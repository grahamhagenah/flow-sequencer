import type { Sequence } from '../sequence';
import { breathCue, chime, CHIME_LEAD_MS, unlockAudio } from './chime';
import { announcementParts, CLOSING, forVoice, isFlowStep, PHRASE_GAP_MS } from './script';

// Walks a flow step by step: chime, speak the step's announcement, then hold the pose
// for its breaths, then move on. Plain timers and the browser's built-in
// speech (Web Speech API), so nothing to download, but it only runs while the
// page is awake: phones pause it when the screen locks.

export type Phase = 'ready' | 'speaking' | 'holding' | 'closing' | 'done';

export interface PlayerState {
  index: number;
  phase: Phase;
  playing: boolean;
  /** Milliseconds of the current hold so far, and its full length. */
  holdElapsed: number;
  holdTotal: number;
  /**
   * Milliseconds of the current step's chime and announcement so far, and how
   * long they're expected to take (see speechMs). Counted so the time left keeps
   * moving while the voice talks.
   */
  speechElapsed: number;
  speechTotal: number;
}

export interface PlayerSettings {
  secondsPerBreath: number;
  /** Ring a soft bell as each pose begins. */
  chime: boolean;
  /** A faint tone at each new breath of a hold. */
  breathTone: boolean;
  voice: SpeechSynthesisVoice | null;
}

const synth = typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;
export const canSpeak = synth !== null;

/**
 * Lets sound and speech start a moment later, outside the click itself. Call it
 * from a click that will start playback on the next render: some browsers (iOS
 * Safari especially) only allow audio that begins inside a user gesture.
 */
export function unlockPlayback() {
  unlockAudio();
  synth?.speak(new SpeechSynthesisUtterance(''));
}

const words = (text: string) => text.split(/\s+/).filter(Boolean).length;

/** Speaking pace. A little under normal speed reads as calmer and less mechanical. */
const RATE = 0.9;

/** A realistic guess at how long the voice takes to say text: about 150 words a minute at RATE. */
const sayMs = (text: string) => (words(text) / 2.5) * 1000;

/**
 * Expected time for step i's chime and spoken announcement, pauses included. It
 * comes before the hold, except on a one-breath flow step, where it's said
 * during the breath (and there's no chime).
 */
export function speechMs(seq: Sequence, i: number, chimeOn: boolean): number {
  const parts = announcementParts(seq, i);
  return (
    (chimeOn && !isFlowStep(seq, i) ? CHIME_LEAD_MS : 0) +
    parts.reduce((sum, p) => sum + sayMs(p), 0) +
    (parts.length - 1) * PHRASE_GAP_MS
  );
}

/** Says a short line in the given voice at the class's pace, for trying a voice out. */
export function speakSample(voice: SpeechSynthesisVoice | null) {
  if (!synth) return;
  synth.cancel();
  const u = new SpeechSynthesisUtterance('Welcome. Find a comfortable seat, and let your breath slow down.');
  if (voice) {
    u.voice = voice;
    u.lang = voice.lang;
  }
  u.rate = RATE;
  synth.speak(u);
}

/** Expected time for step i: its announcement then its hold, or on a flow step whichever is longer. */
export function stepMs(seq: Sequence, i: number, secondsPerBreath: number, chimeOn: boolean): number {
  const speech = speechMs(seq, i, chimeOn);
  const hold = seq[i].breaths * secondsPerBreath * 1000;
  return isFlowStep(seq, i) ? Math.max(speech, hold) : speech + hold;
}

/** Expected length of a whole class: every step's announcement and hold, then the closing words. */
export function classMs(seq: Sequence, secondsPerBreath: number, chimeOn: boolean): number {
  if (seq.length === 0) return 0;
  return seq.reduce((sum, _, i) => sum + stepMs(seq, i, secondsPerBreath, chimeOn), 0) + closingMs();
}

/** A class length for lists and headings: "about 27 min". */
export function aboutMinutes(ms: number): string {
  return `about ${Math.max(1, Math.round(ms / 60000))} min`;
}

/** Expected time for the closing words after the last hold. */
export const closingMs = () => sayMs(CLOSING);

export class Conductor {
  private state: PlayerState = {
    index: 0,
    phase: 'ready',
    playing: false,
    holdElapsed: 0,
    holdTotal: 0,
    speechElapsed: 0,
    speechTotal: 0,
  };
  /** Bumped whenever the current action is abandoned, so its late callbacks do nothing. */
  private token = 0;
  private timers: ReturnType<typeof setTimeout>[] = [];
  private ticker: ReturnType<typeof setInterval> | undefined;
  private holdStartedAt = 0;
  private speechStartedAt = 0;
  /**
   * On a flow step the movement is spoken during the breath: the step moves on
   * once both are over. Set while that speech is still going, and once the
   * breath has run out before it.
   */
  private awaitingSpeech = false;
  private holdOver = false;
  /** Utterances being spoken. Chrome drops onend if one is garbage collected, so hold on to them. */
  private live = new Set<SpeechSynthesisUtterance>();

  constructor(
    private seq: Sequence,
    private settings: PlayerSettings,
    private emit: (state: PlayerState) => void,
  ) {}

  setSettings(settings: PlayerSettings) {
    this.settings = settings;
  }

  /** Takes an edited flow without losing the place, unless the place was cut off. */
  setSeq(seq: Sequence) {
    this.seq = seq;
    if (seq.length === 0) {
      this.abandon();
      this.update({ index: 0, playing: false, phase: 'ready', holdElapsed: 0, holdTotal: 0, speechElapsed: 0, speechTotal: 0 });
    } else if (this.state.index >= seq.length) {
      this.goTo(seq.length - 1, false);
    } else {
      this.retime();
    }
  }

  /**
   * Picks up a change to the current pose's breaths. A hold in progress keeps the
   * time already spent and runs to the new length (moving on at once if that's
   * already past); otherwise the new length applies when the hold begins.
   */
  private retime() {
    const holdTotal = this.holdMs(this.state.index);
    if (holdTotal === this.state.holdTotal) return;
    if (this.state.phase === 'holding' && this.state.playing) {
      const spent = Math.min(holdTotal, performance.now() - this.holdStartedAt);
      // The timers dropped below include a flow step's speech; let it finish without waiting on it.
      this.awaitingSpeech = false;
      // Drop the old hold's timers (end, breath tones, ticker) and start them afresh.
      this.token++;
      this.timers.forEach(clearTimeout);
      this.timers = [];
      this.stopTicker();
      this.update({ holdTotal, holdElapsed: spent });
      this.hold();
    } else {
      const speaking = this.state.phase === 'speaking';
      this.update({
        holdTotal,
        holdElapsed: Math.min(this.state.holdElapsed, holdTotal),
        // "Hold for N breaths" is part of the announcement, so its length changes too.
        speechTotal: speaking ? this.state.speechTotal : speechMs(this.seq, this.state.index, this.settings.chime),
      });
    }
  }

  /** Back to the start, silent. */
  stop() {
    this.goTo(0, false);
  }

  /** Must be called from a click or key press: browsers only let speech start from one. */
  play() {
    if (this.state.playing) return;
    unlockAudio();
    const { phase, index } = this.state;
    if (phase === 'done') return this.goTo(0, true);
    this.update({ playing: true });
    if (phase === 'holding') this.hold();
    else if (phase === 'closing') this.close();
    else this.announce(index);
  }

  pause() {
    if (!this.state.playing) return;
    const holdElapsed = this.state.phase === 'holding' ? this.elapsed() : this.state.holdElapsed;
    this.abandon();
    // Speech can't be resumed mid-sentence reliably, so a paused announcement starts over.
    const speaking = this.state.phase === 'speaking';
    this.update({
      playing: false,
      holdElapsed,
      phase: speaking ? 'ready' : this.state.phase,
      speechElapsed: speaking ? 0 : this.state.speechElapsed,
    });
  }

  next() {
    if (this.state.index < this.seq.length - 1) this.goTo(this.state.index + 1, this.state.playing);
  }

  prev() {
    this.goTo(Math.max(0, this.state.index - 1), this.state.playing);
  }

  goTo(index: number, playing: boolean) {
    this.abandon();
    this.update({
      index,
      playing,
      phase: 'ready',
      holdElapsed: 0,
      holdTotal: this.holdMs(index),
      speechElapsed: 0,
      speechTotal: speechMs(this.seq, index, this.settings.chime),
    });
    if (playing) this.announce(index);
  }

  dispose() {
    this.abandon();
  }

  private announce(index: number) {
    if (isFlowStep(this.seq, index)) {
      // Speak the movement and start the breath together.
      this.update({ phase: 'holding', holdElapsed: 0, holdTotal: this.holdMs(index), speechElapsed: 0, speechTotal: 0 });
      this.awaitingSpeech = true;
      this.holdOver = false;
      this.speakParts(announcementParts(this.seq, index), () => {
        this.awaitingSpeech = false;
        if (this.holdOver) this.moveOn();
      });
      return this.hold();
    }
    const speechTotal = speechMs(this.seq, index, this.settings.chime);
    this.speechStartedAt = performance.now();
    this.update({ phase: 'speaking', holdElapsed: 0, holdTotal: this.holdMs(index), speechElapsed: 0, speechTotal });
    // Tick while the voice talks too. Held at the estimate if it runs long.
    this.ticker = setInterval(
      () => this.update({ speechElapsed: Math.min(speechTotal, performance.now() - this.speechStartedAt) }),
      250,
    );
    const say = () => this.speakParts(announcementParts(this.seq, index), () => this.hold());
    if (!this.settings.chime) return say();
    chime();
    this.later(CHIME_LEAD_MS, say);
  }

  private hold() {
    this.stopTicker();
    const remaining = this.state.holdTotal - this.state.holdElapsed;
    this.holdStartedAt = performance.now() - this.state.holdElapsed;
    // The announcement is over, whether it ran short or long of its estimate.
    this.update({ phase: 'holding', speechElapsed: this.state.speechTotal });
    // A faint tone at the start of each breath after the first (the first follows the pose's chime).
    if (this.settings.breathTone) {
      const breathMs = this.settings.secondsPerBreath * 1000;
      const first = Math.floor(this.state.holdElapsed / breathMs) + 1;
      for (let b = first; b < this.seq[this.state.index].breaths; b++) {
        this.later(b * breathMs - this.state.holdElapsed, breathCue);
      }
    }
    // The progress bars' CSS transitions match this interval; change both together.
    this.ticker = setInterval(() => this.update({ holdElapsed: this.elapsed() }), 250);
    this.later(remaining, () => {
      this.stopTicker();
      this.update({ holdElapsed: this.state.holdTotal });
      if (this.awaitingSpeech) this.holdOver = true;
      else this.moveOn();
    });
  }

  private moveOn() {
    if (this.state.index < this.seq.length - 1) this.goTo(this.state.index + 1, true);
    else this.close();
  }

  private close() {
    this.update({ phase: 'closing', holdElapsed: this.state.holdTotal });
    this.speak(CLOSING, () => this.update({ phase: 'done', playing: false }));
  }

  /** Speaks each phrase in turn with a short pause between them, then calls done. */
  private speakParts(parts: string[], done: () => void) {
    const [first, ...rest] = parts;
    if (first === undefined) return done();
    this.speak(first, () => (rest.length ? this.later(PHRASE_GAP_MS, () => this.speakParts(rest, done)) : done()));
  }

  private speak(text: string, done: () => void) {
    const token = this.token;
    let finished = false;
    let u: SpeechSynthesisUtterance | undefined;
    const finish = () => {
      if (u) this.live.delete(u);
      if (finished || token !== this.token) return;
      finished = true;
      done();
    };
    // Some browsers never fire onend (and without speech there's nothing to wait
    // for), so move on anyway once the text has surely been said.
    this.later(synth ? sayMs(text) * 1.5 + 3000 : sayMs(text), finish);
    if (!synth) return;
    u = new SpeechSynthesisUtterance(forVoice(text));
    if (this.settings.voice) {
      u.voice = this.settings.voice;
      u.lang = this.settings.voice.lang;
    }
    u.rate = RATE;
    u.onend = finish;
    u.onerror = finish;
    this.live.add(u);
    synth.speak(u);
  }

  private later(ms: number, fn: () => void) {
    const token = this.token;
    this.timers.push(setTimeout(() => token === this.token && fn(), Math.max(0, ms)));
  }

  private abandon() {
    this.token++;
    this.awaitingSpeech = false;
    this.holdOver = false;
    this.timers.forEach(clearTimeout);
    this.timers = [];
    this.stopTicker();
    if (synth && (synth.speaking || synth.pending)) synth.cancel();
    this.live.clear();
  }

  private stopTicker() {
    clearInterval(this.ticker);
    this.ticker = undefined;
  }

  private elapsed() {
    return Math.min(this.state.holdTotal, performance.now() - this.holdStartedAt);
  }

  private holdMs(index: number) {
    return this.seq[index].breaths * this.settings.secondsPerBreath * 1000;
  }

  private update(patch: Partial<PlayerState>) {
    this.state = { ...this.state, ...patch };
    this.emit(this.state);
  }
}
