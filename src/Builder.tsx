import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from 'react';
import { applySide, getPose, otherSide, outgoing, renderLabel, sideLabel, TRANSITION_BY_ID } from './data/graph';
import { START_POSES } from './data/poses';
import type { SampleFlow } from './data/samples';
import { GetStarted, HowItWorks } from './GetStarted';
import type { SavedFlow } from './library';
import { PlaybackDock } from './player/PlaybackDock';
import { usePlayer } from './player/usePlayer';
import { advance, mirror, mirrorRange, type Sequence, setBreaths, setLeadingSide, start } from './sequence';
import { aboutMinutes, classMs } from './player/conductor';

type SetSeq = (next: Sequence | ((prev: Sequence) => Sequence)) => void;

/** Poses per page of the sequence list; shorter flows show in full. */
const PAGE_SIZE = 20;

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

  const rowBody = (i: number) => {
    const s = seq[i];
    const p = getPose(s.poseId);
    const via = s.via === undefined ? undefined : TRANSITION_BY_ID.get(s.via);
    return (
      <>
        {via && (
          <span className="via" title={renderLabel(via.label, s.side)}>
            {renderLabel(via.label, s.side)}
          </span>
        )}
        <span className="row-name">
          {p.name}
          {p.sided && <span className="side">{sideLabel(s.side)}</span>}
        </span>
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

        {current ? (
          <CurrentPose step={current} onBreaths={(n) => set((s) => setBreaths(s, s.length - 1, n))} />
        ) : (
          // How it works, in the pose card's place, so "Start" sits where "Next" will.
          <HowItWorks />
        )}

        <div className="next-head">
          <h2>{current ? 'Next' : 'Start'}</h2>
          {current && choosesSide(current.poseId) && (
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
        <div className="tiles">
          {current
            ? outgoing(current.poseId).map((t) => {
                const to = getPose(t.to);
                const side = applySide(current.side, t.side);
                return (
                  <button key={t.id} className="tile" onClick={() => set((s) => advance(s, t))}>
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
          {first > 0 && (
            <button className="link-btn to-first" onClick={() => goToPage(0)}>
              ↑ Back to first page
            </button>
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
                isLast && !player.active && 'current',
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
                >
                  <span className="num">{i + 1}</span>
                  {/* Jumps playback here, paused, so the class can pick up from this pose. */}
                  <button className="row-main" onClick={() => player.goTo(i)} title="Jump here (paused)">
                    {rowBody(i)}
                  </button>
                  <span className="row-breaths">{s.breaths === 1 ? '1 breath' : `${s.breaths} breaths`}</span>
                </li>
              );
            })}
          </ol>
        )}
        {/* The pager sits with the dock, pinned to the bottom, so it's in the same place on every page. */}
        {seq.length > 0 && (
          <div className="play-footer">
            {pageCount > 1 && (
              <div className="pager">
                <button onClick={() => turnPage(-1)} disabled={first === 0} aria-label="Previous poses">
                  ‹
                </button>
                <span>
                  Poses {first + 1}–{first + shown.length} of {seq.length}
                </span>
                <button
                  onClick={() => turnPage(1)}
                  disabled={first + PAGE_SIZE >= seq.length}
                  aria-label="Next poses"
                >
                  ›
                </button>
              </div>
            )}
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

function CurrentPose({ step, onBreaths }: { step: Sequence[number]; onBreaths: (n: number) => void }) {
  const p = getPose(step.poseId);
  return (
    <div className="current-pose">
      <div className="pose-head">
        <div>
          <div className="pose-name">
            {p.name}
            {p.sided && <span className="side">{sideLabel(step.side)}</span>}
          </div>
          {/* Always there, so poses without one don't make the card shorter. */}
          <div className="sanskrit">{p.sanskrit ?? '\u00a0'}</div>
        </div>
        <Stepper value={step.breaths} onChange={onBreaths} />
      </div>
      <p className="cue">{p.cue}</p>
    </div>
  );
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
