/**
 * A ring that fills as the current pose's breaths go by (`fraction`, 0 to 1): in the
 * player, and around the pose's drawing in the single-pose view during a class.
 */
export function PoseRing({ fraction, size = 36, className }: { fraction: number; size?: number; className?: string }) {
  const r = 15;
  const around = 2 * Math.PI * r;
  return (
    <svg
      className={className ? `pose-ring ${className}` : 'pose-ring'}
      viewBox="0 0 36 36"
      width={size}
      height={size}
      aria-hidden="true"
    >
      <circle className="pose-ring-track" cx="18" cy="18" r={r} />
      <circle
        className="pose-ring-fill"
        cx="18"
        cy="18"
        r={r}
        strokeDasharray={around}
        strokeDashoffset={around * (1 - fraction)}
        transform="rotate(-90 18 18)"
        // Its round end would show as a dot on an empty ring.
        opacity={fraction > 0 ? 1 : 0}
      />
    </svg>
  );
}
