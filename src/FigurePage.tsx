import { type CSSProperties, useEffect, useRef, useState } from 'react';
import {
  descendants,
  type Figure,
  figureArt,
  figurePath,
  figureSvg,
  HEAD_RADIUS,
  JOINT_NAMES,
  type JointId,
  JOINTS,
  mirror,
  moveJoint,
  nudge,
  PARENT,
  type Point,
  PRESETS,
} from './figure';
import { CheckIcon, DownloadIcon, FlipIcon, RedoIcon, UndoIcon } from './icons';
import { InkPicker, INKS, save } from './PosesPage';
import { FLOOR_PATH } from './poseSvg';
import { SiteBar } from './SiteBar';
import { SiteFooter } from './SiteFooter';
import { useHistory } from './useHistory';

// The figure page (/figure/): a stick figure in the poses' style whose joints drag into
// any shape, then downloads as an SVG like the pose drawings. A limb pulled past its length
// stretches a little, so limbs can be made longer or shorter as well as turned.

/** The drawing's grid, as the SVG's viewBox and the joint handles' sizes. */
const GRID = 48;
/** Hands and feet and the head are picked up by a wider ring than they show. */
const HIT_RADIUS = 2.4;

/** Where the pointer is on the drawing's grid. */
function gridPoint(svg: SVGSVGElement, e: { clientX: number; clientY: number }): Point {
  const rect = svg.getBoundingClientRect();
  return [((e.clientX - rect.left) / rect.width) * GRID, ((e.clientY - rect.top) / rect.height) * GRID];
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function FigurePage() {
  const { value: figure, set, reset, undo, redo, canUndo, canRedo } = useHistory<Figure>(() => PRESETS[0].figure);
  const [neck, setNeck] = useState(false);
  const [inkId, setInkId] = useState('white');
  const [selected, setSelected] = useState<JointId | null>(null);
  const [copied, setCopied] = useState<'svg' | 'code' | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  // A drag in progress: which joint, the figure as it was when it started (the limb's
  // length to stretch from), and the figure as it is now, shown live without touching
  // the history until the pointer is released.
  const drag = useRef<{ id: JointId; start: Figure; current: Figure } | null>(null);
  const [live, setLive] = useState<Figure | null>(null);
  const shown = live ?? figure;
  const ink = INKS.find((i) => i.id === inkId)!;

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(null), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  const onDown = (id: JointId) => (e: React.PointerEvent<SVGElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { id, start: figure, current: figure };
    setSelected(id);
  };
  const onMove = (e: React.PointerEvent<SVGElement>) => {
    const d = drag.current;
    if (!d || !svgRef.current) return;
    d.current = moveJoint(d.start, d.current, d.id, gridPoint(svgRef.current, e));
    setLive(d.current);
  };
  const onUp = () => {
    const d = drag.current;
    if (!d) return;
    drag.current = null;
    setLive(null);
    if (d.current !== d.start) set(d.current);
  };

  // Arrow keys nudge the selected joint; with Shift, by a whole grid unit.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        return e.shiftKey ? redo() : undo();
      }
      if (!selected || e.metaKey || e.ctrlKey) return;
      const step = e.shiftKey ? 1 : 0.25;
      const by: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
      const delta = by[e.key];
      if (!delta) return;
      e.preventDefault();
      set((f) => nudge(f, selected, ...delta));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected, set, undo, redo]);

  const svgText = () => figureSvg(figure, neck, ink.hex);
  const dragging = drag.current?.id ?? null;
  // The joints a drag carries along, lit with it.
  const carried = dragging ? new Set(descendants(dragging)) : new Set<JointId>();

  return (
    <>
      <SiteBar root="../" section="Pose a figure" />
      <main className="figure-page" style={{ '--ink': ink.hex } as CSSProperties}>
        <header className="poses-head">
          <h1>Pose a figure</h1>
          <p>
            Drag the joints to put the figure into a pose: a hand or foot swings its limb, the hip moves the whole
            figure. Pull a limb past its length and it gives a little, so limbs can be longer or shorter. Then download
            it as an SVG, drawn the way the app’s poses are.
          </p>
        </header>

        <div className="figure-studio">
          <svg
            className="figure-canvas"
            ref={svgRef}
            viewBox={`0 0 ${GRID} ${GRID}`}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
            onPointerDown={(e) => e.target === e.currentTarget && setSelected(null)}
            aria-label="The figure. Drag its joints, or pick one and nudge it with the arrow keys."
          >
            <path d={FLOOR_PATH} strokeWidth={1.4} opacity={0.35} />
            {/* The drawing as it will download. */}
            <g className="figure-body">
              <path d={figurePath(shown, neck)} />
              <circle cx={shown.head[0]} cy={shown.head[1]} r={HEAD_RADIUS} fill="currentColor" stroke="none" />
            </g>
            {/* The joints, as handles: a ring on each, a faint line to its parent while it's held. */}
            <g className="figure-joints">
              {JOINTS.map((id) => {
                const [x, y] = shown[id];
                const parent = PARENT[id];
                const state = id === dragging ? 'held' : carried.has(id) ? 'carried' : id === selected ? 'picked' : '';
                return (
                  <g key={id} className={`figure-joint ${state}`}>
                    {id === dragging && parent && (
                      <line className="figure-bone" x1={shown[parent][0]} y1={shown[parent][1]} x2={x} y2={y} />
                    )}
                    <circle
                      className="figure-hit"
                      cx={x}
                      cy={y}
                      r={HIT_RADIUS}
                      onPointerDown={onDown(id)}
                      tabIndex={0}
                      role="button"
                      aria-label={JOINT_NAMES[id]}
                      onFocus={() => setSelected(id)}
                    />
                    <circle className="figure-dot" cx={x} cy={y} r={id === 'head' ? HEAD_RADIUS : 0.9} />
                  </g>
                );
              })}
            </g>
          </svg>

          <div className="figure-tools">
            <div className="figure-row">
              <span className="figure-label">Start from</span>
              <span className="layout-toggle" role="group" aria-label="Starting shape">
                {PRESETS.map((p) => (
                  <button key={p.id} onClick={() => reset(p.figure)}>
                    {p.name}
                  </button>
                ))}
              </span>
            </div>
            <div className="figure-row">
              <button className="icon-btn" onClick={undo} disabled={!canUndo} aria-label="Undo" title="Undo (⌘Z)">
                <UndoIcon />
              </button>
              <button className="icon-btn" onClick={redo} disabled={!canRedo} aria-label="Redo" title="Redo (⇧⌘Z)">
                <RedoIcon />
              </button>
              <button className="icon-btn" onClick={() => set(mirror)} aria-label="Face the other way" title="Face the other way">
                <FlipIcon />
              </button>
              <label className="figure-check">
                <input type="checkbox" checked={neck} onChange={(e) => setNeck(e.target.checked)} /> Neck
              </label>
              <InkPicker inkId={inkId} onChange={setInkId} />
            </div>
            <div className="figure-row">
              <button className="poses-all" onClick={() => save(new Blob([svgText()], { type: 'image/svg+xml' }), `figure${inkId === 'white' ? '' : `-${inkId}`}.svg`)}>
                <DownloadIcon /> Download SVG
              </button>
              <button className="poses-sheet" onClick={async () => (await copyText(svgText())) && setCopied('svg')}>
                {copied === 'svg' ? (
                  <>
                    <CheckIcon /> Copied
                  </>
                ) : (
                  'Copy SVG'
                )}
              </button>
              {/* For adding the figure to the app's own poses: its line in poseArt.ts. */}
              <button className="poses-sheet" onClick={async () => (await copyText(figureArt(figure, neck))) && setCopied('code')} title="The figure as a line of poseArt.ts, to add it to the app">
                {copied === 'code' ? (
                  <>
                    <CheckIcon /> Copied
                  </>
                ) : (
                  'Copy as code'
                )}
              </button>
            </div>
            <p className="figure-hint">
              {selected ? `${JOINT_NAMES[selected]}: arrow keys nudge it, Shift for bigger steps.` : 'Click a joint to pick it, then the arrow keys nudge it.'}
            </p>
          </div>
        </div>
      </main>
      <SiteFooter root="../" />
    </>
  );
}
