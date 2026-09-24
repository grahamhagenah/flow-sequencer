import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { breathCue } from './chime';

vi.mock('./chime', async (load) => ({
  ...(await load<typeof import('./chime')>()),
  chime: vi.fn(),
  breathCue: vi.fn(),
}));
import { outgoing } from '../data/graph';
import { advance, type Sequence, setBreaths, start } from '../sequence';
import { classMs, closingMs, Conductor, type PlayerState, speechMs } from './conductor';
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
    const c = new Conductor(flow, { secondsPerBreath: 1, chime: true, breathTone: true, voice: null }, (s) => states.push(s));
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

  it('keeps time moving while the voice speaks, then holds', () => {
    const { c, last, until } = setup();
    c.play();
    const { speechTotal } = last();
    expect(speechTotal).toBeGreaterThan(0);
    vi.advanceTimersByTime(1000);
    expect(last().phase).toBe('speaking');
    expect(last().speechElapsed).toBeGreaterThanOrEqual(750); // ticks every 250ms
    until('holding');
    expect(last().speechElapsed).toBe(speechTotal); // settled at the estimate
  });

  it('counts the voice in a class length', () => {
    const holdsOnly = flow.reduce((sum, s) => sum + s.breaths * 1000, 0);
    const withVoice = classMs(flow, 1, true);
    const expected = flow.reduce((sum, _, i) => sum + speechMs(flow, i, true), 0) + holdsOnly + closingMs();
    expect(withVoice).toBe(expected);
    expect(withVoice).toBeGreaterThan(holdsOnly);
    expect(classMs(flow, 1, false)).toBeLessThan(withVoice); // no chime, less lead-in
  });

  it('sounds a breath cue at each new breath of a hold, not the first', () => {
    const { c, until } = setup();
    vi.mocked(breathCue).mockClear();
    c.play();
    until('holding'); // step 0 holds for 2 breaths of 1s each
    expect(breathCue).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1000);
    expect(breathCue).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1000); // the hold ends; the next pose has 1 breath, so no cue
    until('holding');
    vi.advanceTimersByTime(900);
    expect(breathCue).toHaveBeenCalledTimes(1);
  });

  it('stretches or cuts short the current hold when its breaths change', () => {
    const { c, last, until } = setup();
    c.play();
    until('holding'); // 2 breaths of 1s
    vi.advanceTimersByTime(500);
    c.setSeq(setBreaths(flow, 0, 4)); // now 4s long, 0.5s already spent
    expect(last()).toMatchObject({ index: 0, phase: 'holding', holdTotal: 4000 });
    vi.advanceTimersByTime(3000);
    expect(last().index).toBe(0); // still holding at 3.5s
    vi.advanceTimersByTime(600);
    expect(last()).toMatchObject({ index: 1, phase: 'speaking' });
  });

  it('moves straight on when a hold is shortened below the time already spent', () => {
    const { c, last, until } = setup();
    c.play();
    until('holding');
    vi.advanceTimersByTime(1500);
    c.setSeq(setBreaths(flow, 0, 1)); // 1s, but 1.5s have passed
    vi.advanceTimersByTime(10);
    expect(last()).toMatchObject({ index: 1, phase: 'speaking' });
  });

  it('jumps to a step and holds it paused, then resumes from there', () => {
    const { c, last, until } = setup();
    c.play();
    until('holding');
    c.goTo(1, false);
    expect(last()).toMatchObject({ index: 1, playing: false, phase: 'ready', holdElapsed: 0 });
    vi.advanceTimersByTime(60_000); // stays put while paused
    expect(last()).toMatchObject({ index: 1, playing: false });
    c.play();
    expect(last()).toMatchObject({ index: 1, playing: true, phase: 'speaking' });
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
