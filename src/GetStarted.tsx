import { SAMPLE_FLOWS, type SampleFlow } from './data/samples';
import { PlayIcon } from './icons';
import type { SavedFlow } from './library';
import { decodeSteps } from './link';
import { formatDuration, totalSeconds } from './sequence';

const RECENT = 3;

/** What the sequence panel shows while the flow is empty: how it works, classes to try, and recent flows. */
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
                      {seq.length} {seq.length === 1 ? 'pose' : 'poses'} · {formatDuration(totalSeconds(seq))}
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
          <h3>Try a sample class</h3>
        </div>
        <ul className="gs-list">
          {SAMPLE_FLOWS.map((f) => (
            <li key={f.id} className="gs-sample">
              <div className="gs-text">
                <span className="gs-title">{f.name}</span>
                <span className="gs-desc">{f.description}</span>
                <span className="gs-meta">
                  {f.seq.length} poses · {formatDuration(totalSeconds(f.seq))} of holds
                </span>
              </div>
              <div className="gs-actions">
                <button className="gs-play" onClick={() => onPlaySample(f)} aria-label={`Play ${f.name}`}>
                  <PlayIcon /> Play
                </button>
                <button onClick={() => onOpenSample(f)} aria-label={`Open ${f.name}`}>
                  Open
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
