"use client";

import { useRef, useState } from "react";

/**
 * Butang yang memerlukan pengesahan sebelum menghantar borang (cth. Delete).
 * Borang dihantar ke Server Action; server menyemak semula kebenaran.
 */
export function ConfirmSubmit({
  action,
  fields,
  label,
  title,
  message,
  confirmLabel = "Yes, delete",
  className = "btn-ghost !min-h-9 !px-3 text-red-300",
}: {
  action: (formData: FormData) => Promise<void>;
  fields: Record<string, string>;
  label: string;
  title: string;
  message: string;
  confirmLabel?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)} aria-haspopup="dialog">
        {label}
      </button>
      {open && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
          aria-describedby="confirm-msg"
          className="fixed inset-0 z-[130] flex items-center justify-center bg-black/70 p-4"
          onKeyDown={(e) => e.key === "Escape" && !busy && setOpen(false)}
        >
          <form
            ref={formRef}
            action={async (fd) => {
              setBusy(true);
              await action(fd);
            }}
            className="glass w-full max-w-sm space-y-4 border-red-400/40 p-5"
          >
            {Object.entries(fields).map(([k, v]) => (
              <input key={k} type="hidden" name={k} value={v} />
            ))}
            <h2 id="confirm-title" className="text-lg font-bold">{title}</h2>
            <p id="confirm-msg" className="text-sm text-ink-muted">{message}</p>
            <div className="flex gap-2">
              <button type="button" className="btn-ghost flex-1" onClick={() => setOpen(false)} disabled={busy} autoFocus>
                Cancel
              </button>
              <button type="submit" className="btn-danger flex-1" disabled={busy}>
                {busy ? "Working…" : confirmLabel}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
