import { describe, expect, it } from 'vitest';
import { outgoing } from '../data/graph';
import { advance, start } from '../sequence';
import { speechMs } from './conductor';
import { announcementParts, PHRASE_GAP_MS } from './script';
import { betterVoiceTip, rankVoices } from './voices';

const voice = (name: string, lang = 'en-US') => ({ name, lang, voiceURI: name }) as SpeechSynthesisVoice;

describe('voice ranking', () => {
  it('puts premium, natural and enhanced voices first and drops novelty and non-English ones', () => {
    const ranked = rankVoices([
      voice('Fred'),
      voice('Albert'),
      voice('Samantha'),
      voice('Ava (Premium)'),
      voice('Microsoft Aria Online (Natural) - English (United States)'),
      voice('Zoe (Enhanced)'),
      voice('Google UK English Female', 'en-GB'),
      voice('Thomas', 'fr-FR'),
    ]).map((v) => v.name);
    expect(ranked.slice(0, 2).sort()).toEqual(['Ava (Premium)', 'Microsoft Aria Online (Natural) - English (United States)']);
    expect(ranked.indexOf('Zoe (Enhanced)')).toBeLessThan(ranked.indexOf('Google UK English Female'));
    expect(ranked.indexOf('Google UK English Female')).toBeLessThan(ranked.indexOf('Samantha'));
    expect(ranked).not.toContain('Fred');
    expect(ranked).not.toContain('Albert');
    expect(ranked).not.toContain('Thomas');
  });

  it("breaks ties in favour of the listener's own accent", () => {
    const pair = [voice('Daniel', 'en-GB'), voice('Samantha', 'en-US')];
    expect(rankVoices(pair, 'en-US')[0].name).toBe('Samantha');
    expect(rankVoices(pair, 'en-GB')[0].name).toBe('Daniel');
  });

  it('gives device-specific advice on getting a better voice', () => {
    expect(betterVoiceTip('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)')).toMatch(/System Settings/);
    expect(betterVoiceTip('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)')).toMatch(/Settings → Accessibility/);
    expect(betterVoiceTip('Mozilla/5.0 (Windows NT 10.0) Chrome/120 Safari/537.36')).toMatch(/Edge/);
    expect(betterVoiceTip('Mozilla/5.0 (Windows NT 10.0) Chrome/120 Safari/537.36 Edg/120')).toBeNull();
  });
});

describe('announcement phrases', () => {
  it('splits the move, the pose, the cue and the hold into separate phrases', () => {
    const seq = advance(start('down-dog'), outgoing('down-dog').find((t) => t.to === 'three-leg-dog')!);
    expect(announcementParts(seq, 1)).toEqual([
      'Lift right leg high.',
      'Three-Legged Dog, right side.',
      'One leg lifts high, hips stay level.',
      'Hold for two breaths.',
    ]);
    expect(announcementParts(seq, 0)[0]).toBe('Begin in Downward-Facing Dog.');
  });

  it('counts the pauses between phrases in the speaking time', () => {
    const seq = start('down-dog');
    const phrases = announcementParts(seq, 0).length;
    expect(speechMs(seq, 0, false)).toBeGreaterThan((phrases - 1) * PHRASE_GAP_MS);
  });
});
