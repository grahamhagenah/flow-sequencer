import { type CSSProperties, useEffect, useRef, useState } from 'react';
import { FLOW_COLORS, flowColor } from './colors';
import { FLOW_ICONS, flowIcon } from './flowIcons';

/**
 * The flow's look: its icon (or, with none, a dot) in its colour, beside the name. It
 * opens the colours and the icons to choose from; both stay open to pick one of each,
 * and a click outside or Escape closes them.
 */
export function LookPicker({
  color,
  icon,
  onColor,
  onIcon,
}: {
  color: string | null;
  icon: string | null;
  onColor: (id: string) => void;
  onIcon: (id: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = flowColor(color);
  const glyph = flowIcon(icon);

  useEffect(() => {
    if (!open) return;
    const outside = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', outside);
    window.addEventListener('keydown', onKey);
    // Keyboard users start on the chosen colour.
    ref.current?.querySelector<HTMLButtonElement>('.color-swatches [aria-checked="true"]')?.focus();
    return () => {
      document.removeEventListener('pointerdown', outside);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="look-picker" ref={ref}>
      <button
        className={glyph ? 'look-trigger has-icon' : 'look-trigger'}
        onClick={() => setOpen((o) => !o)}
        aria-label={`Flow colour and icon, ${current.name}${glyph ? `, ${glyph.name}` : ''}`}
        aria-haspopup="true"
        aria-expanded={open}
        title="Colour and icon"
      >
        {glyph?.glyph}
      </button>
      {open && (
        <div className="look-panel">
          <div className="color-swatches" role="radiogroup" aria-label="Flow colour">
            {FLOW_COLORS.map((c) => (
              <button
                key={c.id}
                role="radio"
                aria-checked={c.id === current.id}
                aria-label={c.name}
                title={c.name}
                style={{ '--swatch': c.hex } as CSSProperties}
                onClick={() => onColor(c.id)}
              />
            ))}
          </div>
          <div className="icon-swatches" role="radiogroup" aria-label="Flow icon">
            {FLOW_ICONS.map((i) => (
              <button
                key={i.id}
                role="radio"
                aria-checked={i.id === icon}
                aria-label={i.name}
                title={i.name}
                // Choosing the chosen one again takes it away.
                onClick={() => onIcon(i.id === icon ? null : i.id)}
              >
                {i.glyph}
              </button>
            ))}
          </div>
          {glyph && (
            <button className="link-btn look-none" onClick={() => onIcon(null)}>
              No icon
            </button>
          )}
        </div>
      )}
    </div>
  );
}
