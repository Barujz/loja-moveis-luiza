"use client";

import { useActionState } from "react";
import { reviewRegistration } from "@/lib/admin/actions";
import type { AuthFormState } from "@/lib/auth/actions";
import { FormFeedback, fieldClass, labelClass } from "@/components/auth/AuthFields";
import { Button } from "@/components/ui/Button";

const initial: AuthFormState = { error: null, message: null };

export function ReviewForm({ kind, id }: { kind: "comprador" | "fornecedor"; id: string }) {
  const [state, action, pending] = useActionState(reviewRegistration, initial);

  return (
    <form action={action} className="grid max-w-xl gap-5">
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="id" value={id} />
      <FormFeedback error={state.error} message={state.message} />
      <label className="block">
        <span className={labelClass}>Motivo da correção</span>
        <textarea
          className={`${fieldClass} mt-2 min-h-28 resize-y`}
          name="reason"
          maxLength={2000}
          placeholder="Obrigatório só ao solicitar correção."
        />
      </label>
      <div className="flex flex-wrap gap-3">
        <Button type="submit" name="decision" value="aprovar" disabled={pending}>
          {pending ? "Aguarde…" : "Aprovar"}
        </Button>
        <Button type="submit" name="decision" value="rejeitar" variant="outline" disabled={pending}>
          Rejeitar
        </Button>
        <Button type="submit" name="decision" value="corrigir" variant="outline" disabled={pending}>
          Solicitar correção
        </Button>
      </div>
    </form>
  );
}
