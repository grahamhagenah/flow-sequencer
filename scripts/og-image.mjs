// Draws public/og-image.png, the 1200×630 card shown when a link to the app is shared
// (see the og:image tags in index.html). It's made from the app's own pieces: the
// Figtree font, the lotus and the pose drawings (read from src/data/poseArt.ts).
//
//   npm run og-image
//
// Needs Google Chrome installed; it renders the card headless and screenshots it.

import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

// A short flow across the card, the last pose in apricot as the newest one is in the app.
const POSES = ['mountain', 'upward-salute', 'forward-fold', 'down-dog', 'warrior-2', 'triangle', 'tree', 'dancer'];

const art = readFileSync(join(root, 'src/data/poseArt.ts'), 'utf8');
const figure = (id, color) => {
  const m = art.match(new RegExp(`'?${id}'?: \\{ head: \\[([\\d.]+), ([\\d.]+)\\], d: '([^']+)'`));
  if (!m) throw new Error(`No drawing for ${id}`);
  const [, cx, cy, d] = m;
  return `<svg viewBox="0 0 48 48" width="112" height="112" fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M4 45h40" stroke-width="1.2" opacity="0.35"/><path d="${d}"/><circle cx="${cx}" cy="${cy}" r="3.3" fill="${color}" stroke="none"/></svg>`;
};

const lotus = readFileSync(join(root, 'src/Logo.tsx'), 'utf8').match(/const LOTUS =\s*'([^']+)'/)[1];
const font = join(root, 'node_modules/@fontsource-variable/figtree/files/figtree-latin-wght-normal.woff2');

const html = `<!doctype html>
<html><head><meta charset="utf-8"><style>
  @font-face { font-family: Figtree; src: url('file://${font}') format('woff2'); font-weight: 300 900; }
  * { box-sizing: border-box; margin: 0; }
  html, body { width: 1200px; height: 630px; background: #08090b; overflow: hidden; }
  body { font-family: Figtree, sans-serif; color: #e6e8eb; padding: 64px 72px; display: flex; flex-direction: column; }
  .top { display: flex; align-items: center; justify-content: space-between; }
  .brand { display: flex; align-items: center; gap: 14px; font-size: 30px; font-weight: 600; }
  h1 { margin-top: 44px; font-size: 68px; line-height: 1.08; font-weight: 700; letter-spacing: -0.01em; max-width: 940px; }
  h1 em { font-style: normal; color: #f2b27a; }
  p { margin-top: 20px; font-size: 28px; line-height: 1.4; color: #9aa1ab; max-width: 1040px; }
  .figures { margin-top: auto; display: flex; justify-content: space-between; margin-left: -12px; margin-right: -12px; }
  .url { font-size: 24px; color: #9aa1ab; }
</style></head><body>
  <div class="top">
    <div class="brand">
      <svg width="44" height="44" viewBox="0 0 256 256" fill="#f2b27a"><path d="${lotus}"/></svg>
      Flow Sequencer
    </div>
    <div class="url">yoga.grahamhagenah.com</div>
  </div>
  <h1>Build a yoga flow, <em>one pose at a time.</em></h1>
  <p>Real transitions, ready-made classes, and a voice that guides you through.</p>
  <div class="figures">${POSES.map((id, i) => figure(id, i === POSES.length - 1 ? '#f2b27a' : '#c0c5cc')).join('')}</div>
</body></html>`;

if (!existsSync(CHROME)) throw new Error('Google Chrome not found at ' + CHROME);
const dir = mkdtempSync(join(tmpdir(), 'og-'));
const page = join(dir, 'card.html');
writeFileSync(page, html);
const out = join(root, 'public/og-image.png');
execFileSync(CHROME, [
  '--headless',
  '--disable-gpu',
  '--hide-scrollbars',
  '--force-device-scale-factor=1',
  '--window-size=1200,630',
  '--virtual-time-budget=2000',
  `--screenshot=${out}`,
  `file://${page}`,
]);
console.log('Wrote', out);
