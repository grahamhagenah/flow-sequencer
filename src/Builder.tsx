import { type ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Composer, FirstPoseChoices, InsertChoices } from './Composer';
import { getPose } from './data/graph';
import type { SampleFlow } from './data/samples';
import type { Transition } from './data/types';
import { GetStarted } from './GetStarted';
import type { Draft, SavedFlow } from './library';
import { aboutMinutes, classMs } from './player/conductor';
import { PlaybackDock } from './player/PlaybackDock';
import { usePlayer } from './player/usePlayer';
import { RowMenu } from './RowMenu';
import { advance, insertAfter, type Sequence, type SetSeq, setBreaths, start } from './sequence';
import { Pager, SequenceRow } from './SequenceRow';
import { usePaging } from './usePaging';

/**
 * The sequencer: the list of poses with the choices of what comes next under the
 * newest one, and the player below. While the flow is empty it shows the start
 * page instead, or (once asked) the first poses to choose from.
 */

export function Builder({
  seq,
  set,
  banner,
  timelineRef,
  onOpenSample,
  onPlaySample,
  recent,
  resume,
  onResume,
  onOpenSaved,
  onSeeAll,
  autoplay,
  onAutoplayStarted,
  openCount,
  choosing,
  setChoosing,
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
  /** A flow in progress, put aside when the app opened at its bare address. */
  resume: Draft | null;
  onResume: () => void;
  onOpenSaved: (f: SavedFlow) => void;
  onSeeAll: () => void;
  /** Start playback as soon as the flow that was just opened is in place. */
  autoplay: boolean;
  onAutoplayStarted: () => void;
  /** Changes whenever a different flow is opened. */
  openCount: number;
  /** An empty flow shows the start page until "Start a new sequence" opens the empty sequencer. */
  choosing: boolean;
  setChoosing: (on: boolean) => void;
}) {
  const current = seq[seq.length - 1];
  const player = usePlayer(seq);

  // "Play" on a sample opens it and asks for playback; by the time this runs the
  // player has the new flow. The click already unlocked audio (unlockPlayback).
  useEffect(() => {
    if (!autoplay || seq.length === 0) return;
    onAutoplayStarted();
    player.toggle();
  }, [autoplay, seq]);
  const playingIndex = player.active ? player.state.index : -1;

  // Keep the playing step in view as playback moves on (on phones this scrolls
  // the page, which is the point), but not when it starts: pressing Play
  // shouldn't pull the page away from the button.
  const lastIndex = useRef(-1);
  useEffect(() => {
    const moved = playingIndex >= 0 && lastIndex.current >= 0 && playingIndex !== lastIndex.current;
    lastIndex.current = playingIndex;
    if (moved) timelineRef.current?.querySelector(`.row[data-index="${playingIndex}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [playingIndex, timelineRef]);

  const { page, pageSize, pageCount, first, onLastPage, justOpened, goToPage, showStep } = usePaging({
    length: seq.length,
    focus: player.active ? player.state.index : seq.length - 1,
    openCount,
    panelRef: timelineRef,
  });

  // Breaths set in the Next heading carry on to each new pose. A newly opened or
  // cleared flow starts on each pose's own suggested breaths.
  const [carryBreaths, setCarryBreaths] = useState<number | null>(null);
  useEffect(() => {
    if (justOpened || seq.length === 0) setCarryBreaths(null);
  }, [justOpened, seq.length]);
  const addMoves = (moves: Transition[]) => {
    keepChoicesInPlace();
    set((q) =>
      moves.reduce((acc, t) => {
        const next = advance(acc, t);
        return carryBreaths === null ? next : setBreaths(next, next.length - 1, carryBreaths);
      }, q),
    );
  };

  // Inserting between two poses: while set, the choices under that row offer what fits there.
  const [insertAt, setInsertAt] = useState<number | null>(null);
  // Each of the two views starts at its top (the panel scrolls on desktop, the page on phones).
  useEffect(() => {
    if (timelineRef.current) timelineRef.current.scrollTop = 0;
    window.scrollTo(0, 0);
  }, [choosing, timelineRef]);
  const inserting = insertAt !== null && insertAt < seq.length - 1;
  useEffect(() => {
    if (insertAt !== null && !inserting) setInsertAt(null);
  }, [insertAt, inserting]);
  useEffect(() => {
    if (!inserting) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setInsertAt(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [inserting]);
  /** The step to show after the next edit, when it isn't the newest (an insert). */
  const revealAt = useRef<number | null>(null);

  // The ⋯ menu on a row: where it opens, and for which step.
  const [menu, setMenu] = useState<{ index: number; anchor: DOMRect } | null>(null);
  // A newly opened flow starts fresh, not halfway through an insert.
  useEffect(() => {
    if (!justOpened) return;
    setInsertAt(null);
    setMenu(null);
  }, [justOpened]);

  // The choices sit under the newest pose, so each pose added pushes them down a row.
  // An edit made from them notes where they were on screen, and the view then moves
  // by however far they moved, so they stay under your finger and the new row shows
  // just above them.
  const composerTop = useRef<number | null>(null);
  const keepChoicesInPlace = () => {
    composerTop.current = timelineRef.current?.querySelector('.composer')?.getBoundingClientRect().top ?? null;
  };
  useLayoutEffect(() => {
    const before = composerTop.current;
    composerTop.current = null;
    const panel = timelineRef.current;
    const after = panel?.querySelector('.composer')?.getBoundingClientRect().top;
    if (before === null || !panel || after === undefined) return;
    const by = after - before;
    // The desktop panel scrolls on its own; on phones the page does.
    if (getComputedStyle(panel).overflowY === 'auto') panel.scrollTop += by;
    else window.scrollBy(0, by);
  });

  // Adding a pose always shows it, even mid-class (when the page otherwise follows
  // the playing pose). The newest row is marked in the CSS (.row.current).
  const lastLength = useRef(seq.length);
  const [justAdded, setJustAdded] = useState<{ index: number } | null>(null);
  useEffect(() => {
    const grew = seq.length > lastLength.current && !justOpened;
    lastLength.current = seq.length;
    const target = revealAt.current ?? seq.length - 1;
    revealAt.current = null;
    if (!grew) return;
    showStep(target);
    setJustAdded({ index: target });
  }, [seq.length, justOpened]);
  useEffect(() => {
    // A pose added at the end is kept in view by keepChoicesInPlace; an inserted one
    // (or one shown from elsewhere) is scrolled to here.
    if (justAdded === null || justAdded.index === seq.length - 1) return;
    timelineRef.current
      ?.querySelector(`.row[data-index="${justAdded.index}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [justAdded, page, timelineRef]);
  // Opening an insert brings its choices, just under the row, into view.
  useEffect(() => {
    if (inserting) timelineRef.current?.querySelector('.composer-insert')?.scrollIntoView({ block: 'nearest' });
  }, [inserting, insertAt, timelineRef]);

  const shown = seq.slice(first, first + pageSize);
  const { holdElapsed, holdTotal, speechElapsed, speechTotal } = player.state;
  // The whole step, the voice's announcement as well as the hold, so the bar moves from
  // the moment the step starts (as the player's clock does) rather than waiting for
  // the voice to finish. (A one-breath step speaks during its breath: speechTotal is 0.)
  const stepTotal = speechTotal + holdTotal;
  const progress = stepTotal ? ((speechElapsed + holdElapsed) / stepTotal) * 100 : 0;

  return (
    <main className="layout">
      <aside className="timeline" ref={timelineRef}>
        {banner}
        <div className={seq.length || choosing ? 'timeline-head' : 'timeline-head empty-head'}>
          <h2>Sequence</h2>
          {pageCount > 1 && <Pager page={first / pageSize} pageCount={pageCount} onPage={goToPage} />}
          {seq.length > 0 && (
            <span className="meta">
              {seq.length} {seq.length === 1 ? 'pose' : 'poses'} ·{' '}
              {aboutMinutes(classMs(seq, player.settings.secondsPerBreath, player.settings.chime))}
            </span>
          )}
        </div>
        {seq.length === 0 && choosing ? (
          <FirstPoseChoices onPick={(id) => set(start(id))} />
        ) : seq.length === 0 ? (
          <GetStarted
            onBuild={() => setChoosing(true)}
            recent={recent}
            resume={resume}
            onResume={onResume}
            onPlaySample={onPlaySample}
            onOpenSample={onOpenSample}
            onOpenSaved={onOpenSaved}
            onSeeAll={onSeeAll}
          />
        ) : (
          <ol start={first + 1}>
            {shown.map((s, j) => {
              const i = first + j;
              const playing = i === playingIndex;
              return [
                <SequenceRow
                  key={i}
                  step={s}
                  index={i}
                  isNewest={i === seq.length - 1}
                  playing={playing}
                  played={player.active && i < playingIndex}
                  insertAfter={inserting && i === insertAt}
                  menuOpen={menu?.index === i}
                  progress={playing ? progress : 0}
                  onJump={() => player.goTo(i)}
                  onBreaths={(n) => set((q) => setBreaths(q, i, n))}
                  onMenu={(anchor) => setMenu(menu?.index === i ? null : { index: i, anchor })}
                />,
                inserting && i === insertAt && (
                  <InsertChoices
                    key="insert"
                    seq={seq}
                    index={i}
                    onCancel={() => setInsertAt(null)}
                    onPick={(o) => {
                      revealAt.current = i + 1;
                      set((q) => insertAfter(q, i, o));
                      setInsertAt(null);
                    }}
                  />
                ),
              ];
            })}
          </ol>
        )}

        {/* What comes next, right under the newest pose (on the last page; from any
            other page, a way there). */}
        {current &&
          (onLastPage ? (
            <Composer
              seq={seq}
              set={set}
              onAdd={addMoves}
              onBreaths={(n) => {
                setCarryBreaths(n);
                set((q) => setBreaths(q, q.length - 1, n));
              }}
              onBeforeEdit={keepChoicesInPlace}
            />
          ) : (
            <button className="link-btn composer-jump" onClick={() => goToPage(pageCount - 1)}>
              Add the next pose, after {seq.length} {getPose(current.poseId).name} ›
            </button>
          ))}
        {seq.length > 0 && (
          <div className="play-footer">
            <PlaybackDock seq={seq} player={player} />
          </div>
        )}
      </aside>
      {menu && menu.index < seq.length && (
        <RowMenu
          seq={seq}
          index={menu.index}
          anchor={menu.anchor}
          onClose={() => setMenu(null)}
          onInsert={() => setInsertAt(menu.index)}
          onRemove={(next) => set(next)}
        />
      )}
    </main>
  );
}
