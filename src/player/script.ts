import { getPose, renderLabel, TRANSITION_BY_ID } from '../data/graph';
import type { Sequence } from '../sequence';

const NUMBERS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const spell = (n: number) => NUMBERS[n] ?? String(n);

/** The pose's name as spoken, with its side when it has one. */
export function spokenPose(seq: Sequence, i: number): string {
  const step = seq[i];
  const pose = getPose(step.poseId);
  return pose.sided ? `${pose.name}, ${step.side} side` : pose.name;
}

/**
 * What the voice says on arriving at step i, as short phrases spoken one at a
 * time with a pause between: how to get there, the pose, its cue, the hold.
 * Short phrases sound calmer than one long sentence, and give the listener a
 * beat to move.
 */
export function announcementParts(seq: Sequence, i: number): string[] {
  const step = seq[i];
  const via = step.via === undefined ? undefined : TRANSITION_BY_ID.get(step.via);
  // One breath, one movement: just the movement, said as it's done.
  if (isFlowStep(seq, i)) return [`${renderLabel(via!.label, step.side)}.`];
  const parts =
    i === 0 || !via
      ? [`Begin in ${spokenPose(seq, i)}.`]
      : [`${renderLabel(via.label, step.side)}.`, `${spokenPose(seq, i)}.`];
  parts.push(getPose(step.poseId).cue);
  if (step.breaths > 1) parts.push(`Hold for ${spell(step.breaths)} breaths.`);
  return parts;
}

/**
 * A step held for a single breath, as in a salutation: the voice says only the
 * movement, with no chime, and saying it is part of that breath rather than
 * coming before it. (The first step always gets its full introduction.)
 */
export function isFlowStep(seq: Sequence, i: number): boolean {
  return i > 0 && seq[i].breaths === 1 && seq[i].via !== undefined;
}

/** The whole announcement as one line of text. */
export function announcement(seq: Sequence, i: number): string {
  return announcementParts(seq, i).join(' ');
}

/** The short pause between phrases, in milliseconds. */
export const PHRASE_GAP_MS = 350;

export const CLOSING = 'That’s the end of your flow. Take a moment before you move on.';
