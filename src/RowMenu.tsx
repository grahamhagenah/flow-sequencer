import { type CSSProperties, type ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Stepper } from './choices';
import { getPose, sideLabel } from './data/graph';
import { PlayIcon, PlusIcon, ScissorsIcon, TrashIcon } from './icons';
import { PoseFigure } from './PoseFigure';
import { cutFrom, removeStep, type Sequence } from './sequence';

/**
 * A row's options: which pose it is and its breaths (changed right here), then what can
 * be done with it: play from it, insert after it, remove it (when its neighbours can be
 * joined), or remove it and everything after. Undo takes any edit back.
 */
export function RowMenu({
  seq,
  index,
  anchor,
  onClose,
  onBreaths,
  onPlayFrom,
  onInsert,
  onRemove,
}: {
  seq: Sequence;
  index: number;
  anchor: DOMRect;
  onClose: () => void;
  onBreaths: (n: number) => void;
  onPlayFrom: () => void;
  onInsert: () => void;
  onRemove: (next: Sequence) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // Keyboard users start on the first action (once, not after each breath change).
  useEffect(() => {
    ref.current?.querySelector<HTMLButtonElement>('[role="menuitem"]:not(:disabled)')?.focus();
  }, []);

  useEffect(() => {
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

  // Opens below the button, or above it when it wouldn't fit below (measured, before it's painted).
  const [up, setUp] = useState(false);
  useLayoutEffect(() => {
    const height = ref.current?.offsetHeight ?? 0;
    setUp(anchor.bottom + height + 12 > window.innerHeight && anchor.top - height - 12 > 0);
  }, [anchor]);
  const style: CSSProperties = {
    right: Math.max(8, window.innerWidth - anchor.right),
    ...(up ? { bottom: window.innerHeight - anchor.top + 4 } : { top: anchor.bottom + 4 }),
  };

  const step = seq[index];
  const pose = getPose(step.poseId);
  const last = index === seq.length - 1;
  const removal = removeStep(seq, index);
  const after = seq.length - index - 1;
  const run = (fn: () => void) => () => {
    onClose();
    fn();
  };

  return (
    <div className="row-menu" role="menu" aria-label={`Pose ${index + 1}, ${pose.name}`} ref={ref} style={style}>
      <div className="row-menu-head">
        <PoseFigure poseId={step.poseId} side={step.side} size={32} />
        <span className="row-menu-title">
          <span className="row-menu-name">{pose.name}</span>
          <span className="row-menu-sub">
            Pose {index + 1}
            {pose.sided && ` · ${sideLabel(step.side)}`}
          </span>
        </span>
      </div>
      <div className="row-menu-breaths">
        <span>Hold for</span>
        <Stepper value={step.breaths} onChange={onBreaths} />
      </div>

      <div className="row-menu-items">
        <Item icon={<PlayIcon />} onClick={run(onPlayFrom)}>
          Play from here
        </Item>
        {!last && (
          <Item icon={<PlusIcon />} onClick={run(onInsert)}>
            Insert a pose after
          </Item>
        )}
        {removal ? (
          <Item icon={<TrashIcon />} onClick={run(() => onRemove(removal.seq))}>
            {removal.count === 2 ? `Remove, with the return to ${getPose(seq[index + 1].poseId).name}` : 'Remove'}
          </Item>
        ) : (
          // Why not, in a quiet line under it.
          <Item icon={<TrashIcon />} disabled note={`${getPose(seq[index - 1].poseId).name} can’t lead to ${getPose(seq[index + 1].poseId).name}`}>
            Remove
          </Item>
        )}
        {!last && (
          <Item icon={<ScissorsIcon />} danger onClick={run(() => onRemove(cutFrom(seq, index)))}>
            Remove this and the {after === 1 ? 'pose' : `${after} poses`} after
          </Item>
        )}
      </div>
    </div>
  );
}

function Item({
  icon,
  children,
  note,
  onClick,
  disabled,
  danger,
}: {
  icon: ReactNode;
  children: ReactNode;
  /** A second, smaller line: why it's disabled. */
  note?: string;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button role="menuitem" className={danger ? 'danger' : undefined} onClick={onClick} disabled={disabled}>
      {icon}
      <span className="row-menu-label">
        {children}
        {note && <span className="row-menu-note">{note}</span>}
      </span>
    </button>
  );
}
