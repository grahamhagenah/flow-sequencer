import { useState } from 'react';
import { getPose, sideLabel } from '../data/graph';
import { BackIcon, ForwardIcon, PauseIcon, PlayIcon, SettingsIcon, StopIcon } from '../icons';
import { formatDuration, type Sequence } from '../sequence';
import { canSpeak } from './conductor';
import { BREATH_CHOICES, type Playback } from './usePlayer';

/**
 * The foot of the sequence panel. Every part is always there, playing or not,
 * and controls that can't do anything yet are greyed out, so pressing Play
 * changes what the dock says but never its shape.
 */
export function PlaybackDock({ seq, player }: { seq: Sequence; player: Playback }) {
  const { state, active, settings } = player;
  const [showSettings, setShowSettings] = useState(false);

  const index = active ? state.index : 0;
  const step = seq[index];
  const pose = getPose(step.poseId);
  const next = seq[index + 1];
  const nextPose = next && getPose(next.poseId);

  const breathMs = settings.secondsPerBreath * 1000;
  const totalMs = seq.reduce((sum, s) => sum + s.breaths * breathMs, 0);
  const elapsedMs = !active
    ? 0
    : state.phase === 'done'
      ? totalMs
      : seq.slice(0, index).reduce((sum, s) => sum + s.breaths * breathMs, 0) + state.holdElapsed;
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

  const primaryLabel = state.playing ? 'Pause' : !active ? 'Play' : state.phase === 'done' ? 'Play again' : 'Resume';

  return (
    <div className="play-dock">
      <div className="play-status">
        <span className="play-label">{label}</span>
        <span className="meta">
          {active
            ? `${formatDuration(Math.round(Math.max(0, totalMs - elapsedMs) / 1000))} left`
            : `${formatDuration(Math.round(totalMs / 1000))} · ${settings.secondsPerBreath}s breaths`}
        </span>
      </div>
      <div className="play-progress" aria-hidden="true">
        <div style={{ width: `${totalMs ? (elapsedMs / totalMs) * 100 : 0}%` }} />
      </div>

      <div className="play-pose">
        <span className="play-pose-name">
          {pose.name}
          {pose.sided && <span className="side">{sideLabel(step.side)}</span>}
        </span>
        <span className="play-pose-step">
          {index + 1} of {seq.length}
        </span>
      </div>
      <p className="play-cue">{pose.cue}</p>
      <p className="play-next">
        {nextPose ? (
          <>
            Up next: <span>{nextPose.name}</span>
            {nextPose.sided && ` · ${sideLabel(next.side)}`}
          </>
        ) : (
          'Last pose'
        )}
      </p>

      <div className="play-controls">
        <button onClick={player.prev} disabled={!active || index === 0} aria-label="Previous pose" title="Previous pose">
          <BackIcon />
        </button>
        <button className="primary" onClick={player.toggle}>
          {state.playing ? <PauseIcon /> : <PlayIcon />} {primaryLabel}
        </button>
        <button
          onClick={player.next}
          disabled={!active || index >= seq.length - 1}
          aria-label="Next pose"
          title="Next pose"
        >
          <ForwardIcon />
        </button>
        <button onClick={player.stop} disabled={!active} aria-label="Stop" title="Stop">
          <StopIcon />
        </button>
        <button
          onClick={() => setShowSettings(!showSettings)}
          aria-expanded={showSettings}
          aria-label="Voice settings"
          title="Voice settings"
          className={showSettings ? 'toggled' : undefined}
        >
          <SettingsIcon />
        </button>
      </div>

      {showSettings && <VoiceSettings player={player} />}
    </div>
  );
}

function VoiceSettings({ player }: { player: Playback }) {
  const { settings, setSettings, voices, voice } = player;
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
        <label>
          Voice
          <select
            value={voice?.voiceURI ?? ''}
            onChange={(e) => setSettings({ ...settings, voiceURI: e.target.value || null })}
          >
            <option value="">Browser default</option>
            {voices.map((v) => (
              <option key={v.voiceURI} value={v.voiceURI}>
                {v.name}
              </option>
            ))}
          </select>
        </label>
      )}
      <label className="check">
        <input
          type="checkbox"
          checked={settings.chime}
          onChange={(e) => setSettings({ ...settings, chime: e.target.checked })}
        />
        Chime at each new pose
      </label>
      <p className="hint">
        {canSpeak
          ? 'Keep the screen on: phones pause the voice when it locks.'
          : 'This browser can’t speak, so playback only times each pose.'}
      </p>
    </div>
  );
}
