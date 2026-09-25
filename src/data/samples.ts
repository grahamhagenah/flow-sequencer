import { advance, type Sequence, setBreaths, setLeadingSide, start } from '../sequence';
import { outgoing } from './graph';

// Complete classes that ship with the app, shown under Ready-made classes. Each is
// written as the moves a teacher would call, and built with the same functions
// the builder uses, so every step is a real move in the pose graph.
// samples.test.ts checks they all still build after the graph changes.

export interface SampleFlow {
  id: string;
  name: string;
  description: string;
  seq: Sequence;
  /** A class that works up to one harder or fun pose, listed in its own section. */
  peak?: boolean;
}

type Stop = string | [pose: string, breaths: number] | [pose: string, breaths: number, labelHint: string];

class FlowBuilder {
  seq: Sequence;

  constructor(pose: string, breaths?: number) {
    this.seq = start(pose);
    if (breaths) this.seq = setBreaths(this.seq, 0, breaths);
  }

  /** Moves to `to`, by the move whose label contains `hint` when there's more than one way. */
  go(to: string, breaths?: number, hint?: string) {
    const here = this.seq[this.seq.length - 1].poseId;
    const t = outgoing(here).find((t) => t.to === to && (!hint || t.label.includes(hint)));
    if (!t) throw new Error(`No move from ${here} to ${to}${hint ? ` (“${hint}”)` : ''}`);
    this.seq = advance(this.seq, t);
    if (breaths) this.seq = setBreaths(this.seq, this.seq.length - 1, breaths);
    return this;
  }

  path(...stops: Stop[]) {
    for (const s of stops) typeof s === 'string' ? this.go(s) : this.go(s[0], s[1], s[2]);
    return this;
  }

  /** Sets which side the next one-sided pose is on. Only valid on a pose without a side. */
  lead(side: 'right' | 'left') {
    const next = setLeadingSide(this.seq, side);
    if (next === this.seq && this.seq[this.seq.length - 1].side !== side) {
      throw new Error(`Can't choose a side on ${this.seq[this.seq.length - 1].poseId}`);
    }
    this.seq = next;
    return this;
  }

  /** Runs `block` on the right, then again on the left. */
  bothSides(block: (f: FlowBuilder) => void) {
    block(this.lead('right'));
    block(this.lead('left'));
    return this;
  }
}

// Salutations take one breath per movement, as they're usually taught; down dog holds.
const vinyasa = (f: FlowBuilder) => f.path(['plank', 1], 'chaturanga', 'up-dog', ['down-dog', 5, 'Roll over']);

const sunA = (f: FlowBuilder) =>
  f
    .path('upward-salute', ['forward-fold', 1, 'Swan'], 'halfway-lift', ['chaturanga', 1, 'jump back'], 'up-dog')
    .path(['down-dog', 5], ['forward-fold', 1, 'Jump'], 'halfway-lift', ['forward-fold', 1])
    .path(['upward-salute', 1, 'Rise'], ['mountain', 2]);

// As taught: from each Warrior I, hands down and straight into the vinyasa, with
// one breath in down dog between and the long hold only at the end.
const sunB = (f: FlowBuilder) => {
  const warrior = (side: 'right' | 'left', dogBreaths: number) =>
    f
      .lead(side)
      .path(['warrior-1', 3, 'rise to Warrior I'], ['plank', 1, 'step back to plank'], 'chaturanga', 'up-dog')
      .path(['down-dog', dogBreaths]);
  f.path(['chair', 3], ['forward-fold', 1], 'halfway-lift', ['chaturanga', 1, 'jump back'], 'up-dog', ['down-dog', 1]);
  warrior('right', 1);
  warrior('left', 5);
  f.path(['forward-fold', 1, 'Jump'], 'halfway-lift', ['forward-fold', 1], ['chair', 3])
    .path(['mountain', 2, 'Straighten legs, hands']);
};

/** From standing, down to down dog through a half salutation. */
const toDownDog = (f: FlowBuilder, breaths: number) =>
  f.path('upward-salute', ['forward-fold', 1, 'Swan'], 'halfway-lift', ['chaturanga', 1, 'jump back'], 'up-dog')
    .path(['down-dog', breaths]);

const catCow = (f: FlowBuilder) => f.path(['cow', 1], 'cat', 'cow', 'cat', 'cow', 'cat');

function morningVinyasa() {
  const f = new FlowBuilder('easy-seat', 12);
  catCow(f.path(['table', 2])).path(['table', 1, 'Return'], ['down-dog', 8]);
  f.path(['forward-fold', 5, 'Walk'], ['halfway-lift', 1], ['forward-fold', 2], ['mountain', 5, 'Roll up']);
  sunA(f);
  sunA(f);
  sunA(f);
  toDownDog(f, 3);
  f.bothSides((f) => {
    f.path(['three-leg-dog', 2], ['warrior-2', 5, 'open to Warrior II'], ['reverse-warrior', 3])
      .path(['extended-side-angle', 5, 'Circle'], ['warrior-2', 2, 'Rise up'], ['triangle', 5], ['half-moon', 4])
      .path(['triangle', 2], ['warrior-2', 1], ['down-dog', 1, 'Cartwheel']);
    vinyasa(f);
  });
  f.path(['forward-fold', 3, 'Walk'], ['mountain', 3, 'Roll up']);
  f.lead('right').go('tree', 8).go('tree', 8).go('mountain', 3);
  f.lead('right').path(['chair', 5], ['twisted-chair', 4]).go('twisted-chair', 4);
  f.path(['chair', 2, 'Unwind'], ['forward-fold', 3], ['down-dog', 3, 'Step back'], ['table', 1, 'Lower knees']);
  f.path(['easy-seat', 2, 'Swing'], ['staff', 2], ['boat', 5], ['staff', 2], ['boat', 5], ['knees-to-chest', 3, 'Roll down']);
  f.path(['bridge', 6], ['knees-to-chest', 2], ['bridge', 6], ['knees-to-chest', 4]);
  f.lead('right').go('supine-twist', 8).go('supine-twist', 8);
  f.path(['knees-to-chest', 3, 'Bring'], ['happy-baby', 6], ['savasana', 30], ['easy-seat', 5]);
  return f.seq;
}

function slowHips() {
  const f = new FlowBuilder('child', 10);
  catCow(f.path(['table', 2])).path(['table', 2, 'Return']);
  f.lead('right').go('thread-needle', 8).go('table', 2).lead('left').go('thread-needle', 8).go('table', 2);
  f.go('down-dog', 8);
  f.bothSides((f) =>
    f.path(['three-leg-dog', 2], ['low-lunge', 5, 'lower back knee'], ['lizard', 8], ['half-split', 8], ['low-lunge', 4])
      .path(['three-leg-dog', 2, 'Step'], ['pigeon', 15], ['down-dog', 5]),
  );
  f.path(['table', 2, 'Lower knees'], ['easy-seat', 3, 'Swing'], ['bound-angle', 12], ['staff', 2]);
  f.lead('right').go('head-to-knee', 10).go('head-to-knee', 10);
  f.path(['staff', 2], ['seated-forward-fold', 12], ['staff', 2], ['savasana', 2, 'Roll down'], ['knees-to-chest', 4]);
  f.lead('right').go('supine-twist', 10).go('supine-twist', 10);
  f.path(['knees-to-chest', 3, 'Bring'], ['savasana', 30]);
  return f.seq;
}

function eveningWindDown() {
  const f = new FlowBuilder('easy-seat', 15);
  f.lead('right').go('seated-twist', 8).go('seated-twist', 8).go('easy-seat', 4, 'Unwind to center');
  f.path(['bound-angle', 12], ['staff', 2], ['seated-forward-fold', 15], ['staff', 2], ['easy-seat', 2]);
  f.path(['table', 2], ['child', 12], ['table', 2], ['easy-seat', 2, 'Swing'], ['savasana', 2, 'Lower down']);
  f.path(['knees-to-chest', 6]);
  f.lead('right').go('supine-twist', 10).go('supine-twist', 10);
  f.path(['knees-to-chest', 3, 'Bring'], ['happy-baby', 8], ['savasana', 40]);
  return f.seq;
}

function powerFlow() {
  const f = new FlowBuilder('mountain', 5);
  sunA(f);
  sunA(f);
  sunB(f);
  sunB(f);
  toDownDog(f, 3);
  f.bothSides((f) => {
    f.path(['high-lunge', 5, 'rise up'], ['warrior-3', 5], ['high-lunge', 2], ['warrior-1', 3, 'Spin back heel down'])
      .path(['warrior-2', 3], ['reverse-warrior', 3], ['down-dog', 1, 'Cartwheel'], ['plank', 2], ['side-plank', 5])
      .path(['plank', 1], ['chaturanga', 1], 'up-dog', ['down-dog', 3]);
  });
  f.path(['garland', 5], ['crow', 5], ['garland', 2], ['crow', 5], ['chaturanga', 1], 'up-dog', ['down-dog', 3]);
  f.path(['plank', 2], ['belly', 2, 'Lower all'], ['locust', 5], ['belly', 2], ['locust', 5], ['bow', 5, 'Bend']);
  f.path(['belly', 3], ['child', 5, 'Press back'], ['thunderbolt', 2], ['camel', 5], ['thunderbolt', 3], ['camel', 5]);
  f.path(['child', 8], ['table', 2], ['easy-seat', 2, 'Swing'], ['savasana', 2, 'Lower down'], ['bridge', 3, 'Bend']);
  f.path(['wheel', 5], ['knees-to-chest', 3, 'hug'], ['bridge', 2], ['wheel', 5], ['knees-to-chest', 5, 'hug']);
  f.lead('right').go('supine-twist', 8).go('supine-twist', 8);
  f.path(['knees-to-chest', 3, 'Bring'], ['shoulder-stand', 10], ['plow', 6], ['shoulder-stand', 2], ['fish', 5]);
  f.path(['savasana', 30]);
  return f.seq;
}

function sunSalutations() {
  const f = new FlowBuilder('mountain', 5);
  sunA(f);
  sunA(f);
  sunA(f);
  sunB(f);
  sunB(f);
  f.path(['forward-fold', 5, 'Exhale'], ['mountain', 8, 'Roll up']);
  return f.seq;
}

function middayReset() {
  const f = new FlowBuilder('mountain', 5);
  f.path('upward-salute', ['forward-fold', 3, 'Swan'], ['halfway-lift', 1], ['forward-fold', 3], ['down-dog', 5, 'Step back']);
  f.bothSides((f) =>
    f.path(['three-leg-dog', 2], ['low-lunge', 5, 'lower back knee'], ['half-split', 5], ['low-lunge', 2])
      .path(['down-dog', 3, 'Step back']),
  );
  catCow(f.path(['table', 2, 'Lower knees'])).path(['table', 1, 'Return'], ['child', 8]);
  f.path(['table', 2], ['easy-seat', 3, 'Swing']);
  f.lead('right').go('seated-twist', 5).go('seated-twist', 5).go('easy-seat', 3, 'Unwind to center');
  f.path(['savasana', 12, 'Lower down']);
  return f.seq;
}

/** Builds strength and the crow shape (core, twists, squats), then three tries at Crow. */
function crowPeak() {
  const f = new FlowBuilder('easy-seat', 8);
  catCow(f.path(['table', 2])).path(['table', 1, 'Return'], ['down-dog', 5]);
  f.path(['plank', 5, 'Shift forward']).lead('right').path(['side-plank', 5], ['plank', 2]);
  f.lead('left').path(['side-plank', 5], ['plank', 2], ['down-dog', 3, 'Lift hips']);
  f.path(['forward-fold', 3, 'Walk'], ['mountain', 3, 'Roll up']);
  sunA(f);
  sunA(f);
  f.lead('right').path(['chair', 4]).go('twisted-chair', 4).go('twisted-chair', 4).go('chair', 2, 'Unwind');
  f.path(['forward-fold', 2], ['garland', 5, 'squat low'], ['crow', 3], ['garland', 2]);
  f.path(['crow', 5], ['chaturanga', 1], 'up-dog', ['down-dog', 3], ['garland', 3, 'Walk feet']);
  f.path(['crow', 5], ['chaturanga', 1], 'up-dog', ['down-dog', 5]);
  f.path(['child', 8, 'Lower knees'], ['table', 2], ['easy-seat', 2, 'Swing'], ['savasana', 2, 'Lower down']);
  f.path(['knees-to-chest', 4]);
  f.lead('right').go('supine-twist', 8).go('supine-twist', 8);
  f.path(['knees-to-chest', 3, 'Bring'], ['savasana', 25]);
  return f.seq;
}

/** Opens the front of the hips and the chest, then balances build from Tree to Dancer. */
function dancerPeak() {
  const f = new FlowBuilder('mountain', 5);
  sunA(f);
  sunA(f);
  toDownDog(f, 3);
  f.bothSides((f) => {
    f.path(['high-lunge', 4, 'rise up'], ['low-lunge', 5], ['high-lunge', 2, 'Tuck'], ['warrior-3', 4])
      .path(['high-lunge', 2, 'Step back leg'], ['down-dog', 1, 'Hands down']);
    vinyasa(f);
  });
  f.path(['plank', 2, 'Shift forward'], ['belly', 2, 'Lower all'], ['locust', 5], ['belly', 2], ['locust', 5]);
  f.path(['bow', 5, 'Bend'], ['child', 5, 'Release, press back'], ['thunderbolt', 2], ['camel', 5], ['child', 5]);
  f.path(['down-dog', 3], ['forward-fold', 3, 'Walk'], ['mountain', 3, 'Roll up']);
  f.bothSides((f) => f.path(['tree', 5], ['dancer', 5]).go('mountain', 2, 'Release the foot down'));
  f.lead('right').go('dancer', 8).go('dancer', 8).go('mountain', 3);
  f.path(['forward-fold', 5, 'Exhale'], ['garland', 3], ['easy-seat', 2], ['staff', 2], ['seated-forward-fold', 10]);
  f.path(['staff', 2], ['savasana', 2, 'Roll down'], ['knees-to-chest', 4]);
  f.lead('right').go('supine-twist', 8).go('supine-twist', 8);
  f.path(['knees-to-chest', 3, 'Bring'], ['savasana', 25]);
  return f.seq;
}

export const SAMPLE_FLOWS: SampleFlow[] = [
  {
    id: 'morning-vinyasa',
    name: 'Morning Vinyasa · all levels',
    description: 'Salutations, a standing series on each side, balance, core and a long rest.',
    seq: morningVinyasa(),
  },
  {
    id: 'slow-hips',
    name: 'Slow Hip Opening · floor',
    description: 'Long holds low to the ground: lunge, lizard, half split and pigeon on each side.',
    seq: slowHips(),
  },
  {
    id: 'evening-wind-down',
    name: 'Evening Wind-Down · gentle',
    description: 'Seated and lying down only, with twists, folds and a long savasana.',
    seq: eveningWindDown(),
  },
  {
    id: 'power-flow',
    name: 'Power Flow · strong',
    description: 'Sun A and B, warrior III and side plank each side, crow, deep backbends, then shoulder stand.',
    seq: powerFlow(),
  },
  {
    id: 'midday-reset',
    name: 'Midday Reset · quick',
    description: 'A short break: fold, lunge and half split each side, then twist and rest.',
    seq: middayReset(),
  },
  {
    id: 'sun-salutations',
    name: 'Sun Salutations · wake-up',
    description: 'Three rounds of Sun A and two of Sun B, one breath per movement.',
    seq: sunSalutations(),
  },
  {
    id: 'crow-peak',
    name: 'Crow Pose · arm balance',
    description: 'Core, twists and deep squats to find the shape, then three tries at Crow.',
    seq: crowPeak(),
    peak: true,
  },
  {
    id: 'dancer-peak',
    name: 'Dancer · balance',
    description: 'Lunges and backbends open the front body, then Tree builds to Dancer each side.',
    seq: dancerPeak(),
    peak: true,
  },
];
