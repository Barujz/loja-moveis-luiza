import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { DetailList } from "@/components/admin/DetailList";
import { ReviewForm } from "@/components/admin/ReviewForm";
import { requireApprovedAdmin } from "@/lib/admin/access";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Fornecedor" };

export default async function SupplierReviewPage({ params }: { params: Promise<{ id: string }> }) {
  await requireApprovedAdmin();
  const { id } = await params;
  const supabase = await createClient();
  const { data: supplier } = await supabase
    .from("suppliers")
    .select(
      "id, profile_id, legal_name, trade_name, cnpj, segment, description, logo, commercial_contact, contact_email, whatsapp, status",
    )
    .eq("id", id)
    .maybeSingle();

  if (!supplier || supplier.status !== "pendente") notFound();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, phone, status")
    .eq("id", supplier.profile_id)
    .maybeSingle();

  return (
    <>
      <PageHeader
        eyebrow="Fornecedor pendente"
        title={supplier.trade_name}
        description={supplier.legal_name}
        breadcrumbs={[
          { label: "Início", href: "/" },
          { label: "Painel", href: "/admin" },
          { label: "Fornecedor" },
        ]}
      />
      <Container className="grid gap-12 py-16">
        <DetailList
          rows={[
            { label: "Nome", value: profile?.full_name ?? null },
            { label: "E-mail de acesso", value: profile?.email ?? null },
            { label: "Telefone", value: profile?.phone ?? null },
            { label: "Razão social", value: supplier.legal_name },
            { label: "Nome fantasia", value: supplier.trade_name },
            { label: "CNPJ", value: supplier.cnpj },
            { label: "Segmento", value: supplier.segment },
            { label: "Descrição", value: supplier.description },
            { label: "Logo", value: supplier.logo },
            { label: "Contato comercial", value: supplier.commercial_contact },
            { label: "E-mail comercial", value: supplier.contact_email },
            { label: "WhatsApp", value: supplier.whatsapp },
            { label: "Conta", value: profile?.status ?? null },
            { label: "Cadastro", value: supplier.status },
          ]}
        />
        <ReviewForm kind="fornecedor" id={supplier.id} />
      </Container>
    </>
  );
}
