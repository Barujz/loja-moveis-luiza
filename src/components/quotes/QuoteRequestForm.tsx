"use client";

import { useActionState } from "react";
import { requestCatalogQuote } from "@/lib/quotes/actions";
import type { AuthFormState } from "@/lib/auth/actions";
import { fieldClass, labelClass, FormFeedback, SubmitButton } from "@/components/auth/AuthFields";

const initial: AuthFormState = { error: null, message: null };

export function QuoteRequestForm({ catalogId }: { catalogId: string }) {
  const [state, action, pending] = useActionState(requestCatalogQuote, initial);
  const message = state.values?.message ?? "";

  return (
    <form key={state.attempt ?? 0} action={action} className="grid max-w-xl gap-5">
      <input type="hidden" name="catalogId" value={catalogId} />
      <FormFeedback error={state.error} message={state.message} />
      <label className="block">
        <span className={labelClass}>Mensagem</span>
        <textarea
          className={`${fieldClass} mt-2 min-h-32 resize-y`}
          name="message"
          required
          minLength={3}
          maxLength={2000}
          defaultValue={message}
          placeholder="Descreva o que precisa neste catálogo."
        />
        <span className="mt-1.5 block text-xs text-muted">Entre 3 e 2000 caracteres.</span>
      </label>
      <SubmitButton pending={pending}>Enviar pedido</SubmitButton>
    </form>
  );
}
