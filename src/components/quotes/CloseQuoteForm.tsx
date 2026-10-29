"use client";

import { useActionState } from "react";
import { closeQuoteRequest } from "@/lib/quotes/actions";
import type { AuthFormState } from "@/lib/auth/actions";
import { FormFeedback } from "@/components/auth/AuthFields";
import { Button } from "@/components/ui/Button";

const initial: AuthFormState = { error: null, message: null };

export function CloseQuoteForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState(closeQuoteRequest, initial);

  return (
    <form action={action} className="mt-4 grid gap-3">
      <input type="hidden" name="id" value={id} />
      <FormFeedback error={state.error} message={state.message} />
      <label className="flex items-start gap-3 text-sm text-ink">
        <input className="mt-1" type="checkbox" name="confirm" value="sim" required />
        Confirmo o encerramento deste pedido.
      </label>
      <div>
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? "Aguarde…" : "Encerrar"}
        </Button>
      </div>
    </form>
  );
}
