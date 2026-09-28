import { DRAWINGS_OWNER, LICENSE_URL } from './terms';

// The footer under the start page, My flows, the poses page and the guide pages (the sequencer has the
// player at its foot instead): where things are, a few facts worth knowing, and credits.

const REPO = 'https://github.com/grahamhagenah/flow-sequencer';

/** `root` is the relative path to the site's root from the page it's on ('./' in the app). */
export function SiteFooter({ root = './' }: { root?: string }) {
  return (
    <footer className="site-footer">
      <div className="site-footer-col">
        <h2>Explore</h2>
        <ul>
          <li>
            <a href={root}>Flow Sequencer</a>
          </li>
          <li>
            <a href={`${root}flows/`}>Ready-made flows</a>
          </li>
          <li>
            <a href={`${root}poses/`}>Pose drawings</a>
          </li>
          <li>
            <a href={REPO}>Source on GitHub</a>
          </li>
          <li>
            <a href={`${REPO}/issues`}>Report an issue</a>
          </li>
        </ul>
      </div>
      <div className="site-footer-col">
        <h2>Good to know</h2>
        <ul>
          <li>Flows are saved in this browser only. A flow’s link keeps it, and shares it.</li>
          <li>The voice is your browser’s own built-in speech.</li>
          <li>Free, with no account and no tracking.</li>
        </ul>
      </div>
      <div className="site-footer-col">
        <h2>Credits</h2>
        <ul>
          <li>
            Made by <a href="https://grahamhagenah.com/">Graham Hagenah</a>
          </li>
          <li>
            Pose drawings © {DRAWINGS_OWNER}, for personal use (<a href={LICENSE_URL}>terms</a>)
          </li>
          <li>
            Icons from <a href="https://phosphoricons.com/">Phosphor</a> (MIT)
          </li>
          <li>
            Set in <a href="https://fonts.google.com/specimen/Figtree">Figtree</a> (OFL)
          </li>
        </ul>
      </div>
    </footer>
  );
}
