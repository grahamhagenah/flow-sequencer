import { type CSSProperties, type ReactNode, useEffect, useRef } from 'react';
import { applySide, getPose, otherSide, outgoing, renderLabel, sideLabel, TRANSITION_BY_ID } from './data/graph';
import { START_POSES } from './data/poses';
import { PlaybackDock } from './player/PlaybackDock';
import { usePlayer } from './player/usePlayer';
import { advance, formatDuration, mirror, mirrorRange, type Sequence, setBreaths, setLeadingSide, start, totalSeconds } from './sequence';

type SetSeq = (next: Sequence | ((prev: Sequence) => Sequence)) => void;

export function Builder({
  seq,
  set,
  banner,
  timelineRef,
}: {
  seq: Sequence;
  set: SetSeq;
  /** A notice shown above the current pose, if any. */
  banner: ReactNode;
  timelineRef: React.RefObject<HTMLElement | null>;
}) {
  const current = seq[seq.length - 1];
  const range = mirrorRange(seq);
  const mirrorSide = range
    ? otherSide(seq.slice(range[0], range[1] + 1).find((s) => getPose(s.poseId).sided)!.side)
    : null;

  const player = usePlayer(seq);
  const playingIndex = player.active ? player.state.index : -1;

  const rowBody = (i: number) => {
    const s = seq[i];
    const p = getPose(s.poseId);
    const via = s.via === undefined ? undefined : TRANSITION_BY_ID.get(s.via);
    return (
      <>
        {via && (
          <span className="via" title={renderLabel(via.label, s.side)}>
            {renderLabel(via.label, s.side)}
          </span>
        )}
        <span className="row-name">
          {p.name}
          {p.sided && <span className="side">{sideLabel(s.side)}</span>}
        </span>
      </>
    );
  };

  // Keep the playing step in view as playback moves on (on phones this scrolls
  // the page, which is the point), but not when it starts: pressing Play
  // shouldn't pull the page away from the button.
  const lastIndex = useRef(-1);
  useEffect(() => {
    const moved = playingIndex >= 0 && lastIndex.current >= 0 && playingIndex !== lastIndex.current;
    lastIndex.current = playingIndex;
    if (moved) timelineRef.current?.querySelectorAll('.row')[playingIndex]?.scrollIntoView({ block: 'nearest' });
  }, [playingIndex, timelineRef]);

  return (
    <main className="layout">
      <section className="builder">
        {banner}

        {current ? (
          <CurrentPose step={current} onBreaths={(n) => set((s) => setBreaths(s, s.length - 1, n))} />
        ) : (
          // Holds the pose card's place, so "Start" sits where "Next" will.
          <div className="current-pose empty">
            <p className="hint">Pick a pose to start from.</p>
          </div>
        )}

        <div className="next-head">
          <h2>{current ? 'Next' : 'Start'}</h2>
          {current && choosesSide(current.poseId) && (
            <div className="leading" role="group" aria-label="Side for the next move">
              {(['right', 'left'] as const).map((side) => (
                <button
                  key={side}
                  aria-pressed={current.side === side}
                  onClick={() => set((s) => setLeadingSide(s, side))}
                >
                  {sideLabel(side)}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="tiles">
          {current
            ? outgoing(current.poseId).map((t) => {
                const to = getPose(t.to);
                const side = applySide(current.side, t.side);
                return (
                  <button key={t.id} className="tile" onClick={() => set((s) => advance(s, t))}>
                    <span className="tile-label">{renderLabel(t.label, side)}</span>
                    <span className="tile-to">
                      {to.name}
                      {to.sided && ` · ${sideLabel(side)}`}
                    </span>
                  </button>
                );
              })
            : START_POSES.map((id) => {
                const p = getPose(id);
                return (
                  <button key={id} className="tile" onClick={() => set(start(id))}>
                    <span className="tile-label">{p.name}</span>
                    {p.sanskrit && <span className="tile-to">{p.sanskrit}</span>}
                  </button>
                );
              })}
        </div>

        {/* Below the tiles, so it coming and going never moves them. */}
        {range && mirrorSide && (
          <button className="mirror" onClick={() => set(mirror)}>
            <span className="kicker">Suggestion</span>
            Repeat on the {mirrorSide} side
            <span className="sub">
              Adds the last {range[1] - range[0] + 1} steps again, mirrored, starting from{' '}
              {getPose(seq[range[0]].poseId).name}
            </span>
          </button>
        )}
      </section>

      <aside className="timeline" ref={timelineRef}>
        <div className="timeline-head">
          <h2>Sequence</h2>
          {seq.length > 0 && (
            <span className="meta">
              {seq.length} {seq.length === 1 ? 'pose' : 'poses'} · {formatDuration(totalSeconds(seq))}
            </span>
          )}
        </div>
        {seq.length === 0 ? (
          <p className="hint">Your flow will build up here.</p>
        ) : (
          <ol>
            {seq.map((s, i) => {
              const isLast = i === seq.length - 1;
              const playing = i === playingIndex;
              const { holdElapsed, holdTotal } = player.state;
              const className = [
                'row',
                isLast && !player.active && 'current',
                playing && 'playing',
                player.active && i < playingIndex && 'played',
              ]
                .filter(Boolean)
                .join(' ');
              const progress = playing && holdTotal ? (holdElapsed / holdTotal) * 100 : 0;
              return (
                <li
                  key={i}
                  className={className}
                  style={playing ? ({ '--progress': `${progress}%` } as CSSProperties) : undefined}
                  aria-current={playing ? 'step' : undefined}
                >
                  <span className="num">{i + 1}</span>
                  {/* Rows are only clickable while playing, to jump there. */}
                  {player.active ? (
                    <button className="row-main" onClick={() => player.goTo(i)} title="Play from here">
                      {rowBody(i)}
                    </button>
                  ) : (
                    <div className="row-main">{rowBody(i)}</div>
                  )}
                  <span className="row-breaths">{s.breaths === 1 ? '1 breath' : `${s.breaths} breaths`}</span>
                </li>
              );
            })}
          </ol>
        )}
        {seq.length > 0 && (
          <div className="play-footer">
            <PlaybackDock seq={seq} player={player} />
          </div>
        )}
      </aside>
    </main>
  );
}

/** An unsided pose whose next moves include a sided one, so the side is still open. */
function choosesSide(poseId: string): boolean {
  return !getPose(poseId).sided && outgoing(poseId).some((t) => getPose(t.to).sided);
}

function CurrentPose({ step, onBreaths }: { step: Sequence[number]; onBreaths: (n: number) => void }) {
  const p = getPose(step.poseId);
  return (
    <div className="current-pose">
      <div className="pose-head">
        <div>
          <div className="pose-name">
            {p.name}
            {p.sided && <span className="side">{sideLabel(step.side)}</span>}
          </div>
          {/* Always there, so poses without one don't make the card shorter. */}
          <div className="sanskrit">{p.sanskrit ?? '\u00a0'}</div>
        </div>
        <Stepper value={step.breaths} onChange={onBreaths} />
      </div>
      <p className="cue">{p.cue}</p>
    </div>
  );
}

function Stepper({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <span className="stepper">
      <button onClick={() => onChange(value - 1)} disabled={value <= 1} aria-label="Fewer breaths">−</button>
      <span className="count">
        {value}
        <span className="unit"> {value === 1 ? 'breath' : 'breaths'}</span>
      </span>
      <button onClick={() => onChange(value + 1)} aria-label="More breaths">+</button>
    </span>
  );
}
