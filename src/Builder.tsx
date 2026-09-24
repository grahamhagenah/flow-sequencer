import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from 'react';
import { applySide, getPose, otherSide, outgoing, renderLabel, sideLabel, TRANSITION_BY_ID } from './data/graph';
import { START_POSES } from './data/poses';
import type { Transition } from './data/types';
import type { SampleFlow } from './data/samples';
import { GetStarted, HowItWorks } from './GetStarted';
import { PauseIcon, PlayIcon } from './icons';
import type { SavedFlow } from './library';
import { PlaybackDock } from './player/PlaybackDock';
import { usePlayer } from './player/usePlayer';
import { advance, mirror, mirrorRange, type Sequence, setBreaths, setLeadingSide, start } from './sequence';
import { aboutMinutes, classMs } from './player/conductor';

type SetSeq = (next: Sequence | ((prev: Sequence) => Sequence)) => void;

/** Poses per page of the sequence list; shorter flows show in full. */
const PAGE_SIZE = 30;

/**
 * The last flow-open (App's openCount) the list has started on page one. Kept
 * outside the component because the builder unmounts while My flows is shown,
 * and a flow opened from there must still start at the top.
 */
let handledOpen = 0;

export function Builder({
  seq,
  set,
  banner,
  timelineRef,
  onOpenSample,
  onPlaySample,
  recent,
  onOpenSaved,
  onSeeAll,
  autoplay,
  onAutoplayStarted,
  openCount,
}: {
  seq: Sequence;
  set: SetSeq;
  /** A notice shown above the current pose, if any. */
  banner: ReactNode;
  timelineRef: React.RefObject<HTMLElement | null>;
  onOpenSample: (f: SampleFlow) => void;
  onPlaySample: (f: SampleFlow) => void;
  /** Saved flows, newest first, for the empty panel. */
  recent: SavedFlow[];
  onOpenSaved: (f: SavedFlow) => void;
  onSeeAll: () => void;
  /** Start playback as soon as the flow that was just opened is in place. */
  autoplay: boolean;
  onAutoplayStarted: () => void;
  /** Changes whenever a different flow is opened. */
  openCount: number;
}) {
  const current = seq[seq.length - 1];
  const range = mirrorRange(seq);
  const mirrorSide = range
    ? otherSide(seq.slice(range[0], range[1] + 1).find((s) => getPose(s.poseId).sided)!.side)
    : null;

  const player = usePlayer(seq);

  // "Play" on a sample opens it and asks for playback; by the time this runs the
  // player has the new flow. The click already unlocked audio (unlockPlayback).
  useEffect(() => {
    if (!autoplay || seq.length === 0) return;
    onAutoplayStarted();
    player.toggle();
  }, [autoplay, seq]);
  const playingIndex = player.active ? player.state.index : -1;

  /**
   * A row's three lines: the move that led here, the pose, and its Sanskrit name.
   * A line with nothing to show keeps its space (a no-break space), so every row
   * is the same height.
   */
  const rowBody = (i: number) => {
    const s = seq[i];
    const p = getPose(s.poseId);
    const via = s.via === undefined ? undefined : TRANSITION_BY_ID.get(s.via);
    const move = via ? renderLabel(via.label, s.side) : '';
    return (
      <>
        <span className="via" title={move || undefined}>
          {move || '\u00a0'}
        </span>
        <span className="row-name">
          {p.name}
          {p.sided && <span className="side">{sideLabel(s.side)}</span>}
        </span>
        <span className="row-sanskrit">{p.sanskrit ?? '\u00a0'}</span>
      </>
    );
  };

  // Keep the playing step in view as playback moves on (on phones this scrolls
  // the page, which is the point), but not when it starts: pressing Play
  // shouldn't pull the page away from the button.
  const lastIndex = useRef(-1);
  useEffect(() => {
    const moved = playingIndex >= 0 && lastIndex.current >= 0 && playingIndex !== lastIndex.current;
    lastIndex.current = playingIndex;
    if (moved) timelineRef.current?.querySelector(`.row[data-index="${playingIndex}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [playingIndex, timelineRef]);

  // Long flows show a page of the list at a time. A newly opened flow starts on
  // its first page; after that the page follows what you're doing: the newest
  // pose while building, the playing one during a class. Turning pages by hand
  // holds until that moves on.
  const pageCount = Math.ceil(seq.length / PAGE_SIZE);
  const focus = player.active ? player.state.index : seq.length - 1;
  const [page, setPage] = useState(() => (openCount !== handledOpen ? 0 : Math.max(0, Math.floor(focus / PAGE_SIZE))));
  // Only a real change of focus moves the page, not the effect running again
  // (React re-runs effects on mount in development).
  const lastFocus = useRef(focus);
  // Read before the effects below mark the open as handled.
  const justOpened = handledOpen !== openCount;
  useEffect(() => {
    if (handledOpen !== openCount) {
      handledOpen = openCount;
      lastFocus.current = focus;
      setPage(0);
      if (timelineRef.current) timelineRef.current.scrollTop = 0;
      return;
    }
    if (lastFocus.current === focus) return;
    lastFocus.current = focus;
    setPage(Math.max(0, Math.floor(focus / PAGE_SIZE)));
  }, [focus, openCount, timelineRef]);

  // Breaths set in the Next heading carry on to each new pose, until reset to the
  // poses' own defaults. A newly opened or cleared flow starts on the defaults.
  const [carryBreaths, setCarryBreaths] = useState<number | null>(null);
  useEffect(() => {
    if (justOpened || seq.length === 0) setCarryBreaths(null);
  }, [justOpened, seq.length]);
  const addPose = (t: Transition) =>
    set((q) => {
      const next = advance(q, t);
      return carryBreaths === null ? next : setBreaths(next, next.length - 1, carryBreaths);
    });

  // Adding a pose always shows it, even mid-class (when the page otherwise follows
  // the playing pose). The newest row is marked in the CSS (.row.current).
  const lastLength = useRef(seq.length);
  const [justAdded, setJustAdded] = useState<{ index: number } | null>(null);
  useEffect(() => {
    const grew = seq.length > lastLength.current && !justOpened;
    lastLength.current = seq.length;
    if (!grew) return;
    setPage(Math.floor((seq.length - 1) / PAGE_SIZE));
    setJustAdded({ index: seq.length - 1 });
  }, [seq.length, justOpened]);
  useEffect(() => {
    if (justAdded === null) return;
    // Bring the new row into view within the sequence panel (desktop, where the panel
    // scrolls on its own). On phones the page would scroll away from the tiles, so not there.
    const panel = timelineRef.current;
    const row = panel?.querySelector<HTMLElement>(`.row[data-index="${justAdded.index}"]`);
    if (panel && row && getComputedStyle(panel).overflowY === 'auto') {
      const { top, bottom } = row.getBoundingClientRect();
      const box = panel.getBoundingClientRect();
      const footer = panel.querySelector('.play-footer')?.getBoundingClientRect().top ?? box.bottom;
      if (bottom > footer) panel.scrollTop += bottom - footer + 12;
      else if (top < box.top) panel.scrollTop -= box.top - top + 12;
    }
  }, [justAdded, page, timelineRef]);
  const first = Math.min(page, Math.max(0, pageCount - 1)) * PAGE_SIZE;
  const shown = seq.slice(first, first + PAGE_SIZE);
  const goToPage = (p: number) => {
    setPage(p);
    // Start the new page at its first pose. Only the desktop panel scrolls on its own.
    if (timelineRef.current) timelineRef.current.scrollTop = 0;
  };
  const turnPage = (by: number) => goToPage(first / PAGE_SIZE + by);

  return (
    <main className={current ? 'layout' : 'layout empty'}>
      <section className="builder">
        {banner}

        {/* The newest pose shows in the sequence; this side is only for what comes next. */}
        {!current && <HowItWorks />}

        <div className="next-head">
          <h2>
            {current ? 'Next' : 'Start'}
            {current && (
              <span className="next-from">
                · from {getPose(current.poseId).name}
                {getPose(current.poseId).sided && ` (${current.side})`}
              </span>
            )}
          </h2>
          {current && (
            <div className="next-controls">
              {/* The newest pose's breaths, carried on to the poses added after it. */}
              <Stepper
                value={current.breaths}
                onChange={(n) => {
                  setCarryBreaths(n);
                  set((q) => setBreaths(q, q.length - 1, n));
                }}
              />
              {carryBreaths !== null && (
                <button
                  className="link-btn reset-breaths"
                  onClick={() => {
                    setCarryBreaths(null);
                    set((q) => setBreaths(q, q.length - 1, getPose(current.poseId).breaths));
                  }}
                  title="Go back to each pose's suggested breaths"
                >
                  Default
                </button>
              )}
              {choosesSide(current.poseId) && (
                <div className="leading" role="group" aria-label="Side for the next move">
                  {(['right', 'left'] as const).map((side) => (
                    <button
                      key={side}
                      aria-pressed={current.side === side}
                      onClick={() => set((s) => setLeadingSide(s, side))}
                    >
                      {sideLabel(side)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="tiles">
          {current
            ? outgoing(current.poseId).map((t) => {
                const to = getPose(t.to);
                const side = applySide(current.side, t.side);
                return (
                  <button key={t.id} className="tile" onClick={() => addPose(t)}>
                    <span className="tile-label">{renderLabel(t.label, side)}</span>
                    <span className="tile-to">
                      {to.name}
                      {to.sided && ` · ${sideLabel(side)}`}
                    </span>
                  </button>
                );
              })
            : START_POSES.map((id) => {
                const p = getPose(id);
                return (
                  <button key={id} className="tile" onClick={() => set(start(id))}>
                    <span className="tile-label">{p.name}</span>
                    {p.sanskrit && <span className="tile-to">{p.sanskrit}</span>}
                  </button>
                );
              })}
        </div>

        {/* Below the tiles, so it coming and going never moves them. */}
        {range && mirrorSide && (
          <button className="mirror" onClick={() => set(mirror)}>
            <span className="kicker">Suggestion</span>
            Repeat on the {mirrorSide} side
            <span className="sub">
              Adds the last {range[1] - range[0] + 1} steps again, mirrored, starting from{' '}
              {getPose(seq[range[0]].poseId).name}
            </span>
          </button>
        )}
      </section>

      <aside className="timeline" ref={timelineRef}>
        <div className={seq.length ? 'timeline-head' : 'timeline-head empty-head'}>
          <h2>Sequence</h2>
          {/* Quiet page controls beside the heading, for flows longer than a page. */}
          {pageCount > 1 && (
            <nav className="pager" aria-label="Sequence pages">
              <button onClick={() => goToPage(0)} disabled={first === 0} aria-label="First page" title="First page">
                «
              </button>
              <button onClick={() => turnPage(-1)} disabled={first === 0} aria-label="Previous poses" title="Previous poses">
                ‹
              </button>
              <span>
                {first + 1}–{first + shown.length} of {seq.length}
              </span>
              <button
                onClick={() => turnPage(1)}
                disabled={first + PAGE_SIZE >= seq.length}
                aria-label="Next poses"
                title="Next poses"
              >
                ›
              </button>
            </nav>
          )}
          {seq.length > 0 && (
            <span className="meta">
              {seq.length} {seq.length === 1 ? 'pose' : 'poses'} ·{' '}
              {aboutMinutes(classMs(seq, player.settings.secondsPerBreath, player.settings.chime))}
            </span>
          )}
        </div>
        {seq.length === 0 ? (
          <GetStarted
            recent={recent}
            onPlaySample={onPlaySample}
            onOpenSample={onOpenSample}
            onOpenSaved={onOpenSaved}
            onSeeAll={onSeeAll}
          />
        ) : (
          <ol start={first + 1}>
            {shown.map((s, j) => {
              const i = first + j;
              const isLast = i === seq.length - 1;
              const playing = i === playingIndex;
              const { holdElapsed, holdTotal } = player.state;
              const className = [
                'row',
                isLast && !playing && 'current',
                playing && 'playing',
                player.active && i < playingIndex && 'played',
              ]
                .filter(Boolean)
                .join(' ');
              const progress = playing && holdTotal ? (holdElapsed / holdTotal) * 100 : 0;
              return (
                <li
                  key={i}
                  data-index={i}
                  className={className}
                  style={playing ? ({ '--progress': `${progress}%` } as CSSProperties) : undefined}
                  aria-current={playing ? 'step' : undefined}
                  // The whole row jumps there, not just its text; the breaths control keeps its own clicks.
                  // (The text is a real button, for the keyboard.)
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest('.stepper, .row-main')) return;
                    player.goTo(i);
                  }}
                >
                  {/* The pose the player is on shows play or pause in place of its number, in a small
                      round badge (bare pause bars read as "11"). */}
                  <span className="num" aria-label={playing ? `${i + 1}, ${player.state.playing ? 'playing' : 'paused'}` : undefined}>
                    {playing ? <span className="now">{player.state.playing ? <PlayIcon /> : <PauseIcon />}</span> : i + 1}
                  </span>
                  {/* Jumps playback here, paused, so the class can pick up from this pose. */}
                  <button className="row-main" onClick={() => player.goTo(i)} title="Jump here (paused)">
                    {rowBody(i)}
                  </button>
                  {/* The newest pose's breaths are edited in the Next heading; during a class, the
                      pose it's on can be changed here. */}
                  {playing ? (
                    <Stepper value={s.breaths} onChange={(n) => set((q) => setBreaths(q, i, n))} />
                  ) : (
                    <span className="row-breaths">{s.breaths === 1 ? '1 breath' : `${s.breaths} breaths`}</span>
                  )}
                </li>
              );
            })}
          </ol>
        )}
        {seq.length > 0 && (
          <div className="play-footer">
            <PlaybackDock seq={seq} player={player} />
          </div>
        )}
      </aside>
    </main>
  );
}

/** An unsided pose whose next moves include a sided one, so the side is still open. */
function choosesSide(poseId: string): boolean {
  return !getPose(poseId).sided && outgoing(poseId).some((t) => getPose(t.to).sided);
}

function Stepper({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <span className="stepper">
      <button onClick={() => onChange(value - 1)} disabled={value <= 1} aria-label="Fewer breaths">−</button>
      <span className="count">
        {value}
        <span className="unit"> {value === 1 ? 'breath' : 'breaths'}</span>
      </span>
      <button onClick={() => onChange(value + 1)} aria-label="More breaths">+</button>
    </span>
  );
}
