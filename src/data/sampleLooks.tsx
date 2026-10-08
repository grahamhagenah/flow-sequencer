import type { ReactNode } from 'react';
import { DEFAULT_COLOR, flowColor } from '../colors';
import { flowIcon } from '../flowIcons';

// Icons (from the flow icon set) and colours for the sample classes. The peak pose
// classes take an icon after their peak pose.

export interface SampleLook {
  icon: ReactNode;
  /** That icon's id in FLOW_ICONS, which the flow opens with. */
  iconId: string;
  /** The card's accent: the icon, its tinted square and the style pill. */
  color: string;
  /** That colour's id in FLOW_COLORS, which the flow opens in. */
  colorId: string;
}

// One of the flow colours each, so a class opens in the colour of its card.
const LOOKS: Record<string, { icon: string; color: string }> = {
  'morning-vinyasa': { icon: 'sun-horizon', color: 'apricot' },
  'slow-hips': { icon: 'waves', color: 'aqua' },
  'evening-wind-down': { icon: 'moon-stars', color: 'lilac' },
  'power-flow': { icon: 'fire', color: 'coral' },
  'midday-reset': { icon: 'leaf', color: 'sage' },
  'sun-salutations': { icon: 'sun', color: 'sun' },
  'steady-balance': { icon: 'stones', color: 'lime' },
  'crow-peak': { icon: 'bird', color: 'sky' },
  'dancer-peak': { icon: 'balance', color: 'rose' },
  'wheel-peak': { icon: 'rainbow', color: 'teal' },
  'bird-of-paradise-peak': { icon: 'flower', color: 'tangerine' },
  'eagle-peak': { icon: 'feather', color: 'sand' },
  'desk-break': { icon: 'coffee', color: 'tangerine' },
  'runners-stretch': { icon: 'run', color: 'sky' },
  'headstand-peak': { icon: 'upside-down', color: 'lilac' },
  'camel-peak': { icon: 'heart', color: 'rose' },
  'wake-up': { icon: 'battery-full', color: 'butter' },
  bedtime: { icon: 'bed', color: 'periwinkle' },
  'standing-stretch': { icon: 'walk', color: 'mint' },
  'back-care': { icon: 'cat', color: 'pearl' },
  'shoulders-neck': { icon: 'wind', color: 'orchid' },
  'core-strength': { icon: 'lightning', color: 'poppy' },
  beginners: { icon: 'plant', color: 'teal' },
};

export const sampleLook = (id: string): SampleLook => {
  const look = LOOKS[id] ?? { icon: 'sun', color: DEFAULT_COLOR };
  const c = flowColor(look.color);
  return { icon: flowIcon(look.icon)?.glyph, iconId: look.icon, color: c.hex, colorId: c.id };
};
