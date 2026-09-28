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
    expect(encodeSteps(setLeadingSide(start('down-dog'), 'left'))).toBe('down-dogS');
  });

  // "*" and "_" are formatting in chat apps, and iMessage cut links off at them.
  it('writes only letters, digits, "-" and "."', () => {
    let seq = path(start('down-dog'), 'three-leg-dog', 'warrior-2', 'down-dog');
    seq = mirror(setBreaths(seq, 2, 8));
    seq = setLeadingSide(seq, 'left');
    expect(encodeSteps(seq)).toMatch(/^[A-Za-z0-9.-]+$/);
    expect(encodeSteps(seq)).toContain('B8');
  });

  it('still reads links written with the old "*" and "_" markers', () => {
    let seq = path(start('down-dog'), 'three-leg-dog', 'warrior-2', 'down-dog');
    seq = mirror(setBreaths(seq, 2, 8));
    seq = setLeadingSide(seq, 'left');
    const old = encodeSteps(seq).replace(/B(\d+)/g, '*$1').replace(/S/g, '_');
    expect(old).toContain('*8');
    expect(decodeSteps(old)).toEqual({ seq, dropped: 0 });
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

  it('carries the colour, and ignores one it does not know', () => {
    const steps = encodeSteps(start('savasana'));
    expect(fromHash(`#${toHash('', steps, 'teal')}`)?.color).toBe('teal');
    expect(fromHash(`#${toHash('', steps)}`)?.color).toBeNull();
    expect(fromHash(`#c=chartreuse&f=${steps}`)?.color).toBeNull();
  });

  it('carries the icon, and ignores one it does not know', () => {
    const steps = encodeSteps(start('savasana'));
    expect(fromHash(`#${toHash('', steps, 'teal', 'leaf')}`)?.icon).toBe('leaf');
    expect(fromHash(`#${toHash('', steps, 'teal')}`)?.icon).toBeNull();
    expect(fromHash(`#i=unicorn&f=${steps}`)?.icon).toBeNull();
  });

  it('reads a link that means to play the flow', () => {
    const steps = encodeSteps(start('savasana'));
    expect(fromHash(`#${toHash('', steps)}&p=1`)?.play).toBe(true);
    expect(fromHash(`#${toHash('', steps)}`)?.play).toBe(false);
  });
});
