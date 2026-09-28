import { type CSSProperties, useEffect, useRef, useState } from 'react';
import { FLOW_COLORS } from './colors';
import { sideLabel } from './data/graph';
import { BASES, POSES } from './data/poses';
import type { Pose, Side } from './data/types';
import { ChevronIcon, DownloadIcon, InfoIcon } from './icons';
import { PoseFigure } from './PoseFigure';
import { poseSvg } from './poseSvg';
import { SiteBar } from './SiteBar';
import { SiteFooter } from './SiteFooter';
import { DRAWINGS_LICENSE_TEXT, DRAWINGS_OWNER, LICENSE_URL } from './terms';
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
    <>
    <SiteBar root="../" section="Poses" />
    <main className="poses-page" style={{ '--ink': ink.hex } as CSSProperties}>
      <header className="poses-head">
        <h1>Poses</h1>
        <p>
          All {POSES.length} pose drawings. Click one to download it as an SVG, or download them all as a zip (both sides
          of each one-sided pose), in the line colour chosen here. <TermsInfo />
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
          <InkPicker inkId={inkId} onChange={setInkId} />
          <button
            className="poses-all"
            onClick={() =>
              save(
                new Blob(
                  [
                    zip([
                      ...POSES.flatMap((p) => (p.sided ? [fileOf(p, 'right'), fileOf(p, 'left')] : [fileOf(p, 'right')])),
                      // The terms travel with the set.
                      { name: 'LICENSE.txt', text: DRAWINGS_LICENSE_TEXT },
                    ]),
                  ],
                  { type: 'application/zip' },
                ),
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

      <SiteFooter root="../" />
    </main>
    </>
  );
}

/**
 * The line colour: one button showing the colour chosen, opening the swatches to pick
 * another. Picking one closes them; so do a click outside and Escape.
 */
function InkPicker({ inkId, onChange }: { inkId: string; onChange: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const ink = INKS.find((i) => i.id === inkId)!;

  useEffect(() => {
    if (!open) return;
    const outside = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', outside);
    window.addEventListener('keydown', onKey);
    // Keyboard users start on the chosen colour.
    ref.current?.querySelector<HTMLButtonElement>('[aria-checked="true"]')?.focus();
    return () => {
      document.removeEventListener('pointerdown', outside);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="ink-picker" ref={ref}>
      <button
        className="ink-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={`Line colour, ${ink.name}`}
      >
        <span className="ink-dot" style={{ '--swatch': ink.hex } as CSSProperties} aria-hidden="true" />
        {ink.name}
        <ChevronIcon dir="down" size={16} />
      </button>
      {open && (
        <div className="poses-inks" role="radiogroup" aria-label="Line colour">
          {INKS.map((i) => (
            <button
              key={i.id}
              role="radio"
              aria-checked={i.id === inkId}
              aria-label={i.name}
              title={i.name}
              style={{ '--swatch': i.hex } as CSSProperties}
              onClick={() => {
                onChange(i.id);
                setOpen(false);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** Whose the drawings are and what's allowed, behind a small ⓘ at the end of the introduction. */
function TermsInfo() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const outside = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', outside);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', outside);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <span className="terms-info" ref={ref}>
      <button
        className="terms-btn"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Who owns the drawings, and how you may use them"
        title="Terms of use"
      >
        <InfoIcon />
      </button>
      {open && (
        <span className="terms-pop" role="note">
          The drawings are © {DRAWINGS_OWNER}, free for your own personal use. Please don’t sell them or use them in
          other apps, sites or products without asking. <a href={LICENSE_URL}>The full terms</a>
        </span>
      )}
    </span>
  );
}
