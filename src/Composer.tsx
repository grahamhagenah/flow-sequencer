import { useMemo } from 'react';
import { ChoiceButton, choosesSide, MoveChoice, Stepper } from './choices';
import { applySide, getPose, otherSide, outgoing, routesFrom, sideLabel } from './data/graph';
import { POSES, SHOW_SANSKRIT, START_POSES } from './data/poses';
import type { Base, Transition } from './data/types';
import { type Insertion, insertOptions, mirror, mirrorRange, type Sequence, type SetSeq, setLeadingSide } from './sequence';

// What can be added to the flow: the choices under the newest pose, the ones for an
// insert under the row it follows, and the first pose of an empty flow.

/** How the "Get to" list (and the poses page) group poses: by where the body is, standing down to lying. */
export const BASES: [Base, string][] = [
  ['standing', 'Standing'],
  ['hands', 'On hands and feet'],
  ['kneeling', 'Kneeling'],
  ['seated', 'Seated'],
  ['prone', 'Lying face down'],
  ['supine', 'Lying on your back'],
];

/**
 * "Choose the next pose", under the newest one: its breaths and the side to lead
 * with, the moves from it, "Get to" any pose, and the offer to repeat on the other
 * side. `onAdd` adds moves (so the breaths set here carry on); `onBeforeEdit` runs
 * just before an edit made from here, so the view can keep these choices in place.
 */
export function Composer({
  seq,
  set,
  onAdd,
  onBreaths,
  onBeforeEdit,
}: {
  seq: Sequence;
  set: SetSeq;
  onAdd: (moves: Transition[]) => void;
  onBreaths: (n: number) => void;
  onBeforeEdit: () => void;
}) {
  const current = seq[seq.length - 1];
  const pose = getPose(current.poseId);
  // "Get to": the fewest moves from the newest pose to any pose it can reach.
  const routes = useMemo(() => routesFrom(current.poseId), [current.poseId]);
  const range = mirrorRange(seq);
  const mirrorSide = range
    ? otherSide(seq.slice(range[0], range[1] + 1).find((s) => getPose(s.poseId).sided)!.side)
    : null;

  return (
    <section className="composer" aria-label="Choose the next pose">
      <div className="next-head">
        <h2>
          Choose the next pose
          <span className="next-from">
            · after {pose.name}
            {pose.sided && ` (${current.side})`}
          </span>
        </h2>
        <div className="next-controls">
          {/* The newest pose's breaths, carried on to the poses added after it. */}
          <Stepper value={current.breaths} onChange={onBreaths} />
          {choosesSide(current.poseId) && (
            <div className="leading" role="group" aria-label="Side for the next move">
              {(['right', 'left'] as const).map((side) => (
                <button key={side} aria-pressed={current.side === side} onClick={() => set((q) => setLeadingSide(q, side))}>
                  {sideLabel(side)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="next-options">
        {outgoing(current.poseId).map((t) => (
          <MoveChoice key={t.id} move={t} side={applySide(current.side, t.side)} onPick={() => onAdd([t])} />
        ))}
      </div>

      <div className="route">
        <select
          id="route"
          aria-label="Get to a pose"
          value=""
          onChange={(e) => {
            const moves = routes.get(e.target.value);
            if (moves) onAdd(moves);
          }}
        >
          <option value="">Get to any pose in fewest moves</option>
          {BASES.map(([base, label]) => (
            <optgroup key={base} label={label}>
              {POSES.filter((p) => p.base === base && routes.has(p.id)).map((p) => {
                const n = routes.get(p.id)!.length;
                return (
                  <option key={p.id} value={p.id}>
                    {p.name} · {n} {n === 1 ? 'move' : 'moves'}
                  </option>
                );
              })}
            </optgroup>
          ))}
        </select>
      </div>

      {range && mirrorSide && (
        <button
          className="mirror"
          onClick={() => {
            onBeforeEdit();
            set(mirror);
          }}
        >
          <span className="kicker">Suggestion</span>
          Repeat on the {mirrorSide} side
          <span className="sub">
            Adds the last {range[1] === range[0] ? 'step' : `${range[1] - range[0] + 1} steps`} again, mirrored, starting
            from {getPose(seq[range[0]].poseId).name}
          </span>
        </button>
      )}
    </section>
  );
}

/** Inserting after step `index`: the poses that fit between it and the next, right under its row. */
export function InsertChoices({
  seq,
  index,
  onPick,
  onCancel,
}: {
  seq: Sequence;
  index: number;
  onPick: (o: Insertion) => void;
  onCancel: () => void;
}) {
  const choices = insertOptions(seq, index);
  const from = getPose(seq[index].poseId).name;
  const to = getPose(seq[index + 1].poseId).name;
  return (
    <li className="composer composer-insert">
      <div className="next-head">
        <h2>
          Insert
          <span className="next-from">
            · between {from} and {to}
          </span>
        </h2>
        <div className="next-controls">
          <button className="link-btn" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
      {choices.length === 0 ? (
        <p className="next-empty">
          No single pose leads from {from} on to {to}.
        </p>
      ) : (
        <div className="next-options">
          {choices.map((o) => (
            <MoveChoice key={o.move.id} move={o.move} side={applySide(seq[index].side, o.move.side)} onPick={() => onPick(o)} />
          ))}
        </div>
      )}
    </li>
  );
}

/** A blank sequence: its first choices, the poses a flow can start from, in the composer's place. */
export function FirstPoseChoices({ onPick }: { onPick: (poseId: string) => void }) {
  return (
    <section className="composer" aria-label="Choose the first pose">
      <div className="next-head">
        <h2>Choose the first pose</h2>
      </div>
      <div className="next-options">
        {START_POSES.map((id) => (
          <ChoiceButton key={id} poseId={id} main={getPose(id).name} sub={SHOW_SANSKRIT ? getPose(id).sanskrit : undefined} onPick={() => onPick(id)} />
        ))}
      </div>
    </section>
  );
}
