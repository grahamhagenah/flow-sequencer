import { type CSSProperties, useEffect, useRef, useState } from 'react';
import { FLOW_COLORS, flowColor } from './colors';

/**
 * The flow's colour: a dot of it beside the name, which opens the swatches to choose
 * another. Picking one closes them; so do a click outside and Escape.
 */
export function ColorPicker({ value, onChange }: { value: string | null; onChange: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = flowColor(value);

  useEffect(() => {
    if (!open) return;
    const outside = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', outside);
    window.addEventListener('keydown', onKey);
    // Keyboard users start on the chosen colour.
    ref.current?.querySelector<HTMLButtonElement>('[aria-checked="true"]')?.focus();
    return () => {
      document.removeEventListener('pointerdown', outside);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="color-picker" ref={ref}>
      <button
        className="color-dot"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Flow colour, ${current.name}`}
        aria-haspopup="true"
        aria-expanded={open}
        title="Flow colour"
      />
      {open && (
        <div className="color-swatches" role="radiogroup" aria-label="Flow colour">
          {FLOW_COLORS.map((c) => (
            <button
              key={c.id}
              role="radio"
              aria-checked={c.id === current.id}
              aria-label={c.name}
              title={c.name}
              style={{ '--swatch': c.hex } as CSSProperties}
              onClick={() => {
                onChange(c.id);
                setOpen(false);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
