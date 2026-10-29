"use client";

import { useActionState } from "react";
import { reviewCatalog, reviewCatalogFile } from "@/lib/admin/catalog-actions";
import type { AuthFormState } from "@/lib/auth/actions";
import { FormFeedback, fieldClass, labelClass } from "@/components/auth/AuthFields";
import { Button } from "@/components/ui/Button";

const initial: AuthFormState = { error: null, message: null };

export function CatalogDecisionForm({ id, status }: { id: string; status: "pendente" | "aprovado" | "rejeitado" | "suspenso" }) {
  const [state, action, pending] = useActionState(reviewCatalog, initial);
  const canReview = status === "pendente";
  const canSuspend = status === "aprovado";
  const canCorrect = status === "pendente" || status === "aprovado";
  if (!canReview && !canSuspend && !canCorrect) return null;

  return (
    <form action={action} className="grid max-w-xl gap-5">
      <input type="hidden" name="id" value={id} />
      <FormFeedback error={state.error} message={state.message} />
      <label className="flex items-start gap-3 text-sm text-ink">
        <input className="mt-1" type="checkbox" name="confirm" value="sim" required />
        Confirmo esta decisão. A publicação e o histórico ficam a cargo do banco.
      </label>
      {canCorrect ? (
        <label className="block">
          <span className={labelClass}>Motivo da correção</span>
          <textarea className={`${fieldClass} mt-2 min-h-28 resize-y`} name="reason" maxLength={2000} />
        </label>
      ) : null}
      <div className="flex flex-wrap gap-3">
        {canReview ? (
          <Button type="submit" name="decision" value="aprovar" disabled={pending}>
            {pending ? "Aguarde…" : "Aprovar catálogo"}
          </Button>
        ) : null}
        {canReview ? (
          <Button type="submit" name="decision" value="rejeitar" variant="outline" disabled={pending}>
            Rejeitar catálogo
          </Button>
        ) : null}
        {canSuspend ? (
          <Button type="submit" name="decision" value="suspender" variant="outline" disabled={pending}>
            {pending ? "Aguarde…" : "Suspender catálogo"}
          </Button>
        ) : null}
        {canCorrect ? (
          <Button type="submit" name="decision" value="corrigir" variant="outline" disabled={pending}>
            Solicitar correção
          </Button>
        ) : null}
      </div>
    </form>
  );
}

export function FileDecisionForm({
  catalogId,
  fileId,
  status,
  current,
}: {
  catalogId: string;
  fileId: string;
  status: "pendente" | "aprovado" | "rejeitado" | "suspenso";
  current: boolean;
}) {
  const [state, action, pending] = useActionState(reviewCatalogFile, initial);
  const canReview = status === "pendente";
  const canSuspend = status === "aprovado" && current;
  if (!canReview && !canSuspend) return null;

  return (
    <form action={action} className="mt-3 grid gap-3">
      <input type="hidden" name="catalogId" value={catalogId} />
      <input type="hidden" name="fileId" value={fileId} />
      <FormFeedback error={state.error} message={null} />
      <label className="flex items-start gap-3 text-sm text-ink">
        <input className="mt-1" type="checkbox" name="confirm" value="sim" required />
        Confirmo a decisão deste PDF.
      </label>
      <div className="flex flex-wrap gap-3">
        {canReview ? (
          <Button type="submit" name="decision" value="aprovar" disabled={pending}>
            {pending ? "Aguarde…" : "Aprovar PDF"}
          </Button>
        ) : null}
        {canReview ? (
          <Button type="submit" name="decision" value="rejeitar" variant="outline" disabled={pending}>
            Rejeitar PDF
          </Button>
        ) : null}
        {canSuspend ? (
          <Button type="submit" name="decision" value="suspender" variant="outline" disabled={pending}>
            Suspender PDF
          </Button>
        ) : null}
      </div>
    </form>
  );
}
