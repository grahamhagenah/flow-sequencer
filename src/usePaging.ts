import { type RefObject, useEffect, useRef, useState } from 'react';
import { useIsPhone } from './useIsPhone';

/**
 * Poses per page of the sequence list; shorter flows show in full. A few fewer on
 * phones, where each page is one long column.
 */
const usePageSize = () => (useIsPhone() ? 20 : 30);

/**
 * The last flow-open (App's openCount) the list has started on page one. Kept
 * outside the component because the builder unmounts while My flows is shown,
 * and a flow opened from there must still start at the top.
 */
let handledOpen = 0;

/**
 * Long flows show a page of the list at a time. A newly opened flow starts on
 * its first page; after that the page follows `focus` (the newest pose while
 * building, the playing one during a class). Turning pages by hand holds until
 * that moves on. While building, the page only follows the newest pose forward (as
 * poses are added): removing one leaves you on the page you were on.
 */
export function usePaging({
  length,
  focus,
  followBack,
  openCount,
  panelRef,
}: {
  length: number;
  focus: number;
  /** Follow `focus` back too (during a class, when skipping back), not only forward. */
  followBack: boolean;
  openCount: number;
  panelRef: RefObject<HTMLElement | null>;
}) {
  const pageSize = usePageSize();
  const pageCount = Math.ceil(length / pageSize);
  const [page, setPage] = useState(() => (openCount !== handledOpen ? 0 : Math.max(0, Math.floor(focus / pageSize))));
  // Only a real change of focus moves the page, not the effect running again
  // (React re-runs effects on mount in development).
  const lastFocus = useRef(focus);
  // Turning a phone to landscape (or resizing a window) changes the page size; stay on the focus's page.
  const lastPageSize = useRef(pageSize);
  // Read before the effect below marks the open as handled.
  const justOpened = handledOpen !== openCount;
  useEffect(() => {
    if (handledOpen !== openCount) {
      handledOpen = openCount;
      lastFocus.current = focus;
      setPage(0);
      if (panelRef.current) panelRef.current.scrollTop = 0;
      return;
    }
    if (lastFocus.current === focus && lastPageSize.current === pageSize) return;
    const movedBack = lastPageSize.current === pageSize && focus < lastFocus.current;
    lastPageSize.current = pageSize;
    lastFocus.current = focus;
    if (movedBack && !followBack) return;
    setPage(Math.max(0, Math.floor(focus / pageSize)));
  }, [focus, followBack, openCount, pageSize, panelRef]);

  /** The index of the first step on the page shown. */
  const first = Math.min(page, Math.max(0, pageCount - 1)) * pageSize;

  return {
    page,
    pageSize,
    pageCount,
    first,
    onLastPage: first + pageSize >= length,
    /** A different flow was opened since the last render's effects ran. */
    justOpened,
    /** Turns to page `p`, starting at its first pose (only the desktop panel scrolls on its own). */
    goToPage: (p: number) => {
      setPage(p);
      if (panelRef.current) panelRef.current.scrollTop = 0;
    },
    /** Turns to the page with step `i`, leaving the scroll alone. */
    showStep: (i: number) => setPage(Math.floor(i / pageSize)),
  };
}
