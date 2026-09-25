import { MoveLabel, namesSide, Stepper } from './choices';
import { getPose, sideLabel, TRANSITION_BY_ID } from './data/graph';
import { ChevronIcon } from './icons';
import { PoseFigure } from './PoseFigure';
import { PoseRing } from './PoseRing';
import type { Sequence, Step } from './sequence';

/** How many poses the strip shows either side of the one in view. */
const STRIP_REACH = 3;

/** The playing pose's breath, when the class is on the pose in view. */
export interface LiveBreath {
  /** Which breath (from 1), or null while the voice announces the pose. */
  breath: number | null;
  /** How far through the hold, 0 to 1. */
  fraction: number;
}

/**
 * One pose at a time, large: the pose shown (the playing one during a class), how you
 * got into it, its cue, breaths and how long they take, a strip of the poses around
 * it, and the poses either side. During a class the drawing gets the breath ring and
 * the breath being taken. Mostly for following along: its breaths can still be
 * changed, and everything else is edited in the list.
 */
export function SinglePoseView({
  seq,
  index,
  secondsPerBreath,
  live,
  onStep,
  onShow,
  onBreaths,
}: {
  seq: Sequence;
  index: number;
  secondsPerBreath: number;
  live: LiveBreath | null;
  /** Shows the pose before (-1) or after (+1). */
  onStep: (by: -1 | 1) => void;
  /** Shows pose i (from the strip). */
  onShow: (i: number) => void;
  onBreaths: (n: number) => void;
}) {
  const step = seq[index];
  const pose = getPose(step.poseId);
  const via = moveInto(step);
  const holdSeconds = step.breaths * secondsPerBreath;

  const from = Math.max(0, index - STRIP_REACH);
  const strip = seq.slice(from, Math.min(seq.length, index + STRIP_REACH + 1));

  return (
    <section className="single" aria-label={`Pose ${index + 1} of ${seq.length}`}>
      <div className="single-nav">
        <button onClick={() => onStep(-1)} disabled={index === 0} aria-label="Previous pose" title="Previous pose">
          <ChevronIcon dir="left" />
        </button>
        <span className="single-count">
          Pose {index + 1} <span>of {seq.length}</span>
        </span>
        <button
          onClick={() => onStep(1)}
          disabled={index >= seq.length - 1}
          aria-label="Next pose"
          title="Next pose"
        >
          <ChevronIcon dir="right" />
        </button>
      </div>

      {/* The poses around this one, in order, this one lit: a sense of where you are in the flow. */}
      <div className="single-strip" role="list" aria-label="Nearby poses">
        {strip.map((s, k) => {
          const i = from + k;
          const name = getPose(s.poseId).name;
          return (
            <button
              key={i}
              role="listitem"
              className={i === index ? 'current' : undefined}
              aria-current={i === index ? 'true' : undefined}
              aria-label={`Pose ${i + 1}, ${name}`}
              title={name}
              onClick={() => onShow(i)}
            >
              <PoseFigure poseId={s.poseId} side={s.side} size={32} />
            </button>
          );
        })}
      </div>

      <div className="single-pose">
        {/* During a class, the breath ring around the drawing. */}
        <div className="single-figure">
          {live && <PoseRing key={index} fraction={live.fraction} size={200} className="single-ring" />}
          <PoseFigure poseId={step.poseId} side={step.side} size={live ? 132 : 168} />
        </div>
        <div className="single-text">
          {/* How you got here; the first pose is where you begin. */}
          <span className="single-via">{via ? <MoveLabel label={via.label} side={step.side} /> : 'Begin here'}</span>
          <h2 className="single-name">
            {pose.name}
            {pose.sided && !(via && namesSide(via.label)) && <span className="side">{sideLabel(step.side)}</span>}
          </h2>
          {/* Shown here even while SHOW_SANSKRIT keeps it out of the rows and the player. */}
          {pose.sanskrit && <span className="single-sanskrit">{pose.sanskrit}</span>}
          {live?.breath && (
            <span className="single-breath">
              Breath {live.breath} <span>of {step.breaths}</span>
            </span>
          )}
          <p className="single-cue">{pose.cue}</p>
          <div className="single-edit">
            <span>Hold for</span>
            <Stepper value={step.breaths} onChange={onBreaths} />
            <span className="single-time">· {aboutSeconds(holdSeconds)}</span>
          </div>
        </div>
      </div>

      {/* The poses either side, quietly: where you came from and where you go next. */}
      <div className="single-around">
        <Neighbour label="Before" step={seq[index - 1]} dir="left" onClick={() => onStep(-1)} empty="The first pose" />
        <Neighbour label="Up next" step={seq[index + 1]} dir="right" onClick={() => onStep(1)} empty="The last pose" />
      </div>
    </section>
  );
}

function Neighbour({
  label,
  step,
  dir,
  onClick,
  empty,
}: {
  label: string;
  step: Step | undefined;
  dir: 'left' | 'right';
  onClick: () => void;
  empty: string;
}) {
  if (!step) return <p className={`single-neighbour single-end ${dir}`}>{empty}</p>;
  const pose = getPose(step.poseId);
  const via = moveInto(step);
  return (
    <button className={`single-neighbour ${dir}`} onClick={onClick}>
      {dir === 'left' && <ChevronIcon dir="left" />}
      <PoseFigure poseId={step.poseId} side={step.side} size={32} />
      <span className="single-neighbour-text">
        <span className="single-neighbour-label">{label}</span>
        <span className="single-neighbour-name">
          {pose.name}
          {pose.sided && !(via && namesSide(via.label)) && ` · ${sideLabel(step.side)}`}
        </span>
      </span>
      {dir === 'right' && <ChevronIcon dir="right" />}
    </button>
  );
}

const moveInto = (step: Step) => (step.via === undefined ? undefined : TRANSITION_BY_ID.get(step.via));

/** "about 15 seconds", "about 1 minute", "about 1½ minutes". */
function aboutSeconds(seconds: number) {
  if (seconds < 60) return `about ${seconds} seconds`;
  const halves = Math.round(seconds / 30) / 2;
  const whole = Math.floor(halves);
  const text = halves === whole ? `${whole}` : `${whole}½`;
  return `about ${text} ${halves === 1 ? 'minute' : 'minutes'}`;
}
