import { POSES } from './poses';
import { TRANSITIONS } from './transitions';
import type { Pose, Side, SideEffect, Transition } from './types';

export const POSE_BY_ID = new Map<string, Pose>(POSES.map((p) => [p.id, p]));
export const TRANSITION_BY_ID = new Map<number, Transition>(TRANSITIONS.map((t) => [t.id, t]));

const OUTGOING = new Map<string, Transition[]>();
for (const t of TRANSITIONS) {
  const list = OUTGOING.get(t.from) ?? [];
  list.push(t);
  OUTGOING.set(t.from, list);
}

export function getPose(id: string): Pose {
  const pose = POSE_BY_ID.get(id);
  if (!pose) throw new Error(`Unknown pose: ${id}`);
  return pose;
}

export function outgoing(poseId: string): Transition[] {
  return OUTGOING.get(poseId) ?? [];
}

export const otherSide = (side: Side): Side => (side === 'right' ? 'left' : 'right');

export const sideLabel = (side: Side) => (side === 'right' ? 'Right' : 'Left');

export function applySide(side: Side, effect: SideEffect): Side {
  return effect === 'flip' ? otherSide(side) : side;
}

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

/** Fills {side}/{other} in a transition label. `side` is the side after the move. */
export function renderLabel(label: string, side: Side): string {
  const other = otherSide(side);
  return label
    .replaceAll('{side}', side)
    .replaceAll('{other}', other)
    .replaceAll('{Side}', cap(side))
    .replaceAll('{Other}', cap(other));
}
