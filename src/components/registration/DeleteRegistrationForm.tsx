"use client";

import { useActionState } from "react";
import { deleteRegistrationForm } from "@/lib/registration/actions";
import type { AuthFormState } from "@/lib/auth/actions";
import { FormFeedback } from "@/components/auth/AuthFields";
import { Button } from "@/components/ui/Button";

const initial: AuthFormState = { error: null, message: null };

export function DeleteRegistrationForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState(deleteRegistrationForm, initial);

  return (
    <form action={action} className="mt-10 grid max-w-xl gap-3 border-t border-line pt-8">
      <input type="hidden" name="id" value={id} />
      <FormFeedback error={state.error} message={state.message} />
      <label className="flex items-start gap-3 text-sm text-ink">
        <input className="mt-1" type="checkbox" name="confirm" value="sim" required />
        Confirmo a exclusão desta ficha.
      </label>
      <div>
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? "Aguarde…" : "Excluir ficha"}
        </Button>
      </div>
    </form>
  );
}
