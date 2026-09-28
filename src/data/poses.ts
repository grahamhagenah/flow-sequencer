import type { Base, Pose } from './types';

// For sided poses, "side" is:
//   lunges, warriors, triangle, pyramid, side angle   – the front foot
//   half moon, warrior III, tree                       – the standing foot
//   three-legged dog                                   – the lifted leg
//   pigeon                                             – the front (bent) knee
//   half split, head to knee                           – the straight front leg
//   side plank                                         – the supporting hand
//   twists, thread the needle                          – the direction of the twist / threaded arm
//   runner's lunge, lizard, revolved triangle           – the front foot
//   dancer, eagle                                      – the standing foot
//   bird of paradise                                   – the lifted (bound) leg
//   cow face                                           – the top knee
//   fallen triangle                                    – the leg threaded under

/** How the "Get to" list (and the poses page) group poses: by where the body is, standing down to lying. */
export const BASES: [Base, string][] = [
  ['standing', 'Standing'],
  ['hands', 'On hands and feet'],
  ['kneeling', 'Kneeling'],
  ['seated', 'Seated'],
  ['prone', 'Lying face down'],
  ['supine', 'Lying on your back'],
];

export const POSES: Pose[] = [
  // Supine
  { id: 'savasana', name: 'Corpse Pose', sanskrit: 'Savasana', base: 'supine', sided: false, breaths: 10, cue: 'Lie flat, arms by your sides, let everything go.' },
  { id: 'knees-to-chest', name: 'Knees to Chest', sanskrit: 'Apanasana', base: 'supine', sided: false, breaths: 5, cue: 'Rock gently side to side, the low back soft on the mat.' },
  { id: 'supine-twist', name: 'Supine Twist', sanskrit: 'Supta Matsyendrasana', base: 'supine', sided: true, breaths: 6, cue: 'Knees fall to one side, gaze the other way, shoulders heavy.' },
  { id: 'happy-baby', name: 'Happy Baby', sanskrit: 'Ananda Balasana', base: 'supine', sided: false, breaths: 5, cue: 'Heels over the knees, knees toward the armpits, rock if it feels good.' },
  { id: 'bridge', name: 'Bridge', sanskrit: 'Setu Bandha Sarvangasana', base: 'supine', sided: false, breaths: 5, cue: 'Knees over the ankles, roll the shoulders under, chest toward the chin.' },
  { id: 'wheel', name: 'Wheel', sanskrit: 'Urdhva Dhanurasana', base: 'supine', sided: false, breaths: 3, cue: 'Straighten the arms, lift the chest toward the wall behind you.' },

  // Seated
  { id: 'easy-seat', name: 'Easy Seat', sanskrit: 'Sukhasana', base: 'seated', sided: false, breaths: 6, cue: 'Hands rest on the knees, shoulders soft, crown lifts.' },
  { id: 'staff', name: 'Staff', sanskrit: 'Dandasana', base: 'seated', sided: false, breaths: 3, cue: 'Legs long, feet flexed, hands press beside the hips.' },
  { id: 'seated-forward-fold', name: 'Seated Forward Fold', sanskrit: 'Paschimottanasana', base: 'seated', sided: false, breaths: 8, cue: 'Hinge from the hips, long spine over the legs.' },
  { id: 'boat', name: 'Boat', sanskrit: 'Navasana', base: 'seated', sided: false, breaths: 5, cue: 'Chest lifted, shins parallel to the floor, arms reach forward.' },
  { id: 'bound-angle', name: 'Bound Angle', sanskrit: 'Baddha Konasana', base: 'seated', sided: false, breaths: 6, cue: 'Let the knees fall open and the spine grow tall.' },
  { id: 'head-to-knee', name: 'Head to Knee', sanskrit: 'Janu Sirsasana', base: 'seated', sided: true, breaths: 6, cue: 'Lead with the chest, spine long, the bent knee falls open.' },
  { id: 'seated-twist', name: 'Seated Twist', sanskrit: 'Parivrtta Sukhasana', aka: ['Easy Seat Twist'], base: 'seated', sided: true, breaths: 5, cue: 'Lengthen on the inhale, turn a little more on the exhale.' },
  { id: 'pigeon', name: 'Pigeon', sanskrit: 'Eka Pada Rajakapotasana', base: 'seated', sided: true, breaths: 10, cue: 'Front shin angled across the mat, hips level, chest lifts.' },

  // Kneeling
  { id: 'table', name: 'Tabletop', sanskrit: 'Bharmanasana', base: 'kneeling', sided: false, breaths: 2, cue: 'Wrists under shoulders, knees under hips.' },
  { id: 'cat', name: 'Cat', sanskrit: 'Marjaryasana', base: 'kneeling', sided: false, breaths: 1, cue: 'Press the floor away, chin toward the chest, navel draws in.' },
  { id: 'cow', name: 'Cow', sanskrit: 'Bitilasana', base: 'kneeling', sided: false, breaths: 1, cue: 'Shoulders slide away from the ears, chest reaches forward.' },
  { id: 'child', name: "Child's Pose", sanskrit: 'Balasana', base: 'kneeling', sided: false, breaths: 6, cue: 'Forehead down, arms long or by your sides, breathe into the back.' },
  { id: 'thunderbolt', name: 'Thunderbolt', sanskrit: 'Vajrasana', base: 'kneeling', sided: false, breaths: 4, cue: 'Knees together, spine tall, hands rest on the thighs.' },
  { id: 'camel', name: 'Camel', sanskrit: 'Ustrasana', base: 'kneeling', sided: false, breaths: 4, cue: 'Hips over the knees, lift through the chest, let the head follow.' },
  { id: 'thread-needle', name: 'Thread the Needle', base: 'kneeling', sided: true, breaths: 5, cue: 'Rest the shoulder and ear down, hips stay over the knees.' },
  { id: 'low-lunge', name: 'Low Lunge', sanskrit: 'Anjaneyasana', aka: ['Crescent Moon'], base: 'kneeling', sided: true, breaths: 5, cue: 'Hips sink toward the floor, chest lifts, hands on the front thigh.' },
  { id: 'half-split', name: 'Half Split', sanskrit: 'Ardha Hanumanasana', base: 'kneeling', sided: true, breaths: 5, cue: 'Flex the front foot, spine long, fold only as far as feels easy.' },

  // Hands and feet
  { id: 'down-dog', name: 'Downward-Facing Dog', sanskrit: 'Adho Mukha Svanasana', base: 'hands', sided: false, breaths: 5, cue: 'Hips high, press the floor away, heels reach down.' },
  { id: 'three-leg-dog', name: 'Three-Legged Dog', sanskrit: 'Eka Pada Adho Mukha Svanasana', base: 'hands', sided: true, breaths: 2, cue: 'Hips stay level, reach back through the lifted heel.' },
  { id: 'plank', name: 'Plank', sanskrit: 'Phalakasana', base: 'hands', sided: false, breaths: 3, cue: 'Shoulders over wrists, one long line from head to heels.' },
  { id: 'chaturanga', name: 'Chaturanga', sanskrit: 'Chaturanga Dandasana', base: 'hands', sided: false, breaths: 1, cue: 'Elbows hug in, lower until they bend to ninety degrees.' },
  { id: 'up-dog', name: 'Upward-Facing Dog', sanskrit: 'Urdhva Mukha Svanasana', base: 'hands', sided: false, breaths: 1, cue: 'Tops of the feet down, thighs lifted, chest open.' },
  { id: 'side-plank', name: 'Side Plank', sanskrit: 'Vasisthasana', base: 'hands', sided: true, breaths: 3, cue: 'Hips lift high, top arm reaches up, gaze to the hand.' },
  { id: 'crow', name: 'Crow', sanskrit: 'Bakasana', base: 'hands', sided: false, breaths: 3, cue: 'Lean forward until the feet float, gaze a little ahead.' },

  // Prone
  { id: 'belly', name: 'Lying on Belly', sanskrit: 'Makarasana', base: 'prone', sided: false, breaths: 3, cue: 'Rest on the belly, forehead on stacked hands.' },
  { id: 'cobra', name: 'Cobra', sanskrit: 'Bhujangasana', base: 'prone', sided: false, breaths: 2, cue: 'Elbows hug in, shoulders roll back, the back does the work, not the arms.' },
  { id: 'sphinx', name: 'Sphinx', sanskrit: 'Salamba Bhujangasana', base: 'prone', sided: false, breaths: 6, cue: 'Elbows under the shoulders, chest broad, belly soft.' },
  { id: 'locust', name: 'Locust', sanskrit: 'Salabhasana', base: 'prone', sided: false, breaths: 4, cue: 'Reach long through the fingers and toes, gaze down.' },
  { id: 'bow', name: 'Bow', sanskrit: 'Dhanurasana', base: 'prone', sided: false, breaths: 4, cue: 'Kick into the hands to lift the chest and thighs.' },

  // Standing
  { id: 'mountain', name: 'Mountain', sanskrit: 'Tadasana', base: 'standing', sided: false, breaths: 3, cue: 'Feet grounded, spine tall, arms by your sides.' },
  { id: 'upward-salute', name: 'Upward Salute', sanskrit: 'Urdhva Hastasana', base: 'standing', sided: false, breaths: 1, cue: 'Palms face each other, shoulders soft, lift through the chest.' },
  { id: 'forward-fold', name: 'Standing Forward Fold', sanskrit: 'Uttanasana', base: 'standing', sided: false, breaths: 3, cue: 'Fold from the hips, knees soft, head heavy.' },
  { id: 'halfway-lift', name: 'Halfway Lift', sanskrit: 'Ardha Uttanasana', base: 'standing', sided: false, breaths: 1, cue: 'Hands to shins, lengthen the spine forward.' },
  { id: 'chair', name: 'Chair', sanskrit: 'Utkatasana', base: 'standing', sided: false, breaths: 4, cue: 'Weight in the heels, knees behind the toes, chest lifts.' },
  { id: 'twisted-chair', name: 'Twisted Chair', sanskrit: 'Parivrtta Utkatasana', base: 'standing', sided: true, breaths: 4, cue: 'Hook the elbow outside the opposite knee, knees stay level.' },
  { id: 'garland', name: 'Garland', sanskrit: 'Malasana', base: 'standing', sided: false, breaths: 5, cue: 'Elbows press the knees open, chest lifts, heels down if they reach.' },
  { id: 'wide-leg-fold', name: 'Wide-Legged Forward Fold', sanskrit: 'Prasarita Padottanasana', base: 'standing', sided: false, breaths: 5, cue: 'Crown toward the floor, hands under the shoulders, legs strong.' },
  { id: 'high-lunge', name: 'High Lunge', sanskrit: 'Ashta Chandrasana', aka: ['Crescent Lunge'], base: 'standing', sided: true, breaths: 4, cue: 'Hips square, back leg strong, arms reach up.' },
  { id: 'warrior-1', name: 'Warrior I', sanskrit: 'Virabhadrasana I', base: 'standing', sided: true, breaths: 4, cue: 'Back heel down, arms up, ribs soft.' },
  { id: 'warrior-2', name: 'Warrior II', sanskrit: 'Virabhadrasana II', base: 'standing', sided: true, breaths: 4, cue: 'Front knee over the ankle, gaze over the front hand.' },
  { id: 'reverse-warrior', name: 'Reverse Warrior', sanskrit: 'Viparita Virabhadrasana', base: 'standing', sided: true, breaths: 3, cue: 'Back hand slides down the back leg, front knee stays bent.' },
  { id: 'extended-side-angle', name: 'Extended Side Angle', sanskrit: 'Utthita Parsvakonasana', base: 'standing', sided: true, breaths: 4, cue: 'One long line from the back heel to the fingertips, chest turns up.' },
  { id: 'triangle', name: 'Triangle', sanskrit: 'Trikonasana', base: 'standing', sided: true, breaths: 5, cue: 'Front leg straight, arms in one line, chest opens to the side.' },
  { id: 'half-moon', name: 'Half Moon', sanskrit: 'Ardha Chandrasana', base: 'standing', sided: true, breaths: 4, cue: 'Standing leg strong, hips stack open, top arm reaches up.' },
  { id: 'warrior-3', name: 'Warrior III', sanskrit: 'Virabhadrasana III', base: 'standing', sided: true, breaths: 3, cue: 'Balance on one leg, body and back leg parallel to the floor.' },
  { id: 'pyramid', name: 'Pyramid', sanskrit: 'Parsvottanasana', base: 'standing', sided: true, breaths: 5, cue: 'Both legs straight, hips square, lead with the chest.' },
  { id: 'tree', name: 'Tree', sanskrit: 'Vrksasana', base: 'standing', sided: true, breaths: 5, cue: 'Press foot and leg into each other, never on the knee, hands at heart.' },

  // Added later: grouped here by where the body is, like the rest.
  { id: 'fish', name: 'Fish', sanskrit: 'Matsyasana', base: 'supine', sided: false, breaths: 5, cue: 'The crown of the head rests lightly, the weight in the forearms.' },
  { id: 'shoulder-stand', name: 'Shoulder Stand', sanskrit: 'Salamba Sarvangasana', base: 'supine', sided: false, breaths: 10, cue: 'Legs reach straight up, keep the neck still, gaze to the chest.' },
  { id: 'plow', name: 'Plow', sanskrit: 'Halasana', base: 'supine', sided: false, breaths: 8, cue: 'Toes toward the floor, hands support the back, neck still.' },
  { id: 'lotus', name: 'Lotus', sanskrit: 'Padmasana', base: 'seated', sided: false, breaths: 10, cue: 'Half lotus is fine too, spine tall, hands rest on the knees.' },
  { id: 'half-lord-fishes', name: 'Half Lord of the Fishes', sanskrit: 'Ardha Matsyendrasana', aka: ['Seated Spinal Twist'], base: 'seated', sided: true, breaths: 6, cue: 'Lengthen on the inhale, turn toward the raised knee on the exhale.' },
  { id: 'cow-face', name: 'Cow Face', sanskrit: 'Gomukhasana', base: 'seated', sided: true, breaths: 6, cue: 'One arm up and one down, hands meet behind if they can, spine tall.' },
  { id: 'hero', name: 'Hero', sanskrit: 'Virasana', base: 'kneeling', sided: false, breaths: 8, cue: 'Tops of the feet down, spine tall, a block under you if the knees ask.' },
  { id: 'lizard', name: 'Lizard', sanskrit: 'Utthan Pristhasana', base: 'kneeling', sided: true, breaths: 8, cue: 'Forearms down if they reach, hips sink low, back leg strong.' },
  { id: 'runners-lunge', name: 'Runner’s Lunge', sanskrit: 'Utthita Ashwa Sanchalanasana', base: 'hands', sided: true, breaths: 3, cue: 'Front knee over the ankle, back leg long and lifted.' },
  { id: 'dolphin', name: 'Dolphin', sanskrit: 'Ardha Pincha Mayurasana', base: 'hands', sided: false, breaths: 5, cue: 'Hips high, head hangs free, walk the feet in a little.' },
  { id: 'headstand', name: 'Headstand', sanskrit: 'Salamba Sirsasana', base: 'hands', sided: false, breaths: 10, cue: 'Forearms down, fingers laced, lift through the shoulders, not the neck.' },
  { id: 'handstand', name: 'Handstand', sanskrit: 'Adho Mukha Vrksasana', base: 'hands', sided: false, breaths: 3, cue: 'Shoulders over wrists, reach up through the legs.' },
  { id: 'dancer', name: 'Dancer', sanskrit: 'Natarajasana', base: 'standing', sided: true, breaths: 4, cue: 'Hold the back foot, kick it into the hand, reach forward.' },
  { id: 'eagle', name: 'Eagle', sanskrit: 'Garudasana', base: 'standing', sided: true, breaths: 5, cue: 'Sit low, the arms wrap too, elbows lift.' },
  { id: 'bird-of-paradise', name: 'Bird of Paradise', sanskrit: 'Svarga Dvijasana', base: 'standing', sided: true, breaths: 4, cue: 'Stand tall and straighten the lifted leg toward the sky.' },
  { id: 'revolved-triangle', name: 'Revolved Triangle', sanskrit: 'Parivrtta Trikonasana', base: 'standing', sided: true, breaths: 5, cue: 'Hips square, both legs straight, top arm reaches to the sky.' },
  { id: 'humble-warrior', name: 'Humble Warrior', sanskrit: 'Baddha Virabhadrasana', base: 'standing', sided: true, breaths: 4, cue: 'Shoulder toward the inner knee, arms float away from the back.' },
  { id: 'fallen-triangle', name: 'Fallen Triangle', sanskrit: 'Patita Tarasana', base: 'hands', sided: true, breaths: 3, cue: 'Hips lift, top arm reaches up, gaze to the hand.' },
];

/** Poses offered when a sequence is empty. */
export const START_POSES = ['savasana', 'easy-seat', 'child', 'table', 'down-dog', 'mountain'];

/** Where a flow built from scratch begins, already chosen (removing it offers the others). */
export const FIRST_POSE = 'easy-seat';

/** Whether pose names show their Sanskrit too (in the rows, the player and the first-pose choices). Off for now; the single-pose view always shows it. */
export const SHOW_SANSKRIT = false;
