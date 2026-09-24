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

/** What the voice says on arriving at step i: how to get there, the pose, its cue and the hold. */
export function announcement(seq: Sequence, i: number): string {
  const step = seq[i];
  const via = step.via === undefined ? undefined : TRANSITION_BY_ID.get(step.via);
  const parts = [
    i === 0 || !via ? `Begin in ${spokenPose(seq, i)}.` : `${renderLabel(via.label, step.side)}. ${spokenPose(seq, i)}.`,
    getPose(step.poseId).cue,
  ];
  if (step.breaths > 1) parts.push(`Hold for ${spell(step.breaths)} breaths.`);
  return parts.join(' ');
}

export const CLOSING = 'That’s the end of your flow. Take a moment before you move on.';
