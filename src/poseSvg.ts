import { POSE_ART } from './data/poseArt';

// A pose's drawing as a standalone SVG file, for the poses page's downloads. The same
// shapes PoseFigure draws, with the colour and line weight written in, since a file has
// no page around it to inherit them from.

/** The mat under a drawing: its edge in a side view, the whole of it seen from above. */
export const FLOOR_PATH = 'M4 45h40';
export const MAT_RECT = { x: 2, y: 14, width: 44, height: 20, rx: 2 };

export function poseSvg(poseId: string, color: string, strokeWidth = 2): string {
  const art = POSE_ART[poseId];
  if (!art) throw new Error(`No drawing for ${poseId}`);
  const m = MAT_RECT;
  const mat = art.topView
    ? `<rect x="${m.x}" y="${m.y}" width="${m.width}" height="${m.height}" rx="${m.rx}" stroke-width="1.4" opacity="0.35"/>`
    : `<path d="${FLOOR_PATH}" stroke-width="1.4" opacity="0.35"/>`;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="480" height="480" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">`,
    `  ${mat}`,
    `  <path d="${art.d}"/>`,
    `  <circle cx="${art.head[0]}" cy="${art.head[1]}" r="3.3" fill="${color}" stroke="none"/>`,
    `</svg>`,
    '',
  ].join('\n');
}
