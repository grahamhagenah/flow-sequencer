import { Logo } from './Logo';

/**
 * The app's top bar on the pages around it (the poses page and the guide pages): the
 * name, home to the app, then which part of the site this is. `root` is the relative
 * path to the site's root; `section` links to that part's index unless it's the page.
 */
export function SiteBar({
  root,
  section,
  sectionHref,
  logoColor,
}: {
  root: string;
  section: string;
  sectionHref?: string;
  logoColor?: string;
}) {
  return (
    <header className="bar site-bar">
      <h1>
        <a className="home" href={root}>
          <Logo size={22} color={logoColor} /> Flow Sequencer
        </a>
      </h1>
      {sectionHref ? (
        <a className="bar-page" href={sectionHref}>
          {section}
        </a>
      ) : (
        <span className="bar-page">{section}</span>
      )}
    </header>
  );
}
