import { colorId } from './colors';
import { iconId } from './flowIcons';
import { applySide, getPose, POSE_BY_ID, TRANSITION_BY_ID } from './data/graph';
import type { Side } from './data/types';
import type { Sequence, Step } from './sequence';

// A flow as text, for share links and storage. Steps are joined with ".":
//
//   down-dog.20.2cB6.3aS
//
// The first token is the starting pose's id; each later one is a transition
// code in base 36. A token can end with "B<n>" when its breaths differ from the
// pose's default, and then "S" when its side isn't the one the flow would
// arrive at on its own (on the first step: when it starts on the left). The
// markers are capitals, which nothing else in a token uses.
//
// Only letters, digits, "-" and "." are used, so a link survives being pasted into
// a message: "*" and "_" (the markers until 2026) are formatting in chat apps, and
// iMessage cut links off at them. Links and saved flows written with them still read.

const TOKEN = /^([a-z0-9-]+)(?:[B*](\d{1,2}))?([S_])?$/;

export function encodeSteps(seq: Sequence): string {
  return seq
    .map((step, i) => {
      const expected: Side = i === 0 ? 'right' : applySide(seq[i - 1].side, TRANSITION_BY_ID.get(step.via!)!.side);
      const head = i === 0 ? step.poseId : step.via!.toString(36);
      const breaths = step.breaths === getPose(step.poseId).breaths ? '' : `B${step.breaths}`;
      return head + breaths + (step.side === expected ? '' : 'S');
    })
    .join('.');
}

export interface Decoded {
  seq: Sequence;
  /** Tokens that couldn't be read (e.g. a move since removed), counted from the first bad one. */
  dropped: number;
}

/** Reads as much of the flow as it can; stops at the first step it can't follow. */
export function decodeSteps(text: string): Decoded {
  const tokens = text ? text.split('.') : [];
  const seq: Step[] = [];
  for (const [i, token] of tokens.entries()) {
    const m = TOKEN.exec(token);
    const step = m && readStep(m, seq[i - 1]);
    if (!step) return { seq, dropped: tokens.length - i };
    seq.push(step);
  }
  return { seq, dropped: 0 };
}

function readStep([, head, breaths, flip]: RegExpExecArray, prev: Step | undefined): Step | null {
  let poseId: string;
  let side: Side;
  let via: number | undefined;
  if (!prev) {
    if (!POSE_BY_ID.has(head)) return null;
    poseId = head;
    side = 'right';
  } else {
    const t = /^[0-9a-z]+$/.test(head) ? TRANSITION_BY_ID.get(parseInt(head, 36)) : undefined;
    if (!t || t.from !== prev.poseId) return null;
    poseId = t.to;
    side = applySide(prev.side, t.side);
    via = t.id;
  }
  if (flip) side = side === 'right' ? 'left' : 'right';
  const n = breaths ? Number(breaths) : getPose(poseId).breaths;
  if (n < 1 || n > 60) return null;
  return via === undefined ? { poseId, side, breaths: n } : { poseId, side, breaths: n, via };
}

/**
 * The part of a share link after "#". `steps` is encodeSteps text; `color` a FLOW_COLORS
 * id and `icon` a FLOW_ICONS one.
 */
export function toHash(name: string, steps: string, color: string | null = null, icon: string | null = null): string {
  const params = new URLSearchParams();
  if (name) params.set('n', name);
  if (color) params.set('c', color);
  if (icon) params.set('i', icon);
  params.set('f', steps);
  return params.toString();
}

export function shareUrl(name: string, steps: string, color: string | null = null, icon: string | null = null): string {
  return `${location.origin}${location.pathname}#${toHash(name, steps, color, icon)}`;
}

/**
 * A share link's flow. `play` is set by a link that means to play it (`p=1`, from the
 * guide pages): the app opens it in the one-pose view, the player ready.
 */
export function fromHash(
  hash: string,
): { name: string; color: string | null; icon: string | null; seq: Sequence; dropped: number; play: boolean } | null {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  const f = params.get('f');
  if (f === null) return null;
  const { seq, dropped } = decodeSteps(f);
  if (seq.length === 0) return null;
  return {
    name: params.get('n') ?? '',
    color: colorId(params.get('c')),
    icon: iconId(params.get('i')),
    seq,
    dropped,
    play: params.get('p') === '1',
  };
}
