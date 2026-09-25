import { decodeSteps } from './link';

// "My flows" and the working draft live in this browser's localStorage. That
// is per-device, and Safari clears it after a week without a visit, so it is a
// convenience only: a flow's share link is the copy that lasts.

export interface SavedFlow {
  id: string;
  name: string;
  /** Steps as encodeSteps text. */
  steps: string;
  updatedAt: number;
}

export interface Draft {
  /** The saved flow being edited, if any. */
  id: string | null;
  name: string;
  steps: string;
}

// Keys keep the app's first name so flows saved before the rename still load.
const FLOWS_KEY = 'nextpose:flows';
const DRAFT_KEY = 'nextpose:draft';
/** The flow that was open when the app was last opened at its bare address (see App's initial). */
const RESUME_KEY = 'nextpose:resume';

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

// Every storage call is guarded: private windows and blocked site data make
// localStorage throw, and the app should still work (it just won't remember).
function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage unavailable or full; nothing more we can do here.
  }
}

function remove(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    // As above.
  }
}

export function listFlows(): SavedFlow[] {
  const flows = read<SavedFlow[]>(FLOWS_KEY);
  if (!Array.isArray(flows)) return [];
  return flows
    .filter(
      (f) =>
        f &&
        typeof f.id === 'string' &&
        typeof f.name === 'string' &&
        typeof f.steps === 'string' &&
        decodeSteps(f.steps).seq.length > 0,
    )
    .map((f) => (typeof f.updatedAt === 'number' ? f : { ...f, updatedAt: 0 }))
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export function putFlow(flow: SavedFlow) {
  write(FLOWS_KEY, [flow, ...listFlows().filter((f) => f.id !== flow.id)]);
}

export function deleteFlow(id: string) {
  write(FLOWS_KEY, listFlows().filter((f) => f.id !== id));
}

export function newId(): string {
  return crypto.randomUUID?.() ?? `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
}

export function loadDraft(): Draft | null {
  const d = read<Draft>(DRAFT_KEY);
  return d && typeof d.steps === 'string' && typeof d.name === 'string' ? d : null;
}

export function saveDraft(draft: Draft) {
  write(DRAFT_KEY, draft);
}

/** The flow put aside when the app opened at its bare address, offered to pick up again. */
export function loadResume(): Draft | null {
  const d = read<Draft>(RESUME_KEY);
  return d && typeof d.steps === 'string' && d.steps && typeof d.name === 'string' ? d : null;
}

export function saveResume(draft: Draft | null) {
  if (draft) write(RESUME_KEY, draft);
  else remove(RESUME_KEY);
}

/** Forgets the open flow and the one offered to continue (not saved flows), after a crash. */
export function clearWorkingFlow() {
  remove(DRAFT_KEY);
  remove(RESUME_KEY);
}
