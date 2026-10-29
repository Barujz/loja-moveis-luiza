"use client";

import { useActionState } from "react";
import Link from "next/link";
import { confirmEmailLink, resendSignupLink, type AuthFormState } from "@/lib/auth/actions";
import type { ConfirmOtpType } from "@/lib/auth/confirm";
import { Field, FormFeedback, SubmitButton } from "@/components/auth/AuthFields";

const initial: AuthFormState = { error: null, message: null };

export function ConfirmLinkForm({
  tokenHash,
  code,
  type,
  next,
  label,
}: {
  tokenHash: string;
  code: string;
  type: ConfirmOtpType | null;
  next: string;
  label: string;
}) {
  const [state, action, pending] = useActionState(confirmEmailLink, initial);

  if (state.terminal) {
    const waiting = state.error?.startsWith("Muitas tentativas");
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-5">
        <FormFeedback error={state.error} message={null} />
        {waiting ? (
          <p className="text-sm leading-relaxed text-muted">
            Aguarde alguns minutos. Recarregar esta página não envia outro e-mail.
          </p>
        ) : (
          <NewLinkOptions type={type} />
        )}
      </div>
    );
  }

  return (
    <form action={action} className="mx-auto flex max-w-xl flex-col gap-5">
      <FormFeedback error={state.error} message={state.message} />
      {tokenHash ? <input type="hidden" name="token_hash" value={tokenHash} /> : null}
      {code ? <input type="hidden" name="code" value={code} /> : null}
      {type ? <input type="hidden" name="type" value={type} /> : null}
      <input type="hidden" name="next" value={next} />
      <p className="text-sm leading-relaxed text-muted">
        O link só é validado quando você confirma aqui. Abrir o e-mail não conclui o acesso.
      </p>
      <SubmitButton pending={pending}>{label}</SubmitButton>
    </form>
  );
}

export function NewLinkOptions({ type }: { type: ConfirmOtpType | null }) {
  if (type === "invite") {
    return (
      <p className="text-sm leading-relaxed text-muted">
        Peça um novo convite à administração. Não solicite vários seguidos.
      </p>
    );
  }

  if (type === "recovery") {
    return (
      <Link href="/recuperar-senha" className="text-sm text-ink underline underline-offset-4 hover:text-brass">
        Pedir um novo link de senha
      </Link>
    );
  }

  if (type === "email_change") {
    return (
      <Link href="/conta" className="text-sm text-ink underline underline-offset-4 hover:text-brass">
        Voltar à conta
      </Link>
    );
  }

  if (type === "magiclink") {
    return (
      <Link href="/entrar" className="text-sm text-ink underline underline-offset-4 hover:text-brass">
        Entrar
      </Link>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm leading-relaxed text-muted">
        Se o cadastro ainda espera confirmação, peça um único novo link. Se a conta já existe, entre ou recupere a senha.
      </p>
      <ResendSignupForm />
      <div className="flex flex-col gap-2">
        <Link href="/entrar" className="text-sm text-ink underline underline-offset-4 hover:text-brass">
          Entrar
        </Link>
        <Link href="/recuperar-senha" className="text-sm text-ink underline underline-offset-4 hover:text-brass">
          Recuperar senha
        </Link>
      </div>
    </div>
  );
}

function ResendSignupForm() {
  const [state, action, pending] = useActionState(resendSignupLink, initial);

  return (
    <form action={action} className="flex flex-col gap-5">
      <FormFeedback error={state.error} message={state.message} />
      {state.message ? null : (
        <>
          <Field label="E-mail do cadastro" name="email" type="email" autoComplete="email" />
          <SubmitButton pending={pending}>Pedir novo link de confirmação</SubmitButton>
        </>
      )}
    </form>
  );
}
