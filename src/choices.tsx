import type { ReactNode } from 'react';
import { getPose, outgoing, renderLabel, sideLabel } from './data/graph';
import type { Side, Transition } from './data/types';
import { MinusIcon, PlusIcon } from './icons';
import { PoseFigure } from './PoseFigure';

// The small pieces the sequence list and its choices are built from.

/** Whether a move's label says which side the pose it leads to is on ({side} / {Side}). */
export const namesSide = (label: string) => /\{[sS]ide\}/.test(label);

/**
 * A move's label with the pose's side picked out, e.g. "Drop knees to the *right*",
 * so it can stand in for a separate Right/Left tag. ({other} is the opposite limb or
 * direction, not the pose's side, so it stays plain.)
 */
export function MoveLabel({ label, side }: { label: string; side: Side }) {
  return (
    <>
      {label.split(/(\{[sS]ide\})/).map((part, k) =>
        namesSide(part) ? (
          <span key={k} className="side-word">
            {renderLabel(part, side)}
          </span>
        ) : (
          renderLabel(part, side)
        ),
      )}
    </>
  );
}

/** An unsided pose whose next moves include a sided one, so the side is still open. */
export function choosesSide(poseId: string): boolean {
  return !getPose(poseId).sided && outgoing(poseId).some((t) => getPose(t.to).sided);
}

/**
 * One choice of what to add, as a dashed line: the drawing, two lines of text, and a +.
 * Every choice (the next pose, one to insert, the first pose) is one of these.
 */
export function ChoiceButton({
  poseId,
  side,
  title,
  main,
  sub,
  onPick,
}: {
  poseId: string;
  side?: Side;
  title?: string;
  main: ReactNode;
  sub?: ReactNode;
  onPick: () => void;
}) {
  return (
    <button className="next-option" title={title} onClick={onPick}>
      <PoseFigure poseId={poseId} side={side} size={40} />
      <span className="next-option-text">
        <span className="next-option-move">{main}</span>
        {sub && <span className="next-option-pose">{sub}</span>}
      </span>
      <span className="next-option-add" aria-hidden="true">
        <PlusIcon />
      </span>
    </button>
  );
}

/** A move to choose: what to do, then the pose it leads to (and its side, unless the move names it). */
export function MoveChoice({ move, side, onPick }: { move: Transition; side: Side; onPick: () => void }) {
  const to = getPose(move.to);
  return (
    <ChoiceButton
      poseId={move.to}
      side={side}
      title={`${renderLabel(move.label, side)} → ${to.name}`}
      main={<MoveLabel label={move.label} side={side} />}
      sub={
        <>
          {to.name}
          {to.sided && !namesSide(move.label) && ` · ${sideLabel(side)}`}
        </>
      }
      onPick={onPick}
    />
  );
}

/** Quiet − and + either side of a breath count. */
export function Stepper({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <span className="stepper">
      <button onClick={() => onChange(value - 1)} disabled={value <= 1} aria-label="Fewer breaths">
        <MinusIcon />
      </button>
      <span className="count">
        {value}
        <span className="unit"> {value === 1 ? 'breath' : 'breaths'}</span>
      </span>
      <button onClick={() => onChange(value + 1)} aria-label="More breaths">
        <PlusIcon />
      </button>
    </span>
  );
}
