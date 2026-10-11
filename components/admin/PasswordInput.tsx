"use client";

import { useState } from "react";

export function PasswordInput({
  id,
  name,
  label,
  autoComplete,
  error,
  required = true,
}: {
  id: string;
  name: string;
  label: string;
  autoComplete: string;
  error?: string;
  required?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          required={required}
          maxLength={128}
          className="input pr-24"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-err` : undefined}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute inset-y-1 right-1 rounded-lg px-3 text-xs font-semibold text-cyan-electric hover:bg-white/5"
          aria-pressed={show}
          aria-controls={id}
        >
          {show ? "Hide" : "Show"}
        </button>
      </div>
      {error && <p id={`${id}-err`} className="field-error">{error}</p>}
    </div>
  );
}
