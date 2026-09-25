import { type CSSProperties, useState } from 'react';
import { sampleLook } from './data/sampleLooks';
import { SAMPLE_FLOWS, type SampleFlow } from './data/samples';
import { PlayIcon } from './icons';
import { PoseFigure } from './PoseFigure';
import type { SavedFlow } from './library';
import { decodeSteps } from './link';
import { aboutMinutes, classMs } from './player/conductor';
import { loadSettings } from './player/usePlayer';

const RECENT = 3;

/** How long a flow runs with the player's saved settings, voice included. */
const length = (seq: Parameters<typeof classMs>[0]) => {
  const { secondsPerBreath, chime } = loadSettings();
  return classMs(seq, secondsPerBreath, chime);
};

/** What the sequence panel shows while the flow is empty: recent flows and classes to try. */
export function GetStarted({
  recent,
  onPlaySample,
  onOpenSample,
  onOpenSaved,
  onSeeAll,
}: {
  recent: SavedFlow[];
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
          <h3>Ready-made classes</h3>
        </div>
        <SampleList
          flows={rest.filter((f) => !f.peak)}
          onPlaySample={onPlaySample}
          onOpenSample={onOpenSample}
        />
      </section>

      <section>
        <div className="gs-head">
          <h3>Peak pose classes</h3>
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

/** Up to `max` of a flow's poses in order, without repeats: a glimpse of what's in it. */
function posePreview(flow: SampleFlow, max: number) {
  const seen = new Set<string>();
  const steps = flow.seq.filter((s) => !seen.has(s.poseId) && seen.add(s.poseId));
  // Spread the picks across the whole class rather than taking only its opening.
  const every = Math.max(1, steps.length / max);
  return Array.from({ length: Math.min(max, steps.length) }, (_, k) => steps[Math.floor(k * every)]);
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
  return (
    <section className="featured" style={{ '--tone': color } as CSSProperties}>
      <span className="featured-kicker">Featured class</span>
      <h3 className="featured-title">
        <span className="sample-icon">{icon}</span>
        {title}
      </h3>
      <span className="sample-meta">
        {style && `${style[0].toUpperCase()}${style.slice(1)} · `}
        {flow.seq.length} poses · {aboutMinutes(length(flow.seq))}
      </span>
      <p className="featured-desc">{flow.description}</p>
      <div className="featured-poses" aria-hidden="true">
        {posePreview(flow, 8).map((s) => (
          <PoseFigure key={s.poseId} poseId={s.poseId} side={s.side} size={36} />
        ))}
      </div>
      <div className="sample-actions featured-actions">
        <button className="gs-play" onClick={() => onPlaySample(flow)} aria-label={`Play ${flow.name}`}>
          <PlayIcon /> Play class
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

/** An invitation to build a flow from scratch, and how, shown above the starting poses while the flow is empty. */
export function HowItWorks() {
  return (
    <div className="how-it-works-card">
      <h2>Build your own sequence</h2>
      <ol className="how-it-works">
        <li>
          <span className="step">1</span>
          <span>Pick a starting pose below</span>
        </li>
        <li>
          <span className="step">2</span>
          <span>Tap the moves that follow, one pose at a time</span>
        </li>
        <li>
          <span className="step">3</span>
          <span>Save it, share it, or press play and follow along</span>
        </li>
      </ol>
    </div>
  );
}
