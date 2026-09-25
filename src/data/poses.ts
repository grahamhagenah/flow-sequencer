import type { Pose } from './types';

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
//   cow face                                           – the top knee

export const POSES: Pose[] = [
  // Supine
  { id: 'savasana', name: 'Corpse Pose', sanskrit: 'Savasana', base: 'supine', sided: false, breaths: 10, cue: 'Lie flat, arms by your sides, let everything go.' },
  { id: 'knees-to-chest', name: 'Knees to Chest', sanskrit: 'Apanasana', base: 'supine', sided: false, breaths: 5, cue: 'Hug both knees in and rock gently.' },
  { id: 'supine-twist', name: 'Supine Twist', sanskrit: 'Supta Matsyendrasana', base: 'supine', sided: true, breaths: 6, cue: 'Knees fall to one side, gaze the other way, shoulders heavy.' },
  { id: 'happy-baby', name: 'Happy Baby', sanskrit: 'Ananda Balasana', base: 'supine', sided: false, breaths: 5, cue: 'Hold the outer feet, knees toward the armpits.' },
  { id: 'bridge', name: 'Bridge', sanskrit: 'Setu Bandha Sarvangasana', base: 'supine', sided: false, breaths: 5, cue: 'Press through the feet, lift the hips, roll the shoulders under.' },
  { id: 'wheel', name: 'Wheel', sanskrit: 'Urdhva Dhanurasana', base: 'supine', sided: false, breaths: 3, cue: 'Press through hands and feet, lift the chest toward the wall behind you.' },

  // Seated
  { id: 'easy-seat', name: 'Easy Seat', sanskrit: 'Sukhasana', base: 'seated', sided: false, breaths: 6, cue: 'Cross the shins, sit tall, hands resting on the knees.' },
  { id: 'staff', name: 'Staff', sanskrit: 'Dandasana', base: 'seated', sided: false, breaths: 3, cue: 'Legs long, feet flexed, spine tall.' },
  { id: 'seated-forward-fold', name: 'Seated Forward Fold', sanskrit: 'Paschimottanasana', base: 'seated', sided: false, breaths: 8, cue: 'Hinge from the hips, long spine over the legs.' },
  { id: 'boat', name: 'Boat', sanskrit: 'Navasana', base: 'seated', sided: false, breaths: 5, cue: 'Balance on the sit bones, chest lifted, shins parallel to the floor.' },
  { id: 'bound-angle', name: 'Bound Angle', sanskrit: 'Baddha Konasana', base: 'seated', sided: false, breaths: 6, cue: 'Soles of the feet together, knees fall open.' },
  { id: 'head-to-knee', name: 'Head to Knee', sanskrit: 'Janu Sirsasana', base: 'seated', sided: true, breaths: 6, cue: 'One leg long, the other foot to the inner thigh, fold over the straight leg.' },
  { id: 'seated-twist', name: 'Seated Twist', sanskrit: 'Ardha Matsyendrasana', base: 'seated', sided: true, breaths: 5, cue: 'Lengthen on the inhale, twist on the exhale.' },
  { id: 'pigeon', name: 'Pigeon', sanskrit: 'Eka Pada Rajakapotasana', base: 'seated', sided: true, breaths: 10, cue: 'Front shin angled across the mat, back leg long, hips level.' },

  // Kneeling
  { id: 'table', name: 'Tabletop', sanskrit: 'Bharmanasana', base: 'kneeling', sided: false, breaths: 2, cue: 'Wrists under shoulders, knees under hips.' },
  { id: 'cat', name: 'Cat', sanskrit: 'Marjaryasana', base: 'kneeling', sided: false, breaths: 1, cue: 'Exhale, round the spine, tuck the chin.' },
  { id: 'cow', name: 'Cow', sanskrit: 'Bitilasana', base: 'kneeling', sided: false, breaths: 1, cue: 'Inhale, drop the belly, lift the gaze.' },
  { id: 'child', name: "Child's Pose", sanskrit: 'Balasana', base: 'kneeling', sided: false, breaths: 6, cue: 'Hips to heels, forehead down, arms long or by your sides.' },
  { id: 'thunderbolt', name: 'Thunderbolt', sanskrit: 'Vajrasana', base: 'kneeling', sided: false, breaths: 4, cue: 'Sit on the heels, spine tall.' },
  { id: 'camel', name: 'Camel', sanskrit: 'Ustrasana', base: 'kneeling', sided: false, breaths: 4, cue: 'Hips over knees, lift the chest, reach back for the heels.' },
  { id: 'thread-needle', name: 'Thread the Needle', base: 'kneeling', sided: true, breaths: 5, cue: 'Slide one arm under, rest the shoulder and ear down.' },
  { id: 'low-lunge', name: 'Low Lunge', sanskrit: 'Anjaneyasana', base: 'kneeling', sided: true, breaths: 5, cue: 'Front knee over ankle, back knee down, hips sink forward.' },
  { id: 'half-split', name: 'Half Split', sanskrit: 'Ardha Hanumanasana', base: 'kneeling', sided: true, breaths: 5, cue: 'Hips over the back knee, front leg straight, fold over it.' },

  // Hands and feet
  { id: 'down-dog', name: 'Downward-Facing Dog', sanskrit: 'Adho Mukha Svanasana', base: 'hands', sided: false, breaths: 5, cue: 'Hips high, press the floor away, heels reach down.' },
  { id: 'three-leg-dog', name: 'Three-Legged Dog', sanskrit: 'Eka Pada Adho Mukha Svanasana', base: 'hands', sided: true, breaths: 2, cue: 'One leg lifts high, hips stay level.' },
  { id: 'plank', name: 'Plank', sanskrit: 'Phalakasana', base: 'hands', sided: false, breaths: 3, cue: 'Shoulders over wrists, one long line from head to heels.' },
  { id: 'chaturanga', name: 'Chaturanga', sanskrit: 'Chaturanga Dandasana', base: 'hands', sided: false, breaths: 1, cue: 'Elbows hug in, lower until they bend to ninety degrees.' },
  { id: 'up-dog', name: 'Upward-Facing Dog', sanskrit: 'Urdhva Mukha Svanasana', base: 'hands', sided: false, breaths: 1, cue: 'Tops of the feet down, thighs lifted, chest open.' },
  { id: 'side-plank', name: 'Side Plank', sanskrit: 'Vasisthasana', base: 'hands', sided: true, breaths: 3, cue: 'Stack the feet, lift the hips, top arm reaches up.' },
  { id: 'crow', name: 'Crow', sanskrit: 'Bakasana', base: 'hands', sided: false, breaths: 3, cue: 'Knees on the upper arms, lean forward, lift the feet.' },

  // Prone
  { id: 'belly', name: 'Lying on Belly', sanskrit: 'Makarasana', base: 'prone', sided: false, breaths: 3, cue: 'Rest on the belly, forehead on stacked hands.' },
  { id: 'cobra', name: 'Cobra', sanskrit: 'Bhujangasana', base: 'prone', sided: false, breaths: 2, cue: 'Hands under shoulders, lift the chest with the back, not the arms.' },
  { id: 'sphinx', name: 'Sphinx', sanskrit: 'Salamba Bhujangasana', base: 'prone', sided: false, breaths: 6, cue: 'Forearms down, elbows under shoulders, chest broad.' },
  { id: 'locust', name: 'Locust', sanskrit: 'Salabhasana', base: 'prone', sided: false, breaths: 4, cue: 'Lift chest, arms and legs, gaze down.' },
  { id: 'bow', name: 'Bow', sanskrit: 'Dhanurasana', base: 'prone', sided: false, breaths: 4, cue: 'Hold the ankles, kick into the hands, lift the chest.' },

  // Standing
  { id: 'mountain', name: 'Mountain', sanskrit: 'Tadasana', base: 'standing', sided: false, breaths: 3, cue: 'Feet grounded, spine tall, arms by your sides.' },
  { id: 'upward-salute', name: 'Upward Salute', sanskrit: 'Urdhva Hastasana', base: 'standing', sided: false, breaths: 1, cue: 'Arms sweep overhead, palms facing.' },
  { id: 'forward-fold', name: 'Standing Forward Fold', sanskrit: 'Uttanasana', base: 'standing', sided: false, breaths: 3, cue: 'Fold from the hips, knees soft, head heavy.' },
  { id: 'halfway-lift', name: 'Halfway Lift', sanskrit: 'Ardha Uttanasana', base: 'standing', sided: false, breaths: 1, cue: 'Hands to shins, lengthen the spine forward.' },
  { id: 'chair', name: 'Chair', sanskrit: 'Utkatasana', base: 'standing', sided: false, breaths: 4, cue: 'Sit the hips back, arms reach up, weight in the heels.' },
  { id: 'twisted-chair', name: 'Twisted Chair', sanskrit: 'Parivrtta Utkatasana', base: 'standing', sided: true, breaths: 4, cue: 'Hands at heart, hook the elbow outside the opposite knee.' },
  { id: 'garland', name: 'Garland', sanskrit: 'Malasana', base: 'standing', sided: false, breaths: 5, cue: 'Deep squat, elbows press the knees wide, chest lifts.' },
  { id: 'wide-leg-fold', name: 'Wide-Legged Forward Fold', sanskrit: 'Prasarita Padottanasana', base: 'standing', sided: false, breaths: 5, cue: 'Feet wide and parallel, fold from the hips.' },
  { id: 'high-lunge', name: 'High Lunge', sanskrit: 'Ashta Chandrasana', base: 'standing', sided: true, breaths: 4, cue: 'Back heel lifted, front knee bent, arms reach up.' },
  { id: 'warrior-1', name: 'Warrior I', sanskrit: 'Virabhadrasana I', base: 'standing', sided: true, breaths: 4, cue: 'Back heel down, hips face forward, arms up.' },
  { id: 'warrior-2', name: 'Warrior II', sanskrit: 'Virabhadrasana II', base: 'standing', sided: true, breaths: 4, cue: 'Hips open to the side, arms wide, gaze over the front hand.' },
  { id: 'reverse-warrior', name: 'Reverse Warrior', sanskrit: 'Viparita Virabhadrasana', base: 'standing', sided: true, breaths: 3, cue: 'Front arm reaches up and back, back hand slides down the leg.' },
  { id: 'extended-side-angle', name: 'Extended Side Angle', sanskrit: 'Utthita Parsvakonasana', base: 'standing', sided: true, breaths: 4, cue: 'Forearm to thigh or hand down, top arm reaches over the ear.' },
  { id: 'triangle', name: 'Triangle', sanskrit: 'Trikonasana', base: 'standing', sided: true, breaths: 5, cue: 'Front leg straight, reach forward then tilt, arms in one line.' },
  { id: 'half-moon', name: 'Half Moon', sanskrit: 'Ardha Chandrasana', base: 'standing', sided: true, breaths: 4, cue: 'Standing leg strong, back leg lifted, hips stacked open.' },
  { id: 'warrior-3', name: 'Warrior III', sanskrit: 'Virabhadrasana III', base: 'standing', sided: true, breaths: 3, cue: 'Balance on one leg, body and back leg parallel to the floor.' },
  { id: 'pyramid', name: 'Pyramid', sanskrit: 'Parsvottanasana', base: 'standing', sided: true, breaths: 5, cue: 'Short stance, both legs straight, fold over the front leg.' },
  { id: 'tree', name: 'Tree', sanskrit: 'Vrksasana', base: 'standing', sided: true, breaths: 5, cue: 'Foot to inner thigh or calf, never the knee, hands at heart.' },

  // Added later: grouped here by where the body is, like the rest.
  { id: 'fish', name: 'Fish', sanskrit: 'Matsyasana', base: 'supine', sided: false, breaths: 5, cue: 'Forearms under you, lift the chest, the crown of the head rests lightly.' },
  { id: 'shoulder-stand', name: 'Shoulder Stand', sanskrit: 'Salamba Sarvangasana', base: 'supine', sided: false, breaths: 10, cue: 'Hands support the back, legs reach up, keep the neck still.' },
  { id: 'plow', name: 'Plow', sanskrit: 'Halasana', base: 'supine', sided: false, breaths: 8, cue: 'Feet lower overhead toward the floor, hands support the back.' },
  { id: 'lotus', name: 'Lotus', sanskrit: 'Padmasana', base: 'seated', sided: false, breaths: 10, cue: 'Each foot on the opposite thigh, or one for half lotus, spine tall.' },
  { id: 'half-lord-fishes', name: 'Half Lord of the Fishes', sanskrit: 'Ardha Matsyendrasana', base: 'seated', sided: true, breaths: 6, cue: 'One knee up, foot crossed over, twist toward the raised knee.' },
  { id: 'cow-face', name: 'Cow Face', sanskrit: 'Gomukhasana', base: 'seated', sided: true, breaths: 6, cue: 'Knees stacked, one arm up and one down, hands reach for each other behind.' },
  { id: 'hero', name: 'Hero', sanskrit: 'Virasana', base: 'kneeling', sided: false, breaths: 8, cue: 'Knees together, sit between the heels, spine tall.' },
  { id: 'lizard', name: 'Lizard', sanskrit: 'Utthan Pristhasana', base: 'kneeling', sided: true, breaths: 8, cue: 'Both hands inside the front foot, forearms down if they reach.' },
  { id: 'runners-lunge', name: 'Runner’s Lunge', sanskrit: 'Utthita Ashwa Sanchalanasana', base: 'hands', sided: true, breaths: 3, cue: 'Hands frame the front foot, back leg long and lifted.' },
  { id: 'dolphin', name: 'Dolphin', sanskrit: 'Ardha Pincha Mayurasana', base: 'hands', sided: false, breaths: 5, cue: 'Forearms down, hips high, head hangs free.' },
  { id: 'headstand', name: 'Headstand', sanskrit: 'Salamba Sirsasana', base: 'hands', sided: false, breaths: 10, cue: 'Forearms down, fingers laced, lift through the shoulders, not the neck.' },
  { id: 'handstand', name: 'Handstand', sanskrit: 'Adho Mukha Vrksasana', base: 'hands', sided: false, breaths: 3, cue: 'Shoulders over wrists, reach up through the legs.' },
  { id: 'dancer', name: 'Dancer', sanskrit: 'Natarajasana', base: 'standing', sided: true, breaths: 4, cue: 'Hold the back foot, kick it into the hand, reach forward.' },
  { id: 'eagle', name: 'Eagle', sanskrit: 'Garudasana', base: 'standing', sided: true, breaths: 5, cue: 'Sit low, wrap the legs and the arms, elbows lift.' },
  { id: 'revolved-triangle', name: 'Revolved Triangle', sanskrit: 'Parivrtta Trikonasana', base: 'standing', sided: true, breaths: 5, cue: 'Hips square, opposite hand down, twist open to the sky.' },
];

/** Poses offered when a sequence is empty. */
export const START_POSES = ['savasana', 'easy-seat', 'child', 'table', 'down-dog', 'mountain'];
