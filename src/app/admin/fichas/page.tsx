import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireApprovedAdmin } from "@/lib/admin/access";
import { createClient } from "@/lib/supabase/server";
import { formatQuoteDate } from "@/lib/quotes/labels";

export const metadata: Metadata = { title: "Fichas cadastrais" };

export default async function AdminRegistrationFormsPage() {
  await requireApprovedAdmin();
  const supabase = await createClient();
  const { data: forms } = await supabase
    .from("registration_forms")
    .select("id, party, legal_name, responsible_name, created_at")
    .order("created_at", { ascending: false });

  return (
    <>
      <PageHeader
        eyebrow="Administração"
        title="Fichas cadastrais"
        description="Consulta das fichas recebidas. Esta tela não altera os dados gravados pelo autor."
        breadcrumbs={[
          { label: "Início", href: "/" },
          { label: "Painel", href: "/admin" },
          { label: "Fichas" },
        ]}
      />
      <Container className="py-16">
        <ul className="divide-y divide-line border-y border-line">
          {(forms ?? []).length === 0 ? (
            <li className="py-4 text-muted">Nenhuma ficha recebida.</li>
          ) : (
            forms?.map((form) => (
              <li key={form.id} className="flex flex-wrap items-baseline justify-between gap-3 py-4">
                <div>
                  <p className="text-ink">{form.legal_name}</p>
                  <p className="text-sm text-muted">
                    {form.party === "fornecedor" ? "Fornecedor" : "Comprador"} · {form.responsible_name} ·{" "}
                    {formatQuoteDate(form.created_at)}
                  </p>
                </div>
                <Link href={`/admin/fichas/${form.id}`} className="text-sm text-ink underline underline-offset-4 hover:text-brass">
                  Ver ficha
                </Link>
              </li>
            ))
          )}
        </ul>
      </Container>
    </>
  );
}
