import { describe, expect, it } from 'vitest';
import { outgoing } from './data/graph';
import { advance, mirror, mirrorRange, type Sequence, setLeadingSide, start } from './sequence';

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
