import { MoveLabel, namesSide } from './choices';
import { getPose, sideLabel, TRANSITION_BY_ID } from './data/graph';
import { PoseFigure } from './PoseFigure';
import type { Sequence, Step } from './sequence';

/** The playing pose's breath, when the class is on the pose in view. */
export interface LiveBreath {
  /** Which breath (from 1), or null while the voice announces the pose. */
  breath: number | null;
}

/**
 * One pose at a time, large: the pose shown (the playing one during a class), how you
 * got into it, its cue and its breaths. During a class it shows the breath being taken
 * (the player keeps the breath ring). The player under it says where you are and what's
 * next, and steps through the poses. For following along: everything is edited in the list.
 */
export function SinglePoseView({
  seq,
  index,
  live,
}: {
  seq: Sequence;
  index: number;
  live: LiveBreath | null;
}) {
  const step = seq[index];
  const pose = getPose(step.poseId);
  const via = moveInto(step);

  return (
    <section className="single" aria-label={`Pose ${index + 1} of ${seq.length}`}>
      <div className="single-pose">
        <div className="single-figure">
          <PoseFigure poseId={step.poseId} side={step.side} size={168} />
        </div>
        <div className="single-text">
          {/* How you got here; the first pose is where you begin. */}
          <span className="single-via">{via ? <MoveLabel label={via.label} side={step.side} /> : 'Begin here'}</span>
          <h2 className="single-name">
            {pose.name}
            {/* Beside the name, quieter. Shown here even while SHOW_SANSKRIT keeps it out of the rows and the player. */}
            {pose.sanskrit && <span className="single-sanskrit">{pose.sanskrit}</span>}
            {pose.sided && !(via && namesSide(via.label)) && <span className="side">{sideLabel(step.side)}</span>}
            {index === seq.length - 1 && <span className="last-tag">Last pose</span>}
          </h2>
          <p className="single-cue">{pose.cue}</p>
          {/* Under the cue: the breath being taken during a class; before it, how many. Always
              shown, so nothing shifts when a class starts. */}
          {live?.breath ? (
            <span className="single-breath">
              Breath {live.breath} <span>of {step.breaths}</span>
            </span>
          ) : (
            <span className="single-breath idle">
              {step.breaths} {step.breaths === 1 ? 'breath' : 'breaths'}
            </span>
          )}
        </div>
      </div>

    </section>
  );
}


const moveInto = (step: Step) => (step.via === undefined ? undefined : TRANSITION_BY_ID.get(step.via));
