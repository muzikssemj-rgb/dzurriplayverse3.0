"use client";

import { useActionState } from "react";
import { loginAction } from "@/lib/actions/auth";
import { initialActionState } from "@/lib/actions/state";
import { PasswordInput } from "@/components/admin/PasswordInput";
import { SubmitButton } from "@/components/admin/SubmitButton";

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, initialActionState);
  return (
    <form action={formAction} className="space-y-4" noValidate>
      {/* Medan nama pengguna tersembunyi membantu pengurus kata laluan pelayar */}
      <input type="text" name="username" value="owner" autoComplete="username" readOnly hidden />
      <PasswordInput id="password" name="password" label="Admin password" autoComplete="current-password" />
      {state.error && (
        <p className="field-error" role="alert">{state.error}</p>
      )}
      <SubmitButton className="btn-primary w-full" pendingText="Signing in…">
        Sign in
      </SubmitButton>
    </form>
  );
}
