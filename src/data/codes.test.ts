import { readFileSync, writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { POSES } from './poses';
import { TRANSITIONS } from './transitions';

// Share links store pose ids and transition codes, so neither may change
// meaning. codes.lock.json records every one ever used, including removed
// ones, and only grows. After adding poses or moves, run
//   UPDATE_CODES=1 npm test
// to record them.

const LOCK = new URL('./codes.lock.json', import.meta.url);

interface Lock {
  poses: string[];
  transitions: Record<string, string>;
}

const read = (): Lock => JSON.parse(readFileSync(LOCK, 'utf8'));
const edge = (t: { from: string; to: string }) => `${t.from}>${t.to}`;

if (process.env.UPDATE_CODES) {
  const lock = read();
  for (const p of POSES) if (!lock.poses.includes(p.id)) lock.poses.push(p.id);
  for (const t of TRANSITIONS) lock.transitions[t.id] ??= edge(t);
  writeFileSync(LOCK, JSON.stringify(lock, null, 2) + '\n');
}

describe('link codes', () => {
  const lock = read();

  it('keeps every pose id that links may start from', () => {
    const ids = new Set(POSES.map((p) => p.id));
    expect(lock.poses.filter((id) => !ids.has(id)), 'pose ids renamed or removed').toEqual([]);
    expect(POSES.filter((p) => !/^[a-z0-9-]+$/.test(p.id)).map((p) => p.id)).toEqual([]);
  });

  it('never gives a code to a different move', () => {
    const changed = TRANSITIONS.filter((t) => lock.transitions[t.id] && lock.transitions[t.id] !== edge(t)).map(
      (t) => `${t.id}: was ${lock.transitions[t.id]}, now ${edge(t)}`,
    );
    expect(changed, 'reused codes; give these moves new numbers').toEqual([]);
  });

  it('has every pose and move recorded', () => {
    const missing = [
      ...POSES.filter((p) => !lock.poses.includes(p.id)).map((p) => p.id),
      ...TRANSITIONS.filter((t) => !lock.transitions[t.id]).map((t) => String(t.id)),
    ];
    expect(missing, 'not in codes.lock.json; run UPDATE_CODES=1 npm test').toEqual([]);
  });
});
