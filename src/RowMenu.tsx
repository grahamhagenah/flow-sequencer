import { type CSSProperties, useEffect, useRef } from 'react';
import { getPose } from './data/graph';
import { cutFrom, removeStep, type Sequence } from './sequence';

/**
 * A row's edits: insert after it, remove it (when its neighbours can be joined), or
 * remove it and everything after. Undo takes any of them back.
 */
export function RowMenu({
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
