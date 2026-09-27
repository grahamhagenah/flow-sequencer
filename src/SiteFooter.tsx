// The footer under the start page, My flows and the poses page (the sequencer has the
// player at its foot instead): where things are, a few facts worth knowing, and credits.

const REPO = 'https://github.com/grahamhagenah/flow-sequencer';

/** `here` says which page it's on, for the link to the other one and the relative paths. */
export function SiteFooter({ here }: { here: 'app' | 'poses' }) {
  return (
    <footer className="site-footer">
      <div className="site-footer-col">
        <h2>Explore</h2>
        <ul>
          <li>{here === 'app' ? <a href="./poses/">Pose drawings</a> : <a href="../">Flow Sequencer</a>}</li>
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
            Icons from <a href="https://phosphoricons.com/">Phosphor</a> (MIT); pose drawings made for this app
          </li>
          <li>
            Set in <a href="https://fonts.google.com/specimen/Figtree">Figtree</a> (OFL)
          </li>
        </ul>
      </div>
    </footer>
  );
}
