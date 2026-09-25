// Ranks the browser's built-in voices so the player defaults to the most
// natural one available. Browsers usually default to an old, robotic voice even
// when much better ones are installed.

/** Joke and effect voices that ship with macOS; never right for a class. */
const NOVELTY = new Set([
  'albert', 'bad news', 'bahh', 'bells', 'boing', 'bubbles', 'cellos', 'deranged', 'good news', 'hysterical',
  'jester', 'organ', 'pipe organ', 'superstar', 'trinoids', 'whisper', 'wobble', 'zarvox', 'junior', 'ralph',
  'fred', 'kathy', 'princess', 'bruce', 'agnes', 'vicki', 'victoria', 'grandma', 'grandpa', 'eddy', 'flo',
  'reed', 'rocko', 'sandy', 'shelley',
]);

/** Voices that are reliably pleasant, by the first word of their name. */
const GOOD_NAMES = new Set([
  'ava', 'zoe', 'samantha', 'allison', 'serena', 'evan', 'nathan', 'susan', 'tom', 'kate', 'daniel', 'karen',
  'moira', 'tessa', 'aria', 'jenny', 'guy', 'emma', 'brian', 'libby', 'sonia', 'ryan', 'natasha', 'william',
]);

const baseName = (v: SpeechSynthesisVoice) => v.name.toLowerCase().replace(/\s*\(.*\)\s*/g, '').trim();

export const isNovelty = (v: SpeechSynthesisVoice) => NOVELTY.has(baseName(v));

/**
 * Higher is better. Quality markers matter most, then known-good names, then
 * accent: the listener's own (preferredLang, e.g. "en-US") beats other English.
 */
export function voiceScore(v: SpeechSynthesisVoice, preferredLang = ''): number {
  const name = v.name.toLowerCase();
  let score = 0;
  if (/premium/.test(name)) score += 6;
  if (/natural|neural/.test(name)) score += 6; // Edge's online voices, e.g. "Microsoft Aria Online (Natural)"
  if (/enhanced/.test(name)) score += 4;
  if (/^google/.test(name)) score += 3;
  if (baseName(v).split(/\s+/).some((w) => GOOD_NAMES.has(w))) score += 2;
  const lang = v.lang.replace('_', '-').toLowerCase();
  if (preferredLang && lang === preferredLang.toLowerCase()) score += 2;
  else if (/^en-(us|gb)/.test(lang)) score += 1;
  if (/compact|eloquence/.test(name)) score -= 3;
  return score;
}

/** English voices, best first, without the novelty ones. */
export function rankVoices(all: SpeechSynthesisVoice[], preferredLang = ''): SpeechSynthesisVoice[] {
  return all
    .filter((v) => v.lang.toLowerCase().startsWith('en') && !isNovelty(v))
    .sort((a, b) => voiceScore(b, preferredLang) - voiceScore(a, preferredLang) || a.name.localeCompare(b.name));
}
