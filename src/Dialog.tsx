import { useEffect, useRef } from 'react';

export interface DialogAction {
  label: string;
  kind?: 'primary' | 'danger';
  run: () => void;
}

export interface DialogSpec {
  title: string;
  body: string;
  /** Shown before Cancel, which every dialog gets. */
  actions: DialogAction[];
  /** Runs on Cancel or Escape. */
  onCancel?: () => void;
}

/**
 * The app's own confirmation dialog, in place of window.confirm: that one can
 * be blocked or easily missed, and offers only OK or Cancel.
 */
export function Dialog({ spec, onClose }: { spec: DialogSpec | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (spec && !el.open) {
      el.showModal();
      // Start on a safe choice for Enter: the main action when it's a save, Cancel when
      // the only action destroys something. Never the first button, which may be Discard.
      el.querySelector<HTMLButtonElement>('.main.primary, .cancel')?.focus();
    }
    if (!spec && el.open) el.close();
  }, [spec]);

  const hasPrimary = spec?.actions.some((a) => a.kind === 'primary') ?? false;

  const cancel = () => {
    spec?.onCancel?.();
    onClose();
  };

  return (
    <dialog
      ref={ref}
      className="dialog"
      onCancel={(e) => {
        e.preventDefault(); // Escape: close through React state, not behind its back
        cancel();
      }}
      aria-labelledby="dialog-title"
    >
      {spec && (
        <>
          <h2 id="dialog-title">{spec.title}</h2>
          <p>{spec.body}</p>
          {/* A destructive action sits apart on the left when there's also a main one;
              Cancel and the main action go on the right, the main one last. */}
          <div className="dialog-actions">
            {spec.actions.map((a) => {
              const main = a.kind === 'primary' || (a.kind === 'danger' && !hasPrimary);
              return (
                <button
                  key={a.label}
                  className={[a.kind, main ? 'main' : 'aside'].filter(Boolean).join(' ')}
                  onClick={() => {
                    onClose();
                    a.run();
                  }}
                >
                  {a.label}
                </button>
              );
            })}
            <button className="cancel" onClick={cancel}>
              Cancel
            </button>
          </div>
        </>
      )}
    </dialog>
  );
}
