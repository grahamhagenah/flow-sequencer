import type { CSSProperties } from 'react';
import { sampleLook } from './data/sampleLooks';
import { SAMPLE_FLOWS, type SampleFlow } from './data/samples';
import { PlayIcon } from './icons';
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
  return (
    <div className="get-started">
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
        <ul className="sample-cards">
          {SAMPLE_FLOWS.map((f) => {
            const { icon, color } = sampleLook(f.id);
            // "Power Flow · strong": the part after the dot becomes a style pill.
            const [title, style] = f.name.split(' · ');
            return (
              <li key={f.id} className="sample-card" style={{ '--tone': color } as CSSProperties}>
                <span className="sample-title">
                  <span className="sample-icon">{icon}</span>
                  {title}
                </span>
                <span className="sample-meta">
                  {style && <span className="sample-style">{style}</span>}
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
      </section>
    </div>
  );
}

/** How building works, shown above the Start poses while the flow is empty. */
export function HowItWorks() {
  return (
    <div className="current-pose how-it-works-card">
      <h2>Get started</h2>
      <ol className="how-it-works">
        <li>
          <span className="step">1</span>
          <span>Pick a starting pose</span>
        </li>
        <li>
          <span className="step">2</span>
          <span>Tap the moves that follow</span>
        </li>
        <li>
          <span className="step">3</span>
          <span>Press play and follow along</span>
        </li>
      </ol>
    </div>
  );
}
