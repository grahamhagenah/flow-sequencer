// The player's sounds, synthesised with the Web Audio API so there's no file to
// load: a soft bell for each new pose, a quiet rise on resuming, and a faint low
// tone at each new breath.

let ctx: AudioContext | null = null;

/** Browsers only allow audio after a click or key press, so call this from one before the first chime. */
export function unlockAudio() {
  if (typeof AudioContext === 'undefined') return;
  ctx ??= new AudioContext();
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
}

/** How long to wait after a chime before speaking over it. */
export const CHIME_LEAD_MS = 600;

/** [frequency in Hz, relative loudness, ring time in seconds, start delay in seconds] */
type Partial = [freq: number, level: number, ring: number, delay?: number];

/** Plays sine partials that swell in over `attack` seconds and fade out, at `volume` overall. */
function play(partials: Partial[], volume: number, attack = 0.015, glideTo?: number) {
  if (!ctx || ctx.state !== 'running') return;
  const now = ctx.currentTime;
  const out = ctx.createGain();
  out.gain.value = volume;
  out.connect(ctx.destination);
  for (const [freq, level, ring, delay = 0] of partials) {
    const t = now + delay;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    if (glideTo) osc.frequency.exponentialRampToValueAtTime(freq * glideTo, t + ring);
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(level, t + attack);
    env.gain.exponentialRampToValueAtTime(0.0001, t + ring);
    osc.connect(env).connect(out);
    osc.start(t);
    osc.stop(t + ring + 0.05);
  }
}

/** A soft bell as each pose begins: a low tone and quieter overtones, left to ring out. */
export function chime() {
  play(
    [
      [528, 1, 1.8],
      [1320, 0.35, 1.1],
      [2112, 0.12, 0.6],
    ],
    0.12,
  );
}

/** A quiet two-note rise (G then D, a fifth apart) when playback resumes. */
export function resumeCue() {
  play(
    [
      [392, 1, 0.7],
      [587.33, 0.8, 0.9, 0.12],
    ],
    0.05,
    0.03,
  );
}

/** A faint, rounded low tone at each new breath, sinking slightly as it fades. */
export function breathCue() {
  play([[294, 1, 0.45]], 0.035, 0.02, 0.9);
}
