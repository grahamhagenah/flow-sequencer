import { type CSSProperties, useLayoutEffect, useRef, useState } from 'react';
import { sampleLook } from './data/sampleLooks';
import { SAMPLE_FLOWS, type SampleFlow } from './data/samples';
import { PlayIcon, PlusIcon } from './icons';
import { PoseFigure } from './PoseFigure';
import type { Draft, SavedFlow } from './library';
import { decodeSteps } from './link';
import { aboutMinutes, classMs } from './player/conductor';
import { loadSettings } from './player/usePlayer';

const RECENT = 3;

/** How long a flow runs with the player's saved settings, voice included. */
const length = (seq: Parameters<typeof classMs>[0]) => {
  const { secondsPerBreath, chime } = loadSettings();
  return classMs(seq, secondsPerBreath, chime);
};

/** What the sequence panel shows while the flow is empty: recent flows and ready-made ones to try. */
export function GetStarted({
  onBuild,
  recent,
  resume,
  onResume,
  onPlaySample,
  onOpenSample,
  onOpenSaved,
  onSeeAll,
}: {
  onBuild: () => void;
  recent: SavedFlow[];
  resume: Draft | null;
  onResume: () => void;
  onPlaySample: (f: SampleFlow) => void;
  onOpenSample: (f: SampleFlow) => void;
  onOpenSaved: (f: SavedFlow) => void;
  onSeeAll: () => void;
}) {
  // A different class leads each time the page loads; the others follow in the grid.
  const [featured] = useState(() => SAMPLE_FLOWS[Math.floor(Math.random() * SAMPLE_FLOWS.length)]);
  const rest = SAMPLE_FLOWS.filter((f) => f.id !== featured.id);
  return (
    <div className="get-started">
      <FeaturedClass flow={featured} onPlaySample={onPlaySample} onOpenSample={onOpenSample} />

      <BuildYourOwn onBuild={onBuild} />

      {resume && <ResumeFlow draft={resume} onResume={onResume} />}

      {recent.length > 0 && (
        <section>
          <div className="gs-head">
            <h3>Your recent flows</h3>
            <button className="link-btn" onClick={onSeeAll}>
              See all
            </button>
          </div>
          <ul className="gs-list">
            {recent.slice(0, RECENT).map((f) => {
              const seq = decodeSteps(f.steps).seq;
              return (
                <li key={f.id}>
                  <button className="gs-item" onClick={() => onOpenSaved(f)}>
                    <span className="gs-title">{f.name}</span>
                    <span className="gs-meta">
                      {seq.length} {seq.length === 1 ? 'pose' : 'poses'} · {aboutMinutes(length(seq))}
                    </span>
                    <span className="gs-open">Open ›</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section>
        <div className="gs-head">
          <h3>Ready-made flows</h3>
        </div>
        <SampleList
          flows={rest.filter((f) => !f.peak)}
          onPlaySample={onPlaySample}
          onOpenSample={onOpenSample}
        />
      </section>

      <section>
        <div className="gs-head">
          <h3>Peak pose flows</h3>
        </div>
        <SampleList
          flows={rest.filter((f) => f.peak)}
          onPlaySample={onPlaySample}
          onOpenSample={onOpenSample}
        />
      </section>
    </div>
  );
}

/** The flow that was open last time, offered at the top of the start page. */
function ResumeFlow({ draft, onResume }: { draft: Draft; onResume: () => void }) {
  const seq = decodeSteps(draft.steps).seq;
  if (seq.length === 0) return null;
  return (
    <section>
      <div className="gs-head">
        <h3>Continue where you left off</h3>
      </div>
      <ul className="gs-list">
        <li>
          <button className="gs-item" onClick={onResume}>
            <span className="gs-title">{draft.name.trim() || 'Untitled flow'}</span>
            <span className="gs-meta">
              {seq.length} {seq.length === 1 ? 'pose' : 'poses'} · {aboutMinutes(length(seq))}
            </span>
            <span className="gs-open">Open ›</span>
          </button>
        </li>
      </ul>
    </section>
  );
}

/**
 * Up to `max` of a flow's poses in order, without repeats: a glimpse of what's in it.
 * A peak class's peak pose is left out here; it's shown on its own at the end.
 */
function posePreview(flow: SampleFlow, max: number) {
  const seen = new Set<string>(flow.peakPose ? [flow.peakPose] : []);
  const steps = flow.seq.filter((s) => !seen.has(s.poseId) && seen.add(s.poseId));
  // Spread the picks across the whole class rather than taking only its opening.
  const every = Math.max(1, steps.length / max);
  return Array.from({ length: Math.min(max, steps.length) }, (_, k) => steps[Math.floor(k * every)]);
}

// The featured strip's drawings and the space between them (keep in step with .featured-poses).
const STRIP_ITEM = 44;
const STRIP_GAP = 16;

/** How many items of `item` px, `gap` apart, fit across the element (up to `max`), kept up to date as it resizes. */
function useFitCount(ref: React.RefObject<HTMLElement | null>, item: number, gap: number, max: number) {
  const [count, setCount] = useState(max);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setCount(Math.max(1, Math.min(max, Math.floor((el.clientWidth + gap) / (item + gap)))));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, item, gap, max]);
  return count;
}

/** One class given more room at the top: a larger title, the full description and a glimpse of its poses. */
function FeaturedClass({
  flow,
  onPlaySample,
  onOpenSample,
}: {
  flow: SampleFlow;
  onPlaySample: (f: SampleFlow) => void;
  onOpenSample: (f: SampleFlow) => void;
}) {
  const { icon, color } = sampleLook(flow.id);
  const [title, style] = flow.name.split(' · ');
  const peak = flow.peakPose ? flow.seq.find((s) => s.poseId === flow.peakPose) : undefined;
  // As many drawings as fit on one line (8 at most), the last of them the peak pose.
  const strip = useRef<HTMLDivElement>(null);
  const fit = useFitCount(strip, STRIP_ITEM, STRIP_GAP, 8);
  return (
    <section className="featured" style={{ '--tone': color } as CSSProperties}>
      <span className="featured-kicker">A flow to try</span>
      <h3 className="featured-title">
        <span className="sample-icon">{icon}</span>
        {title}
      </h3>
      <span className="sample-meta">
        {style && `${style[0].toUpperCase()}${style.slice(1)} · `}
        {flow.seq.length} poses · {aboutMinutes(length(flow.seq))}
      </span>
      <p className="featured-desc">{flow.description}</p>
      {/* The way there, then (for a peak class) the peak pose itself, in the class's colour. */}
      <div className={peak ? 'featured-poses has-peak' : 'featured-poses'} ref={strip} aria-hidden="true">
        {posePreview(flow, peak ? fit - 1 : fit).map((s) => (
          <PoseFigure key={s.poseId} poseId={s.poseId} side={s.side} size={STRIP_ITEM} />
        ))}
        {peak && <PoseFigure poseId={peak.poseId} side={peak.side} size={STRIP_ITEM} />}
      </div>
      <div className="sample-actions featured-actions">
        <button className="gs-play" onClick={() => onPlaySample(flow)} aria-label={`Play ${flow.name}`}>
          <PlayIcon /> Play flow
        </button>
        <button onClick={() => onOpenSample(flow)} aria-label={`Open ${flow.name}`}>
          Open
        </button>
      </div>
    </section>
  );
}

/** Sample classes in a two-column grid, each with Play and Open. Used here and on the Flows page. */
export function SampleList({
  flows,
  onPlaySample,
  onOpenSample,
}: {
  flows: SampleFlow[];
  onPlaySample: (f: SampleFlow) => void;
  onOpenSample: (f: SampleFlow) => void;
}) {
  return (
    // Its own container, so the grid goes to two columns by its own width wherever it's placed.
    <div className="sample-grid">
      <ul className="sample-cards">
        {flows.map((f) => {
          const { icon, color } = sampleLook(f.id);
          // "Power Flow · strong": the part after the dot is its style, shown before the length.
          const [title, style] = f.name.split(' · ');
          return (
            <li key={f.id} className="sample-card" style={{ '--tone': color } as CSSProperties}>
              <span className="sample-title">
                <span className="sample-icon">{icon}</span>
                {title}
              </span>
              <span className="sample-meta">
                {style && `${style[0].toUpperCase()}${style.slice(1)} · `}
                {aboutMinutes(length(f.seq))}
              </span>
              <span className="sample-desc" title={`${f.description} (${f.seq.length} poses)`}>
                {f.description}
              </span>
              <div className="sample-actions">
                <button className="gs-play" onClick={() => onPlaySample(f)} aria-label={`Play ${f.name}`}>
                  <PlayIcon /> Play
                </button>
                <button onClick={() => onOpenSample(f)} aria-label={`Open ${f.name}`}>
                  Open
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** The way to a blank sequence: one line on how building works, and a button to begin. */
function BuildYourOwn({ onBuild }: { onBuild: () => void }) {
  return (
    <section className="build-own">
      <div className="build-own-text">
        <h3>Build your own sequence</h3>
        <p>Pick a starting pose, then tap the moves that follow, one pose at a time.</p>
      </div>
      <button className="gs-play build-own-btn" onClick={onBuild}>
        <PlusIcon /> Start a new sequence
      </button>
    </section>
  );
}
