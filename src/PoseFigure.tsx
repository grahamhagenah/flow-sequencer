import { getPose } from './data/graph';
import { neckPath, POSE_ART } from './data/poseArt';
import type { Side } from './data/types';
import { FLOOR_PATH, leftSideTransform, MAT_RECT, WALL_PATH } from './poseSvg';

/**
 * A pose's line drawing (see poseArt.ts). One-sided poses are drawn on the right
 * and mirrored for the left, so the two sides look different in a list. Small ones
 * (the rows and choices) get a slightly heavier line, so they keep their weight shrunk;
 * large ones (the single-pose view) a lighter one, so they don't turn heavy.
 */
export function PoseFigure({ poseId, side, size = 40 }: { poseId: string; side?: Side; size?: number }) {
  const art = POSE_ART[poseId];
  if (!art) return null;
  const mirrored = side === 'left' && getPose(poseId).sided;
  return (
    <svg
      className="pose-figure"
      viewBox="0 0 48 48"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={size <= 40 ? 2.8 : size >= 100 ? 1.5 : 2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* The mat: its edge in a side view, the whole of it from above. */}
      {art.topView ? (
        <rect {...MAT_RECT} strokeWidth={1.4} opacity={0.35} />
      ) : (
        <path d={FLOOR_PATH} strokeWidth={1.4} opacity={0.35} />
      )}
      {art.wall && <path d={WALL_PATH} strokeWidth={1.4} opacity={0.35} />}
      <g transform={mirrored ? leftSideTransform(art) : undefined}>
        <path d={art.d + neckPath(art)} />
        <circle cx={art.head[0]} cy={art.head[1]} r={3.3} fill="currentColor" stroke="none" />
      </g>
    </svg>
  );
}
