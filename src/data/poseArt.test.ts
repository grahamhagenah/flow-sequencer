import { describe, expect, it } from 'vitest';
import { neckPath, pathPoints, POSE_ART } from './poseArt';
import { POSES } from './poses';

describe('pose drawings', () => {
  it('has one for every pose, and none for poses that are gone', () => {
    expect(Object.keys(POSE_ART).sort()).toEqual(POSES.map((p) => p.id).sort());
  });

  it('keeps every drawing on its 48×48 grid', () => {
    for (const [id, art] of Object.entries(POSE_ART)) {
      const [x, y] = art.head;
      expect(x - 3.3, id).toBeGreaterThanOrEqual(0);
      expect(x + 3.3, id).toBeLessThanOrEqual(48);
      expect(y - 3.3, id).toBeGreaterThanOrEqual(0);
      expect(y + 3.3, id).toBeLessThanOrEqual(48);
      expect(art.d, id).toMatch(/^M[\d\s.,MLHVCSQTcsqtlhv-]+$/);
    }
  });

  it('draws a neck only for a drawing that asks for one', () => {
    for (const [id, art] of Object.entries(POSE_ART)) {
      expect(neckPath(art) !== '', id).toBe(art.neck === true);
    }
    expect(neckPath({ head: [24, 8], d: 'M24 14v14', neck: true })).toBe('M24 14L24 8');
  });

  it('reads the points of a path, relative moves and all', () => {
    expect(pathPoints('M2 3h4v2l1 1M10 10 12 12')).toEqual([
      [2, 3],
      [6, 3],
      [6, 5],
      [7, 6],
      [10, 10],
      [12, 12],
    ]);
  });
});
