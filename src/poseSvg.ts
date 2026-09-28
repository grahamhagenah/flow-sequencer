import { getPose } from './data/graph';
import { neckPath, POSE_ART, type PoseArt } from './data/poseArt';
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
