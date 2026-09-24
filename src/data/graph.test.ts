import { describe, expect, it } from 'vitest';
import { outgoing, POSE_BY_ID, renderLabel } from './graph';
import { POSES, START_POSES } from './poses';
import { TRANSITIONS } from './transitions';

function reachable(from: string, edges: (id: string) => string[]): Set<string> {
  const seen = new Set([from]);
  const queue = [from];
  while (queue.length) {
    for (const next of edges(queue.shift()!)) {
      if (!seen.has(next)) {
        seen.add(next);
        queue.push(next);
      }
    }
  }
  return seen;
}

describe('pose graph', () => {
  it('has unique pose and transition ids', () => {
    expect(new Set(POSES.map((p) => p.id)).size).toBe(POSES.length);
    const dupes = TRANSITIONS.map((t) => t.id).filter((id, i, all) => all.indexOf(id) !== i);
    expect(dupes).toEqual([]);
  });

  it('only links poses that exist', () => {
    const bad = TRANSITIONS.filter((t) => !POSE_BY_ID.has(t.from) || !POSE_BY_ID.has(t.to)).map((t) => t.id);
    expect(bad).toEqual([]);
    expect(START_POSES.filter((id) => !POSE_BY_ID.has(id))).toEqual([]);
  });

  it('gives every pose a way out', () => {
    expect(POSES.filter((p) => outgoing(p.id).length === 0).map((p) => p.id)).toEqual([]);
  });

  it('lets every pose reach, and be reached from, savasana', () => {
    const forward = reachable('savasana', (id) => outgoing(id).map((t) => t.to));
    const backward = reachable('savasana', (id) => TRANSITIONS.filter((t) => t.to === id).map((t) => t.from));
    expect(POSES.filter((p) => !forward.has(p.id)).map((p) => p.id)).toEqual([]);
    expect(POSES.filter((p) => !backward.has(p.id)).map((p) => p.id)).toEqual([]);
  });

  it('only flips sides into sided poses', () => {
    const bad = TRANSITIONS.filter((t) => t.side === 'flip' && !POSE_BY_ID.get(t.to)!.sided).map((t) => t.id);
    expect(bad).toEqual([]);
  });

  it('uses only known placeholders in labels', () => {
    const bad = TRANSITIONS.filter((t) => /\{/.test(renderLabel(t.label, 'right'))).map((t) => t.id);
    expect(bad).toEqual([]);
  });
});
