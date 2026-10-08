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
  /** True to draw a neck into the head. None by default: the head sits free of the body. */
  neck?: boolean;
}

export const POSE_ART: Record<string, PoseArt> = {
  // Lying on the back
  // Seen from above, on the mat: straight arms resting a little out from the sides, legs a little apart.
  savasana: { head: [9, 24], d: 'M13.9 24H24.85M25.4 29.5L13.9 24L25.4 18.5M24.85 24L41.4 20M24.85 24L41.4 28', topView: true },
  'knees-to-chest': { head: [7.1, 40.5], d: 'M16.1 31.2L24.75 41.7H12.6L16.1 31.2ZM16.1 31.2H29.45' },
  // Seen from above: arms wide in a T past the mat's edges, both knees dropped to one side.
  'supine-twist': { head: [11.5, 22.1], d: 'M16.6 14.3V33.7M16.6 24.05H29.55L27.7 33.7H38.95', topView: true },
  // Graham's drawing: lying on the back, the knees drawn in with the shins straight up and the
  // soles to the sky, the arm reaching up to hold the foot; the head free, no neck.
  'happy-baby': { head: [11.5, 40.3], d: 'M24 25.2V35.35L32.35 42.85H16.7L21.55 25.2' },
  // Graham's drawing: the shins straight up from the feet to the knees, one long line down
  // from the knees through the lifted hips to the shoulders, the arms flat along the floor
  // toward the heels; the head free, no neck.
  bridge: { head: [9, 40.3], d: 'M37 42.8V29.3L14 42.8H26' },
  // One smooth, round arch from the hands over to the feet, the head hanging inside it.
  wheel: { head: [15.5, 36], d: 'M8.5 43C8 12 39 12 38.5 43' },

  // Seated
  // Graham's drawing, from the front, made exactly symmetric (its two halves sat a hair
  // apart): sitting tall, the shins crossed, the arms straight down to the knees.
  'easy-seat': { head: [24, 16.6], d: 'M19.3 42.66L34.45 38.6L24 35.7L13.55 38.6L28.7 42.66M24 35.7V21.7M14.2 35.65L24 21.7L33.8 35.65' },
  // Graham's drawing, already facing left: sitting tall, the legs long in front; the arms
  // left out, since beside the body they would only double its line.
  staff: { head: [29.1, 20.7], d: 'M7.8 42.9H30.02V25.7L32.89 34.52L33.4 42.9' },
  // Graham's drawing, already facing left: the legs long on the floor, the back folded
  // forward over them from the hips, the arms reaching on toward the feet; the head above.
  'seated-forward-fold': { head: [15.1, 33.6], d: 'M8 42.9H33.4L19.95 36.9L8 42.9Z' },
  // Graham's drawing, already facing left: balanced on the sit bones in a V, the legs
  // straight up and out, the back leaning away, the arms level forward alongside the legs.
  boat: { head: [13.9, 22.6], d: 'M39 26.9L24 42.9L16 27.9H32.7' },
  // Graham's drawing, from the front: sitting tall, the knees wide and low, the soles
  // together in front; the arms bent at the elbows, hands down by the feet.
  'bound-angle': { head: [24, 15.8], d: 'M22 42.8L11 39.38L24 38.8L37 39.38L26 42.8M24 38.8V20.8M19.5 38.8L17.1 30.55L24 20.8L30.9 30.55L28.5 38.8' },
  'head-to-knee': { head: [15.1, 33.6], d: 'M8 42.9H33.4L19.95 36.9L8 42.9ZM19.95 42.9L25.3 39.29' },
  // Graham's drawing, from the front: sitting cross-legged, the spine curving as it turns,
  // the head turned over the shoulder, one arm bent back behind toward the floor.
  'seated-twist': { head: [29.5, 17.1], d: 'M26.75 21.25C26.75 21.25 24.44 24.06 23.7 27.45C23 30.66 23.4 35.9 23.4 35.9L14.2 38.6L29.6 42.73M26.75 21.25L28.55 29L33.4 36.2M23.4 35.9L33.8 38.6L18.65 42.66' },
  // Graham's drawing, from the side, already facing left: the back leg long on the floor up to
  // hips sunk low, the front shin folded under them, the chest low over it and the arm
  // reaching down to the hand ahead; the head free above.
  pigeon: { head: [11.8, 34.3], d: 'M43.4 42.9H34.7L26.95 41.1L16.85 37.4L5.7 42.9M26.95 41.1L14.35 43.3L21.3 46.7' },

  // Kneeling and on hands and knees
  // Graham's drawings, a set on one frame: the arm slanting up to the shoulder, the back to the hips,
  // the thigh straight down and the shin flat behind. Tabletop's back is level with the head
  // ahead; Cat rounds it up with the head dropped; Cow dips it with the head lifted. The
  // shoulders, hips and legs stay put, so stepping between them only moves the back and head.
  table: { head: [9.3, 23.6], d: 'M10.45 42.9L12.5 27.95L32 28.65V42.9H42.5' },
  cat: { head: [6.9, 27.32], d: 'M42.5 42.94H32V32.09C32 21.69 13.15 22.49 11.9 31.09L10.15 42.94' },
  cow: { head: [11.4, 24.42], d: 'M10.3 42.89L12.5 29.94C17.5 33.16 23.65 33.99 32 30.51V42.94H42.5' },
  // Graham's drawing: shins flat, hips back over the heels, the back one low curve down to the
  // floor, the arms long along it, the head resting; no neck.
  child: { head: [10.35, 37.9], d: 'M34.25 42.85H25.5L29.4 35.8C17.4 32.8 16.4 38.4 13.55 43.05H4.5' },
  thunderbolt: { head: [30, 15], d: 'M30 20v18M30 38l-16 4h18M30 23l-8 14' },
  // Graham's drawing, exactly: kneeling tall, the body arching up and back over the heels,
  // the arm straight down toward them, the head back beyond the shoulder; no neck.
  camel: { head: [32.5, 21.5], d: 'M30.4 42.9H16V33.37C16 20.41 22.47 21.61 27.34 21.1V37.4' },
  // Graham's drawing, mirrored to face left: the shin flat and the thigh straight up, the body
  // sloping down to the shoulder on the floor, one arm threaded along the floor beneath, the
  // other reaching down past it; the head resting.
  'thread-needle': { head: [10.2, 40.5], d: 'M43.3 42.9H31.3V33L15 42.9H28.45M21.75 38.8L24.9 46.45' },
  // Graham's drawing, mirrored to face left: the back shin on the floor and the thigh
  // straight up, the front thigh level over the shin; the body and arms one line leaning
  // forward and up, the head tucked just behind it so nothing crosses it.
  'low-lunge': { head: [22.3, 17.1], d: 'M21.5 36.85L29.05 42.9H39.5M10.4 42.9L11.15 34.4L17.7 31.1L21.5 22.15V36.85M21.5 36.85L11.15 34.4' },
  // Graham's drawing, mirrored to face left: the back knee down with the shin flat, the thigh
  // straight up; the body level forward over the front leg, hands straight down to the floor,
  // the front leg long; the head free, no neck.
  'half-split': { head: [13.9, 19.6], d: 'M17.6 42.9V23.35L29.05 32.5V42.9H39.5M29.05 32.5L8 42.9' },

  // On hands and feet
  // Graham's drawing: hands and feet planted, hips high, one clean inverted V; the head hangs
  // free between the arms, no neck.
  'down-dog': { head: [16.1, 40.4], d: 'M7 42.9C11.05 37.8 25.1 21.2 25.1 21.2L42 42.9' },
  // Graham's drawing: Down Dog with the top leg lifted high from the hips, reaching up past them.
  'three-leg-dog': { head: [16.1, 40.4], d: 'M7 42.9C11.05 37.8 25.1 21.2 25.1 21.2M25.1 21.2L42 42.9M25.1 21.2L33.85 10.45' },
  // Graham's drawing: one straight line from the heels to the shoulders, the arm straight
  // down under them; the head free, no neck.
  plank: { head: [8, 24], d: 'M42.05 42.7L11.9 26.7V42.7' },
  // Graham's drawing: Plank's line lowered to hover just off the floor, the arm bent with the
  // elbow back and the hand under the shoulder; the head free, no neck.
  chaturanga: { head: [7.8, 32.2], d: 'M42.05 42.7L11.9 34.85L16.3 39.4L11.9 42.7' },
  // One line: feet, the thighs just off the floor, the back curving up to the shoulders, a straight arm down.
  'up-dog': { head: [13.5, 22.5], d: 'M44 43 28 41Q20 39 16 27.5v15.5' },
  // Graham's drawing: one long line from the stacked feet to the shoulder, the arms one line
  // through it, the lower hand on the floor and the top one reaching up; the head free.
  // Graham's drawing, already facing left: side plank's long line from the stacked feet to
  // the hand on the floor, the top arm reaching up, and the other leg threaded under and
  // through from the hip; the head free past the shoulders.
  'fallen-triangle': { head: [11.8, 29], d: 'M42 42L16.9 28.8M16.9 28.8L16 43M16.9 28.8L13.4 15.05M31.75 46.9L26.5 33.95' },
  // Graham's drawing, already facing left: one long line from the stacked feet to the hand
  // on the floor, the top arm reaching up; Fallen Triangle is this with a leg threaded under.
  'side-plank': { head: [11.8, 29], d: 'M42 42L16.9 28.8M16.9 28.8L16 43M16.9 28.8L13.4 15.05' },
  // Graham's drawing: balanced on the hands, the arms angled forward, the body tipped over them
  // with the hips high, the knees tucked onto the upper arms and the feet lifted; the head free.
  crow: { head: [11.6, 33.4], d: 'M20.8 42.7L16 31L30.1 24.3L21 32.65L30.1 35' },

  // Lying face down
  // Seen from above, on the mat like Corpse Pose: the elbows out wide, the hands stacked
  // under the forehead, so the arms frame the head.
  belly: { head: [11, 24], d: 'M16.5 24H29M29 24l13-2.5M29 24l13 2.5M16.5 24 12 16.5 5 24M16.5 24 12 31.5 5 24', topView: true },
  // Graham's drawing, already facing left: legs long on the floor, the back curving up to
  // the shoulders, the elbow bent back and the hand planted forward under the head.
  cobra: { head: [12.1, 27.25], d: 'M39.05 42.9H25.9C16.85 42.9 16.67 37.7 14 31.7L15.84 36.3L9.85 42.9' },
  // Graham's drawing, already facing left: legs long on the floor, the back curving up to
  // the shoulders, the upper arm straight down and the forearm flat forward on the floor.
  sphinx: { head: [15.3, 28.1], d: 'M41.85 42.9H26.45C21.3 42.55 19.27 38.9 16.6 32.9V42.9H7.6' },
  // Graham's drawing, already facing left: resting on the belly, the legs and chest
  // lifted in a shallow V, the arms reaching straight back along the sides.
  locust: { head: [6.5, 35.1], d: 'M39.4 37.6L21.7 42.75L11.2 37.1H26.9' },
  // Graham's drawing, already facing left: rocking on the belly, the body curving up from it
  // to the lifted chest, the knees bent and the feet high behind, the hand holding the ankle,
  // so the outline closes into a drawn bow.
  bow: { head: [14, 23.7], d: 'M15.4 28.85C15.88 36.68 19.35 44 31.65 42.45L35.5 33.5L30.8 25.3L15.4 28.85Z' },

  // Standing
  // Graham's drawing, from the front: legs a little apart, the spine tall, the arms angled
  // slightly out by the sides; the head free.
  mountain: { head: [24, 9.3], d: 'M28.29 43 24 27V14L29.65 27M19.76 43 24 27M24 14 18.4 27' },
  // Graham's drawing, from the front: legs a little apart, the spine tall, the arms one wide V
  // from the shoulders up past the head, which sits free between them; no neck.
  'upward-salute': { head: [24, 6.2], d: 'M28.29 43 24 27V15.75L31.35 2.95M19.76 42.95 24 27M24 15.75 16.7 2.9' },
  // Graham's drawing, already facing left: straight legs, the back curving over from the
  // hips, the arms hanging down to the floor beside the feet, the head free and low.
  'forward-fold': { head: [16.9, 37.5], d: 'M28 42.8L28 19.65C20 19.65 19.6 25.35 19.6 33.05L25.75 42.8' },
  // Graham's drawing: legs straight, the back flat and level from the hips, the arms reaching
  // down and back to the shins; the head free.
  'halfway-lift': { head: [10, 25.5], d: 'M30 43V24H15.35L24.35 35.7' },
  // Graham's drawing: knees forward over the toes, hips back; the body and arms one long line
  // from the hips to the hands, the head free behind it, no neck.
  chair: { head: [25.3, 14.2], d: 'M23 43 16 33l12-2.5L25.95 26.25 16.35 7.25' },
  // Graham's drawing: Chair's legs; the arms one long line from the elbow hooked outside the
  // knee up through the heart to the other elbow, crossing the body; the head free, no neck.
  'twisted-chair': { head: [16.8, 19.05], d: 'M23 43L16 33L28 30.5C28 30.5 27.85 28.2 25.15 25.3C23.17 23.18 20.57 22.73 20.57 22.73M20.57 22.73L16.6 30.5M20.57 22.73L25.15 13.35' },
  // Graham's drawing, from the front: a deep squat, knees wide over the feet, the spine tall,
  // palms together at the heart with the elbows pressing out; the head free, no neck.
  garland: { head: [23.5, 19.4], d: 'M17.64 42.95 14.05 33.65 23.5 38.5V24.2L17.02 29.85 23.5 33.1M29.35 42.95 32.94 33.65 23.5 38.5M23.5 24.2 29.97 29.85 23.5 33.1' },
  // Graham's drawing, from the front: the legs a wide inverted V, the body folding straight
  // down between them, the head hanging free.
  'wide-leg-fold': { head: [24, 38.5], d: 'M37 43L24 24L11 43M24 24V33.55' },
  // Graham's drawing, mirrored to face left: the front knee bent over the foot, the back
  // knee lifted with the heel up; the body and arms one line leaning forward and up, the
  // head tucked just behind it, as in Low Lunge.
  'high-lunge': { head: [17.8, 16], d: 'M22.35 31.7L28.35 40.05L39.5 42.9M22.35 31.7L12.55 34.4L9.65 42.9M22.35 31.7C22.35 31.7 20.56 24.62 21.9 19.35C23.35 13.65 26.25 8.8 26.25 8.8' },
  // Graham's drawing, mirrored to face left: the front knee bent over the foot, the back leg
  // long and straight to the heel; the body and arms one line straight up, the head just in
  // front of it. The hands stop at 1.2, as in High Lunge (drawn to -1.6, off the grid).
  'warrior-1': { head: [17.4, 10.8], d: 'M22.25 1.2V25.45M22.25 25.45L11.7 31.85L8.4 42.7M22.25 25.45L40.4 42.7' },
  // Graham's drawing, already facing left: Warrior I's legs, the body bowed down along the
  // inside of the front thigh, the clasped arms one line lifting away from the back, the
  // head hanging low by the front foot.
  'humble-warrior': { head: [8.7, 36.5], d: 'M41.35 42.6L24.1 31.35L18.85 32.88L14 34.3L18.2 23.95M18.85 32.88L14.85 42.65' },
  // Graham's drawing, front on with the bent knee to the left, as the app's side views face:
  // the arms one level line at the shoulders, the head just clear above it.
  'warrior-2': { head: [24, 10.2], d: 'M24 15.5V27M24 27L13 31L11 43M24 27L39 43M6 15.5H42' },
  // Graham's drawing, front on with the bent knee to the left: the torso tipped back over
  // the back leg, the front arm straight up, the back hand sliding down the back leg.
  'reverse-warrior': { head: [29.1, 13.2], d: 'M24.1 14.25L21.7 25M24.1 14.25V2.9M24.1 14.25L31.75 32M21.7 25L14.55 31.55L11 43M21.7 25L39 43' },
  // Graham's drawing, mirrored to face left: the back leg long, the front knee square over the
  // ankle, the lower arm resting down the thigh to the knee, the top arm reaching long
  // overhead; the head free of the shoulders, no neck.
  'extended-side-angle': { head: [11.2, 22.7], d: 'M27.4 30.8 43 43M27.4 30.8H15M27.4 30.8 16.85 21.1M16.85 21.1 15 30.8V43M16.85 21.1 7.95 11' },
  // Graham's drawing, mirrored to face left: both legs straight and wide, the side body long
  // over the front leg, the arms one vertical line from the floor to the sky; the head free, no neck.
  triangle: { head: [8.2, 23.5], d: 'M25.5 29 11.5 43M13.15 23.38 25.5 29 39.5 43M13.15 10.55V38.1' },
  // Graham's drawing, mirrored to face left: the standing leg straight up to the hip, the
  // lifted leg level behind, the body level forward to the shoulders; the arms one vertical
  // line through the shoulders, and the head free beyond them.
  'half-moon': { head: [6.5, 26.8], d: 'M23.75 42.4V26.4M23.75 26.4L39.85 25M23.75 26.4H11.6M11.6 26.4L10.15 13.15M11.6 26.4V40' },
  // Graham's drawing, mirrored to face left: one level line from the back heel to the
  // shoulders, stopping short of the head; the arm folded under the chest.
  'warrior-3': { head: [7.3, 28], d: 'M23.85 43V28M43 28H12.8L18.3 34.05H10.95' },
  // Graham's drawing, already facing left: legs in a wide inverted V, the
  // torso folded down along the front leg, the arm bent to the floor inside it.
  pyramid: { head: [9.7, 35.5], d: 'M25.85 25.5L12 43M16.3 43L20.75 37.5L13.9 33.05L25.85 25.5L38 43' },
  // Graham's drawing, from the front: the standing leg straight, the other foot tucked to the
  // inner thigh with the knee out; the arms raised, elbows wide, hands meeting over the head;
  // the head free, no neck.
  tree: { head: [24, 9.9], d: 'M25.84 1.85 33 9.01 24 16V43M24 26.75 33 32.05 24 37.45M22.11 1.8 14.95 8.96 24 16' },

  // Added later
  // Graham's drawing, already facing left: the legs long on the floor, the chest arching up
  // from them to the shoulders, the arm straight down and the forearm flat under the back;
  // the head back beyond the shoulders.
  fish: { head: [7.7, 36.1], d: 'M42.85 42.9H27.65C23.65 35.7 18.15 36.1 12.75 36.1V42.9H20.7' },
  // Graham's drawing: on the shoulders, the body and legs one straight line up; the upper
  // arms flat on the floor, the forearms up with the hands at the back; the head beside.
  'shoulder-stand': { head: [8.9, 39.1], d: 'M14 5.85V41.1H24.05L17.2 30.45' },
  // Graham's drawing, mirrored so the head is on the left as in Shoulder Stand, which it
  // comes from: the hips high over the shoulders, the legs reaching over to the toes on
  // the floor beyond the head, the arms long on the floor the other way.
  plow: { head: [15.7, 40.4], d: 'M5.05 42.5L21 24.3V42.5H34' },
  // Graham's drawing, from the front, made exactly symmetric (its halves sat a hair apart):
  // sitting tall, each foot up on the opposite thigh, the knees wide and low; the arms
  // straight down to the hands on the knees.
  lotus: { head: [24, 16.6], d: 'M14.35 35.5L24 21.55L33.65 35.5M24 21.55V35.55M24 35.55L30.7 42.85L16.4 38.75M24 35.55L17.3 42.85L31.6 38.75' },
  // Graham's drawing, from the side, mirrored to face left: one leg long on the floor, the
  // other knee tall with its foot planted across it; the body leaning back onto the hand
  // planted behind, the other elbow hooked just above the tall knee, forearm up; the head
  // turned back over the shoulder.
  'half-lord-fishes': { head: [33.2, 20], d: 'M8.7 42.35H29.45L31.85 24.9L39.2 42.35M29.45 42.35L22.8 31.8L15.2 42.35M31.85 24.9L22.85 29.65V22.55' },
  // Graham's drawing, from the front: the knees stacked close in the middle, the shins
  // fanning out low to the feet either side; one elbow high by the head, its hand reaching
  // behind it (stopping short of it), the other elbow down by the waist, its hand behind the
  // back. Its halves joined at one shoulder and one hip point.
  'cow-face': { head: [25.3, 16.6], d: 'M23.95 21.5L31 29.55L26.45 28.45M23.95 21.5L15.8 15.95H20.7M23.95 21.5V35.5L19.45 38.4L28.65 42.46M23.95 35.5L28.4 38.45L19.2 42.51' },
  // From the side, from Graham's front-on drawing: the shins flat on the floor, the thighs
  // folded over them, the back tall and the hand resting on the knee.
  hero: { head: [28, 17], d: 'M31 43H12L28 38.5V22.5M28 22.5 17 39.3' },
  // Graham's drawing, from the side, mirrored to face left: hips low, the front knee high with
  // the foot planted, the forearm flat on the floor inside it, the back leg long behind; the head
  // free, low and forward.
  lizard: { head: [6.8, 32], d: 'M23.35 39.15L16.95 32.15L14.3 42.9M4.6 42.9H11V34.95L23.35 39.15L41.35 43' },
  // Graham's drawing, mirrored to face left: hips low, the front knee forward past the ankle,
  // the back leg long to the floor, the body leaning up to the shoulders and the hands
  // straight down beside the front foot; the head free, no neck.
  'runners-lunge': { head: [7.7, 22.7], d: 'M24.45 34.55L14.5 33.65L15 42.9M41.35 43L30.5 40.65L24.45 34.55C24.45 34.55 16.2 29.47 10.75 27V42.9' },
  // Graham's drawing: Down Dog's inverted V on the forearms, flat on the floor; the head hangs
  // free between the arms, no neck.
  dolphin: { head: [8.9, 37.4], d: 'M4.94 42.9H12.94L14.45 36.35 17.4 23.1 41.9 42.9' },
  // Graham's drawing, from the side: forearms flat on the floor, the upper arm rising to the
  // shoulders, the body one straight line up to the feet; the head resting just inside the
  // forearms, no neck.
  headstand: { head: [27, 38], d: 'M28.5 42.85H19.6L24 32.4V4' },
  // Upward Salute upside down (y -> 45.95 - y): the hands on the floor in its wide V, which frames
  // the head, the spine tall, the legs a little apart up to the feet.
  handstand: { head: [24, 39.75], d: 'M28.29 2.95 24 18.95V30.2L31.35 43.0M19.76 3.0 24 18.95M24 30.2 16.7 43.05' },
  // Graham's drawing, mirrored to face left like the other side views: the standing leg, the
  // back foot caught up at shoulder height, the free arm one long line reaching forward; the
  // head free of the shoulders, no neck.
  dancer: { head: [15.8, 13.1], d: 'M22 43V28M22 28 16 19M22 28l9.5 1.3 2.3-10.3H16M16 19 2.85 13.8' },
  // Graham's drawing, mirrored to face left: sitting low, the top leg wrapped over the
  // standing thigh with its foot hooked behind the calf; the upper arm level at shoulder
  // height, the wrapped forearms one line rising in front of the face; the head free, no neck.
  eagle: { head: [24.4, 10.8], d: 'M16.2 7.25L16.7 16H24.4V29.95L14.5 32L21 43M24.4 29.95L15.45 27.1L22.9 37' },
  // Graham's drawing, front on with the lifted leg to the left: standing tall on one leg,
  // the arm bound around the lifted thigh to close a triangle at the knee, the leg
  // straightening up and out from it; the head free above the shoulders.
  'bird-of-paradise': { head: [23, 5.1], d: 'M23 43V10.4L16.25 15.05L23 24.8M16.25 15.05L8.85 5.9' },
  // Graham's drawing, mirrored to face left: Triangle's legs, the body folded low and level
  // over the front leg, the arms one line tilted across it (the twist); the head free, no neck.
  'revolved-triangle': { head: [8.3, 27.9], d: 'M25.5 29 11.5 43M13.3 27.65 25.5 29 39.5 43M10.85 13.55 15.95 42.95' },
};

/** Every point a drawing's path reaches (each segment's end), in absolute coordinates. */
export function pathPoints(d: string): [number, number][] {
  const toks = d.match(/[a-zA-Z]|-?\d*\.?\d+/g) ?? [];
  const pts: [number, number][] = [];
  let i = 0;
  let cmd = '';
  let x = 0;
  let y = 0;
  const num = () => parseFloat(toks[i++]);
  while (i < toks.length) {
    if (/[a-zA-Z]/.test(toks[i])) cmd = toks[i++];
    const rel = cmd === cmd.toLowerCase();
    const at = (a: number, b: number) => {
      x = rel ? x + a : a;
      y = rel ? y + b : b;
    };
    switch (cmd.toUpperCase()) {
      case 'M':
        at(num(), num());
        cmd = rel ? 'l' : 'L'; // further pairs after a move are lines
        break;
      case 'L':
      case 'T':
        at(num(), num());
        break;
      case 'H':
        x = rel ? x + num() : num();
        break;
      case 'V':
        y = rel ? y + num() : num();
        break;
      case 'Q':
      case 'S':
        num();
        num();
        at(num(), num());
        break;
      case 'C':
        num();
        num();
        num();
        num();
        at(num(), num());
        break;
      case 'Z':
        continue; // closes the shape: no new point
      default:
        return pts; // anything else isn't used by the drawings
    }
    pts.push([x, y]);
  }
  return pts;
}

/**
 * A neck, for a drawing that asks for one (`neck: true`): from the line end nearest the head
 * right into it. The head is drawn over it. None by default, and none where no line ends
 * near the head.
 */
export function neckPath(art: PoseArt): string {
  if (!art.neck) return '';
  const [hx, hy] = art.head;
  let best: [number, number] | null = null;
  let bestDist = 7;
  for (const [px, py] of pathPoints(art.d)) {
    const dist = Math.hypot(px - hx, py - hy);
    if (dist < bestDist) {
      best = [px, py];
      bestDist = dist;
    }
  }
  return best ? `M${best[0]} ${best[1]}L${hx} ${hy}` : '';
}
