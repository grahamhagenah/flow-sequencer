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
import { advance, insertAfter, isAppend, type Sequence, type SetSeq, setBreaths, start } from './sequence';
import { Pager, SequenceRow } from './SequenceRow';
import { SinglePoseView } from './SinglePoseView';
import { usePaging } from './usePaging';

export type Layout = 'single' | 'list';
/** A view asked for by an open (App's openCount `count`): Open asks for the list, Play for one pose. */
export interface OpenLayout {
  count: number;
  layout: Layout;
}
/** The last open whose view has been applied: kept outside, like handledOpen, as the builder remounts. */
let appliedOpenLayout = 0;
const LAYOUT_KEY = 'nextpose:layout';
const loadLayout = (): Layout => {
  try {
    return localStorage.getItem(LAYOUT_KEY) === 'list' ? 'list' : 'single';
  } catch {
    return 'single';
  }
};
const saveLayout = (layout: Layout) => {
  try {
    localStorage.setItem(LAYOUT_KEY, layout);
  } catch {
    // Not remembered; single view next time.
  }
};

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
  openLayout,
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
  /** The view the latest open asked for, if any. */
  openLayout: OpenLayout | null;
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

  // While building, the list follows the newest pose only as poses are added at the end;
  // a removal, or an undo that brings one back, leaves the page where it is.
  const buildFocus = useRef(seq.length - 1);
  const focusSeq = useRef(seq);
  const focusOpen = useRef(openCount);
  if (focusSeq.current !== seq || focusOpen.current !== openCount) {
    const fresh = focusOpen.current !== openCount || isAppend(focusSeq.current, seq);
    buildFocus.current = fresh ? seq.length - 1 : Math.min(buildFocus.current, seq.length - 1);
    focusSeq.current = seq;
    focusOpen.current = openCount;
  }

  const { page, pageSize, pageCount, first, onLastPage, justOpened, goToPage, showStep } = usePaging({
    length: seq.length,
    focus: player.active ? player.state.index : buildFocus.current,
    followBack: player.active,
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
  // Switching between the start page and the empty sequencer starts the new view at its
  // top (the panel scrolls on desktop, the page on phones). Only on a real switch, not
  // on mount, which would undo the scroll to the newest pose on coming back from Flows.
  const lastChoosing = useRef(choosing);
  useEffect(() => {
    if (lastChoosing.current === choosing) return;
    lastChoosing.current = choosing;
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
  // the playing pose): at the end, or where it was inserted. The newest row is marked
  // in the CSS (.row.current). Other growth (an undo bringing back a removed pose)
  // leaves the view alone.
  const lastSeq = useRef(seq);
  const [justAdded, setJustAdded] = useState<{ index: number } | null>(null);
  useEffect(() => {
    const inserted = revealAt.current;
    const added = !justOpened && (inserted !== null || isAppend(lastSeq.current, seq));
    lastSeq.current = seq;
    revealAt.current = null;
    if (!added) return;
    const target = inserted ?? seq.length - 1;
    showStep(target);
    setJustAdded({ index: target });
  }, [seq, justOpened]);
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

  // List or single-pose view. Single is the default, for following a flow; the list is
  // where it's built, so starting a new sequence opens that. The choice is remembered.
  const [layout, setLayoutState] = useState<Layout>(loadLayout);
  const setLayout = (next: Layout) => {
    setLayoutState(next);
    saveLayout(next);
    setMenu(null); // a row's menu belongs to the list
  };
  // A flow opened with Open shows the list; with Play, one pose at a time (once per open).
  useEffect(() => {
    if (!openLayout || openLayout.count !== openCount || appliedOpenLayout === openCount) return;
    appliedOpenLayout = openCount;
    setLayout(openLayout.layout);
  }, [openCount, openLayout]);
  const single = layout === 'single' && seq.length > 0;
  // The pose shown in single view: the playing one during a class, else the one stepped to.
  const [viewIndex, setViewIndex] = useState(0);
  useEffect(() => {
    if (justOpened) setViewIndex(0);
  }, [justOpened]);
  const singleIndex = Math.min(player.active ? player.state.index : viewIndex, seq.length - 1);
  const stepSingle = (by: -1 | 1) => {
    if (player.active) return by > 0 ? player.next() : player.prev();
    setViewIndex((i) => Math.max(0, Math.min(seq.length - 1, Math.min(i, seq.length - 1) + by)));
  };
  // During a class, the breath being taken on the pose in view.
  const liveBreath = (() => {
    const { index, phase, holdElapsed } = player.state;
    if (!player.active || index !== singleIndex || (phase !== 'speaking' && phase !== 'holding')) return null;
    const breathMs = player.settings.secondsPerBreath * 1000;
    const holding = phase === 'holding';
    return { breath: holding ? Math.min(seq[index].breaths, Math.floor(holdElapsed / breathMs) + 1) : null };
  })();
  // ← and → step through the poses in single view (not while typing).
  useEffect(() => {
    if (!single) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'ArrowLeft') stepSingle(-1);
      else if (e.key === 'ArrowRight') stepSingle(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <main className="layout">
      <aside className="timeline" ref={timelineRef}>
        {banner}
        <div className={seq.length || choosing ? 'timeline-head' : 'timeline-head empty-head'}>
          <h2>Sequence</h2>
          {!single && pageCount > 1 && <Pager page={first / pageSize} pageCount={pageCount} onPage={goToPage} />}
          {seq.length > 0 && (
            <span className="timeline-head-end">
              <span className="meta">
                {seq.length} {seq.length === 1 ? 'pose' : 'poses'} ·{' '}
                {aboutMinutes(classMs(seq, player.settings.secondsPerBreath, player.settings.chime))}
              </span>
              <span className="layout-toggle" role="group" aria-label="View">
                <button aria-pressed={single} onClick={() => setLayout('single')} title="One pose at a time">
                  One pose
                </button>
                <button aria-pressed={!single} onClick={() => setLayout('list')} title="The whole list, to edit">
                  List
                </button>
              </span>
            </span>
          )}
        </div>
        {seq.length === 0 && choosing ? (
          <FirstPoseChoices onPick={(id) => set(start(id))} />
        ) : seq.length === 0 ? (
          <GetStarted
            onBuild={() => {
              setChoosing(true);
              setLayout('list');
            }}
            recent={recent}
            resume={resume}
            onResume={onResume}
            onPlaySample={onPlaySample}
            onOpenSample={onOpenSample}
            onOpenSaved={onOpenSaved}
            onSeeAll={onSeeAll}
          />
        ) : single ? (
          <SinglePoseView
            seq={seq}
            index={singleIndex}
            onStep={stepSingle}
            secondsPerBreath={player.settings.secondsPerBreath}
            live={liveBreath}
            onBreaths={(n) => set((q) => setBreaths(q, singleIndex, n))}
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
          !single &&
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
            {/* In single view, Play starts from the pose on screen. */}
            <PlaybackDock
              seq={seq}
              player={player}
              startAt={single ? singleIndex : 0}
              onBrowse={single ? stepSingle : undefined}
            />
          </div>
        )}
      </aside>
      {menu && menu.index < seq.length && (
        <RowMenu
          key={menu.index}
          seq={seq}
          index={menu.index}
          anchor={menu.anchor}
          onClose={() => setMenu(null)}
          onBreaths={(n) => set((q) => setBreaths(q, menu.index, n))}
          onPlayFrom={() => player.playFrom(menu.index)}
          onInsert={() => setInsertAt(menu.index)}
          onRemove={(next) => set(next)}
        />
      )}
    </main>
  );
}
