import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { outgoing } from '../data/graph';
import { advance, type Sequence, setBreaths, start } from '../sequence';
import { Conductor, type PlayerState } from './conductor';
import { announcement } from './script';

function go(seq: Sequence, to: string): Sequence {
  return advance(seq, outgoing(seq[seq.length - 1].poseId).find((t) => t.to === to)!);
}

describe('script', () => {
  it('opens with the starting pose and says how to reach each one after', () => {
    const seq = go(go(start('down-dog'), 'three-leg-dog'), 'warrior-2');
    expect(announcement(seq, 0)).toBe(
      'Begin in Downward-Facing Dog. Hips high, press the floor away, heels reach down. Hold for five breaths.',
    );
    expect(announcement(seq, 2)).toMatch(/^Step right foot forward, open to Warrior II\. Warrior II, right side\. /);
  });

  it('leaves out the hold for a single breath', () => {
    const seq = setBreaths(start('mountain'), 0, 1);
    expect(announcement(seq, 0)).not.toMatch(/Hold/);
  });
});

describe('conductor', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const flow = go(setBreaths(start('mountain'), 0, 2), 'upward-salute'); // 2 breaths, then 1
  const setup = () => {
    const states: PlayerState[] = [];
    const c = new Conductor(flow, { secondsPerBreath: 1, chime: true, voice: null }, (s) => states.push(s));
    const last = () => states[states.length - 1];
    /** Steps the clock until the player reaches `phase`. */
    const until = (phase: PlayerState['phase']) => {
      for (let t = 0; t < 60_000 && last().phase !== phase; t += 50) vi.advanceTimersByTime(50);
    };
    return { c, last, until };
  };

  it('speaks, holds, moves on and finishes', () => {
    const { c, last, until } = setup();
    c.play();
    expect(last()).toMatchObject({ index: 0, phase: 'speaking', playing: true });
    until('holding');
    expect(last()).toMatchObject({ index: 0, phase: 'holding', holdTotal: 2000 });
    vi.advanceTimersByTime(2000);
    expect(last()).toMatchObject({ index: 1, phase: 'speaking' });
    until('done');
    expect(last()).toMatchObject({ phase: 'done', playing: false });
  });

  it('resumes a paused hold where it left off', () => {
    const { c, last, until } = setup();
    c.play();
    until('holding');
    vi.advanceTimersByTime(1500);
    c.pause();
    expect(last()).toMatchObject({ phase: 'holding', playing: false, holdElapsed: 1500 });
    vi.advanceTimersByTime(60_000); // nothing moves while paused
    expect(last().index).toBe(0);
    c.play();
    vi.advanceTimersByTime(499);
    expect(last().index).toBe(0);
    vi.advanceTimersByTime(1);
    expect(last()).toMatchObject({ index: 1, phase: 'speaking' });
  });

  it('skips without leaving the old step’s timers running', () => {
    const { c, last, until } = setup();
    c.play();
    c.next();
    expect(last()).toMatchObject({ index: 1, phase: 'speaking' });
    c.prev();
    until('holding');
    expect(last()).toMatchObject({ index: 0, phase: 'holding' });
  });
});
