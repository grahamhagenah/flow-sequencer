import { type ReactNode, useEffect, useRef, useState } from 'react';
import { MoreIcon } from './icons';

export interface BarMenuItem {
  icon: ReactNode;
  label: ReactNode;
  /** A small figure at the end of the line (how many flows are saved). */
  count?: number;
  run: () => void;
  disabled?: boolean;
  /** Left open after it runs, for an item whose label answers it ("Link copied"). */
  stay?: boolean;
}

/**
 * The header's ⋯: the open flow's less frequent actions, kept out of the bar so it can
 * carry the flow's name. Closes on a pick, a click outside, or Escape.
 */
export function BarMenu({ items }: { items: BarMenuItem[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const outside = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setOpen(false);
      ref.current?.querySelector<HTMLButtonElement>('.bar-more')?.focus();
    };
    document.addEventListener('pointerdown', outside);
    window.addEventListener('keydown', onKey);
    // Keyboard users start on the first action.
    ref.current?.querySelector<HTMLButtonElement>('[role="menuitem"]:not(:disabled)')?.focus();
    return () => {
      document.removeEventListener('pointerdown', outside);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="bar-menu" ref={ref}>
      <button
        className="icon-btn bar-more"
        onClick={() => setOpen((o) => !o)}
        aria-label="More"
        aria-haspopup="menu"
        aria-expanded={open}
        data-tip={open ? undefined : 'More'}
      >
        <MoreIcon />
      </button>
      {open && (
        <div className="row-menu bar-menu-list" role="menu">
          <div className="row-menu-items">
            {items.map((item, i) => (
              <button
                key={i}
                role="menuitem"
                disabled={item.disabled}
                onClick={() => {
                  if (!item.stay) setOpen(false);
                  item.run();
                }}
              >
                {item.icon}
                <span className="row-menu-label">{item.label}</span>
                {item.count !== undefined && item.count > 0 && <span className="bar-menu-count">{item.count}</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
