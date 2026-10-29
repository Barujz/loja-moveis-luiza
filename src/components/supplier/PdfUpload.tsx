"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { discardCatalogPdf, prepareCatalogPdf } from "@/lib/supplier/actions";
import { fieldClass, labelClass, FormFeedback } from "@/components/auth/AuthFields";
import { Button } from "@/components/ui/Button";

const pdfLimit = 52_428_800;

async function pdfProblem(file: File) {
  const name = file.name.trim().toLowerCase();
  if (!name.endsWith(".pdf")) return "Envie um arquivo com extensão .pdf.";
  if (file.type && file.type !== "application/pdf") return "O arquivo precisa ser um PDF.";
  if (file.size < 1 || file.size > pdfLimit) return "O PDF precisa ter entre 1 byte e 50 MB.";
  const header = new Uint8Array(await file.slice(0, 5).arrayBuffer());
  const signature = String.fromCharCode(...header);
  if (!signature.startsWith("%PDF")) return "O conteúdo não é um PDF.";
  return null;
}

export function PdfUpload({ catalogId }: { catalogId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = event.currentTarget;
    const file = new FormData(form).get("pdf");
    if (!(file instanceof File) || file.size === 0) {
      setError("Escolha um PDF.");
      setMessage(null);
      return;
    }

    const problem = await pdfProblem(file);
    if (problem) {
      setError(problem);
      setMessage(null);
      return;
    }

    setPending(true);
    setError(null);
    setMessage(null);
    let fileId: string | null = null;
    try {
      const prepared = await prepareCatalogPdf(catalogId, file.size, file.name);
      if (prepared.error || !prepared.fileId || !prepared.path) {
        setError(prepared.error ?? "Não foi possível preparar o envio.");
        return;
      }
      fileId = prepared.fileId;
      const supabase = createClient();
      const uploaded = await supabase.storage.from("catalog-pdfs").upload(prepared.path, file, {
        contentType: "application/pdf",
        upsert: false,
      });
      if (uploaded.error) {
        const removed = await discardCatalogPdf(prepared.fileId);
        setError(
          removed
            ? "Não foi possível guardar o PDF. O registro foi desfeito."
            : "Não foi possível guardar o PDF. Uma versão pendente pode ter ficado sem arquivo.",
        );
        return;
      }
      form.reset();
      setMessage("PDF enviado. Esta versão fica pendente até a Luiza aprovar e não substitui um PDF já aprovado.");
      router.refresh();
    } catch {
      if (fileId) await discardCatalogPdf(fileId);
      setError("Não foi possível guardar o PDF. O registro foi desfeito.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto flex max-w-xl flex-col gap-5">
      <FormFeedback error={error} message={message} />
      <label className="block">
        <span className={labelClass}>Novo PDF</span>
        <input className={`${fieldClass} mt-2`} name="pdf" type="file" accept="application/pdf,.pdf" required disabled={pending} />
        <span className="mt-1.5 block text-xs text-muted">Até 50 MB, já sem preços. Cada envio cria uma versão pendente.</span>
      </label>
      <Button type="submit" disabled={pending}>
        {pending ? "Enviando…" : "Enviar PDF"}
      </Button>
    </form>
  );
}
