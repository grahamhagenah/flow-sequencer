import { describe, expect, it } from 'vitest';
import { outgoing } from './data/graph';
import { decodeSteps, encodeSteps, fromHash, toHash } from './link';
import { advance, mirror, type Sequence, setBreaths, setLeadingSide, start } from './sequence';

function go(seq: Sequence, to: string): Sequence {
  const t = outgoing(seq[seq.length - 1].poseId).find((t) => t.to === to);
  if (!t) throw new Error(`no transition to ${to}`);
  return advance(seq, t);
}

const path = (seq: Sequence, ...ids: string[]) => ids.reduce(go, seq);

describe('share links', () => {
  it('round-trips a flow with changed breaths, a chosen side and a mirror', () => {
    let seq = path(start('down-dog'), 'three-leg-dog', 'warrior-2', 'down-dog');
    seq = mirror(setBreaths(seq, 2, 8));
    seq = setLeadingSide(seq, 'right');
    seq = path(seq, 'low-lunge');
    const text = encodeSteps(seq);
    expect(decodeSteps(text)).toEqual({ seq, dropped: 0 });
  });

  it('writes default breaths and sides as bare codes', () => {
    const seq = path(start('down-dog'), 'three-leg-dog');
    expect(encodeSteps(seq)).toBe(`down-dog.${(72).toString(36)}`);
    expect(encodeSteps(setLeadingSide(start('down-dog'), 'left'))).toBe('down-dog_');
  });

  it('keeps the steps before a move it can no longer follow', () => {
    const good = encodeSteps(path(start('mountain'), 'upward-salute'));
    expect(decodeSteps(`${good}.zzz.1`)).toEqual({ seq: decodeSteps(good).seq, dropped: 2 });
    // Code 1 exists (savasana > knees to chest) but doesn't start from mountain.
    expect(decodeSteps('mountain.1').dropped).toBe(1);
    expect(decodeSteps('not-a-pose').seq).toEqual([]);
  });

  it('carries the name through the hash, spaces and all', () => {
    const steps = encodeSteps(path(start('savasana'), 'knees-to-chest'));
    const back = fromHash(`#${toHash('Slow Sunday · hips', steps)}`);
    expect(back?.name).toBe('Slow Sunday · hips');
    expect(back?.seq).toEqual(decodeSteps(steps).seq);
    expect(fromHash('#nothing=here')).toBeNull();
  });
});
