import { describe, expect, it } from 'vitest';
import { POSES } from '../data/poses';
import { SAMPLE_FLOWS } from '../data/samples';
import { buildPages, SITE } from './pages';

const pages = buildPages({ css: ['assets/app.css'] });
const html = pages.filter((p) => p.fileName.endsWith('.html'));

/** Where a page's relative link lands, as a path from the site's root. */
function resolve(fileName: string, href: string) {
  const url = new URL(href, `${SITE}/${fileName}`);
  return url.origin === SITE ? url.pathname.slice(1) : null;
}

describe('guide pages', () => {
  it('has a page for every flow and every pose, and the index', () => {
    const names = new Set(pages.map((p) => p.fileName));
    expect(names.has('flows/index.html')).toBe(true);
    for (const f of SAMPLE_FLOWS) expect(names.has(`flows/${f.id}/index.html`), f.id).toBe(true);
    for (const p of POSES) expect(names.has(`poses/${p.id}/index.html`), p.id).toBe(true);
    expect(names.size).toBe(pages.length);
  });

  it('gives each page its own title and description', () => {
    const titles = html.map((p) => p.content.match(/<title>(.*?)<\/title>/)?.[1]);
    const descriptions = html.map((p) => p.content.match(/<meta name="description" content="(.*?)"/)?.[1]);
    expect(new Set(titles).size).toBe(html.length);
    expect(new Set(descriptions).size).toBe(html.length);
  });

  it('links only to pages that exist', () => {
    // The app's own pages, the site's files and the guide pages themselves.
    const known = new Set(['', 'poses/', 'favicon.svg', 'assets/app.css', ...pages.map((p) => p.fileName.replace(/index\.html$/, ''))]);
    for (const page of html) {
      for (const [, href] of page.content.matchAll(/(?:href)="([^"#]*)(?:#[^"]*)?"/g)) {
        const path = resolve(page.fileName, href);
        if (path !== null) expect(known.has(path), `${page.fileName} → ${href}`).toBe(true);
      }
    }
  });

  it('lists every page in the sitemap', () => {
    const sitemap = pages.find((p) => p.fileName === 'sitemap.xml')!.content;
    for (const page of html) expect(sitemap).toContain(`<loc>${SITE}/${page.fileName.replace(/index\.html$/, '')}</loc>`);
  });
});
