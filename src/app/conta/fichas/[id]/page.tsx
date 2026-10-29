import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { DetailList } from "@/components/admin/DetailList";
import { RegistrationForm } from "@/components/registration/RegistrationForm";
import { DeleteRegistrationForm } from "@/components/registration/DeleteRegistrationForm";
import { getAccount } from "@/lib/auth/account";
import { isUuid } from "@/lib/quotes/access";
import { updateRegistrationForm } from "@/lib/registration/actions";
import { RegistrationTools } from "@/components/registration/RegistrationTools";
import { draftFromRow, loadOwnRegistrationForm } from "@/lib/registration/data";
import { registrationPageUrl, registrationShareLinks } from "@/lib/registration/share";

export const metadata: Metadata = { title: "Ficha cadastral" };

const notices: Record<string, string> = {
  criada: "Ficha criada.",
  salva: "Ficha atualizada.",
};

export default async function RegistrationFormPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ feito?: string }>;
}) {
  const account = await getAccount();
  if (!account) redirect("/entrar?next=/conta/fichas");
  if (!account.hasProfile || (account.role !== "comprador" && account.role !== "fornecedor")) redirect("/conta");

  const { id } = await params;
  if (!isUuid(id)) notFound();
  const form = await loadOwnRegistrationForm(id);
  if (!form) notFound();

  const query = await searchParams;
  const notice = query.feito ? notices[query.feito] : null;
  const canWrite = account.status === "pendente" || account.status === "aprovado";
  const share = registrationShareLinks(await registrationPageUrl(form.id));

  return (
    <>
      <PageHeader
        eyebrow={form.party === "fornecedor" ? "Fornecedor" : "Comprador"}
        title={form.legal_name}
        description={canWrite ? "Atualize os dados comerciais desta ficha." : "Esta conta só pode consultar a ficha."}
        breadcrumbs={[
          { label: "Início", href: "/" },
          { label: "Conta", href: "/conta" },
          { label: "Fichas", href: "/conta/fichas" },
          { label: "Ficha" },
        ]}
      />
      <Container className="py-16">
        {notice ? (
          <p className="mb-8 max-w-xl rounded-sm border border-line bg-cream px-4 py-3 text-sm text-ink" role="status">
            {notice}
          </p>
        ) : null}
        <RegistrationTools
          pdfHref={`/conta/fichas/${form.id}/pdf`}
          whatsappHref={share.whatsapp}
          emailHref={share.email}
        />
        {canWrite ? (
          <>
            <RegistrationForm
              action={updateRegistrationForm}
              defaults={draftFromRow(form)}
              submitLabel="Salvar alterações"
              id={form.id}
            />
            <DeleteRegistrationForm id={form.id} />
          </>
        ) : (
          <DetailList
            rows={[
              { label: "Nome ou razão social", value: form.legal_name },
              { label: "CNPJ ou CPF", value: form.tax_id },
              { label: "Endereço", value: form.address },
              { label: "Telefone", value: form.phone },
              { label: "E-mail", value: form.email },
              { label: "Responsável", value: form.responsible_name },
              { label: "Segmento", value: form.segment },
            ]}
          />
        )}
      </Container>
    </>
  );
}
