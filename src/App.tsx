import { useCallback, useEffect, useRef, useState } from 'react';
import { Builder } from './Builder';
import type { SampleFlow } from './data/samples';
import { Dialog, type DialogSpec } from './Dialog';
import { unlockPlayback } from './player/conductor';
import { FlowList } from './FlowList';
import { ArrowLeftIcon, CheckIcon, LinkIcon, PlusIcon, SaveIcon, UndoIcon } from './icons';
import { Logo } from './Logo';
import { deleteFlow, listFlows, loadDraft, newId, putFlow, type SavedFlow, saveDraft } from './library';
import { decodeSteps, encodeSteps, fromHash, shareUrl, toHash } from './link';
import type { Sequence } from './sequence';
import { useHistory } from './useHistory';

interface Opened {
  /** The saved flow being edited, or null for one not in My flows. */
  id: string | null;
  name: string;
  seq: Sequence;
  notice: string | null;
}

const droppedNotice = (dropped: number) =>
  dropped > 0
    ? `This link had ${dropped} ${dropped === 1 ? 'step' : 'steps'} at the end that couldn’t be loaded, probably moves that have since changed. The rest is here.`
    : null;

/** A share link wins over the stored draft, unless it is the draft (a reload). */
function initial(): Opened {
  const draft = loadDraft();
  const linked = fromHash(location.hash);
  if (linked) {
    const isDraft = draft && linked.dropped === 0 && draft.steps === encodeSteps(linked.seq) && draft.name === linked.name;
    return { id: isDraft ? draft.id : null, name: linked.name, seq: linked.seq, notice: droppedNotice(linked.dropped) };
  }
  if (draft) return { id: draft.id, name: draft.name, seq: decodeSteps(draft.steps).seq, notice: null };
  return { id: null, name: '', seq: [], notice: null };
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
  const lastOpen = useRef(0);
  const timelineRef = useRef<HTMLElement>(null);

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

  useEffect(() => {
    // Keep the newest step in view. Only the desktop timeline scrolls on its own;
    // on phones it sits below the builder and this does nothing. A flow that was
    // just opened is left at its top (the list starts it on page one).
    const el = timelineRef.current;
    if (lastOpen.current !== openCount) lastOpen.current = openCount;
    else if (el) el.scrollTop = el.scrollHeight;
  }, [seq.length, view, openCount]);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(null), 2000);
    return () => clearTimeout(t);
  }, [copied]);


  const open = useCallback(
    (next: Opened) => {
      reset(next.seq);
      setOpenCount((n) => n + 1);
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
  };

  /**
   * Runs `proceed` straight away, or first asks what to do with unsaved
   * changes: save them, discard them, or stay put.
   */
  const guardUnsaved = (title: string, saveLabel: string, proceed: () => void, onCancel?: () => void) => {
    if (!dirty) return proceed();
    setDialog({
      title,
      body: `“${name.trim() || 'Untitled flow'}” has changes that aren’t saved.`,
      actions: [
        {
          label: saveLabel,
          kind: 'primary',
          run: () => {
            save();
            proceed();
          },
        },
        { label: 'Discard changes', kind: 'danger', run: proceed },
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
    guardUnsaved('Start a new flow?', 'Save and start new', () => open({ id: null, name: '', seq: [], notice: null }));

  const openSaved = (f: SavedFlow) => {
    if (f.id === id) return setView('builder');
    guardUnsaved(`Open “${f.name}”?`, 'Save and open', () =>
      open({ id: f.id, name: f.name, seq: decodeSteps(f.steps).seq, notice: null }),
    );
  };

  // A sample opens as an unsaved copy, so the sample itself never changes.
  const openSample = (f: SampleFlow, play = false) =>
    guardUnsaved(`Open “${f.name}”?`, 'Save and open', () => {
      open({ id: null, name: f.name, seq: f.seq, notice: null });
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
          {/* Home is the sequencer. A plain click never clears the open flow; opening it in a new tab starts fresh. */}
          <a
            className="home"
            href="./"
            onClick={(e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
              e.preventDefault();
              setView('builder');
            }}
          >
            <Logo size={22} /> Flow Sequencer
          </a>
        </h1>
        {view === 'builder' ? (
          <>
            <div className="bar-title">
              <input
                className="flow-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Untitled flow"
                aria-label="Flow name"
                maxLength={80}
              />
              <span className="status">{status}</span>
            </div>
            <div className="bar-actions">
            {/* Icon-only; data-tip is the hover/focus tooltip and aria-label the spoken name. */}
            <div className="flow-buttons">
              <button className="icon-btn" onClick={undo} disabled={!canUndo} aria-label="Undo" data-tip="Undo (⌘Z)">
                <UndoIcon />
              </button>
              <button
                className="icon-btn"
                onClick={save}
                disabled={seq.length === 0 || !dirty}
                aria-label="Save"
                data-tip="Save to My flows"
              >
                <SaveIcon />
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
                <PlusIcon />
              </button>
            </div>
            <button
              className="nav"
              onClick={() => setView('flows')}
              aria-label={`Flows, ${flows.length} saved`}
            >
              Flows
              {flows.length > 0 && <span className="count">{flows.length}</span>}
            </button>
            </div>
          </>
        ) : (
          <>
            <span className="bar-page">My flows</span>
            <button className="nav" onClick={() => setView('builder')}>
              <ArrowLeftIcon /> Back to sequencer
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
          onCopySampleLink={(f) => copyLink(f.id, f.name, encodeSteps(f.seq))}
        />
      ) : (
        <Builder
          seq={seq}
          set={set}
          timelineRef={timelineRef}
          onOpenSample={(f) => openSample(f)}
          onPlaySample={playSample}
          recent={flows}
          onOpenSaved={openSaved}
          onSeeAll={() => setView('flows')}
          autoplay={autoplay}
          openCount={openCount}
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
