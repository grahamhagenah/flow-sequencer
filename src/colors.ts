// A flow's colour: its poses' drawings, the play button and the other accents while it's
// open. Each is bright enough to read on the dark background and to carry the dark text
// of the play button. Stored and shared by id, so a flow keeps its colour if a tone is tuned.

export interface FlowColor {
  id: string;
  name: string;
  hex: string;
}

// In order round the colour wheel, warm to cool; twelve, so they sit in two rows of six.
export const FLOW_COLORS: FlowColor[] = [
  { id: 'coral', name: 'Coral', hex: '#f5866a' },
  { id: 'tangerine', name: 'Tangerine', hex: '#fb9a4b' },
  { id: 'apricot', name: 'Apricot', hex: '#f2b27a' },
  { id: 'sand', name: 'Sand', hex: '#d8b07a' },
  { id: 'sun', name: 'Sun', hex: '#f4d25a' },
  { id: 'lime', name: 'Lime', hex: '#b8d86a' },
  { id: 'sage', name: 'Sage', hex: '#72d19a' },
  { id: 'teal', name: 'Teal', hex: '#5cc8b0' },
  { id: 'aqua', name: 'Aqua', hex: '#62c4e0' },
  { id: 'sky', name: 'Sky', hex: '#7fb2f0' },
  { id: 'lilac', name: 'Lilac', hex: '#b4a4f5' },
  { id: 'rose', name: 'Rose', hex: '#f08fc0' },
];

export const DEFAULT_COLOR = 'apricot';

const BY_ID = new Map(FLOW_COLORS.map((c) => [c.id, c]));

/** The colour with this id, or the default for an unknown or missing one. */
export const flowColor = (id: string | null | undefined): FlowColor => BY_ID.get(id ?? '') ?? BY_ID.get(DEFAULT_COLOR)!;

/** A known colour id, or null (read from storage and links, which may hold anything). */
export const colorId = (id: unknown): string | null => (typeof id === 'string' && BY_ID.has(id) ? id : null);

/** Any one of the colours, for a flow started from scratch. */
export const randomColor = (): string => FLOW_COLORS[Math.floor(Math.random() * FLOW_COLORS.length)].id;
