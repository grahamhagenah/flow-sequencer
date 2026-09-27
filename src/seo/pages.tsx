import type { CSSProperties, ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { getPose, renderLabel, TRANSITION_BY_ID } from '../data/graph';
import { BASES, POSES } from '../data/poses';
import { SAMPLE_FLOWS, type SampleFlow } from '../data/samples';
import { sampleLook } from '../data/sampleLooks';
import { TRANSITIONS } from '../data/transitions';
import type { Pose } from '../data/types';
import { encodeSteps, toHash } from '../link';
import { classMs } from '../player/conductor';
import { PoseFigure } from '../PoseFigure';
import { SiteBar } from '../SiteBar';
import { SiteFooter } from '../SiteFooter';

// Pages for search engines (and people arriving from them), written out at build time
// (see seoPages in vite.config.ts): one for each ready-made flow and each pose, an index
// of the flows, and a sitemap. The app keeps its flows after the "#" in its address,
// which search engines don't read, and draws them with JavaScript; these are plain HTML
// with the same words and drawings, each linking into the app to play.

export const SITE = 'https://yoga.grahamhagenah.com';
const NAME = 'Flow Sequencer';
/** How long a class runs for the numbers on these pages: the player's default pace. */
const minutes = (f: SampleFlow) => Math.max(1, Math.round(classMs(f.seq, 5, true) / 60000));

export interface Page {
  /** Where it's written in the build, e.g. "flows/crow-peak/index.html". */
  fileName: string;
  content: string;
}

/** The assets every page links to, as paths from the site's root (hashed by the build). */
export interface Assets {
  css: string[];
}

const [flowTitle, flowStyle] = [(f: SampleFlow) => f.name.split(' · ')[0], (f: SampleFlow) => f.name.split(' · ')[1] ?? ''];
const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);
const baseLabel = (p: Pose) => BASES.find(([b]) => b === p.base)?.[1] ?? '';
const flowPath = (f: SampleFlow) => `flows/${f.id}/`;
const posePath = (p: Pose | string) => `poses/${typeof p === 'string' ? p : p.id}/`;
/** A plural for a count: "1 pose", "3 poses". */
const n = (count: number, one: string, many = `${one}s`) => `${count} ${count === 1 ? one : many}`;

/** The link that opens a flow in the app on its first pose, the player ready (see fromHash). */
const playLink = (f: SampleFlow, root: string) => {
  const look = sampleLook(f.id);
  return `${root}#${toHash(f.name, encodeSteps(f.seq), look.colorId, look.iconId)}&p=1`;
};

const flowsWith = (poseId: string) => SAMPLE_FLOWS.filter((f) => f.seq.some((s) => s.poseId === poseId));

/** The poses in a flow, each once, in the order they first come. */
const posesIn = (f: SampleFlow) => [...new Set(f.seq.map((s) => s.poseId))].map(getPose);

/** The whole document around a page's body. */
function doc({
  path,
  root,
  title,
  description,
  accent,
  jsonLd,
  body,
  assets,
  section,
}: {
  path: string;
  root: string;
  /** The part of the site it's in, for the bar: its name, and a link unless this is its index. */
  section: { name: string; href?: string };
  title: string;
  description: string;
  accent?: string;
  jsonLd: object[];
  body: ReactNode;
  assets: Assets;
}): string {
  const url = `${SITE}/${path}`;
  const esc = (s: string) => s.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
  const head = [
    '<meta charset="UTF-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1.0" />',
    '<meta name="color-scheme" content="dark" />',
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}" />`,
    `<link rel="canonical" href="${url}" />`,
    '<meta property="og:type" content="website" />',
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:site_name" content="${NAME}" />`,
    `<meta property="og:image" content="${SITE}/og-image.png" />`,
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:image" content="${SITE}/og-image.png" />`,
    `<link rel="icon" href="${root}favicon.svg" type="image/svg+xml" />`,
    ...assets.css.map((c) => `<link rel="stylesheet" href="${root}${c}" />`),
    ...jsonLd.map((j) => `<script type="application/ld+json">${JSON.stringify(j).replaceAll('<', '\\u003c')}</script>`),
  ];
  const html = renderToStaticMarkup(
    // In the flow's colour on a flow's page; elsewhere white, like the poses page.
    <body style={{ '--accent': accent ?? 'var(--text)' } as CSSProperties}>
      <SiteBar root={root} section={section.name} sectionHref={section.href} logoColor={accent} />
      <div className="guide">
        <main>{body}</main>
        <SiteFooter root={root} />
      </div>
    </body>,
  );
  return `<!doctype html>\n<html lang="en">\n<head>\n${head.map((h) => `  ${h}`).join('\n')}\n</head>\n${html}\n</html>\n`;
}

/** "Flow Sequencer › Flows › Crow Pose": the page's place in the site, as structured data. */
function crumbs(trail: [name: string, path: string][]) {
  const all: [string, string][] = [[NAME, ''], ...trail];
  return {
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: all.map(([name, path], i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name,
        item: `${SITE}/${path}`,
      })),
    },
  };
}

const PlayIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M7 4.5v15l12-7.5z" fill="currentColor" />
  </svg>
);

/** A flow's own page: what it is, every step in order, and a link that opens it in the app. */
function flowPage(f: SampleFlow, assets: Assets): Page {
  const root = '../../';
  const path = flowPath(f);
  const look = sampleLook(f.id);
  const title = flowTitle(f);
  const style = flowStyle(f);
  const mins = minutes(f);
  const poses = posesIn(f);
  const trail = crumbs([
    ['Ready-made flows', 'flows/'],
    [title, path],
  ]);
  const description = `${f.description} A ${mins}-minute yoga flow of ${f.seq.length} steps, with a voice to guide you. Free, in your browser.`;
  const others = SAMPLE_FLOWS.filter((o) => o.id !== f.id && !!o.peak === !!f.peak);
  const stepText = (i: number) => {
    const s = f.seq[i];
    const move = s.via === undefined ? 'Begin here' : renderLabel(TRANSITION_BY_ID.get(s.via)!.label, s.side);
    return { move, pose: getPose(s.poseId) };
  };

  const body = (
    <>
      <article className="guide-flow">
        <p className="guide-kicker">{f.peak ? 'Peak pose flow' : 'Ready-made flow'}</p>
        <h1 className="guide-title">
          <span className="guide-icon" aria-hidden="true">
            {look.icon}
          </span>
          {title}
        </h1>
        <p className="guide-meta">
          {cap(style)} · {n(f.seq.length, 'step')} · about {mins} min
        </p>
        <p className="guide-lede">{f.description}</p>
        <p>
          <a className="guide-play" href={playLink(f, root)}>
            <PlayIcon /> Play this flow
          </a>
        </p>
        <p className="guide-note">
          It opens in {NAME} on the first pose: press play, and a voice calls each move and counts your breaths. You
          can change anything in it first.
        </p>

        <h2>The sequence</h2>
        <ol className="guide-steps">
          {f.seq.map((s, i) => {
            const { move, pose } = stepText(i);
            return (
              <li key={i}>
                <PoseFigure poseId={s.poseId} side={s.side} size={36} />
                <span className="guide-step-text">
                  <span className="guide-step-move">{move}</span>
                  <a className="guide-step-pose" href={`${root}${posePath(pose)}`}>
                    {pose.name}
                  </a>
                  {pose.sided && <span className="guide-side">{s.side === 'right' ? 'Right' : 'Left'}</span>}
                </span>
                <span className="guide-breaths">{n(s.breaths, 'breath')}</span>
              </li>
            );
          })}
        </ol>

        <h2>The poses in it</h2>
        <ul className="guide-pose-grid">
          {poses.map((p) => (
            <li key={p.id}>
              <a href={`${root}${posePath(p)}`}>
                <PoseFigure poseId={p.id} size={56} />
                <span>{p.name}</span>
              </a>
            </li>
          ))}
        </ul>

        <h2>{f.peak ? 'More peak pose flows' : 'More ready-made flows'}</h2>
        <FlowLinks flows={others} root={root} />
      </article>
    </>
  );

  const howTo = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: `${title} yoga flow`,
    description: f.description,
    totalTime: `PT${mins}M`,
    url: `${SITE}/${path}`,
    step: f.seq.map((s, i) => {
      const { move, pose } = stepText(i);
      const side = pose.sided ? ` (${s.side} side)` : '';
      return {
        '@type': 'HowToStep',
        position: i + 1,
        name: `${pose.name}${side}`,
        text: `${move}. ${pose.name}${side}, ${n(s.breaths, 'breath')}. ${pose.cue}`,
        url: `${SITE}/${posePath(pose)}`,
      };
    }),
  };

  return {
    fileName: `${path}index.html`,
    content: doc({
      section: { name: 'Flows', href: `${root}flows/` },
      path,
      root,
      title: `${title} · ${mins}-minute ${f.peak ? 'peak pose yoga flow' : 'yoga flow'} · ${NAME}`,
      description,
      accent: look.color,
      jsonLd: [howTo, trail.jsonLd],
      body,
      assets,
    }),
  };
}

/**
 * Flows as cards, like the app's: icon and title (to the flow's page), length and
 * description, and Play, straight into the app.
 */
function FlowLinks({ flows, root }: { flows: SampleFlow[]; root: string }) {
  return (
    <ul className="guide-flow-list">
      {flows.map((f) => {
        const look = sampleLook(f.id);
        return (
          <li key={f.id} style={{ '--tone': look.color } as CSSProperties}>
            <a className="guide-flow-name" href={`${root}${flowPath(f)}`}>
              <span className="guide-icon" aria-hidden="true">
                {look.icon}
              </span>
              {flowTitle(f)}
            </a>
            <span className="guide-flow-meta">
              {cap(flowStyle(f))} · about {minutes(f)} min
            </span>
            <span className="guide-flow-desc">{f.description}</span>
            <span className="guide-flow-actions">
              <a className="guide-flow-play" href={playLink(f, root)} aria-label={`Play ${flowTitle(f)}`}>
                <PlayIcon /> Play
              </a>
              <a href={`${root}${flowPath(f)}`} aria-label={`${flowTitle(f)}: the steps and poses`}>
                Steps and poses
              </a>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/** The index of every ready-made flow. */
function flowsIndex(assets: Assets): Page {
  const root = '../';
  const path = 'flows/';
  const trail = crumbs([['Ready-made flows', path]]);
  const body = (
    <>
      <h1 className="guide-title">Ready-made yoga flows</h1>
      <p className="guide-lede">
        {SAMPLE_FLOWS.length} complete classes, from a ten-minute desk break to peak pose flows that build to Crow,
        Headstand or Wheel. Open any of them in {NAME} to play it with a voice guiding you, or change it to suit you.
      </p>
      <h2>Ready-made flows</h2>
      <FlowLinks flows={SAMPLE_FLOWS.filter((f) => !f.peak)} root={root} />
      <h2>Peak pose flows</h2>
      <FlowLinks flows={SAMPLE_FLOWS.filter((f) => f.peak)} root={root} />
      <h2>All the poses</h2>
      <p>
        <a href={`${root}poses/`}>Every pose drawing</a>, or look one up:{' '}
        {POSES.map((p, i) => (
          <span key={p.id}>
            <a href={`${root}${posePath(p)}`}>{p.name}</a>
            {i < POSES.length - 1 ? ', ' : '.'}
          </span>
        ))}
      </p>
    </>
  );
  const list = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: SAMPLE_FLOWS.map((f, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE}/${flowPath(f)}`,
      name: flowTitle(f),
    })),
  };
  return {
    fileName: `${path}index.html`,
    content: doc({
      section: { name: 'Flows' },
      path,
      root,
      title: `Ready-made yoga flows, with a voice to guide you · ${NAME}`,
      description: `${SAMPLE_FLOWS.length} free yoga classes to play in your browser: morning vinyasa, hip opening, a desk break, a runner's stretch, and peak pose flows for Crow, Headstand, Wheel and more.`,
      jsonLd: [list, trail.jsonLd],
      body,
      assets,
    }),
  };
}

/** Moves into or out of a pose, each other pose once, with the first cue that gets there. */
function moves(poseId: string, dir: 'from' | 'to') {
  const seen = new Map<string, string>();
  for (const t of TRANSITIONS) {
    const [here, there] = dir === 'from' ? [t.from, t.to] : [t.to, t.from];
    if (here !== poseId || there === poseId || seen.has(there)) continue;
    seen.set(there, renderLabel(t.label, 'right'));
  }
  return [...seen].map(([id, label]) => ({ pose: getPose(id), label }));
}

/** A pose's own page: its drawing, names, cue, and the poses it moves between. */
function posePage(p: Pose, assets: Assets): Page {
  const root = '../../';
  const path = posePath(p);
  const trail = crumbs([
    ['Poses', 'poses/'],
    [p.name, path],
  ]);
  const next = moves(p.id, 'from');
  const prev = moves(p.id, 'to');
  const flows = flowsWith(p.id);
  const also = [p.sanskrit, ...(p.aka ?? [])].filter(Boolean).join(', ');
  const kind = `${baseLabel(p).toLowerCase()} pose`;
  const description =
    `${p.name}${p.sanskrit ? ` (${p.sanskrit})` : ''}: ${p.cue} A ${kind}${p.sided ? ' done on each side' : ''}, ` +
    `with the poses it flows into and out of${flows.length ? ` and ${n(flows.length, 'free class', 'free classes')} to try it in` : ''}.`;

  const MoveList = ({ items }: { items: { pose: Pose; label: string }[] }) => (
    <ul className="guide-moves">
      {items.map(({ pose, label }) => (
        <li key={pose.id}>
          <a href={`${root}${posePath(pose)}`}>
            <PoseFigure poseId={pose.id} size={36} />
            <span>
              <span className="guide-step-pose">{pose.name}</span>
              <span className="guide-step-move">{label}</span>
            </span>
          </a>
        </li>
      ))}
    </ul>
  );

  const body = (
    <>
      <article className="guide-pose">
        <div className="guide-pose-head">
          <div className="guide-pose-figures">
            <PoseFigure poseId={p.id} side="right" size={160} />
            {p.sided && <PoseFigure poseId={p.id} side="left" size={160} />}
          </div>
          <div>
            <p className="guide-kicker">{baseLabel(p)}</p>
            <h1 className="guide-title">{p.name}</h1>
            {also && <p className="guide-also">{also}</p>}
            <p className="guide-lede">{p.cue}</p>
            <p className="guide-meta">
              {p.sided ? 'Done on each side, usually' : 'Usually'} held for {n(p.breaths, 'breath')}
            </p>
          </div>
        </div>

        {prev.length > 0 && (
          <>
            <h2>How to get into {p.name}</h2>
            <MoveList items={prev} />
          </>
        )}
        {next.length > 0 && (
          <>
            <h2>Where {p.name} flows next</h2>
            <MoveList items={next} />
          </>
        )}
        {flows.length > 0 && (
          <>
            <h2>Flows with {p.name}</h2>
            <FlowLinks flows={flows} root={root} />
          </>
        )}
        <p className="guide-note">
          <a href={`${root}poses/`}>See every pose drawing</a>, each free to download as an SVG, or{' '}
          <a href={root}>build your own flow</a> from {p.name}.
        </p>
      </article>
    </>
  );

  return {
    fileName: `${path}index.html`,
    content: doc({
      section: { name: 'Poses', href: `${root}poses/` },
      path,
      root,
      title: `${p.name}${p.sanskrit ? ` (${p.sanskrit})` : ''} · yoga pose, and what flows next · ${NAME}`,
      description,
      jsonLd: [trail.jsonLd],
      body,
      assets,
    }),
  };
}

/** Every page to write, the sitemap last. */
export function buildPages(assets: Assets): Page[] {
  const pages = [flowsIndex(assets), ...SAMPLE_FLOWS.map((f) => flowPage(f, assets)), ...POSES.map((p) => posePage(p, assets))];
  const urls = ['', 'poses/', ...pages.map((p) => p.fileName.replace(/index\.html$/, ''))];
  const sitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map((u) => `  <url><loc>${SITE}/${u}</loc></url>`),
    '</urlset>',
    '',
  ].join('\n');
  return [...pages, { fileName: 'sitemap.xml', content: sitemap }];
}
