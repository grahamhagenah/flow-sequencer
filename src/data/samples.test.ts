import { describe, expect, it } from 'vitest';
import { decodeSteps, encodeSteps } from '../link';
import { getPose } from './graph';
import { SAMPLE_FLOWS } from './samples';

// Importing samples.ts builds every flow, so a sample that no longer fits the
// pose graph fails here, naming the move that's missing.

describe('sample flows', () => {
  it('have unique ids and names', () => {
    expect(new Set(SAMPLE_FLOWS.map((f) => f.id)).size).toBe(SAMPLE_FLOWS.length);
    expect(new Set(SAMPLE_FLOWS.map((f) => f.name)).size).toBe(SAMPLE_FLOWS.length);
  });

  it.each(SAMPLE_FLOWS.map((f) => [f.name, f] as const))('%s survives a share link', (_, flow) => {
    expect(decodeSteps(encodeSteps(flow.seq))).toEqual({ seq: flow.seq, dropped: 0 });
  });

  it.each(SAMPLE_FLOWS.map((f) => [f.name, f] as const))('%s does each side and ends at rest', (_, flow) => {
    const sided = flow.seq.filter((s) => getPose(s.poseId).sided);
    expect(sided.filter((s) => s.side === 'right').length).toBe(sided.filter((s) => s.side === 'left').length);
    expect(flow.seq.some((s) => s.poseId === 'savasana') || flow.seq.at(-1)!.poseId === 'mountain').toBe(true);
  });
});
