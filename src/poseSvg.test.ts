import { describe, expect, it } from 'vitest';
import { poseSvg } from './poseSvg';
import { DRAWINGS_NOTICE } from './terms';

describe('downloaded drawings', () => {
  it('carry who drew them and on what terms', () => {
    const svg = poseSvg('tree', '#ffffff');
    expect(svg.startsWith('<!-- Tree, from Flow Sequencer')).toBe(true);
    expect(svg).toContain(DRAWINGS_NOTICE);
    // Still a well-formed file: the notice is a comment before the drawing.
    expect(svg).toMatch(/-->\n<svg xmlns=/);
  });
});
