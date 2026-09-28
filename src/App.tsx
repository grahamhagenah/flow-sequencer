import { type CSSProperties, useCallback, useEffect, useRef, useState } from 'react';
import { Builder, type Layout, type OpenLayout } from './Builder';
import { FIRST_POSE } from './data/poses';
import type { SampleFlow } from './data/samples';
import { sampleLook } from './data/sampleLooks';
import { colorId, flowColor, randomColor } from './colors';
import { LookPicker } from './LookPicker';
import { iconId } from './flowIcons';
import { Dialog, type DialogSpec } from './Dialog';
import { FlowFinished, SharedWelcome } from './ShareScreens';
import { unlockPlayback } from './player/conductor';
import { FlowList } from './FlowList';
import { ArrowLeftIcon, CheckIcon, FlowsIcon, NewFlowIcon, SaveIcon, UndoIcon } from './icons';
import { Logo } from './Logo';
import { deleteFlow, listFlows, loadDraft, loadResume, newId, putFlow, type SavedFlow, saveDraft, saveResume } from './library';
import { decodeSteps, encodeSteps, fromHash, shareUrl, toHash } from './link';
import { type Sequence, start } from './sequence';
import { useHistory } from './useHistory';
import { useLongPressTips } from './useLongPressTips';

interface Opened {
  /** The saved flow being edited, or null for one not in My flows. */
  id: string | null;
  name: string;
  /** A FLOW_COLORS id, or null for the default. */
  color: string | null;
  /** A FLOW_ICONS id, or null for none. */
  icon: string | null;
  seq: Sequence;
  notice: string | null;
  /** Which view it opens in: the list from Open, one pose at a time from Play. Otherwise the last one used. */
  layout?: Layout;
  /** Someone else's shared link: it opens on a welcome, not the editor. */
  welcome?: boolean;
}

const EMPTY: Opened = { id: null, name: '', color: null, icon: null, seq: [], notice: null };
const FRESH_STEPS = encodeSteps(start(FIRST_POSE));

/** A flow's contents as one string, to tell whether it has changed since it was opened. */
const flowKey = (steps: string, name: string, color: string | null, icon: string | null) =>
  JSON.stringify([steps, name.trim(), color, icon]);

/** How a flow was when it was opened, or null for none (the start page). */
const openedKey = (o: Opened) => (o.seq.length ? flowKey(encodeSteps(o.seq), o.name, o.color, o.icon) : null);

const droppedNotice = (dropped: number) =>
  dropped > 0
    ? `This link had ${dropped} ${dropped === 1 ? 'step' : 'steps'} at the end that couldn’t be loaded, probably moves that have since changed. The rest is here.`
    : null;

/**
 * A link (or a reload, whose address is the flow's link) opens that flow. The bare
 * address opens the start page: a flow that was in progress is put aside to offer
 * again there ("Continue where you left off") rather than opened.
 */
function initial(): Opened {
  const draft = loadDraft();
  const linked = fromHash(location.hash);
  if (linked) {
    const isDraft = draft && linked.dropped === 0 && draft.steps === encodeSteps(linked.seq) && draft.name === linked.name;
    return {
      id: isDraft ? draft.id : null,
      name: linked.name,
      color: linked.color,
      icon: linked.icon,
      seq: linked.seq,
      notice: droppedNotice(linked.dropped),
      // A link to play it opens on its first pose with the player ready (browsers need a
      // tap before the voice can start, so it waits for Play).
      layout: linked.play ? 'single' : undefined,
      // Not for a reload of your own flow (its address is its link), nor a link that plays it.
      welcome: !isDraft && !linked.play,
    };
  }
  if (draft?.steps) saveResume(draft);
  return EMPTY;
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    window.prompt('Copy this link:', text);
    return false;
  }
}

export function App() {
  const [init] = useState(initial);
  const { value: seq, set, reset, undo, redo, canUndo } = useHistory<Sequence>(() => init.seq);
  const [id, setId] = useState(init.id);
  const [name, setName] = useState(init.name);
  const [color, setColor] = useState(init.color);
  const [icon, setIcon] = useState(init.icon);
  // An unsaved flow opened from a sample or a link has nothing to save until it's changed.
  const [openedAs, setOpenedAs] = useState(() => openedKey(init));
  const [notice, setNotice] = useState(init.notice);
  const [welcome, setWelcome] = useState(!!init.welcome);
  const [flows, setFlows] = useState(listFlows);
  const [view, setView] = useState<'builder' | 'flows'>('builder');
  const [copied, setCopied] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogSpec | null>(null);
  const [autoplay, setAutoplay] = useState(false);
  /** Bumped each time a flow is opened, so the sequence list can start it on its first page. */
  const [openCount, setOpenCount] = useState(init.layout ? 1 : 0);
  const [resume, setResume] = useState(loadResume);
  // An empty flow shows the start page until "Start a new sequence" opens the empty sequencer.
  const [choosing, setChoosing] = useState(false);
  const forgetResume = () => {
    saveResume(null);
    setResume(null);
  };
  const lastOpen = useRef(0);
  const timelineRef = useRef<HTMLElement>(null);
  // The header's icon buttons show their names on a long press on touch screens.
  const buttonsRef = useRef<HTMLDivElement>(null);
  useLongPressTips(buttonsRef, view);
  // A moment's check on the save button after saving from it.
  const [justSaved, setJustSaved] = useState(false);
  useEffect(() => {
    if (!justSaved) return;
    const t = setTimeout(() => setJustSaved(false), 1600);
    return () => clearTimeout(t);
  }, [justSaved]);

  const steps = encodeSteps(seq);
  const saved = id ? flows.find((f) => f.id === id) : undefined;
  // A flow started from scratch and not yet touched: just its pre-chosen first pose.
  const fresh = !id && !name.trim() && steps === FRESH_STEPS;
  // Or an unsaved one (a sample, a link) just as it was opened. Neither asks to be saved
  // on the way out, though the second can still be saved to My flows.
  const untouched = fresh || (!id && flowKey(steps, name, color, icon) === openedAs);
  const dirty = saved
    ? saved.steps !== steps ||
      saved.name !== name.trim() ||
      colorId(saved.color) !== color ||
      iconId(saved.icon) !== icon
    : seq.length > 0 && !untouched;

  // Keep the draft and the address bar in step with the flow, so a reload or a
  // bookmark always lands back here.
  useEffect(() => {
    saveDraft({ id, name, steps, color, icon });
    const url = seq.length ? `#${toHash(name.trim(), steps, color, icon)}` : location.pathname + location.search;
    history.replaceState(null, '', url);
  }, [id, name, steps, color, icon, seq.length]);

  // Coming back from the Flows page, show the newest pose and its choices. Only the
  // desktop panel scrolls on its own (on phones the page does, and this does nothing).
  // Edits scroll nothing here: the builder keeps the choices in place as poses are
  // added, and leaves the view alone on a removal. A flow that was just opened is left
  // at its top (the list starts it on page one), and so is the start page.
  const lastView = useRef(view);
  useEffect(() => {
    const el = timelineRef.current;
    const cameBack = view !== lastView.current;
    lastView.current = view;
    if (lastOpen.current !== openCount) lastOpen.current = openCount;
    else if (el && seq.length > 0 && cameBack) el.scrollTop = el.scrollHeight;
  }, [seq.length, view, openCount]);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(null), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  // Which view the latest open asked for, and for which open (see Builder).
  const [openLayout, setOpenLayout] = useState<OpenLayout | null>(() =>
    init.layout ? { count: 1, layout: init.layout } : null,
  );
  const openCountRef = useRef(openCount);
  openCountRef.current = openCount;
  const open = useCallback(
    (next: Opened) => {
      reset(next.seq);
      setOpenedAs(openedKey(next));
      setOpenCount((n) => n + 1);
      setOpenLayout(next.layout ? { count: openCountRef.current + 1, layout: next.layout } : null);
      setChoosing(false);
      setId(next.id);
      setName(next.name);
      setColor(next.color);
      setIcon(next.icon);
      setNotice(next.notice);
      setWelcome(!!next.welcome);
      setView('builder');
    },
    [reset],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== 'z' || view !== 'builder') return;
      if (e.target instanceof HTMLInputElement) return; // leave text undo to the name field
      e.preventDefault();
      if (e.shiftKey) redo();
      else undo();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo, view]);

  const save = () => {
    const flow: SavedFlow = { id: id ?? newId(), name: name.trim() || 'Untitled flow', steps, color, icon, updatedAt: Date.now() };
    putFlow(flow);
    setFlows(listFlows());
    setId(flow.id);
    setName(flow.name);
    return flow;
  };

  /**
   * Runs `proceed` straight away, or first asks what to do with unsaved
   * changes: save them, discard them, or stay put. `proceed` hears which, and
   * the saved flow's id when they were saved (or there were none to save).
   */
  const guardUnsaved = (
    title: string,
    saveLabel: string,
    proceed: (outcome: { discarded: boolean; savedId: string | null }) => void,
    onCancel?: () => void,
  ) => {
    if (!dirty) return proceed({ discarded: false, savedId: id });
    setDialog({
      title,
      body: `“${name.trim() || 'Untitled flow'}” has changes that aren’t saved.`,
      actions: [
        { label: saveLabel, kind: 'primary', run: () => proceed({ discarded: false, savedId: save().id }) },
        { label: 'Discard changes', kind: 'danger', run: () => proceed({ discarded: true, savedId: id }) },
      ],
      onCancel,
    });
  };

  // A pasted link in the same tab only changes the hash.
  useEffect(() => {
    const onHash = () => {
      const linked = fromHash(location.hash);
      if (
        !linked ||
        (encodeSteps(linked.seq) === steps && linked.name === name.trim() && linked.color === color && linked.icon === icon)
      )
        return;
      guardUnsaved(
        'Open the linked flow?',
        'Save and open',
        () =>
          open({
            id: null,
            name: linked.name,
            color: linked.color,
            icon: linked.icon,
            seq: linked.seq,
            notice: droppedNotice(linked.dropped),
            welcome: true,
          }),
        () => history.replaceState(null, '', `#${toHash(name.trim(), steps, color, icon)}`),
      );
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  });

  const copyLink = async (
    key: string,
    flowName: string,
    flowSteps: string,
    flowColor: string | null,
    flowIcon: string | null,
  ) => {
    if (await copyText(shareUrl(flowName, flowSteps, flowColor, flowIcon))) setCopied(key);
  };

  const newFlow = () =>
    guardUnsaved('Start a new flow?', 'Save and start new', () => {
      forgetResume();
      open(EMPTY);
    });

  // The logo: from the Flows page, back to the sequencer; from a flow, the start page,
  // with the flow offered there under "Continue where you left off" unless its changes
  // were discarded.
  const goHome = () => {
    if (view === 'flows') return setView('builder');
    if (seq.length === 0) return setChoosing(false);
    if (untouched) {
      forgetResume();
      return open(EMPTY);
    }
    guardUnsaved('Go to the start page?', 'Save and leave', ({ discarded, savedId }) => {
      if (discarded) forgetResume();
      else {
        const d = { id: savedId, name: name.trim(), steps, color, icon };
        saveResume(d);
        setResume(d);
      }
      open(EMPTY);
    });
  };

  // Picks up the flow put aside when the app opened at its bare address.
  const openResume = () => {
    if (!resume) return;
    guardUnsaved('Open the earlier flow?', 'Save and open', () => {
      forgetResume();
      open({
        id: resume.id,
        name: resume.name,
        color: colorId(resume.color),
        icon: iconId(resume.icon),
        seq: decodeSteps(resume.steps).seq,
        notice: null,
        layout: 'list',
      });
    });
  };

  const openSaved = (f: SavedFlow) => {
    if (f.id === id) return setView('builder');
    guardUnsaved(`Open “${f.name}”?`, 'Save and open', () =>
      open({
        id: f.id,
        name: f.name,
        color: colorId(f.color),
        icon: iconId(f.icon),
        seq: decodeSteps(f.steps).seq,
        notice: null,
        layout: 'list',
      }),
    );
  };

  // A sample opens as an unsaved copy, so the sample itself never changes.
  const openSample = (f: SampleFlow, play = false) =>
    guardUnsaved(`Open “${f.name}”?`, 'Save and open', () => {
      // In the colour and with the icon of its card.
      const look = sampleLook(f.id);
      open({
        id: null,
        name: f.name,
        color: look.colorId,
        icon: look.iconId,
        seq: f.seq,
        notice: null,
        layout: play ? 'single' : 'list',
      });
      if (play) setAutoplay(true);
    });

  const playSample = (f: SampleFlow) => {
    unlockPlayback(); // inside the click, so the voice can start once the flow is loaded
    openSample(f, true);
  };

  // From a shared link's welcome: the flow as it is, played one pose at a time or shown as a list.
  const openShared = (layout: Layout) => open({ id, name, color, icon, seq, notice, layout });
  const startShared = () => {
    unlockPlayback(); // inside the click, so the voice can start once the flow is in place
    openShared('single');
    setAutoplay(true);
  };

  const duplicate = (f: SavedFlow) => {
    putFlow({ id: newId(), name: `${f.name} (copy)`, steps: f.steps, color: f.color, icon: f.icon, updatedAt: Date.now() });
    setFlows(listFlows());
  };

  const remove = (f: SavedFlow) =>
    setDialog({
      title: `Delete “${f.name}”?`,
      body: 'It will be removed from My flows. Links you’ve already shared will still work.',
      actions: [
        {
          label: 'Delete',
          kind: 'danger',
          run: () => {
            deleteFlow(f.id);
            setFlows(listFlows());
            if (f.id === id) setId(null);
          },
        },
      ],
    });

  const status = saved ? (dirty ? 'Unsaved changes' : 'Saved') : seq.length ? 'Not saved yet' : '';

  return (
    // The open flow's colour is the accent everywhere: its poses, the play button, highlights.
    <div className="app" style={{ '--accent': flowColor(color).hex } as CSSProperties}>
      <Dialog spec={dialog} onClose={() => setDialog(null)} />
      {/* One bar: the app's name, the open flow's save status, and everything you do with it (the
          flow's name heads its list, in Builder). */}
      <header className="bar">
        <h1>
          {/* Home is the start page (see goHome); opening it in a new tab starts fresh there too. */}
          <a
            className="home"
            href="./"
            onClick={(e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
              e.preventDefault();
              goHome();
            }}
          >
            {/* White until a flow is open, then in its colour. */}
            <Logo size={22} color={seq.length > 0 || choosing ? 'var(--accent)' : undefined} /> Flow Sequencer
          </a>
        </h1>
        {view === 'builder' ? (
          <>
            {/* The start page has no flow yet, so no name for it; the app's tagline instead
                (on wider screens). */}
            {seq.length === 0 && !choosing && <span className="bar-tagline">Build a yoga flow, one pose at a time</span>}
            {(seq.length > 0 || choosing) && <span className="status">{status}</span>}
            {/* Icon-only; data-tip is the hover/focus tooltip and aria-label the spoken name. */}
            <div className="flow-buttons" ref={buttonsRef}>
              <button className="icon-btn" onClick={undo} disabled={!canUndo} aria-label="Undo" data-tip="Undo (⌘Z)">
                <UndoIcon />
              </button>
              {/* A dot while there are changes to save (the status text is hidden on phones),
                  and a check for a moment once saved. */}
              <button
                className={justSaved ? 'icon-btn tip-shown' : 'icon-btn'}
                onClick={() => {
                  save();
                  setJustSaved(true);
                }}
                disabled={seq.length === 0 || fresh || (!!saved && !dirty)}
                aria-label={justSaved ? 'Saved' : dirty && seq.length > 0 ? 'Save, unsaved changes' : 'Save'}
                data-tip={justSaved ? 'Saved' : 'Save to My flows'}
              >
                {justSaved ? <CheckIcon /> : <SaveIcon />}
                {dirty && seq.length > 0 && !justSaved && <span className="icon-dot" aria-hidden="true" />}
              </button>
              <button
                className="icon-btn"
                onClick={newFlow}
                disabled={seq.length === 0 && !id}
                aria-label="New flow"
                data-tip="New flow"
              >
                <NewFlowIcon />
              </button>
              {/* The Flows page, with a badge for how many are saved. */}
              <button
                className="icon-btn flows-icon"
                onClick={() => setView('flows')}
                aria-label={`Flows, ${flows.length} saved`}
                data-tip="My flows"
              >
                <FlowsIcon />
                {flows.length > 0 && <span className="icon-count">{flows.length}</span>}
              </button>
            </div>
          </>
        ) : (
          <>
            <span className="bar-page">My flows</span>
            <button className="nav" onClick={() => setView('builder')} aria-label="Back to sequencer">
              <ArrowLeftIcon /> <span className="nav-text">Back to sequencer</span>
            </button>
          </>
        )}
      </header>

      {view === 'flows' ? (
        <FlowList
          flows={flows}
          currentId={id}
          copiedKey={copied}
          onOpen={openSaved}
          onNew={newFlow}
          onCopyLink={(f) => copyLink(f.id, f.name, f.steps, colorId(f.color), iconId(f.icon))}
          onCopySampleLink={(f) => {
            const look = sampleLook(f.id);
            copyLink(`sample:${f.id}`, f.name, encodeSteps(f.seq), look.colorId, look.iconId);
          }}
          onDuplicate={duplicate}
          onDelete={remove}
          onOpenSample={(f) => openSample(f)}
          onPlaySample={playSample}
        />
      ) : (
        <Builder
          seq={seq}
          set={set}
          title={
            // The flow's icon (or a dot) in its colour, then its name, editable in place
            // (outlined on hover).
            <div className="list-title">
              <LookPicker color={color} icon={icon} onColor={setColor} onIcon={setIcon} />
              <label className="name-field" title="Rename this flow">
                <input
                  className="flow-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Untitled flow"
                  aria-label="Flow name"
                  maxLength={80}
                />
              </label>
            </div>
          }
          timelineRef={timelineRef}
          onOpenSample={(f) => openSample(f)}
          onPlaySample={playSample}
          recent={flows}
          resume={resume}
          onResume={openResume}
          onOpenSaved={openSaved}
          onSeeAll={() => setView('flows')}
          autoplay={autoplay}
          openCount={openCount}
          openLayout={openLayout}
          choosing={choosing}
          setChoosing={(on) => {
            // A flow started from scratch gets a colour of its own, picked at random.
            if (on) setColor(randomColor());
            setChoosing(on);
          }}
          onAutoplayStarted={() => setAutoplay(false)}
          welcome={
            welcome && (
              <SharedWelcome seq={seq} name={name} icon={icon} onStart={startShared} onBrowse={() => openShared('list')} />
            )
          }
          renderFinish={(close) => (
            <FlowFinished
              seq={seq}
              name={name}
              url={shareUrl(name.trim(), steps, color, icon)}
              canSave={!saved || dirty}
              onSave={save}
              onClose={close}
            />
          )}
          banner={
            notice && (
              <div className="notice" role="status">
                <span>{notice}</span>
                <button onClick={() => setNotice(null)} aria-label="Dismiss">×</button>
              </div>
            )
          }
        />
      )}
    </div>
  );
}
