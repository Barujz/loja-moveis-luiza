import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { getAccount } from "@/lib/auth/account";
import { loadOwnRegistrationForms } from "@/lib/registration/data";

export const metadata: Metadata = { title: "Fichas cadastrais" };

const notices: Record<string, string> = {
  excluida: "Ficha excluída.",
};

function canOpen(role: string) {
  return role === "comprador" || role === "fornecedor";
}

export default async function RegistrationFormsPage({
  searchParams,
}: {
  searchParams: Promise<{ feito?: string }>;
}) {
  const account = await getAccount();
  if (!account) redirect("/entrar?next=/conta/fichas");
  if (!account.hasProfile || !canOpen(account.role)) redirect("/conta");

  const query = await searchParams;
  const notice = query.feito ? notices[query.feito] : null;
  const canWrite = account.status === "pendente" || account.status === "aprovado";
  const forms = await loadOwnRegistrationForms();

  return (
    <>
      <PageHeader
        eyebrow="Conta"
        title="Fichas cadastrais"
        description="Dados comerciais da sua empresa. A Luiza consulta o que você gravar aqui."
        breadcrumbs={[
          { label: "Início", href: "/" },
          { label: "Conta", href: "/conta" },
          { label: "Fichas" },
        ]}
      />
      <Container className="space-y-8 py-16">
        {notice ? (
          <p className="max-w-xl rounded-sm border border-line bg-cream px-4 py-3 text-sm text-ink" role="status">
            {notice}
          </p>
        ) : null}
        {!canWrite ? (
          <p className="max-w-xl text-sm leading-relaxed text-muted">
            Esta conta só pode consultar as fichas já gravadas.
          </p>
        ) : (
          <Button href="/conta/fichas/nova">Nova ficha</Button>
        )}
        {forms.length === 0 ? (
          <p className="max-w-xl text-muted">Nenhuma ficha cadastral ainda.</p>
        ) : (
          <ul className="grid gap-4">
            {forms.map((form) => (
              <li key={form.id}>
                <Link
                  href={`/conta/fichas/${form.id}`}
                  className="block max-w-xl rounded-sm border border-line bg-paper px-6 py-5 transition-colors hover:border-brass"
                >
                  <p className="font-display text-2xl text-ink">{form.legal_name}</p>
                  <p className="mt-2 text-sm text-muted">
                    {form.segment} · {form.party === "fornecedor" ? "Fornecedor" : "Comprador"}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </>
  );
}
