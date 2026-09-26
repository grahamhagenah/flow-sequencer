// Simple line drawings of each pose, drawn for this app (no outside artwork, so no
// licence to follow). Each is a round head plus one path of strokes on a 48×48
// grid, standing on a faint floor line at y 45 (or, seen from above, on a faint mat).
// Side views face left; PoseFigure mirrors the one-sided poses for the left side.
// poseArt.test.ts checks every pose has one.

export interface PoseArt {
  /** Centre of the head. */
  head: [number, number];
  /** The body, limbs and all, as stroked lines. */
  d: string;
  /** Seen from above (a lying twist): drawn on the whole mat rather than its edge. */
  topView?: boolean;
}

export const POSE_ART: Record<string, PoseArt> = {
  // Lying on the back
  // Seen from above, on the mat: straight arms resting a little out from the sides, legs a little apart.
  savasana: { head: [8, 24], d: 'M12 24h16M28 24l14-3M28 24l14 3M14.5 24 26 19M14.5 24 26 29', topView: true },
  'knees-to-chest': { head: [8, 39.5], d: 'M12 40.5h12M24 40.5 17 30h10M14 40l4-9' },
  // Seen from above: arms wide in a T past the mat's edges, both knees dropped to one side.
  'supine-twist': { head: [8, 24], d: 'M12 24h17M15.5 11v26M29 24l3 11h9', topView: true },
  'happy-baby': { head: [8, 39.5], d: 'M12 40.5h12M24 40.5 17 31V19M14 40l3-20' },
  bridge: { head: [9, 40.5], d: 'M13 42l13-10 8-2 3 13M14 43.5h12' },
  wheel: { head: [15, 35.5], d: 'M11 32Q16 18 24 17t10 9l4 17M11 32 8 43' },

  // Seated
  'easy-seat': { head: [24, 12], d: 'M24 17v18M24 35l-12 5 16 3M24 35l12 5-16 3M24 20l-9 16M24 20l9 16' },
  staff: { head: [30, 19], d: 'M30 24v19M30 43H8M30 27l-1 16' },
  'seated-forward-fold': { head: [11.5, 35.5], d: 'M32 43H8M32 43l-17-8M17 36l-9 6' },
  boat: { head: [12.5, 18], d: 'M24 41 14.5 23M24 41l15-16M16 26h14' },
  'bound-angle': { head: [24, 15], d: 'M24 20v18M24 38H10l12 5M24 38h14l-12 5M24 23l-2 17M24 23l2 17' },
  'head-to-knee': { head: [12, 34], d: 'M32 43H8M32 43l-16-9M18 35l-9 7M31 43l-6-4.5-4 4.5' },
  'seated-twist': { head: [26, 12], d: 'M24 17v18M24 35l-12 5 16 3M24 35l12 5-16 3M24 21l11 15M24 21l-11 14' },
  pigeon: { head: [24, 17], d: 'M26 22v18M26 40l18 3M26 40l-12 3M25 26l-5 16' },

  // Kneeling and on hands and knees
  table: { head: [8, 25], d: 'M12 28h20M12 28v15M32 28v15h12' },
  // Cat and Cow: the spine one curve from the hips on into the neck, rounded up with the
  // head tucked under, or dipped with the head lifted; the arms meet it at the shoulders.
  cat: { head: [7.8, 34.3], d: 'M32 29C31 17 13 16 10 30.5M13 24v19M32 29v14h12' },
  cow: { head: [8.5, 19.5], d: 'M32 27.5C26 36 15 34 10.5 23M12.5 26.8 12 43M32 27.5v15.5h12' },
  // Hips back on the heels, the back rounded over the thighs, arms long on the floor, forehead down.
  child: { head: [11.5, 38.8], d: 'M24 43h16M24 43l14-6.5M38 36.5C37 28.5 26 25.5 18 35.5M18 35.5l-3 7.7H4' },
  thunderbolt: { head: [30, 15], d: 'M30 20v18M30 38l-16 4h18M30 23l-8 14' },
  camel: { head: [26.5, 15.5], d: 'M16 43V27M16 43h16M16 27q-2-10 6-13M21 15l10 27' },
  'thread-needle': { head: [11, 40.5], d: 'M32 28 15 38M32 28v15h12M19 36l1 7M15 39l15 4' },
  'low-lunge': { head: [24, 12], d: 'M24 17v15M24 32H14l-2 11M24 32l10 11h10M24 18 17 6' },
  'half-split': { head: [11, 31.5], d: 'M28 30H15M28 30v13h14M28 30 8 43M17 31l1 12' },

  // On hands and feet
  'down-dog': { head: [17.5, 31.5], d: 'M7 43 27 12l15 31' },
  'three-leg-dog': { head: [17.5, 31.5], d: 'M7 43 27 12l15 31M27 12l15-8' },
  plank: { head: [8, 24], d: 'M12 26l32 16M13 27v16' },
  // Hovering low and straight, the upper arm back along the ribs and the elbow over the wrist.
  chaturanga: { head: [7, 32.5], d: 'M11 33.2 44 40M13.5 33.6 20 37.5 19.5 43' },
  // One line: feet, the thighs just off the floor, the back curving up to the shoulders, a straight arm down.
  'up-dog': { head: [13.5, 22.5], d: 'M44 43 28 41Q20 39 16 27.5v15.5' },
  'side-plank': { head: [12, 22.5], d: 'M42 42 16 25M16 25v18M16 25V5' },
  crow: { head: [11.5, 33], d: 'M16 43V31M16 31l14-7M30 24l-10 7 9 3' },

  // Lying face down
  // Seen from above, on the mat like Corpse Pose: the elbows out wide, the hands stacked
  // under the forehead, so the arms frame the head.
  belly: { head: [11, 24], d: 'M15 24h14M29 24l13-2.5M29 24l13 2.5M16.5 24 12 16.5 5 24M16.5 24 12 31.5 5 24', topView: true },
  cobra: { head: [15, 25.5], d: 'M44 43l-15-.5Q22 42 17 31M18 33l2 9.5' },
  sphinx: { head: [16, 28], d: 'M44 43l-16-.5Q22 42 18 33M19 35v8H9' },
  locust: { head: [8, 33.5], d: 'M26 42l18-6M26 42 12 36M14 37h16' },
  bow: { head: [11, 28.5], d: 'M26 42Q18 42 14 33M26 42h10l-4-14M15 34l17-6' },

  // Standing
  mountain: { head: [24, 7], d: 'M24 12v15M24 27l-2.5 16M24 27l2.5 16M24 14l-4 13M24 14l4 13' },
  'upward-salute': { head: [24, 9], d: 'M24 14v14M24 28l-2.5 15M24 28l2.5 15M24 15 18 4M24 15l6-11' },
  // Hips high over the feet, the back folded over, head hanging, hands down to the floor.
  'forward-fold': { head: [19, 35.5], d: 'M30 19.5 28 43M30 19.5C22 17 17 22 19.5 30M21.5 30 26 43' },
  'halfway-lift': { head: [10, 25.5], d: 'M30 24v19M30 24l-16 1M16 25l6 11' },
  chair: { head: [21, 9.5], d: 'M20 43l-4-11 12-2M28 30l-6-16M23 16 14 5' },
  'twisted-chair': { head: [21, 10.5], d: 'M20 43l-4-11 12-2M28 30l-6-15M14 10l16 12' },
  garland: { head: [24, 15], d: 'M24 36 10 31l5 12M24 36l14-5-5 12M24 36V20M24 24l-7 6M24 24l7 6' },
  'wide-leg-fold': { head: [24, 39], d: 'M24 26 10 43M24 26l14 17M24 26v9M24 30l-6 12M24 30l6 12' },
  'high-lunge': { head: [20, 11], d: 'M24 30l-3-14M24 30H14l-2 13M24 30l18 13M21.5 17 14 6' },
  'warrior-1': { head: [24, 10], d: 'M24 15v15M24 30H14l-2 13M24 30l16 13h4M24 16l-4-12M24 16l4-12' },
  'warrior-2': { head: [24, 7], d: 'M24 12v15M6 15.5h36M24 27l-11 4-2 12M24 27l15 16' },
  'reverse-warrior': { head: [29.5, 8.5], d: 'M24 27l4-14M24 27l-11 4-2 12M24 27l15 16M27.5 15 30 3M27 16l7 14' },
  'extended-side-angle': { head: [9, 17.5], d: 'M26 30 14 31l-2 12M26 30l15 13M26 30 12 20M15 20 6 8M14 22v9' },
  triangle: { head: [7.5, 22.5], d: 'M24 29 10 43M24 29l14 14M24 29l-13-5M13 10v28' },
  'half-moon': { head: [4.5, 25], d: 'M20 43V28M20 28l22-1M20 28 8 26M10 13v27' },
  'warrior-3': { head: [6, 28], d: 'M26 43V28M26 28H10M26 28h17M12 28.5l6 5' },
  pyramid: { head: [12, 37.5], d: 'M24 28 12 43M24 28l14 15M24 28q-8 1-11 6M20 29l8-3' },
  // The body starts at the shoulders, where the raised arms meet it (no neck above them).
  tree: { head: [24, 10], d: 'M24 16 16 11.5l7-9M24 16l8-4.5-7-9M24 16v12M24 28v15M24 28l9 3-8 4' },

  // Added later
  fish: { head: [10, 40.5], d: 'M44 43H28q-7-14-15-6M20 34l2 9' },
  'shoulder-stand': { head: [8, 40.5], d: 'M14 41l1-17 1-19M14 42.5h8l-5-12' },
  plow: { head: [34, 40.5], d: 'M29 41l-2-19 17 20M28 42.5H14' },
  lotus: { head: [24, 12], d: 'M24 17v19M24 36l-14 6 16-4M24 36l14 6-16-4M24 20l-11 18M24 20l11 18' },
  'half-lord-fishes': { head: [26.5, 12], d: 'M24 17v19M24 38l-12 4h18M24 38l8-10-2 15M24 22l7 8M24 22l-9 14 1 7' },
  // From the front: one elbow up by the head and one down by the waist, the forearms bending
  // back to meet at the spine; the knees stacked, the shins folded in a Z.
  'cow-face': { head: [24, 11.5], d: 'M24 17v19M20.5 19.5h7M27.5 19.5 29.5 6 25 19.5M20.5 19.5 18 31l5.5-9M24 36H13l22 4.5H14' },
  hero: { head: [24, 13], d: 'M24 18v18M24 38l-9 5H8M24 38l9 5h7M24 22l-5 14M24 22l5 14' },
  lizard: { head: [8, 36.5], d: 'M27 34l-11-1-3 10M27 34l7 9h10M27 34l-15 2M14 37v5H5' },
  'runners-lunge': { head: [10, 25], d: 'M28 30H17l-3 13M28 30l16 12M28 30l-14-3M14 28l-2 15' },
  dolphin: { head: [19, 38], d: 'M5 43h8l3-10 12-21 14 31' },
  headstand: { head: [24, 39.5], d: 'M14 43l10-8 10 8M24 35V4' },
  handstand: { head: [24, 33], d: 'M19 43l5-15 5 15M24 28V4' },
  dancer: { head: [11.5, 13], d: 'M22 43V28M22 28l-8-11M15 18 5 10M22 28l10 3 5-14M16 19l20-2' },
  // Sitting low as in Chair: the elbow lifted to shoulder height, forearm up in front of the
  // face; the top leg wraps over the thigh, its foot hooked behind the standing calf.
  eagle: { head: [22, 10.8], d: 'M21 43l-6.5-11 12.5-1M27 31l-12.5-2.5 7 9.5M27 31l-4-15M23 16.5H14l.5-9' },
  'bird-of-paradise': { head: [22, 8], d: 'M22 13v15M22 28l1 15M22 28 6 10M22 17l-7 3' },
  'revolved-triangle': { head: [8, 30.5], d: 'M24 29 10 43M24 29l14 14M24 29l-12 1M13 13v29' },
};
