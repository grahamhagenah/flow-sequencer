import { applySide, getPose, otherSide, outgoing, TRANSITION_BY_ID } from './data/graph';
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

/** Sets the flow, as React's state setters do: a new sequence or a change to the last one. */
export type SetSeq = (next: Sequence | ((prev: Sequence) => Sequence)) => void;

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

// Editing the middle of a flow. Each step's side follows from the move into it,
// except where it was chosen (a step whose side differs from what its move gives,
// like a Right/Left pick on an unsided pose; the first step's side is always its
// own). An edit keeps those choices and lets every other side follow the new moves.

interface Tagged {
  step: Step;
  chosen: boolean;
}

const moveSide = (prev: Step, step: Step) => applySide(prev.side, TRANSITION_BY_ID.get(step.via!)!.side);

function tag(seq: Sequence): Tagged[] {
  return seq.map((step, i) => ({ step, chosen: i === 0 || step.side !== moveSide(seq[i - 1], step) }));
}

function untag(tagged: Tagged[]): Sequence {
  const seq: Sequence = [];
  for (const [i, { step, chosen }] of tagged.entries()) {
    if (i === 0) {
      const { via: _, ...first } = step;
      seq.push(first);
      continue;
    }
    const prev = seq[i - 1];
    if (TRANSITION_BY_ID.get(step.via!)!.from !== prev.poseId) throw new Error(`step ${i} doesn't follow on`);
    seq.push({ ...step, side: chosen ? step.side : moveSide(prev, step) });
  }
  return seq;
}

/** Of the moves `from` → `to`, the one that lands on `wantSide` when there is one. */
function pickMove(from: string, fromSide: Side, to: string, wantSide: Side): Transition | undefined {
  const moves = outgoing(from).filter((t) => t.to === to);
  return moves.find((t) => applySide(fromSide, t.side) === wantSide) ?? moves[0];
}

export interface Removal {
  seq: Sequence;
  /** Steps removed: 1, or 2 when a detour and the return from it go together. */
  count: number;
}

/**
 * Removes step i, joining its neighbours with a move between them. When there's no
 * such move but the step is a detour (the poses either side are the same), the
 * return goes too. Null when the flow can't be joined up.
 */
export function removeStep(seq: Sequence, i: number): Removal | null {
  const tagged = tag(seq);
  if (i === seq.length - 1) return { seq: seq.slice(0, -1), count: 1 };
  if (i === 0) return { seq: untag(tagged.slice(1)), count: 1 };
  const prev = seq[i - 1];
  const next = seq[i + 1];
  const join = pickMove(prev.poseId, prev.side, next.poseId, next.side);
  if (join) {
    const rest = tagged.slice(i + 1);
    rest[0] = { ...rest[0], step: { ...rest[0].step, via: join.id } };
    return { seq: untag([...tagged.slice(0, i), ...rest]), count: 1 };
  }
  if (prev.poseId === next.poseId) return { seq: untag([...tagged.slice(0, i), ...tagged.slice(i + 2)]), count: 2 };
  return null;
}

/** Everything before step i. */
/**
 * Whether `next` is `prev` with steps added at the end (a pose added, "Get to", the
 * mirror), as opposed to growing some other way, like an undo bringing back a removed
 * pose. Steps are never changed in place, so the same objects mean the same steps.
 */
export const isAppend = (prev: Sequence, next: Sequence): boolean =>
  next.length > prev.length && prev.every((s, i) => next[i] === s);

export const cutFrom = (seq: Sequence, i: number): Sequence => seq.slice(0, i);

export interface Insertion {
  /** The move to the new pose. */
  move: Transition;
  /** The move from it on to the step that followed. */
  onward: Transition;
}

/** The poses that fit between step i and step i + 1, with the moves in and out. */
export function insertOptions(seq: Sequence, i: number): Insertion[] {
  const here = seq[i];
  const next = seq[i + 1];
  if (!here || !next) return [];
  return outgoing(here.poseId).flatMap((move) => {
    const onward = pickMove(move.to, applySide(here.side, move.side), next.poseId, next.side);
    return onward ? [{ move, onward }] : [];
  });
}

/** Puts a pose between step i and step i + 1 (see insertOptions). */
export function insertAfter(seq: Sequence, i: number, { move, onward }: Insertion): Sequence {
  const tagged = tag(seq);
  const added: Tagged = { step: { poseId: move.to, side: 'right', breaths: getPose(move.to).breaths, via: move.id }, chosen: false };
  const rest = tagged.slice(i + 1);
  rest[0] = { ...rest[0], step: { ...rest[0].step, via: onward.id } };
  return untag([...tagged.slice(0, i + 1), added, ...rest]);
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
