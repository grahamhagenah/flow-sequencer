import { type CSSProperties, useState } from 'react';
import { FLOW_COLORS } from './colors';
import { BASES } from './Composer';
import { sideLabel } from './data/graph';
import { POSES } from './data/poses';
import type { Pose, Side } from './data/types';
import { ArrowLeftIcon, DownloadIcon } from './icons';
import { PoseFigure } from './PoseFigure';
import { poseSvg } from './poseSvg';
import { SiteFooter } from './SiteFooter';
import { zip } from './zip';

// The poses page (/poses/): every drawing in a grid, grouped as the "Get to" list is,
// with its cue. A search narrows them; one-sided poses show the side chosen.
// Each downloads as an SVG, or all of them at once (both sides) as a zip.

const INKS = [
  { id: 'white', name: 'White', hex: '#ffffff' },
  ...FLOW_COLORS,
];

function save(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Lower case, accents dropped, so "asana" finds "Āsana" and "tadasana" finds Tadasana. */
const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const matches = (p: Pose, query: string) => {
  const q = fold(query.trim());
  return !q || [p.name, p.sanskrit ?? '', ...(p.aka ?? [])].some((n) => fold(n).includes(q));
};

export function PosesPage() {
  const [inkId, setInkId] = useState('white');
  const [side, setSide] = useState<Side>('right');
  const [query, setQuery] = useState('');
  const ink = INKS.find((i) => i.id === inkId)!;
  const suffix = inkId === 'white' ? '' : `-${inkId}`;
  /** A one-sided pose's files are named for their side. */
  const fileOf = (p: Pose, s: Side) => ({
    name: `${p.id}${p.sided ? `-${s}` : ''}${suffix}.svg`,
    text: poseSvg(p.id, ink.hex, { left: p.sided && s === 'left' }),
  });
  const shown = POSES.filter((p) => matches(p, query));

  return (
    <main className="poses-page" style={{ '--ink': ink.hex } as CSSProperties}>
      <header className="poses-head">
        <a className="poses-back" href="../">
          <ArrowLeftIcon /> Flow Sequencer
        </a>
        <h1>Poses</h1>
        <p>
          All {POSES.length} pose drawings. Click one to download it as an SVG, or download them all as a zip (both sides
          of each one-sided pose), in the line colour chosen here.
        </p>
        <div className="poses-tools">
          <input
            className="poses-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search poses"
            aria-label="Search poses by any of their names, English or Sanskrit"
          />
          <span className="layout-toggle" role="group" aria-label="Side for one-sided poses">
            {(['right', 'left'] as const).map((s) => (
              <button key={s} aria-pressed={side === s} onClick={() => setSide(s)}>
                {sideLabel(s)}
              </button>
            ))}
          </span>
          <div className="poses-inks" role="radiogroup" aria-label="Line colour">
            {INKS.map((i) => (
              <button
                key={i.id}
                role="radio"
                aria-checked={i.id === inkId}
                aria-label={i.name}
                title={i.name}
                style={{ '--swatch': i.hex } as CSSProperties}
                onClick={() => setInkId(i.id)}
              />
            ))}
          </div>
          <button
            className="poses-all"
            onClick={() =>
              save(
                new Blob([zip(POSES.flatMap((p) => (p.sided ? [fileOf(p, 'right'), fileOf(p, 'left')] : [fileOf(p, 'right')])))], {
                  type: 'application/zip',
                }),
                `flow-sequencer-poses${suffix}.zip`,
              )
            }
          >
            <DownloadIcon /> Download all
          </button>
        </div>
      </header>

      {shown.length === 0 && <p className="poses-none">No poses match “{query.trim()}”.</p>}

      {BASES.map(([base, label]) => {
        const poses = shown.filter((p) => p.base === base);
        if (poses.length === 0) return null;
        return (
          <section key={base} className="poses-group">
            <h2>
              {label} <span>{poses.length}</span>
            </h2>
            <ul className="poses-grid">
              {poses.map((p) => (
                <li key={p.id}>
                  {/* The whole pose is the download. */}
                  <button
                    className="poses-item"
                    onClick={() => {
                      const f = fileOf(p, side);
                      save(new Blob([f.text], { type: 'image/svg+xml' }), f.name);
                    }}
                    aria-label={`Download ${p.name}${p.sided ? `, ${side} side,` : ''} as SVG`}
                    title="Download SVG"
                  >
                    <PoseFigure poseId={p.id} side={side} size={128} />
                    <span className="poses-name">
                      {p.name}
                      {p.sided && <span className="side">{sideLabel(side)}</span>}
                    </span>
                    {p.sanskrit && <span className="poses-sanskrit">{p.sanskrit}</span>}
                    {p.aka && <span className="poses-aka">Also {p.aka.join(', ')}</span>}
                    <span className="poses-cue">{p.cue}</span>
                    <span className="poses-hint" aria-hidden="true">
                      <DownloadIcon /> SVG
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      <SiteFooter here="poses" />
    </main>
  );
}
