import { SAMPLE_FLOWS, type SampleFlow } from './data/samples';
import { SampleList } from './GetStarted';
import { InfoIcon, PlusIcon } from './icons';
import type { SavedFlow } from './library';
import { decodeSteps } from './link';
import { aboutMinutes, classMs } from './player/conductor';
import { loadSettings } from './player/usePlayer';

const SAMPLE_GROUPS = [
  { title: 'Ready-made classes', peak: false },
  { title: 'Peak pose classes', peak: true },
];

/** How long a flow runs with the player's saved settings, voice included. */
const length = (seq: Parameters<typeof classMs>[0]) => {
  const { secondsPerBreath, chime } = loadSettings();
  return classMs(seq, secondsPerBreath, chime);
};

export function FlowList({
  flows,
  currentId,
  copiedKey,
  onOpen,
  onNew,
  onCopyLink,
  onDuplicate,
  onDelete,
  onOpenSample,
  onPlaySample,
}: {
  flows: SavedFlow[];
  currentId: string | null;
  /** Which flow's link was just copied, to say so on its button. */
  copiedKey: string | null;
  onOpen: (f: SavedFlow) => void;
  onNew: () => void;
  onCopyLink: (f: SavedFlow) => void;
  onDuplicate: (f: SavedFlow) => void;
  onDelete: (f: SavedFlow) => void;
  onOpenSample: (f: SampleFlow) => void;
  onPlaySample: (f: SampleFlow) => void;
}) {
  return (
    <main className="flows">
      <div className="flows-head">
        <h2>Saved flows</h2>
        <button className="new-flow" onClick={onNew}>
          <PlusIcon /> New flow
        </button>
      </div>
      <p className="storage-note">
        <InfoIcon />
        <span>
          Saved in this browser only, and Safari clears it after a week without a visit. Copy a flow’s link to keep
          it for good or open it on another device.
        </span>
      </p>
      {flows.length === 0 ? (
        <p className="empty">No saved flows yet. Build one and press Save, or open a sample below.</p>
      ) : (
        <ul>
          {flows.map((f) => {
            const seq = decodeSteps(f.steps).seq;
            return (
              <li key={f.id} className={f.id === currentId ? 'flow current' : 'flow'}>
                <button className="flow-main" onClick={() => onOpen(f)}>
                  <span className="flow-title">{f.name}</span>
                  <span className="flow-meta">
                    {seq.length} {seq.length === 1 ? 'pose' : 'poses'} · {aboutMinutes(length(seq))} · saved{' '}
                    {new Date(f.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    {f.id === currentId && ' · open now'}
                  </span>
                </button>
                <div className="flow-actions">
                  <button onClick={() => onCopyLink(f)}>{copiedKey === f.id ? 'Copied' : 'Copy link'}</button>
                  <button onClick={() => onDuplicate(f)}>Duplicate</button>
                  <button className="delete" onClick={() => onDelete(f)}>
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {SAMPLE_GROUPS.map((g) => (
        <section key={g.title}>
          <div className="flows-head samples-head">
            <h2>{g.title}</h2>
          </div>
          <SampleList
            flows={SAMPLE_FLOWS.filter((f) => !!f.peak === g.peak)}
            onPlaySample={onPlaySample}
            onOpenSample={onOpenSample}
          />
        </section>
      ))}
    </main>
  );
}
