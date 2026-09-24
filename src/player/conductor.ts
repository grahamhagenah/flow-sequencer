import type { Sequence } from '../sequence';
import { chime, CHIME_LEAD_MS, unlockAudio } from './chime';
import { announcement, CLOSING } from './script';

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
}

export interface PlayerSettings {
  secondsPerBreath: number;
  /** Ring a soft bell as each pose begins. */
  chime: boolean;
  voice: SpeechSynthesisVoice | null;
}

const synth = typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;
export const canSpeak = synth !== null;

/** A generous guess at how long text takes to say, for when the browser never reports it finished. */
const estimateMs = (text: string) => (text.split(/\s+/).length / 2.5) * 1000;

export class Conductor {
  private state: PlayerState = { index: 0, phase: 'ready', playing: false, holdElapsed: 0, holdTotal: 0 };
  /** Bumped whenever the current action is abandoned, so its late callbacks do nothing. */
  private token = 0;
  private timers: ReturnType<typeof setTimeout>[] = [];
  private ticker: ReturnType<typeof setInterval> | undefined;
  private holdStartedAt = 0;
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
      this.update({ index: 0, playing: false, phase: 'ready', holdElapsed: 0, holdTotal: 0 });
    } else if (this.state.index >= seq.length) {
      this.goTo(seq.length - 1, false);
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
    this.update({ playing: false, holdElapsed, phase: this.state.phase === 'speaking' ? 'ready' : this.state.phase });
  }

  next() {
    if (this.state.index < this.seq.length - 1) this.goTo(this.state.index + 1, this.state.playing);
  }

  prev() {
    this.goTo(Math.max(0, this.state.index - 1), this.state.playing);
  }

  goTo(index: number, playing: boolean) {
    this.abandon();
    this.update({ index, playing, phase: 'ready', holdElapsed: 0, holdTotal: this.holdMs(index) });
    if (playing) this.announce(index);
  }

  dispose() {
    this.abandon();
  }

  private announce(index: number) {
    this.update({ phase: 'speaking', holdElapsed: 0, holdTotal: this.holdMs(index) });
    const say = () => this.speak(announcement(this.seq, index), () => this.hold());
    if (!this.settings.chime) return say();
    chime();
    this.later(CHIME_LEAD_MS, say);
  }

  private hold() {
    const remaining = this.state.holdTotal - this.state.holdElapsed;
    this.holdStartedAt = performance.now() - this.state.holdElapsed;
    this.update({ phase: 'holding' });
    this.ticker = setInterval(() => this.update({ holdElapsed: this.elapsed() }), 250);
    this.later(remaining, () => {
      this.stopTicker();
      if (this.state.index < this.seq.length - 1) this.goTo(this.state.index + 1, true);
      else this.close();
    });
  }

  private close() {
    this.update({ phase: 'closing', holdElapsed: this.state.holdTotal });
    this.speak(CLOSING, () => this.update({ phase: 'done', playing: false }));
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
    this.later(synth ? estimateMs(text) * 1.5 + 3000 : estimateMs(text), finish);
    if (!synth) return;
    u = new SpeechSynthesisUtterance(text);
    if (this.settings.voice) {
      u.voice = this.settings.voice;
      u.lang = this.settings.voice.lang;
    }
    u.rate = 0.95;
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
