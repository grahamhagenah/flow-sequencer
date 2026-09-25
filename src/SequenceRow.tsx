import { MoveLabel, namesSide, Stepper } from './choices';
import { getPose, renderLabel, sideLabel, TRANSITION_BY_ID } from './data/graph';
import { SHOW_SANSKRIT } from './data/poses';
import { ChevronIcon, MoreIcon } from './icons';
import { PoseFigure } from './PoseFigure';
import type { Step } from './sequence';

/**
 * One pose in the sequence list. Clicking anywhere on it jumps playback there
 * (paused); the ⋯ opens its edits. While it plays, its breaths can be changed in place.
 */
export function SequenceRow({
  step,
  index,
  isNewest,
  playing,
  played,
  insertAfter,
  menuOpen,
  onJump,
  onBreaths,
  onMenu,
}: {
  step: Step;
  index: number;
  /** The last pose, where the next one is added (marked unless it's playing). */
  isNewest: boolean;
  playing: boolean;
  played: boolean;
  /** An insert is being chosen right after this row. */
  insertAfter: boolean;
  menuOpen: boolean;
  onJump: () => void;
  onBreaths: (n: number) => void;
  onMenu: (anchor: DOMRect) => void;
}) {
  const className = [
    'row',
    isNewest && !playing && 'current',
    playing && 'playing',
    played && 'played',
    insertAfter && 'insert-after',
    menuOpen && 'menu-open',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <li
      data-index={index}
      className={className}
      aria-current={playing ? 'step' : undefined}
      // The whole row jumps there, not just its text; the breaths control keeps its own clicks.
      // (The text is a real button, for the keyboard.)
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('.stepper, .row-main, .row-more')) return;
        onJump();
      }}
    >
      <span className="num">{index + 1}</span>
      <PoseFigure poseId={step.poseId} side={step.side} size={36} />
      {/* Jumps playback here, paused, so the class can pick up from this pose. */}
      <button className="row-main" onClick={onJump} title="Jump here (paused)">
        <RowText step={step} index={index} />
      </button>
      {/* The newest pose's breaths are edited in the Next heading; during a class, the
          pose it's on can be changed here. Both are hidden on phones. */}
      {playing ? (
        <Stepper value={step.breaths} onChange={onBreaths} />
      ) : (
        <span className="row-breaths">{step.breaths === 1 ? '1 breath' : `${step.breaths} breaths`}</span>
      )}
      <button
        className="row-more"
        aria-label={`Edit pose ${index + 1}`}
        title="Insert or remove"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        onClick={(e) => onMenu(e.currentTarget.getBoundingClientRect())}
      >
        <MoreIcon />
      </button>
    </li>
  );
}

/**
 * A row's lines: the move that led here, the pose, and (if shown) its Sanskrit name.
 * A line with nothing to show keeps its space (a no-break space), so every row
 * is the same height.
 */
function RowText({ step, index }: { step: Step; index: number }) {
  const p = getPose(step.poseId);
  const via = step.via === undefined ? undefined : TRANSITION_BY_ID.get(step.via);
  const move = via ? renderLabel(via.label, step.side) : '';
  return (
    <>
      {/* The first pose has no move into it; the voice says "Begin in …" there. */}
      <span className="via" title={move || undefined}>
        {via ? <MoveLabel label={via.label} side={step.side} /> : index === 0 ? 'Begin here' : '\u00a0'}
      </span>
      <span className="row-name">
        {p.name}
        {p.sided && !(via && namesSide(via.label)) && <span className="side">{sideLabel(step.side)}</span>}
      </span>
      {SHOW_SANSKRIT && <span className="row-sanskrit">{p.sanskrit ?? '\u00a0'}</span>}
    </>
  );
}

/** Quiet ‹ 2 of 8 › beside the Sequence heading, for flows longer than a page. `page` counts from 0. */
export function Pager({ page, pageCount, onPage }: { page: number; pageCount: number; onPage: (p: number) => void }) {
  return (
    <nav className="pager" aria-label="Sequence pages">
      <button onClick={() => onPage(page - 1)} disabled={page === 0} aria-label="Previous page" title="Previous page">
        <ChevronIcon dir="left" />
      </button>
      <span>
        {page + 1} of {pageCount}
      </span>
      <button
        onClick={() => onPage(page + 1)}
        disabled={page >= pageCount - 1}
        aria-label="Next page"
        title="Next page"
      >
        <ChevronIcon dir="right" />
      </button>
    </nav>
  );
}
