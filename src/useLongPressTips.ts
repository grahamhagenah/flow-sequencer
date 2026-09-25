import { type RefObject, useEffect } from 'react';

const HOLD_MS = 450;
const SHOW_MS = 1500;

/**
 * Touch screens have no hover, so an icon button's tooltip (its data-tip) never shows
 * there. This shows it on a long press instead, for the icon buttons inside `ref`,
 * without also pressing the button. `when` re-attaches it when the element is
 * replaced (the header's buttons come and go with the page).
 */
export function useLongPressTips(ref: RefObject<HTMLElement | null>, when?: unknown) {
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    let hold: ReturnType<typeof setTimeout> | undefined;
    let hide: ReturnType<typeof setTimeout> | undefined;
    let shown: HTMLElement | null = null;
    // Set when a long press showed a tip, so the click that follows the release is dropped.
    let swallowClick = false;

    const target = (e: Event) => (e.target as HTMLElement).closest<HTMLElement>('.icon-btn[data-tip]');
    const clear = () => {
      clearTimeout(hold);
      clearTimeout(hide);
      shown?.classList.remove('tip-pressed');
      shown = null;
    };
    const down = (e: PointerEvent) => {
      const btn = target(e);
      if (!btn || e.pointerType !== 'touch') return;
      clear();
      swallowClick = false;
      hold = setTimeout(() => {
        shown = btn;
        btn.classList.add('tip-pressed');
        swallowClick = true;
        hide = setTimeout(clear, SHOW_MS);
      }, HOLD_MS);
    };
    const up = () => clearTimeout(hold);
    const click = (e: MouseEvent) => {
      if (!swallowClick) return;
      swallowClick = false;
      e.preventDefault();
      e.stopPropagation();
    };
    // Android opens a context menu on a long press; the tip stands in for it.
    const menu = (e: Event) => target(e) && e.preventDefault();

    root.addEventListener('pointerdown', down);
    root.addEventListener('pointerup', up);
    root.addEventListener('pointercancel', up);
    root.addEventListener('click', click, true);
    root.addEventListener('contextmenu', menu);
    return () => {
      clear();
      root.removeEventListener('pointerdown', down);
      root.removeEventListener('pointerup', up);
      root.removeEventListener('pointercancel', up);
      root.removeEventListener('click', click, true);
      root.removeEventListener('contextmenu', menu);
    };
  }, [ref, when]);
}
