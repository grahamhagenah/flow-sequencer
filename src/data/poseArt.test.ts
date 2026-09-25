import { describe, expect, it } from 'vitest';
import { POSE_ART } from './poseArt';
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
      expect(art.d, id).toMatch(/^M[\d\s.,MLHVCQTcqtlhv-]+$/);
    }
  });
});
