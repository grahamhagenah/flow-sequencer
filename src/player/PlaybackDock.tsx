import { useState } from 'react';
import { getPose, sideLabel } from '../data/graph';
import { SHOW_SANSKRIT } from '../data/poses';
import { BackIcon, ChevronIcon, ForwardIcon, PauseIcon, PlayIcon, SettingsIcon, StopIcon } from '../icons';
import { formatDuration, type Sequence } from '../sequence';
import { canSpeak, classMs, closingMs, speakSample, stepMs } from './conductor';
import { PoseRing } from '../PoseRing';
import { useIsPhone } from '../useIsPhone';
import { BREATH_CHOICES, type Playback } from './usePlayer';

/**
 * The foot of the sequence panel. Every part is always there, playing or not,
 * and controls that can't do anything yet are greyed out, so pressing Play
 * changes what the dock says but never its shape.
 */
export function PlaybackDock({ seq, player, startAt = 0 }: { seq: Sequence; player: Playback; startAt?: number }) {
  const { state, active, settings } = player;
  const [showSettings, setShowSettings] = useState(false);
  // Phones show a slim bar until it's tapped open, so the player doesn't cover the list.
  const phone = useIsPhone();
  const [open, setOpen] = useState(false);

  // Before a class starts, the pose it will start from.
  const index = active ? state.index : Math.min(startAt, seq.length - 1);
  const step = seq[index];
  const pose = getPose(step.poseId);
  const next = seq[index + 1];
  const nextPose = next && getPose(next.poseId);

  // Time counts the voice as well as the holds, so the clock keeps moving while
  // an announcement is read and the total is how long the class really takes.
  const breathMs = settings.secondsPerBreath * 1000;
  const totalMs = classMs(seq, settings.secondsPerBreath, settings.chime);
  const stepsBefore = seq
    .slice(0, index)
    .reduce((sum, _, i) => sum + stepMs(seq, i, settings.secondsPerBreath, settings.chime), 0);
  const elapsedMs = !active
    ? 0
    : state.phase === 'done'
      ? totalMs
      : state.phase === 'closing'
        ? totalMs - closingMs() // only the closing words are left
        : stepsBefore + state.speechElapsed + state.holdElapsed;
  const breath = Math.min(step.breaths, Math.floor(state.holdElapsed / breathMs) + 1);

  const label = !active
    ? 'Up first'
    : state.phase === 'done'
      ? 'Finished'
      : state.phase === 'closing'
        ? 'Closing'
        : !state.playing
          ? 'Paused'
          : state.phase === 'holding'
            ? `Breath ${breath} of ${step.breaths}`
            : 'Now';

  const primaryLabel = state.playing ? 'Pause' : !active ? 'Play sequence' : state.phase === 'done' ? 'Play again' : 'Resume';

  // The ring beside the pose: its breaths, filling through the hold. It stays empty while
  // the voice announces the pose (how long that takes is only estimated, so a fill that
  // included it would stall), and full once the class is done.
  const holdFraction =
    active && state.phase === 'done'
      ? 1
      : active && state.phase === 'holding' && state.holdTotal
        ? Math.min(1, state.holdElapsed / state.holdTotal)
        : 0;
  // Keyed by the step, so a new pose starts its ring from empty rather than winding it back.
  const ring = <PoseRing key={index} fraction={holdFraction} />;
  const timeLeft = `−${formatDuration(Math.round(Math.max(0, totalMs - elapsedMs) / 1000))}`;
  const playButton = (
    <button
      className="primary play-main"
      onClick={() => (!active && startAt > 0 ? player.playFrom(index) : player.toggle())}
      aria-label={primaryLabel}
      title={primaryLabel}
    >
      {state.playing ? <PauseIcon /> : <PlayIcon />}
    </button>
  );

  const backButton = (
    <button
      className="play-skip"
      onClick={player.prev}
      disabled={!active || index === 0}
      aria-label="Previous pose"
      title="Previous pose"
    >
      <BackIcon />
    </button>
  );
  const forwardButton = (
    <button
      className="play-skip"
      onClick={player.next}
      disabled={!active || index >= seq.length - 1}
      aria-label="Next pose"
      title="Next pose"
    >
      <ForwardIcon />
    </button>
  );

  if (phone && !open) {
    return (
      <div className="play-dock play-mini">
        <div className="play-mini-row">
          <button className="play-mini-open" onClick={() => setOpen(true)} aria-label="Open the player" aria-expanded={false}>
            {ring}
            <span className="play-mini-text">
              {/* The time left shares the label's line, leaving the pose's name the width. */}
              <span className="play-mini-top">
                <span className="play-label">{label}</span>
                <span className="play-mini-time">{timeLeft}</span>
              </span>
              <span className="play-pose-name">
                {pose.name}
                {pose.sided && <span className="side">{sideLabel(step.side)}</span>}
              </span>
            </span>
          </button>
          <div className="play-mini-controls">
            {backButton}
            {playButton}
            {forwardButton}
          </div>
        </div>
      </div>
    );
  }

  const stopButton = (
    <button className="play-side" onClick={player.stop} disabled={!active} aria-label="Stop" title="Stop">
      <StopIcon />
    </button>
  );
  const settingsButton = (
    <button
      onClick={() => setShowSettings(!showSettings)}
      aria-expanded={showSettings}
      aria-label="Voice settings"
      title="Voice settings"
      className={showSettings ? 'play-side toggled' : 'play-side'}
    >
      <SettingsIcon />
    </button>
  );
  const upNext = nextPose ? (
    <>
      Up next: <span>{nextPose.name}</span>
      {nextPose.sided && ` · ${sideLabel(next.side)}`}
    </>
  ) : (
    'Last pose'
  );

  // Wider screens: one slim bar, like a music app's, rather than a tall panel. What's
  // playing on the left, the controls in the middle, the time on the right, and the
  // voice settings opening above it.
  if (!phone) {
    return (
      <div className="play-dock play-bar">
        {showSettings && <VoiceSettings player={player} />}
        <div className="play-bar-row">
          <div className="play-bar-now">
            {ring}
            <div className="play-bar-text">
            <span className="play-bar-top">
              <span className="play-label">{label}</span>
              <span className="play-pose-step">
                {index + 1} of {seq.length}
              </span>
            </span>
            <span className="play-pose-name">
              {pose.name}
              {pose.sided && <span className="side">{sideLabel(step.side)}</span>}
            </span>
            <span className="play-bar-cue" title={pose.cue}>
              {pose.cue}
            </span>
            </div>
          </div>
          <div className="play-controls">
            {stopButton}
            {backButton}
            {playButton}
            {forwardButton}
            {settingsButton}
          </div>
          <div className="play-bar-side">
            <span className="play-bar-times">
              {formatDuration(Math.round(elapsedMs / 1000))} <span className="play-bar-sep">/</span> {timeLeft}
            </span>
            <span className="play-next">{upNext}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="play-dock">
      <div className="play-status">
        <span className="play-label">{label}</span>
        <span className="play-pose-step">
          {index + 1} of {seq.length}
        </span>
        {phone && (
          <button className="play-close" onClick={() => setOpen(false)} aria-label="Shrink the player" aria-expanded>
            <ChevronIcon dir="down" size={22} />
          </button>
        )}
      </div>
      <div className="play-pose">
        {ring}
        <span className="play-pose-name">
          {pose.name}
          {pose.sided && <span className="side">{sideLabel(step.side)}</span>}
        </span>
        {SHOW_SANSKRIT && pose.sanskrit && <span className="play-sanskrit">{pose.sanskrit}</span>}
      </div>
      <p className="play-cue">{pose.cue}</p>
      <p className="play-next">{upNext}</p>

      {/* Time played on the left, time left on the right, like a podcast player's. */}
      <div className="play-times">
        <span>{formatDuration(Math.round(elapsedMs / 1000))}</span>
        <span>{timeLeft}</span>
      </div>

      {/* Transport in the middle, the big round play button at its centre; stop and settings at the ends. */}
      <div className="play-controls">
        {stopButton}
        {backButton}
        {playButton}
        {forwardButton}
        {settingsButton}
      </div>

      {showSettings && <VoiceSettings player={player} />}
    </div>
  );
}

function VoiceSettings({ player }: { player: Playback }) {
  const { settings, setSettings, voices, voice, best } = player;
  return (
    <div className="play-settings">
      <label>
        Breath length
        <select
          value={settings.secondsPerBreath}
          onChange={(e) => setSettings({ ...settings, secondsPerBreath: Number(e.target.value) })}
        >
          {BREATH_CHOICES.map((n) => (
            <option key={n} value={n}>
              {n} seconds
            </option>
          ))}
        </select>
      </label>
      {voices.length > 0 && (
        <div className="voice-row">
          <label>
            Voice
            {/* Empty means automatic: the best voice this device has, which can change as voices are installed. */}
            <select
              value={settings.voiceURI && voices.some((v) => v.voiceURI === settings.voiceURI) ? settings.voiceURI : ''}
              onChange={(e) => setSettings({ ...settings, voiceURI: e.target.value || null })}
            >
              <option value="">Best available{best ? ` (${best.name})` : ''}</option>
              {voices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name}
                </option>
              ))}
            </select>
          </label>
          <button className="test-voice" onClick={() => speakSample(voice)}>
            Test voice
          </button>
        </div>
      )}
      <label className="check">
        <input
          type="checkbox"
          checked={settings.chime}
          onChange={(e) => setSettings({ ...settings, chime: e.target.checked })}
        />
        Chime at each new pose
      </label>
      <label className="check">
        <input
          type="checkbox"
          checked={settings.breathTone}
          onChange={(e) => setSettings({ ...settings, breathTone: e.target.checked })}
        />
        Soft tone on each breath
      </label>
      <p className="hint">
        {canSpeak
          ? 'Keep the screen on: phones pause the voice when it locks.'
          : 'This browser can’t speak, so playback only times each pose.'}
      </p>
    </div>
  );
}
