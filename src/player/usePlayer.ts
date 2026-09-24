import { useEffect, useRef, useState } from 'react';
import type { Sequence } from '../sequence';
import { canSpeak, Conductor, type PlayerState } from './conductor';

const SETTINGS_KEY = 'nextpose:player';
export const BREATH_CHOICES = [3, 4, 5, 6, 7, 8];

export interface Settings {
  secondsPerBreath: number;
  voiceURI: string | null;
  chime: boolean;
}

const DEFAULTS: Settings = { secondsPerBreath: 5, voiceURI: null, chime: true };

function loadSettings(): Settings {
  try {
    const s = { ...DEFAULTS, ...(JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '') as Partial<Settings>) };
    if (BREATH_CHOICES.includes(s.secondsPerBreath)) return s;
  } catch {
    // fall through to defaults
  }
  return DEFAULTS;
}

function useVoices(): SpeechSynthesisVoice[] {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  useEffect(() => {
    if (!canSpeak) return;
    // Voices load asynchronously in most browsers.
    const load = () => setVoices(speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith('en')));
    load();
    speechSynthesis.addEventListener('voiceschanged', load);
    return () => speechSynthesis.removeEventListener('voiceschanged', load);
  }, []);
  return voices;
}

/** Keeps the screen on while `active`, where the browser supports it. */
function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let cancelled = false;
    const request = () =>
      navigator.wakeLock
        .request('screen')
        .then((l) => {
          if (cancelled) l.release();
          else lock = l;
        })
        .catch(() => {});
    // The lock drops whenever the page is hidden, so take it again on return.
    const onVisible = () => document.visibilityState === 'visible' && request();
    request();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      lock?.release().catch(() => {});
    };
  }, [active]);
}

const IDLE: PlayerState = { index: 0, phase: 'ready', playing: false, holdElapsed: 0, holdTotal: 0 };

/**
 * Voice playback of a flow. `active` is true from Play until Stop, including
 * while paused, so the sequence list can show where the class is.
 */
export function usePlayer(seq: Sequence) {
  const [settings, setSettings] = useState(loadSettings);
  const voices = useVoices();
  const voice = voices.find((v) => v.voiceURI === settings.voiceURI) ?? null;
  const [state, setState] = useState<PlayerState>(IDLE);
  const [active, setActive] = useState(false);
  const conductor = useRef<Conductor | null>(null);
  const latest = useRef({ seq, settings, voice });
  latest.current = { seq, settings, voice };

  // One conductor for the life of the builder; the flow and settings reach it as they change.
  useEffect(() => {
    const { seq, settings, voice } = latest.current;
    const c = new Conductor(seq, { secondsPerBreath: settings.secondsPerBreath, chime: settings.chime, voice }, setState);
    conductor.current = c;
    return () => c.dispose();
  }, []);

  useEffect(() => {
    conductor.current?.setSeq(seq);
    if (seq.length === 0) setActive(false);
  }, [seq]);

  useEffect(() => {
    conductor.current?.setSettings({ secondsPerBreath: settings.secondsPerBreath, chime: settings.chime, voice });
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      // Not remembered; defaults next time.
    }
  }, [settings, voice]);

  useWakeLock(state.playing);

  return {
    state,
    active,
    settings,
    setSettings,
    voices,
    voice,
    /** Call from a click or key press: browsers only let speech start from one. */
    toggle: () => {
      setActive(true);
      if (state.playing) conductor.current?.pause();
      else conductor.current?.play();
    },
    next: () => conductor.current?.next(),
    prev: () => conductor.current?.prev(),
    /** Moves to step i and holds there, paused; Resume carries on from it. */
    goTo: (i: number) => {
      setActive(true);
      conductor.current?.goTo(i, false);
    },
    stop: () => {
      conductor.current?.stop();
      setActive(false);
    },
  };
}

export type Playback = ReturnType<typeof usePlayer>;
