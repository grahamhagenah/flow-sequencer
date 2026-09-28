import { useEffect, useRef, useState } from 'react';
import { flowIcon } from './flowIcons';
import { STRIP_GAP, STRIP_ITEM, useFitCount } from './GetStarted';
import { CheckIcon, LinkIcon, PlayIcon } from './icons';
import { aboutMinutes, classMs } from './player/conductor';
import { loadSettings } from './player/usePlayer';
import { PoseFigure } from './PoseFigure';
import type { Sequence } from './sequence';

/** "12 poses · about 15 min", with the player's saved settings. */
function summary(seq: Sequence) {
  const { secondsPerBreath, chime } = loadSettings();
  return `${seq.length} ${seq.length === 1 ? 'pose' : 'poses'} · ${aboutMinutes(classMs(seq, secondsPerBreath, chime))}`;
}

/** Up to `max` of the flow's poses in order, without repeats, spread across the whole of it. */
function glimpse(seq: Sequence, max: number) {
  const seen = new Set<string>();
  const steps = seq.filter((s) => !seen.has(s.poseId) && seen.add(s.poseId));
  const every = Math.max(1, steps.length / max);
  return Array.from({ length: Math.min(max, steps.length) }, (_, k) => steps[Math.floor(k * every)]);
}

/** The flow's icon (or a dot) in its colour, then its name. */
function FlowName({ name, icon }: { name: string; icon: string | null }) {
  const glyph = flowIcon(icon);
  return (
    <h2 className="share-title">
      {glyph ? <span className="share-icon">{glyph.glyph}</span> : <span className="share-dot" />}
      {name.trim() || 'A yoga flow'}
    </h2>
  );
}

/**
 * What someone who opens a shared link sees first: the flow, what's in it and one way
 * to start, rather than the editor. "See the poses" opens it as usual.
 */
export function SharedWelcome({
  seq,
  name,
  icon,
  onStart,
  onBrowse,
}: {
  seq: Sequence;
  name: string;
  icon: string | null;
  onStart: () => void;
  onBrowse: () => void;
}) {
  const strip = useRef<HTMLDivElement>(null);
  const fit = useFitCount(strip, STRIP_ITEM, STRIP_GAP, 8);
  return (
    <section className="share-screen">
      <span className="share-kicker">A flow shared with you</span>
      <FlowName name={name} icon={icon} />
      <span className="share-meta">{summary(seq)}</span>
      <div className="share-poses" ref={strip} aria-hidden="true">
        {glimpse(seq, fit).map((s) => (
          <PoseFigure key={s.poseId} poseId={s.poseId} side={s.side} size={STRIP_ITEM} />
        ))}
      </div>
      <p className="share-note">A voice guides you from pose to pose, so turn your sound on.</p>
      <div className="share-actions">
        <button className="primary" onClick={onStart}>
          <PlayIcon /> Start the flow
        </button>
        <button className="share-quiet" onClick={onBrowse}>
          See the poses
        </button>
      </div>
    </section>
  );
}

/** Shares a link to the flow: the phone's share sheet where there is one, else the clipboard. */
async function shareLink(url: string, name: string): Promise<'shared' | 'copied' | null> {
  const touch = window.matchMedia('(pointer: coarse)').matches;
  if (touch && navigator.share) {
    try {
      await navigator.share({ title: name, text: `Try this yoga flow: ${name}`, url });
      return 'shared';
    } catch (e) {
      // Closing the sheet isn't a failure; anything else falls back to copying.
      if (e instanceof DOMException && e.name === 'AbortError') return null;
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    return 'copied';
  } catch {
    window.prompt('Copy this link:', url);
    return null;
  }
}

/**
 * The end of a class: a moment to share the flow (the link opens it for anyone, with the
 * welcome above) and to keep it, if it isn't saved as it is.
 */
export function FlowFinished({
  seq,
  name,
  url,
  canSave,
  onSave,
  onClose,
}: {
  seq: Sequence;
  name: string;
  url: string;
  canSave: boolean;
  onSave: () => void;
  onClose: () => void;
}) {
  const [shared, setShared] = useState<'shared' | 'copied' | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  useEffect(() => {
    if (!shared) return;
    const t = setTimeout(() => setShared(null), 2500);
    return () => clearTimeout(t);
  }, [shared]);
  return (
    <section className="share-screen finished">
      {/* The flow's name heads the panel above, so this one celebrates instead. */}
      <span className="share-kicker">Flow complete</span>
      <h2 className="share-title">Nice work</h2>
      <span className="share-meta">{summary(seq)}</span>
      <p className="share-note">Know someone who’d like it? The link opens it ready to play, no sign-up.</p>
      <div className="share-actions">
        <button className="primary" onClick={async () => setShared(await shareLink(url, name.trim() || 'A yoga flow'))}>
          {shared ? <CheckIcon /> : <LinkIcon />} {shared === 'copied' ? 'Link copied' : shared === 'shared' ? 'Shared' : 'Share this flow'}
        </button>
        {(canSave || justSaved) && (
          <button
            disabled={justSaved}
            onClick={() => {
              onSave();
              setJustSaved(true);
            }}
          >
            {justSaved ? (
              <>
                <CheckIcon /> Saved to My flows
              </>
            ) : (
              'Save to My flows'
            )}
          </button>
        )}
        <button className="share-quiet" onClick={onClose}>
          Back to the flow
        </button>
      </div>
    </section>
  );
}
