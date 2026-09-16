"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Send } from "lucide-react";
import { getProductBySlug } from "@/lib/products";
import { site, whatsappLink } from "@/lib/site";
import { cn } from "@/lib/cn";

const projectTypes = [
  "Hotel",
  "Resort",
  "Pousada",
  "Restaurante / Bar",
  "Escritório / Corporativo",
  "Residencial de alto padrão",
  "Outro",
];

const inputClass =
  "w-full rounded-sm border border-line bg-cream px-4 py-3 text-ink placeholder:text-muted/70 focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass transition-colors";
const labelClass = "block text-sm font-medium text-ink";

export function QuoteForm() {
  const searchParams = useSearchParams();
  const produtoSlug = searchParams.get("produto");
  const produto = produtoSlug ? getProductBySlug(produtoSlug) : undefined;

  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    const linhas = [
      "*Novo pedido de orçamento — Luiza*",
      "",
      `Nome: ${data.get("nome")}`,
      `Empresa/Hotel: ${data.get("empresa") || "—"}`,
      `E-mail: ${data.get("email")}`,
      `Telefone: ${data.get("telefone")}`,
      `Tipo de projeto: ${data.get("tipo")}`,
      produto ? `Peça de interesse: ${produto.name}` : "",
      "",
      "Mensagem:",
      `${data.get("mensagem") || "—"}`,
    ]
      .filter(Boolean)
      .join("\n");

    // Sem backend ainda: encaminha a mensagem pelo WhatsApp da empresa.
    // No futuro, basta trocar este trecho por um POST para a API/CRM.
    window.open(whatsappLink(linhas), "_blank", "noopener,noreferrer");
    setSent(true);
    form.reset();
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center rounded-sm border border-line bg-paper px-8 py-16 text-center">
        <CheckCircle2 size={48} className="text-brass" />
        <h3 className="mt-6 font-display text-3xl text-ink">
          Pedido encaminhado!
        </h3>
        <p className="mt-3 max-w-md text-muted">
          Abrimos o WhatsApp com o seu pedido pré-preenchido — é só enviar.
          Retornaremos em até um dia útil. Se preferir, escreva para{" "}
          <a href={`mailto:${site.email}`} className="text-brass underline">
            {site.email}
          </a>
          .
        </p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="mt-8 text-sm font-medium text-ink underline underline-offset-4 hover:text-brass"
        >
          Enviar outro pedido
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {produto && (
        <div className="rounded-sm border border-brass/30 bg-brass/5 px-4 py-3 text-sm text-ink">
          Orçamento para a peça: <strong>{produto.name}</strong>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="nome" className={labelClass}>
            Nome *
          </label>
          <input id="nome" name="nome" required className={cn(inputClass, "mt-2")} />
        </div>
        <div>
          <label htmlFor="empresa" className={labelClass}>
            Empresa / Hotel
          </label>
          <input id="empresa" name="empresa" className={cn(inputClass, "mt-2")} />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="email" className={labelClass}>
            E-mail *
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className={cn(inputClass, "mt-2")}
          />
        </div>
        <div>
          <label htmlFor="telefone" className={labelClass}>
            Telefone / WhatsApp *
          </label>
          <input
            id="telefone"
            name="telefone"
            required
            className={cn(inputClass, "mt-2")}
          />
        </div>
      </div>

      <div>
        <label htmlFor="tipo" className={labelClass}>
          Tipo de projeto *
        </label>
        <select
          id="tipo"
          name="tipo"
          required
          defaultValue=""
          className={cn(inputClass, "mt-2")}
        >
          <option value="" disabled>
            Selecione…
          </option>
          {projectTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="mensagem" className={labelClass}>
          Conte sobre o seu projeto
        </label>
        <textarea
          id="mensagem"
          name="mensagem"
          rows={5}
          placeholder="Ambientes, quantidades, prazo desejado…"
          className={cn(inputClass, "mt-2 resize-none")}
        />
      </div>

      <button
        type="submit"
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-8 py-4 text-sm font-medium text-cream transition-colors duration-300 hover:bg-brass sm:w-auto"
      >
        <Send size={17} />
        Enviar pedido de orçamento
      </button>

      <p className="text-xs text-muted">
        Ao enviar, seu pedido é encaminhado pelo WhatsApp. Não compartilhamos
        seus dados com terceiros.
      </p>
    </form>
  );
}
