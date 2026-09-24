export type Base = 'supine' | 'prone' | 'seated' | 'kneeling' | 'hands' | 'standing';

export type Side = 'right' | 'left';

export interface Pose {
  id: string;
  name: string;
  sanskrit?: string;
  base: Base;
  /** Done on one side at a time. What "side" means is noted per pose in poses.ts. */
  sided: boolean;
  /** Default hold, in breaths. */
  breaths: number;
  cue: string;
}

/**
 * How a transition changes the flow's current side.
 * 'keep' carries it through; 'flip' switches to the other side.
 */
export type SideEffect = 'keep' | 'flip';

export interface Transition {
  /** Permanent code, stored in share links. See transitions.ts. */
  id: number;
  from: string;
  to: string;
  /**
   * Shown on the tile. {side}/{other} fill in as "right"/"left" from the side
   * *after* the transition; {Side}/{Other} capitalise.
   */
  label: string;
  side: SideEffect;
}
