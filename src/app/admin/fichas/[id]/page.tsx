import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { DetailList } from "@/components/admin/DetailList";
import { RegistrationTools } from "@/components/registration/RegistrationTools";
import { requireApprovedAdmin } from "@/lib/admin/access";
import { isUuid } from "@/lib/quotes/access";
import { createClient } from "@/lib/supabase/server";
import { registrationPageUrl, registrationShareLinks } from "@/lib/registration/share";

export const metadata: Metadata = { title: "Ficha cadastral" };

export default async function AdminRegistrationFormPage({ params }: { params: Promise<{ id: string }> }) {
  await requireApprovedAdmin();
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const supabase = await createClient();
  const { data: form } = await supabase
    .from("registration_forms")
    .select("id, party, legal_name, tax_id, address, phone, email, responsible_name, segment, created_at")
    .eq("id", id)
    .maybeSingle();
  if (!form) notFound();

  const share = registrationShareLinks(await registrationPageUrl(form.id));

  return (
    <>
      <PageHeader
        eyebrow={form.party === "fornecedor" ? "Fornecedor" : "Comprador"}
        title={form.legal_name}
        description="Leitura da ficha recebida. O administrador não altera o cadastro do autor por aqui."
        breadcrumbs={[
          { label: "Início", href: "/" },
          { label: "Painel", href: "/admin" },
          { label: "Fichas", href: "/admin/fichas" },
          { label: "Ficha" },
        ]}
      />
      <Container className="py-16">
        <RegistrationTools
          pdfHref={`/conta/fichas/${form.id}/pdf`}
          whatsappHref={share.whatsapp}
          emailHref={share.email}
        />
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
      </Container>
    </>
  );
}
