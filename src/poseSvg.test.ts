import { describe, expect, it } from 'vitest';
import { POSES } from './data/poses';
import { poseSheetSvg, poseSvg } from './poseSvg';
import { DRAWINGS_NOTICE } from './terms';

describe('downloaded drawings', () => {
  it('carry who drew them and on what terms', () => {
    const svg = poseSvg('tree', '#ffffff');
    expect(svg.startsWith('<!-- Tree, from Flow Sequencer')).toBe(true);
    expect(svg).toContain(DRAWINGS_NOTICE);
    // Still a well-formed file: the notice is a comment before the drawing.
    expect(svg).toMatch(/-->\n<svg xmlns=/);
  });

  it('come all together on one sheet, a named group for each, at the scale they are drawn at', () => {
    const sheet = poseSheetSvg('#ffffff');
    for (const p of POSES) expect(sheet).toContain(`<g id="${p.id}">`);
    expect(sheet).toContain(DRAWINGS_NOTICE);
    // Tree's head, 3.3 units across a 48-unit square, is 33px on the 480px one.
    expect(sheet).toMatch(/<circle id="head" cx="[\d.]+" cy="[\d.]+" r="33"/);
    expect(sheet).not.toContain('scale(');
  });
});
