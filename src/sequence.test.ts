import { describe, expect, it } from 'vitest';
import { outgoing, routesFrom } from './data/graph';
import { encodeSteps, decodeSteps } from './link';
import {
  advance,
  cutFrom,
  insertAfter,
  insertOptions,
  mirror,
  mirrorRange,
  removeStep,
  type Sequence,
  setBreaths,
  setLeadingSide,
  start,
} from './sequence';

/** Follows the first transition from the current pose to `to`. */
function go(seq: Sequence, to: string): Sequence {
  const t = outgoing(seq[seq.length - 1].poseId).find((t) => t.to === to);
  if (!t) throw new Error(`no transition to ${to}`);
  return advance(seq, t);
}

const path = (seq: Sequence, ...ids: string[]) => ids.reduce(go, seq);

describe('sequence', () => {
  it('carries the side through unsided poses and flips on flip moves', () => {
    const seq = path(start('down-dog'), 'three-leg-dog', 'warrior-2', 'warrior-2');
    expect(seq.map((s) => s.side)).toEqual(['right', 'right', 'right', 'left']);
  });

  it('only lets the leading side change on an unsided pose', () => {
    const dog = setLeadingSide(start('down-dog'), 'left');
    expect(go(dog, 'three-leg-dog').at(-1)!.side).toBe('left');
    const lunge = go(start('down-dog'), 'low-lunge');
    expect(setLeadingSide(lunge, 'left')).toBe(lunge);
  });

  it('mirrors back to the visit before the vinyasa, not just the vinyasa', () => {
    const seq = path(
      start('down-dog'),
      'three-leg-dog', 'warrior-2', 'down-dog', // right side
      'plank', 'chaturanga', 'up-dog', 'down-dog', // vinyasa
    );
    expect(mirrorRange(seq)).toEqual([1, 7]);
    const mirrored = mirror(seq);
    expect(mirrored.slice(8).map((s) => [s.poseId, s.side])).toEqual([
      ['three-leg-dog', 'left'],
      ['warrior-2', 'left'],
      ['down-dog', 'left'],
      ['plank', 'left'],
      ['chaturanga', 'left'],
      ['up-dog', 'left'],
      ['down-dog', 'left'],
    ]);
  });

  it('has nothing to mirror without sided poses', () => {
    expect(mirrorRange(path(start('down-dog'), 'plank', 'down-dog'))).toBeNull();
  });
});

/** Every step follows from the one before by a real move, and the flow survives a share link. */
function expectValid(seq: Sequence) {
  seq.slice(1).forEach((s, i) => expect(outgoing(seq[i].poseId).some((t) => t.id === s.via)).toBe(true));
  expect(seq[0].via).toBeUndefined();
  expect(decodeSteps(encodeSteps(seq)).seq).toEqual(seq);
}

describe('editing the middle', () => {
  it('removes a pose by joining its neighbours', () => {
    const seq = path(start('table'), 'cat', 'cow', 'table');
    const r = removeStep(seq, 1)!;
    expect(r.count).toBe(1);
    expect(r.seq.map((s) => s.poseId)).toEqual(['table', 'cow', 'table']);
    expectValid(r.seq);
  });

  it('removes a detour together with the return from it', () => {
    const seq = path(start('table'), 'thread-needle', 'table', 'down-dog');
    const r = removeStep(seq, 1)!;
    expect(r.count).toBe(2);
    expect(r.seq.map((s) => s.poseId)).toEqual(['table', 'down-dog']);
    expectValid(r.seq);
  });

  it("won't remove a pose its neighbours can't join around", () => {
    const seq = path(start('easy-seat'), 'table', 'cat');
    expect(outgoing('easy-seat').some((t) => t.to === 'cat')).toBe(false);
    expect(removeStep(seq, 1)).toBeNull();
  });

  it('removes the first and last poses', () => {
    const seq = setBreaths(path(start('table'), 'cat', 'cow'), 1, 4);
    const first = removeStep(seq, 0)!.seq;
    expect(first.map((s) => [s.poseId, s.breaths])).toEqual([['cat', 4], ['cow', 1]]);
    expectValid(first);
    expect(removeStep(seq, 2)!.seq).toEqual(seq.slice(0, 2));
  });

  it('lets later sides follow the new moves but keeps chosen ones', () => {
    // Warrior II right, turn to face left, reverse warrior (left).
    const seq = path(start('mountain'), 'warrior-2', 'warrior-2', 'reverse-warrior');
    expect(seq.map((s) => s.side)).toEqual(['right', 'right', 'left', 'left']);
    const r = removeStep(seq, 2)!.seq;
    expect(r.map((s) => [s.poseId, s.side])).toEqual([['mountain', 'right'], ['warrior-2', 'right'], ['reverse-warrior', 'right']]);
    expectValid(r);
    // A side picked on an unsided pose stays picked.
    const chosen = path(setLeadingSide(path(start('table'), 'cat', 'cow'), 'left'), 'table', 'thread-needle');
    const without = removeStep(chosen, 1)!.seq;
    expect(without.map((s) => [s.poseId, s.side])).toEqual([
      ['table', 'right'],
      ['cow', 'left'],
      ['table', 'left'],
      ['thread-needle', 'left'],
    ]);
    expectValid(without);
  });

  it('inserts a pose that leads on to the next one', () => {
    const seq = path(start('table'), 'down-dog');
    const options = insertOptions(seq, 0);
    expect(options.length).toBeGreaterThan(0);
    for (const o of options) {
      const next = insertAfter(seq, 0, o);
      expect(next).toHaveLength(3);
      expect(next[1].poseId).toBe(o.move.to);
      expect(next[2].poseId).toBe('down-dog');
      expectValid(next);
    }
    expect(insertOptions(seq, 1)).toEqual([]);
  });

  it('cuts the flow at a pose', () => {
    const seq = path(start('table'), 'cat', 'cow');
    expect(cutFrom(seq, 1)).toEqual(seq.slice(0, 1));
  });
});

describe('routes', () => {
  it('finds the fewest moves to a pose', () => {
    const routes = routesFrom('easy-seat');
    expect(routes.has('easy-seat')).toBe(false);
    const toDog = routes.get('down-dog')!;
    expect(toDog[0].from).toBe('easy-seat');
    expect(toDog.at(-1)!.to).toBe('down-dog');
    toDog.slice(1).forEach((t, i) => expect(t.from).toBe(toDog[i].to));
    for (const t of outgoing('easy-seat')) expect(routes.get(t.to)).toHaveLength(1);
  });

  it('can reach every pose from each starting pose', () => {
    for (const id of ['savasana', 'mountain', 'down-dog']) expect(routesFrom(id).size).toBeGreaterThan(40);
  });
});
