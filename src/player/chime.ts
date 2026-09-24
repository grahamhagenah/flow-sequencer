// A soft bell, synthesised with the Web Audio API so there's no file to load:
// a low tone and a quieter overtone, struck gently and left to ring out.

let ctx: AudioContext | null = null;

/** Browsers only allow audio after a click or key press, so call this from one before the first chime. */
export function unlockAudio() {
  if (typeof AudioContext === 'undefined') return;
  ctx ??= new AudioContext();
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
}

/** How long to wait after a chime before speaking over it. */
export const CHIME_LEAD_MS = 600;

export function chime() {
  if (!ctx || ctx.state !== 'running') return;
  const now = ctx.currentTime;
  const out = ctx.createGain();
  out.gain.value = 0.12;
  out.connect(ctx.destination);

  // [frequency, relative loudness, ring time in seconds]
  const partials: [number, number, number][] = [
    [528, 1, 1.8],
    [1320, 0.35, 1.1],
    [2112, 0.12, 0.6],
  ];
  for (const [freq, level, ring] of partials) {
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    env.gain.setValueAtTime(0.0001, now);
    env.gain.exponentialRampToValueAtTime(level, now + 0.015);
    env.gain.exponentialRampToValueAtTime(0.0001, now + ring);
    osc.connect(env).connect(out);
    osc.start(now);
    osc.stop(now + ring + 0.05);
  }
}
