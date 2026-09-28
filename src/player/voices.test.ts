import { describe, expect, it } from 'vitest';
import { getPose, outgoing } from '../data/graph';
import { TRANSITIONS } from '../data/transitions';
import { advance, start } from '../sequence';
import { speechMs } from './conductor';
import { announcementParts, PHRASE_GAP_MS } from './script';
import { rankVoices } from './voices';

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
});

describe('announcement phrases', () => {
  it('splits the move, the pose, the cue and the hold into separate phrases', () => {
    const seq = advance(start('down-dog'), outgoing('down-dog').find((t) => t.to === 'three-leg-dog')!);
    expect(announcementParts(seq, 1)).toEqual([
      'Lift right leg high.',
      'Three-Legged Dog, right side.',
      'Hips stay level, reach back through the lifted heel.',
      'Hold for two breaths.',
    ]);
    expect(announcementParts(seq, 0)[0]).toBe('Begin in Downward-Facing Dog.');
  });

  // The voice says the move, then the pose's cue: a cue that restates the move is heard
  // twice ("Exhale, round into Cat. Cat. Exhale, round the spine…"). Cues add to it instead.
  it('never has a cue repeat the move into its pose', () => {
    const skip = new Set('the and into your you with from down back over through for left right side other'.split(' '));
    const words = (s: string) =>
      new Set((s.toLowerCase().replace(/\{\w+\}/g, '').match(/[a-z]+/g) ?? []).filter((w) => w.length > 2 && !skip.has(w)));
    const repeats = TRANSITIONS.flatMap((t) => {
      const cue = words(getPose(t.to).cue);
      const shared = [...words(t.label)].filter((w) => cue.has(w));
      return shared.length > 2 || shared.some((w) => w === 'inhale' || w === 'exhale') ? [`${t.label} / ${getPose(t.to).cue}`] : [];
    });
    expect(repeats).toEqual([]);
  });

  it('counts the pauses between phrases in the speaking time', () => {
    const seq = start('down-dog');
    const phrases = announcementParts(seq, 0).length;
    expect(speechMs(seq, 0, false)).toBeGreaterThan((phrases - 1) * PHRASE_GAP_MS);
  });
});
