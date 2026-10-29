import type { Metadata } from "next";
import { BookOpen, ShieldCheck, FileText, MessageSquare } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Sobre",
  description: "A Luiza é uma plataforma B2B de catálogos de mobiliário de luxo para hotelaria.",
};

const values = [
  {
    icon: ShieldCheck,
    title: "Aprovação",
    text: "Fornecedores, compradores e catálogos passam pela análise da Luiza antes de circular.",
  },
  {
    icon: BookOpen,
    title: "Catálogos",
    text: "O acervo público fica aberto. O restrito aparece para compradores aprovados.",
  },
  {
    icon: FileText,
    title: "PDF publicado",
    text: "O arquivo só fica disponível depois da aprovação da versão vigente.",
  },
  {
    icon: MessageSquare,
    title: "Orçamento",
    text: "O pedido nasce no catálogo e fica ligado ao comprador e ao fornecedor.",
  },
];

const steps = [
  { n: "01", title: "Cadastro", text: "Comprador ou fornecedor abre a conta e informa a empresa." },
  { n: "02", title: "Aprovação", text: "A Luiza analisa o cadastro antes de liberar o painel." },
  { n: "03", title: "Catálogo", text: "O fornecedor envia o PDF. A publicação depende da aprovação." },
  { n: "04", title: "Consulta", text: "O comprador aprovado abre o catálogo e pode pedir orçamento." },
];

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="Sobre"
        title="Catálogos de luxo para a hospitalidade"
        description="A Luiza organiza o acervo de fornecedores aprovados para hotéis, resorts e projetos de hospitalidade."
        breadcrumbs={[{ label: "Início", href: "/" }, { label: "Sobre" }]}
      />

      <section className="py-20 lg:py-28">
        <Container className="max-w-3xl">
          <p className="eyebrow mb-4">A plataforma</p>
          <h2 className="text-4xl leading-tight sm:text-5xl">Um lugar para consultar, não uma vitrine de peças avulsas</h2>
          <div className="mt-6 space-y-4 text-base leading-relaxed text-muted sm:text-lg">
            <p>
              Cada catálogo pertence a um fornecedor aprovado. Visitantes veem somente o que estiver público, aprovado e com PDF publicado.
            </p>
            <p>
              Compradores aprovados acessam também os catálogos restritos e registram o pedido de orçamento na própria página.
            </p>
          </div>
          <div className="mt-8">
            <Button href="/catalogo">Explorar catálogos</Button>
          </div>
        </Container>
      </section>

      <section className="border-y border-line bg-paper py-20 lg:py-28">
        <Container>
          <div className="max-w-2xl">
            <p className="eyebrow mb-4">Como funciona</p>
            <h2 className="text-4xl leading-tight sm:text-5xl">O que a conta pode fazer</h2>
          </div>
          <div className="mt-14 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value, i) => (
              <Reveal key={value.title} delay={i * 80}>
                <value.icon size={30} strokeWidth={1.4} className="text-brass" />
                <h3 className="mt-5 font-display text-2xl text-ink">{value.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{value.text}</p>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-20 lg:py-28">
        <Container>
          <div className="max-w-2xl">
            <p className="eyebrow mb-4">Percurso</p>
            <h2 className="text-4xl leading-tight sm:text-5xl">Do cadastro à consulta</h2>
          </div>
          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => (
              <Reveal key={step.n} delay={i * 80} className="border-t border-ink/15 pt-6">
                <p className="font-display text-5xl text-brass/40">{step.n}</p>
                <h3 className="mt-4 font-display text-2xl text-ink">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{step.text}</p>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
