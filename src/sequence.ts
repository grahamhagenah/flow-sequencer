import { applySide, getPose, otherSide } from './data/graph';
import type { Side, Transition } from './data/types';

export interface Step {
  poseId: string;
  /** For sided poses, the side being worked. For unsided poses, the side the flow carries forward. */
  side: Side;
  breaths: number;
  /** The transition that led here; absent on the first step. */
  via?: number;
}

export type Sequence = Step[];

export const SECONDS_PER_BREATH = 5;

export function start(poseId: string, side: Side = 'right'): Sequence {
  return [{ poseId, side, breaths: getPose(poseId).breaths }];
}

export function advance(seq: Sequence, t: Transition): Sequence {
  const last = seq[seq.length - 1];
  if (!last || last.poseId !== t.from) throw new Error(`${t.id} does not start from the current pose`);
  return [...seq, { poseId: t.to, side: applySide(last.side, t.side), breaths: getPose(t.to).breaths, via: t.id }];
}

export function setBreaths(seq: Sequence, index: number, breaths: number): Sequence {
  const clamped = Math.max(1, Math.min(60, breaths));
  return seq.map((s, i) => (i === index ? { ...s, breaths: clamped } : s));
}

/**
 * Changes the side carried by the last step. Only allowed on an unsided pose,
 * since a sided pose's side follows from how the flow got there.
 */
export function setLeadingSide(seq: Sequence, side: Side): Sequence {
  const last = seq[seq.length - 1];
  if (!last || getPose(last.poseId).sided) return seq;
  return [...seq.slice(0, -1), { ...last, side }];
}

/**
 * Finds the stretch to repeat on the other side: the steps since the most
 * recent earlier visit to the current pose that include at least one sided
 * pose. Returns [first, last] indices of that stretch, or null.
 */
export function mirrorRange(seq: Sequence): [number, number] | null {
  const end = seq.length - 1;
  if (end < 1) return null;
  const current = seq[end].poseId;
  let hasSided = getPose(current).sided;
  for (let j = end - 1; j >= 0; j--) {
    if (seq[j].poseId === current && hasSided) return [j + 1, end];
    if (getPose(seq[j].poseId).sided) hasSided = true;
  }
  return null;
}

/** Appends the mirrorRange stretch again with every side swapped. */
export function mirror(seq: Sequence): Sequence {
  const range = mirrorRange(seq);
  if (!range) return seq;
  const repeat = seq.slice(range[0], range[1] + 1).map((s) => ({ ...s, side: otherSide(s.side) }));
  return [...seq, ...repeat];
}

export function totalSeconds(seq: Sequence): number {
  return seq.reduce((sum, s) => sum + s.breaths * SECONDS_PER_BREATH, 0);
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
