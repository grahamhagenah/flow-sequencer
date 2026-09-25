import { type CSSProperties, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { applySide, getPose, otherSide, outgoing, renderLabel, routesFrom, sideLabel, TRANSITION_BY_ID } from './data/graph';
import { POSES, START_POSES } from './data/poses';
import type { Base, Side, Transition } from './data/types';
import type { SampleFlow } from './data/samples';
import { GetStarted, HowItWorks } from './GetStarted';
import { PoseFigure } from './PoseFigure';
import { useIsPhone } from './useIsPhone';
import type { SavedFlow } from './library';
import { PlaybackDock } from './player/PlaybackDock';
import { usePlayer } from './player/usePlayer';
import {
  advance,
  cutFrom,
  insertAfter,
  insertOptions,
  mirror,
  mirrorRange,
  removeStep,
  type Sequence,
  setBreaths,
  setLeadingSide,
  start,
} from './sequence';
import { aboutMinutes, classMs } from './player/conductor';

type SetSeq = (next: Sequence | ((prev: Sequence) => Sequence)) => void;

/**
 * Poses per page of the sequence list; shorter flows show in full. Fewer on phones,
 * where the tiles for adding the next pose sit below the list.
 */
const usePageSize = () => (useIsPhone() ? 10 : 30);

/**
 * The last flow-open (App's openCount) the list has started on page one. Kept
 * outside the component because the builder unmounts while My flows is shown,
 * and a flow opened from there must still start at the top.
 */
let handledOpen = 0;

/** How the "Get to" list groups poses: by where the body is, standing down to lying. */
const BASES: [Base, string][] = [
  ['standing', 'Standing'],
  ['hands', 'On hands and feet'],
  ['kneeling', 'Kneeling'],
  ['seated', 'Seated'],
  ['prone', 'Lying face down'],
  ['supine', 'Lying on your back'],
];

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
        {/* The first pose has no move into it; the voice says "Begin in …" there. */}
        <span className="via" title={move || undefined}>
          {via ? <MoveLabel label={via.label} side={s.side} /> : i === 0 ? 'Begin here' : '\u00a0'}
        </span>
        <span className="row-name">
          {p.name}
          {p.sided && !(via && namesSide(via.label)) && <span className="side">{sideLabel(s.side)}</span>}
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
  const pageSize = usePageSize();
  const pageCount = Math.ceil(seq.length / pageSize);
  const focus = player.active ? player.state.index : seq.length - 1;
  const [page, setPage] = useState(() => (openCount !== handledOpen ? 0 : Math.max(0, Math.floor(focus / pageSize))));
  // Only a real change of focus moves the page, not the effect running again
  // (React re-runs effects on mount in development).
  const lastFocus = useRef(focus);
  // Turning a phone to landscape (or resizing a window) changes the page size; stay on the focus's page.
  const lastPageSize = useRef(pageSize);
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
    if (lastFocus.current === focus && lastPageSize.current === pageSize) return;
    lastPageSize.current = pageSize;
    lastFocus.current = focus;
    setPage(Math.max(0, Math.floor(focus / pageSize)));
  }, [focus, openCount, pageSize, timelineRef]);

  // Breaths set in the Next heading carry on to each new pose. A newly opened or
  // cleared flow starts on each pose's own suggested breaths.
  const [carryBreaths, setCarryBreaths] = useState<number | null>(null);
  useEffect(() => {
    if (justOpened || seq.length === 0) setCarryBreaths(null);
  }, [justOpened, seq.length]);
  const addMoves = (moves: Transition[]) =>
    set((q) =>
      moves.reduce((acc, t) => {
        const next = advance(acc, t);
        return carryBreaths === null ? next : setBreaths(next, next.length - 1, carryBreaths);
      }, q),
    );
  const addPose = (t: Transition) => addMoves([t]);

  // "Get to": the fewest moves from the newest pose to any pose it can reach.
  const routes = useMemo(() => (current ? routesFrom(current.poseId) : null), [current?.poseId]);

  // Inserting between two poses: while set, the tiles offer what fits after this step.
  const [insertAt, setInsertAt] = useState<number | null>(null);
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
    setPage(Math.floor(target / pageSize));
    setJustAdded({ index: target });
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
  const first = Math.min(page, Math.max(0, pageCount - 1)) * pageSize;
  const shown = seq.slice(first, first + pageSize);
  const goToPage = (p: number) => {
    setPage(p);
    // Start the new page at its first pose. Only the desktop panel scrolls on its own.
    if (timelineRef.current) timelineRef.current.scrollTop = 0;
  };

  return (
    <main className={current ? 'layout' : 'layout empty'}>
      <section className="builder">
        {banner}

        {/* The newest pose shows in the sequence; this side is only for what comes next. */}
        {!current && <HowItWorks />}

        <div className="next-head">
          {inserting ? (
            <h2>
              Insert
              <span className="next-from">
                · between {insertAt + 1} {getPose(seq[insertAt].poseId).name} and {insertAt + 2}{' '}
                {getPose(seq[insertAt + 1].poseId).name}
              </span>
            </h2>
          ) : (
            <h2>
              {current ? 'Choose the next pose' : 'Choose a starting pose'}
              {current && (
                <span className="next-from">
                  · after{' '}
                  {/* Names the pose by its number, and shows it: a flow opens on its first
                      page, where the newest pose usually isn't. */}
                  <button
                    className="link-btn from-pose"
                    onClick={() => {
                      setPage(Math.floor((seq.length - 1) / pageSize));
                      setJustAdded({ index: seq.length - 1 });
                    }}
                    title="Show this pose in the sequence"
                  >
                    {seq.length} {getPose(current.poseId).name}
                    {getPose(current.poseId).sided && ` (${current.side})`}
                  </button>
                </span>
              )}
            </h2>
          )}
          {inserting && (
            <div className="next-controls">
              <button className="link-btn" onClick={() => setInsertAt(null)}>
                Cancel
              </button>
            </div>
          )}
          {current && !inserting && (
            <div className="next-controls">
              {/* The newest pose's breaths, carried on to the poses added after it. */}
              <Stepper
                value={current.breaths}
                onChange={(n) => {
                  setCarryBreaths(n);
                  set((q) => setBreaths(q, q.length - 1, n));
                }}
              />
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
          {inserting
            ? insertOptions(seq, insertAt).map((o) => {
                const to = getPose(o.move.to);
                const side = applySide(seq[insertAt].side, o.move.side);
                return (
                  <button
                    key={o.move.id}
                    className="tile"
                    title={`${renderLabel(o.move.label, side)} → ${to.name}`}
                    onClick={() => {
                      revealAt.current = insertAt + 1;
                      set((q) => insertAfter(q, insertAt, o));
                      setInsertAt(null);
                    }}
                  >
                    <PoseFigure poseId={o.move.to} side={side} />
                    <span className="tile-text">
                      <span className="tile-label">
                        <MoveLabel label={o.move.label} side={side} />
                      </span>
                      <span className="tile-to">
                        {to.name}
                        {to.sided && !namesSide(o.move.label) && ` · ${sideLabel(side)}`}
                      </span>
                    </span>
                  </button>
                );
              })
            : current
            ? outgoing(current.poseId).map((t) => {
                const to = getPose(t.to);
                const side = applySide(current.side, t.side);
                return (
                  <button
                    key={t.id}
                    className="tile"
                    title={`${renderLabel(t.label, side)} → ${to.name}`}
                    onClick={() => addPose(t)}
                  >
                    <PoseFigure poseId={t.to} side={side} />
                    <span className="tile-text">
                      <span className="tile-label">
                        <MoveLabel label={t.label} side={side} />
                      </span>
                      <span className="tile-to">
                        {to.name}
                        {to.sided && !namesSide(t.label) && ` · ${sideLabel(side)}`}
                      </span>
                    </span>
                  </button>
                );
              })
            : START_POSES.map((id) => {
                const p = getPose(id);
                return (
                  <button key={id} className="tile" onClick={() => set(start(id))}>
                    <PoseFigure poseId={id} />
                    <span className="tile-text">
                      <span className="tile-label">{p.name}</span>
                      {p.sanskrit && <span className="tile-to">{p.sanskrit}</span>}
                    </span>
                  </button>
                );
              })}
        </div>

        {inserting && insertOptions(seq, insertAt).length === 0 && (
          <p className="tiles-empty">
            No single pose leads from {getPose(seq[insertAt].poseId).name} on to{' '}
            {getPose(seq[insertAt + 1].poseId).name}.
          </p>
        )}

        {/* Always here once there's a pose, so it never moves the suggestion below it. */}
        {routes && !inserting && (
          <div className="route">
            <select
              id="route"
              aria-label="Get to a pose"
              value=""
              onChange={(e) => {
                const moves = routes.get(e.target.value);
                if (moves) addMoves(moves);
              }}
            >
              <option value="">Get to any pose in fewest moves</option>
              {BASES.map(([base, label]) => (
                <optgroup key={base} label={label}>
                  {POSES.filter((p) => p.base === base && routes.has(p.id)).map((p) => {
                    const n = routes.get(p.id)!.length;
                    return (
                      <option key={p.id} value={p.id}>
                        {p.name} · {n} {n === 1 ? 'move' : 'moves'}
                      </option>
                    );
                  })}
                </optgroup>
              ))}
            </select>
          </div>
        )}

        {/* Below the tiles, so it coming and going never moves them. */}
        {range && mirrorSide && !inserting && (
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
          {/* Quiet page numbers beside the heading, for flows longer than a page. */}
          {pageCount > 1 && (
            <nav className="pager" aria-label="Sequence pages">
              {pagesToShow(pageCount, first / pageSize).map((p, k) =>
                p === null ? (
                  <span key={`gap${k}`} className="pager-gap">
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => goToPage(p)}
                    aria-current={first / pageSize === p ? 'page' : undefined}
                    aria-label={`Page ${p + 1}`}
                  >
                    {p + 1}
                  </button>
                ),
              )}
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
              const { holdElapsed, holdTotal, speechElapsed, speechTotal } = player.state;
              const className = [
                'row',
                isLast && !playing && 'current',
                playing && 'playing',
                player.active && i < playingIndex && 'played',
                inserting && i === insertAt && 'insert-after',
                menu?.index === i && 'menu-open',
              ]
                .filter(Boolean)
                .join(' ');
              // The whole step, the voice's announcement as well as the hold, so the bar moves from
              // the moment the step starts (as the player's clock does) rather than waiting for
              // the voice to finish. (A one-breath step speaks during its breath: speechTotal is 0.)
              const stepTotal = speechTotal + holdTotal;
              const progress = playing && stepTotal ? ((speechElapsed + holdElapsed) / stepTotal) * 100 : 0;
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
                    if ((e.target as HTMLElement).closest('.stepper, .row-main, .row-more')) return;
                    player.goTo(i);
                  }}
                >
                  <span className="num">{i + 1}</span>
                  <PoseFigure poseId={s.poseId} side={s.side} size={30} />
                  {/* Jumps playback here, paused, so the class can pick up from this pose. */}
                  <button className="row-main" onClick={() => player.goTo(i)} title="Jump here (paused)">
                    {rowBody(i)}
                  </button>
                  {/* The newest pose's breaths are edited in the Next heading; during a class, the
                      pose it's on can be changed here. */}
                  {/* The breaths (or, on the playing row, a stepper for them) are hidden on phones. */}
                  {playing ? (
                    <Stepper value={s.breaths} onChange={(n) => set((q) => setBreaths(q, i, n))} />
                  ) : (
                    <span className="row-breaths">{s.breaths === 1 ? '1 breath' : `${s.breaths} breaths`}</span>
                  )}
                  <button
                    className="row-more"
                    aria-label={`Edit pose ${i + 1}`}
                    title="Insert or remove"
                    aria-haspopup="menu"
                    aria-expanded={menu?.index === i}
                    onClick={(e) =>
                      setMenu(menu?.index === i ? null : { index: i, anchor: e.currentTarget.getBoundingClientRect() })
                    }
                  >
                    <MoreIcon />
                  </button>
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
      {menu && menu.index < seq.length && (
        <RowMenu
          seq={seq}
          index={menu.index}
          anchor={menu.anchor}
          onClose={() => setMenu(null)}
          onInsert={() => {
            setInsertAt(menu.index);
            document.querySelector('.next-head')?.scrollIntoView({ block: 'nearest' });
          }}
          onRemove={(next) => set(next)}
        />
      )}
    </main>
  );
}

/**
 * A row's edits: insert after it, remove it (when its neighbours can be joined), or
 * remove it and everything after. Undo takes any of them back.
 */
function RowMenu({
  seq,
  index,
  anchor,
  onClose,
  onInsert,
  onRemove,
}: {
  seq: Sequence;
  index: number;
  anchor: DOMRect;
  onClose: () => void;
  onInsert: () => void;
  onRemove: (next: Sequence) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus();
    const outside = (e: PointerEvent) => {
      const t = e.target as HTMLElement;
      if (!ref.current?.contains(t) && !t.closest('.row-more')) onClose();
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    // It's placed from the button's position, so anything that moves the button closes it.
    const moved = () => onClose();
    document.addEventListener('pointerdown', outside);
    window.addEventListener('keydown', onKey);
    window.addEventListener('scroll', moved, true);
    window.addEventListener('resize', moved);
    return () => {
      document.removeEventListener('pointerdown', outside);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', moved, true);
      window.removeEventListener('resize', moved);
    };
  }, [onClose]);

  const last = index === seq.length - 1;
  const removal = removeStep(seq, index);
  const after = seq.length - index - 1;
  const name = (i: number) => getPose(seq[i].poseId).name;
  // Opens below the button, or above it when there isn't room.
  const up = anchor.bottom + 170 > window.innerHeight;
  const style: CSSProperties = {
    right: Math.max(8, window.innerWidth - anchor.right),
    ...(up ? { bottom: window.innerHeight - anchor.top + 4 } : { top: anchor.bottom + 4 }),
  };
  const run = (fn: () => void) => () => {
    onClose();
    fn();
  };

  return (
    <div className="row-menu" role="menu" ref={ref} style={style}>
      {!last && (
        <button role="menuitem" onClick={run(onInsert)}>
          Insert a pose after
        </button>
      )}
      {removal ? (
        <button role="menuitem" onClick={run(() => onRemove(removal.seq))}>
          {removal.count === 2 ? `Remove, with the return to ${name(index + 1)}` : 'Remove'}
        </button>
      ) : (
        <>
          <button role="menuitem" disabled>
            Remove
          </button>
          <span className="why">
            {name(index - 1)} doesn’t lead to {name(index + 1)}
          </span>
        </>
      )}
      {!last && (
        <button role="menuitem" className="danger" onClick={run(() => onRemove(cutFrom(seq, index)))}>
          Remove this and the {after === 1 ? 'pose' : `${after} poses`} after
        </button>
      )}
    </div>
  );
}

const MoreIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
    <circle cx="5" cy="12" r="1.6" />
    <circle cx="12" cy="12" r="1.6" />
    <circle cx="19" cy="12" r="1.6" />
  </svg>
);

/**
 * The page numbers to list (0-based), with null for a gap: all of them when there
 * are up to seven, otherwise the first, the last and the current one's neighbours,
 * e.g. 1 … 7 8 9 … 15.
 */
export function pagesToShow(count: number, current: number): (number | null)[] {
  if (count <= 7) return Array.from({ length: count }, (_, p) => p);
  const middle = [current - 1, current, current + 1].map((p) => Math.min(count - 2, Math.max(1, p)));
  const pages = [...new Set([0, ...middle, count - 1])];
  return pages.flatMap((p, i) => (i > 0 && p - pages[i - 1] > 1 ? [null, p] : [p]));
}

/** Whether a move's label says which side the pose it leads to is on ({side} / {Side}). */
const namesSide = (label: string) => /\{[sS]ide\}/.test(label);

/**
 * A move's label with the pose's side picked out, e.g. "Drop knees to the *right*",
 * so it can stand in for a separate Right/Left tag. ({other} is the opposite limb or
 * direction, not the pose's side, so it stays plain.)
 */
function MoveLabel({ label, side }: { label: string; side: Side }) {
  return (
    <>
      {label.split(/(\{[sS]ide\})/).map((part, k) =>
        namesSide(part) ? (
          <span key={k} className="side-word">
            {renderLabel(part, side)}
          </span>
        ) : (
          renderLabel(part, side)
        ),
      )}
    </>
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
