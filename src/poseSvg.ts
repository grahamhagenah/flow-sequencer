import { getPose } from './data/graph';
import { neckPath, POSE_ART, type PoseArt } from './data/poseArt';
import { BASES, POSES } from './data/poses';
import { DRAWINGS_NOTICE } from './terms';

// A pose's drawing as a standalone SVG file, for the poses page's downloads. The same
// shapes PoseFigure draws, with the colour and line weight written in, since a file has
// no page around it to inherit them from.

/** The mat under a drawing: its edge in a side view, the whole of it seen from above. */
export const FLOOR_PATH = 'M4 45h40';
export const MAT_RECT = { x: 2, y: 14, width: 44, height: 20, rx: 2 };

/**
 * How a one-sided pose is drawn for the left side: a side view turns to face the other
 * way; one seen from above flips across the mat, so the head stays at its top end.
 */
export const leftSideTransform = (art: PoseArt) => (art.topView ? 'matrix(1 0 0 -1 0 48)' : 'matrix(-1 0 0 1 48 0)');

/** `left` mirrors the drawing for the left side (only meaningful for one-sided poses). */
export function poseSvg(poseId: string, color: string, { left = false, strokeWidth = 2 } = {}): string {
  const art = POSE_ART[poseId];
  if (!art) throw new Error(`No drawing for ${poseId}`);
  const m = MAT_RECT;
  const mat = art.topView
    ? `<rect x="${m.x}" y="${m.y}" width="${m.width}" height="${m.height}" rx="${m.rx}" stroke-width="1.4" opacity="0.35"/>`
    : `<path d="${FLOOR_PATH}" stroke-width="1.4" opacity="0.35"/>`;
  return [
    // Who drew it and on what terms, carried in the file wherever it goes.
    `<!-- ${getPose(poseId).name}, from Flow Sequencer (https://yoga.grahamhagenah.com/poses/). ${DRAWINGS_NOTICE} -->`,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="480" height="480" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">`,
    `  ${mat}`,
    `  <g${left ? ` transform="${leftSideTransform(art)}"` : ''}>`,
    `    <path d="${art.d}${neckPath(art)}"/>`,
    `    <circle cx="${art.head[0]}" cy="${art.head[1]}" r="3.3" fill="${color}" stroke="none"/>`,
    `  </g>`,
    `</svg>`,
    '',
  ].join('\n');
}

// The whole set on one sheet, for looking over and adjusting: every pose in a labelled
// grid, grouped as on the poses page, at the scale they're drawn at in Figma (10px to a
// grid unit: 20px lines, a 33px head, 480px squares). Each pose is its own named group
// ("tree"), so one can be copied out, changed and sent back as it is. One-sided poses
// are drawn on their right side, the way they're stored.
const SCALE = 10;
const CELL = 48 * SCALE;
const GAP = 40;
const LABEL = 70;
const HEADING = 90;
const COLUMNS = 8;
const PAD = 80;

const xmlText = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

/** A path at `k` times the size: every number scaled (the drawings use no arcs, whose flags mustn't be). */
const scalePath = (d: string, k: number) =>
  d.replace(/-?(?:\d+\.?\d*|\.\d+)/g, (n) => String(Math.round(Number(n) * k * 100) / 100));
const px = (n: number) => Math.round(n * SCALE * 100) / 100;

export function poseSheetSvg(color: string, background = '#08090b'): string {
  const parts: string[] = [];
  let y = PAD;
  for (const [base, label] of BASES) {
    const poses = POSES.filter((p) => p.base === base && POSE_ART[p.id]);
    if (poses.length === 0) continue;
    parts.push(
      `  <text id="heading-${base}" x="${PAD}" y="${y + 48}" fill="${color}" stroke="none" font-size="40" font-weight="600" opacity="0.7">${xmlText(label)} · ${poses.length}</text>`,
    );
    y += HEADING;
    poses.forEach((p, i) => {
      const art = POSE_ART[p.id];
      const x = PAD + (i % COLUMNS) * (CELL + GAP);
      const top = y + Math.floor(i / COLUMNS) * (CELL + LABEL + GAP);
      const m = MAT_RECT;
      // Drawn at full size, not scaled by a transform, so line weights import as they are.
      const mat = art.topView
        ? `<rect id="mat" x="${px(m.x)}" y="${px(m.y)}" width="${px(m.width)}" height="${px(m.height)}" rx="${px(m.rx)}" stroke-width="14" opacity="0.35"/>`
        : `<path id="mat" d="${scalePath(FLOOR_PATH, SCALE)}" stroke-width="14" opacity="0.35"/>`;
      parts.push(
        `  <g id="${p.id}">`,
        `    <g id="${p.id}-drawing" transform="translate(${x} ${top})">`,
        `      ${mat}`,
        `      <path id="body" d="${scalePath(art.d + neckPath(art), SCALE)}"/>`,
        `      <circle id="head" cx="${px(art.head[0])}" cy="${px(art.head[1])}" r="33" fill="${color}" stroke="none"/>`,
        `    </g>`,
        `    <text x="${x + CELL / 2}" y="${top + CELL + 34}" fill="${color}" stroke="none" font-size="28" font-weight="600" text-anchor="middle">${xmlText(p.name)}</text>`,
        `    <text x="${x + CELL / 2}" y="${top + CELL + 64}" fill="${color}" stroke="none" font-size="20" text-anchor="middle" opacity="0.5">${p.id}${p.sided ? ' · right side' : ''}${art.topView ? ' · from above' : ''}</text>`,
        `  </g>`,
      );
    });
    y += Math.ceil(poses.length / COLUMNS) * (CELL + LABEL + GAP) + GAP;
  }
  const width = PAD * 2 + COLUMNS * CELL + (COLUMNS - 1) * GAP;
  const height = y + PAD - GAP;
  return [
    `<!-- Every pose drawing, from Flow Sequencer (https://yoga.grahamhagenah.com/poses/). ${DRAWINGS_NOTICE} -->`,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" fill="none" stroke="${color}" stroke-width="20" stroke-linecap="round" stroke-linejoin="round" font-family="Helvetica, Arial, sans-serif">`,
    `  <rect id="background" width="${width}" height="${height}" fill="${background}" stroke="none"/>`,
    ...parts,
    `</svg>`,
    '',
  ].join('\n');
}
