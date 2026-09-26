import { type CSSProperties, useState } from 'react';
import { FLOW_COLORS } from './colors';
import { BASES } from './Composer';
import { POSES } from './data/poses';
import { ArrowLeftIcon, DownloadIcon } from './icons';
import { PoseFigure } from './PoseFigure';
import { poseSvg } from './poseSvg';
import { zip } from './zip';

// The poses page (/poses/): every drawing in a grid, grouped as the "Get to" list is,
// each downloadable as an SVG, or all of them at once as a zip.

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

export function PosesPage() {
  const [inkId, setInkId] = useState('white');
  const ink = INKS.find((i) => i.id === inkId)!;
  const svgOf = (id: string) => poseSvg(id, ink.hex);
  const suffix = inkId === 'white' ? '' : `-${inkId}`;

  return (
    <main className="poses-page" style={{ '--ink': ink.hex } as CSSProperties}>
      <header className="poses-head">
        <a className="poses-back" href="../">
          <ArrowLeftIcon /> Flow Sequencer
        </a>
        <h1>Poses</h1>
        <p>
          All {POSES.length} pose drawings. Click one to download it as an SVG, or download them all as a zip, in the
          line colour chosen here.
        </p>
        <div className="poses-tools">
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
            className="primary poses-all"
            onClick={() =>
              save(
                new Blob([zip(POSES.map((p) => ({ name: `${p.id}${suffix}.svg`, text: svgOf(p.id) })))], {
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

      {BASES.map(([base, label]) => {
        const poses = POSES.filter((p) => p.base === base);
        return (
          <section key={base} className="poses-group">
            <h2>{label}</h2>
            <ul className="poses-grid">
              {poses.map((p) => (
                <li key={p.id}>
                  {/* The whole pose is the download. */}
                  <button
                    className="poses-item"
                    onClick={() => save(new Blob([svgOf(p.id)], { type: 'image/svg+xml' }), `${p.id}${suffix}.svg`)}
                    aria-label={`Download ${p.name} as SVG`}
                    title="Download SVG"
                  >
                    <PoseFigure poseId={p.id} size={128} />
                    <span className="poses-name">{p.name}</span>
                    {p.sanskrit && <span className="poses-sanskrit">{p.sanskrit}</span>}
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
    </main>
  );
}
