import { useCallback, useEffect, useRef, useState } from 'react';
import { Builder, type Layout, type OpenLayout } from './Builder';
import type { SampleFlow } from './data/samples';
import { Dialog, type DialogSpec } from './Dialog';
import { unlockPlayback } from './player/conductor';
import { FlowList } from './FlowList';
import { ArrowLeftIcon, CheckIcon, FlowsIcon, LinkIcon, NewFlowIcon, PencilIcon, SaveIcon, UndoIcon } from './icons';
import { Logo } from './Logo';
import { deleteFlow, listFlows, loadDraft, loadResume, newId, putFlow, type SavedFlow, saveDraft, saveResume } from './library';
import { decodeSteps, encodeSteps, fromHash, shareUrl, toHash } from './link';
import type { Sequence } from './sequence';
import { useHistory } from './useHistory';
import { useLongPressTips } from './useLongPressTips';

interface Opened {
  /** The saved flow being edited, or null for one not in My flows. */
  id: string | null;
  name: string;
  seq: Sequence;
  notice: string | null;
  /** Which view it opens in: the list from Open, one pose at a time from Play. Otherwise the last one used. */
  layout?: Layout;
}

const EMPTY: Opened = { id: null, name: '', seq: [], notice: null };

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
    return { id: isDraft ? draft.id : null, name: linked.name, seq: linked.seq, notice: droppedNotice(linked.dropped) };
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
  const [notice, setNotice] = useState(init.notice);
  const [flows, setFlows] = useState(listFlows);
  const [view, setView] = useState<'builder' | 'flows'>('builder');
  const [copied, setCopied] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogSpec | null>(null);
  const [autoplay, setAutoplay] = useState(false);
  /** Bumped each time a flow is opened, so the sequence list can start it on its first page. */
  const [openCount, setOpenCount] = useState(0);
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
  const dirty = saved ? saved.steps !== steps || saved.name !== name.trim() : seq.length > 0;

  // Keep the draft and the address bar in step with the flow, so a reload or a
  // bookmark always lands back here.
  useEffect(() => {
    saveDraft({ id, name, steps });
    const url = seq.length ? `#${toHash(name.trim(), steps)}` : location.pathname + location.search;
    history.replaceState(null, '', url);
  }, [id, name, steps, seq.length]);

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
  const [openLayout, setOpenLayout] = useState<OpenLayout | null>(null);
  const openCountRef = useRef(openCount);
  openCountRef.current = openCount;
  const open = useCallback(
    (next: Opened) => {
      reset(next.seq);
      setOpenCount((n) => n + 1);
      setOpenLayout(next.layout ? { count: openCountRef.current + 1, layout: next.layout } : null);
      setChoosing(false);
      setId(next.id);
      setName(next.name);
      setNotice(next.notice);
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
    const flow: SavedFlow = { id: id ?? newId(), name: name.trim() || 'Untitled flow', steps, updatedAt: Date.now() };
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
      if (!linked || (encodeSteps(linked.seq) === steps && linked.name === name.trim())) return;
      guardUnsaved(
        'Open the linked flow?',
        'Save and open',
        () => open({ id: null, name: linked.name, seq: linked.seq, notice: droppedNotice(linked.dropped) }),
        () => history.replaceState(null, '', `#${toHash(name.trim(), steps)}`),
      );
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  });

  const copyLink = async (key: string, flowName: string, flowSteps: string) => {
    if (await copyText(shareUrl(flowName, flowSteps))) setCopied(key);
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
    guardUnsaved('Go to the start page?', 'Save and leave', ({ discarded, savedId }) => {
      if (discarded) forgetResume();
      else {
        const d = { id: savedId, name: name.trim(), steps };
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
      open({ id: resume.id, name: resume.name, seq: decodeSteps(resume.steps).seq, notice: null, layout: 'list' });
    });
  };

  const openSaved = (f: SavedFlow) => {
    if (f.id === id) return setView('builder');
    guardUnsaved(`Open “${f.name}”?`, 'Save and open', () =>
      open({ id: f.id, name: f.name, seq: decodeSteps(f.steps).seq, notice: null, layout: 'list' }),
    );
  };

  // A sample opens as an unsaved copy, so the sample itself never changes.
  const openSample = (f: SampleFlow, play = false) =>
    guardUnsaved(`Open “${f.name}”?`, 'Save and open', () => {
      open({ id: null, name: f.name, seq: f.seq, notice: null, layout: play ? 'single' : 'list' });
      if (play) setAutoplay(true);
    });

  const playSample = (f: SampleFlow) => {
    unlockPlayback(); // inside the click, so the voice can start once the flow is loaded
    openSample(f, true);
  };

  const duplicate = (f: SavedFlow) => {
    putFlow({ id: newId(), name: `${f.name} (copy)`, steps: f.steps, updatedAt: Date.now() });
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
    <div className="app">
      <Dialog spec={dialog} onClose={() => setDialog(null)} />
      {/* One bar: the app name, the open flow's title and status, and everything you do with it. */}
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
            <Logo size={22} /> Flow Sequencer
          </a>
        </h1>
        {view === 'builder' ? (
          <>
            {/* The start page has no flow yet, so no name for it; the app's tagline instead
                (on wider screens). */}
            {seq.length === 0 && !choosing && <span className="bar-tagline">Build a yoga flow, one pose at a time</span>}
            {(seq.length > 0 || choosing) && (
              <div className="bar-title">
                {/* The name is editable in place; the pencil says so, and clicking it (it's inside the label) edits it. */}
                <label className="name-field" title="Rename this flow">
                  <input
                    className="flow-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Untitled flow"
                    aria-label="Flow name"
                    maxLength={80}
                  />
                  <PencilIcon />
                </label>
                <span className="status">{status}</span>
              </div>
            )}
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
                disabled={seq.length === 0 || !dirty}
                aria-label={justSaved ? 'Saved' : dirty && seq.length > 0 ? 'Save, unsaved changes' : 'Save'}
                data-tip={justSaved ? 'Saved' : 'Save to My flows'}
              >
                {justSaved ? <CheckIcon /> : <SaveIcon />}
                {dirty && seq.length > 0 && !justSaved && <span className="icon-dot" aria-hidden="true" />}
              </button>
              <button
                className={copied === 'current' ? 'icon-btn tip-shown' : 'icon-btn'}
                onClick={() => copyLink('current', name.trim(), steps)}
                disabled={seq.length === 0}
                aria-label={copied === 'current' ? 'Link copied' : 'Copy link'}
                data-tip={copied === 'current' ? 'Link copied' : 'Copy share link'}
              >
                {copied === 'current' ? <CheckIcon /> : <LinkIcon />}
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
          onCopyLink={(f) => copyLink(f.id, f.name, f.steps)}
          onDuplicate={duplicate}
          onDelete={remove}
          onOpenSample={(f) => openSample(f)}
          onPlaySample={playSample}
        />
      ) : (
        <Builder
          seq={seq}
          set={set}
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
          setChoosing={setChoosing}
          onAutoplayStarted={() => setAutoplay(false)}
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
