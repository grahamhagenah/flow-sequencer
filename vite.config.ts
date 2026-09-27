import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin, runnerImport } from 'vite';
import react from '@vitejs/plugin-react';

const here = (path: string) => fileURLToPath(new URL(path, import.meta.url));

/**
 * Writes the guide pages (src/seo/pages.tsx) into the build: a page for each ready-made
 * flow and each pose, the flows' index and the sitemap, as plain HTML for search engines.
 * They link the app's stylesheet (for its colours, type and footer) and their own.
 */
function seoPages(): Plugin {
  return {
    name: 'seo-pages',
    apply: 'build',
    async generateBundle(_, bundle) {
      // The app's stylesheet: the CSS of the main entry and the chunks it imports.
      const appCss = new Set<string>();
      const visit = (name: string) => {
        const chunk = bundle[name];
        if (chunk?.type !== 'chunk') return;
        chunk.viteMetadata?.importedCss.forEach((c) => appCss.add(c));
        chunk.imports.forEach(visit);
      };
      Object.values(bundle).forEach((f) => f.type === 'chunk' && f.isEntry && f.name === 'main' && visit(f.fileName));
      if (appCss.size === 0) this.error("Couldn't find the app's stylesheet for the guide pages");
      const ref = this.emitFile({ type: 'asset', name: 'guide.css', source: readFileSync(here('src/seo/guide.css'), 'utf8') });
      const { module } = await runnerImport<typeof import('./src/seo/pages')>(here('src/seo/pages.tsx'), {
        configFile: false,
        logLevel: 'warn',
      });
      for (const page of module.buildPages({ css: [...appCss, this.getFileName(ref)] })) {
        this.emitFile({ type: 'asset', fileName: page.fileName, source: page.content });
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), seoPages()],
  // Relative asset paths, so the built app works wherever it's served from,
  // including a GitHub Pages project path like /om/. The app has no routes of
  // its own (flows live in the URL hash), so nothing else depends on the base.
  base: './',
  // Two pages: the app, and /poses/ (every drawing, to download). The guide pages
  // (flows/, poses/<id>/, sitemap.xml) are written by seoPages.
  build: {
    rollupOptions: {
      input: { main: 'index.html', poses: 'poses/index.html' },
    },
  },
});
