import { DRAWINGS_NOTICE } from './terms';
import { FLOOR_PATH } from './poseSvg';

// A stick figure to pose by hand (the /figure/ page): the same kind of drawing as the
// poses (poseArt.ts), a round head and stroked lines on the 48×48 grid, standing on
// the floor line, but made of joints that can be dragged. Each joint hangs off another,
// the hip at the root, so moving one carries everything past it.

export type JointId =
  | 'hip'
  | 'neck'
  | 'head'
  | 'elbowA'
  | 'handA'
  | 'elbowB'
  | 'handB'
  | 'kneeA'
  | 'footA'
  | 'kneeB'
  | 'footB';

export type Point = [number, number];
export type Figure = Record<JointId, Point>;

/** Which joint each one hangs off; the hip hangs off nothing. */
export const PARENT: Record<JointId, JointId | null> = {
  hip: null,
  neck: 'hip',
  head: 'neck',
  elbowA: 'neck',
  handA: 'elbowA',
  elbowB: 'neck',
  handB: 'elbowB',
  kneeA: 'hip',
  footA: 'kneeA',
  kneeB: 'hip',
  footB: 'kneeB',
};

export const JOINTS = Object.keys(PARENT) as JointId[];

export const JOINT_NAMES: Record<JointId, string> = {
  hip: 'Hip',
  neck: 'Shoulders',
  head: 'Head',
  elbowA: 'Near elbow',
  handA: 'Near hand',
  elbowB: 'Far elbow',
  handB: 'Far hand',
  kneeA: 'Near knee',
  footA: 'Near foot',
  kneeB: 'Far knee',
  footB: 'Far foot',
};

/** The drawings' head, and the floor they stand on. */
export const HEAD_RADIUS = 3.3;
export const FLOOR_Y = 45;

/** Every joint that hangs off `id`, however far down. */
export function descendants(id: JointId): JointId[] {
  const out: JointId[] = [];
  const walk = (parent: JointId) => {
    for (const j of JOINTS) if (PARENT[j] === parent) (out.push(j), walk(j));
  };
  walk(id);
  return out;
}

const r = (n: number) => Math.round(n * 20) / 20;
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

/** Rounded to the grid's twentieths and kept on the drawing, as the stored poses are. */
export const settle = ([x, y]: Point): Point => [r(clamp(x, 1, 47)), r(clamp(y, 1, FLOOR_Y))];

/**
 * Where a joint lands when dragged toward `to`. A limb pulled past its length gives a
 * little (so it can be longer or shorter) but not all the way: it stretches like a band,
 * never past half again its length at the start of the drag, nor under half of it.
 * `from` is the figure as it was when the drag began.
 */
export function pull(from: Figure, id: JointId, to: Point): Point {
  const parent = PARENT[id];
  if (!parent) return settle(to);
  const [px, py] = from[parent];
  const [x0, y0] = from[id];
  const rest = Math.hypot(x0 - px, y0 - py);
  const dx = to[0] - px;
  const dy = to[1] - py;
  const want = Math.hypot(dx, dy);
  if (want < 0.001) return from[id];
  // The give: the stretch is held back to 45% of the pull, then capped.
  const len = clamp(rest + (want - rest) * 0.45, rest * 0.5, rest * 1.5);
  return settle([px + (dx / want) * len, py + (dy / want) * len]);
}

/** The figure with `id` moved to `to` (by `pull`), its joints past it carried along. */
export function moveJoint(start: Figure, current: Figure, id: JointId, to: Point): Figure {
  const next = pull(start, id, to);
  const [x0, y0] = current[id];
  const dx = next[0] - x0;
  const dy = next[1] - y0;
  const out = { ...current, [id]: next };
  for (const j of descendants(id)) out[j] = settle([current[j][0] + dx, current[j][1] + dy]);
  return out;
}

/** The same figure facing the other way. */
export const mirror = (f: Figure): Figure =>
  Object.fromEntries(JOINTS.map((j) => [j, [r(48 - f[j][0]), f[j][1]]])) as Figure;

export const nudge = (f: Figure, id: JointId, dx: number, dy: number): Figure =>
  moveJoint(f, f, id, [f[id][0] + dx, f[id][1] + dy]);

// Ways to start: a few shapes to pose from, facing left as the drawings do, the far
// limbs a little behind the near ones so both show.
const standing: Figure = {
  head: [24, 8.5],
  neck: [24, 13.5],
  hip: [24, 27],
  elbowA: [23, 20.5],
  handA: [22, 27.5],
  elbowB: [25.5, 20.5],
  handB: [26.5, 27.5],
  kneeA: [22.5, 36],
  footA: [21.5, 45],
  kneeB: [26, 36],
  footB: [27.5, 45],
};

const seated: Figure = {
  head: [22, 19.5],
  neck: [22.5, 24.5],
  hip: [24, 37],
  elbowA: [19.5, 31],
  handA: [16.5, 37.5],
  elbowB: [26, 31],
  handB: [31, 37.5],
  kneeA: [13, 38],
  footA: [25, 44],
  kneeB: [35, 38],
  footB: [23, 44],
};

const downDog: Figure = {
  head: [16, 32],
  neck: [19.5, 27],
  hip: [27, 15],
  elbowA: [13.5, 34.5],
  handA: [8, 44],
  elbowB: [16, 36],
  handB: [11, 44.5],
  kneeA: [31.5, 29.5],
  footA: [36, 45],
  kneeB: [34, 31],
  footB: [39.5, 45],
};

const lying: Figure = {
  head: [7.5, 41.5],
  neck: [12.5, 42],
  hip: [27, 42],
  elbowA: [18, 43],
  handA: [24, 43],
  elbowB: [18, 40.5],
  handB: [24, 40.5],
  kneeA: [33.5, 36],
  footA: [39.5, 44.5],
  kneeB: [36, 37],
  footB: [42, 44.5],
};

export const PRESETS: { id: string; name: string; figure: Figure }[] = [
  { id: 'standing', name: 'Standing', figure: standing },
  { id: 'seated', name: 'Seated', figure: seated },
  { id: 'down-dog', name: 'Down dog', figure: downDog },
  { id: 'lying', name: 'Lying', figure: lying },
];

const pt = ([x, y]: Point) => `${x} ${y}`;

/** The body as one path, the way the poses are stored: spine, then each arm and leg. */
export function figurePath(f: Figure, neck: boolean): string {
  const limb = (...ids: JointId[]) => 'M' + ids.map((id) => pt(f[id])).join('L');
  const parts = [limb('neck', 'hip'), limb('neck', 'elbowA', 'handA'), limb('neck', 'elbowB', 'handB'), limb('hip', 'kneeA', 'footA'), limb('hip', 'kneeB', 'footB')];
  if (neck) parts.push(limb('neck', 'head'));
  return parts.join('');
}

/** The figure as the pose drawings are written in poseArt.ts, to add one to the app. */
export function figureArt(f: Figure, neck: boolean): string {
  return `{ head: [${pt(f.head).replace(' ', ', ')}], d: '${figurePath(f, false)}'${neck ? ', neck: true' : ''} }`;
}

/** A standalone SVG file of the figure, in the same form as the poses page's downloads. */
export function figureSvg(f: Figure, neck: boolean, color: string): string {
  return [
    `<!-- A figure posed with Flow Sequencer (https://yoga.grahamhagenah.com/figure/). ${DRAWINGS_NOTICE} -->`,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="480" height="480" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">`,
    `  <path d="${FLOOR_PATH}" stroke-width="1.4" opacity="0.35"/>`,
    `  <path d="${figurePath(f, neck)}"/>`,
    `  <circle cx="${f.head[0]}" cy="${f.head[1]}" r="${HEAD_RADIUS}" fill="${color}" stroke="none"/>`,
    `</svg>`,
    '',
  ].join('\n');
}
