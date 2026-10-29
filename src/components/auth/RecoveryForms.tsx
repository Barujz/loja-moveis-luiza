"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordReset, updatePassword, type AuthFormState } from "@/lib/auth/actions";
import { Field, FormFeedback, SubmitButton } from "@/components/auth/AuthFields";

const initial: AuthFormState = { error: null, message: null };

export function RecoveryRequestForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, initial);

  return (
    <form action={action} className="mx-auto flex max-w-xl flex-col gap-5">
      <FormFeedback error={state.error} message={state.message} />
      <Field label="E-mail" name="email" type="email" autoComplete="email" />
      <SubmitButton pending={pending}>Enviar link</SubmitButton>
      <Link href="/entrar" className="text-sm text-ink underline underline-offset-4 hover:text-brass">
        Voltar ao login
      </Link>
    </form>
  );
}

export function NewPasswordForm() {
  const [state, action, pending] = useActionState(updatePassword, initial);

  return (
    <form action={action} className="mx-auto flex max-w-xl flex-col gap-5">
      <FormFeedback error={state.error} message={state.message} />
      <Field label="Nova senha" name="password" type="password" autoComplete="new-password" />
      <Field label="Confirmar senha" name="passwordConfirm" type="password" autoComplete="new-password" />
      <SubmitButton pending={pending}>Salvar senha</SubmitButton>
    </form>
  );
}
