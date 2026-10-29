import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { DetailList } from "@/components/admin/DetailList";
import { ReviewForm } from "@/components/admin/ReviewForm";
import { requireApprovedAdmin } from "@/lib/admin/access";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Comprador" };

export default async function BuyerReviewPage({ params }: { params: Promise<{ id: string }> }) {
  await requireApprovedAdmin();
  const { id } = await params;
  const supabase = await createClient();
  const { data: buyer } = await supabase
    .from("buyers")
    .select("id, profile_id, company_name, cnpj, job_title, segment, whatsapp, status")
    .eq("id", id)
    .maybeSingle();

  if (!buyer || buyer.status !== "pendente") notFound();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, phone, status")
    .eq("id", buyer.profile_id)
    .maybeSingle();

  return (
    <>
      <PageHeader
        eyebrow="Comprador pendente"
        title={buyer.company_name}
        description={profile?.full_name || "Cadastro sem nome."}
        breadcrumbs={[
          { label: "Início", href: "/" },
          { label: "Painel", href: "/admin" },
          { label: "Comprador" },
        ]}
      />
      <Container className="grid gap-12 py-16">
        <DetailList
          rows={[
            { label: "Nome", value: profile?.full_name ?? null },
            { label: "E-mail", value: profile?.email ?? null },
            { label: "Telefone", value: profile?.phone ?? null },
            { label: "Empresa", value: buyer.company_name },
            { label: "CNPJ", value: buyer.cnpj },
            { label: "Cargo", value: buyer.job_title },
            { label: "Segmento", value: buyer.segment },
            { label: "WhatsApp", value: buyer.whatsapp },
            { label: "Conta", value: profile?.status ?? null },
            { label: "Cadastro", value: buyer.status },
          ]}
        />
        <ReviewForm kind="comprador" id={buyer.id} />
      </Container>
    </>
  );
}
