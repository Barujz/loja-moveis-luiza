"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signIn, type AuthFormState } from "@/lib/auth/actions";
import { Field, FormFeedback, SubmitButton } from "@/components/auth/AuthFields";

const initial: AuthFormState = { error: null, message: null };

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(signIn, initial);

  return (
    <form action={action} className="flex max-w-xl flex-col gap-5">
      <input type="hidden" name="next" value={next} />
      <FormFeedback error={state.error} message={state.message} />
      <Field label="E-mail" name="email" type="email" autoComplete="email" />
      <Field label="Senha" name="password" type="password" autoComplete="current-password" />
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
        <SubmitButton pending={pending}>Entrar</SubmitButton>
        <Link href="/recuperar-senha" className="text-sm text-ink underline underline-offset-4 hover:text-brass">
          Esqueci a senha
        </Link>
      </div>
      <p className="text-sm text-muted">
        Ainda não tem conta?{" "}
        <Link href="/cadastro" className="text-ink underline underline-offset-4 hover:text-brass">
          Cadastre-se
        </Link>
      </p>
    </form>
  );
}
