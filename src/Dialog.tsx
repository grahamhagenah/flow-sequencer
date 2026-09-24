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
    if (spec && !el.open) el.showModal();
    if (!spec && el.open) el.close();
  }, [spec]);

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
          <div className="dialog-actions">
            {spec.actions.map((a) => (
              <button
                key={a.label}
                className={a.kind}
                onClick={() => {
                  onClose();
                  a.run();
                }}
              >
                {a.label}
              </button>
            ))}
            <button onClick={cancel}>Cancel</button>
          </div>
        </>
      )}
    </dialog>
  );
}
