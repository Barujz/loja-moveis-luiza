import type { Metadata } from "next";
import Image from "next/image";
import { Compass, Hammer, Leaf, HeartHandshake } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Sobre",
  description:
    "Conheça o ateliê Luiza: mobiliário de luxo feito à mão para hotelaria, com curadoria, materiais nobres e acabamento impecável.",
};

const values = [
  {
    icon: Compass,
    title: "Curadoria",
    text: "Cada coleção nasce de pesquisa de tendências e das necessidades reais da hotelaria.",
  },
  {
    icon: Hammer,
    title: "Artesania",
    text: "Marcenaria e tapeçaria feitas à mão por profissionais com décadas de ofício.",
  },
  {
    icon: Leaf,
    title: "Materiais nobres",
    text: "Madeiras certificadas, tecidos premium e metais com acabamento sob medida.",
  },
  {
    icon: HeartHandshake,
    title: "Parceria",
    text: "Acompanhamos o cliente do briefing à instalação, com um ponto de contato dedicado.",
  },
];

const steps = [
  { n: "01", title: "Briefing", text: "Entendemos o conceito, a operação e a identidade do projeto." },
  { n: "02", title: "Projeto", text: "Desenvolvemos peças e ambientações com amostras de acabamento." },
  { n: "03", title: "Produção", text: "Fabricamos em escala, com controle de qualidade em cada etapa." },
  { n: "04", title: "Entrega", text: "Logística e instalação no prazo combinado, sem surpresas." },
];

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="Sobre"
        title="Mobiliário com alma, feito para durar"
        description="Somos um ateliê dedicado à hotelaria. Unimos design autoral, artesania e escala industrial para criar ambientes memoráveis — que resistem ao tempo e ao uso."
        breadcrumbs={[{ label: "Início", href: "/" }, { label: "Sobre" }]}
      />

      {/* História */}
      <section className="py-20 lg:py-28">
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
            <Reveal className="relative aspect-4/5 overflow-hidden rounded-sm">
              <Image
                src="/img/about/about-banner-01.jpg"
                alt="Ambiente mobiliado pelo ateliê Luiza"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </Reveal>
            <Reveal delay={120}>
              <p className="eyebrow mb-4">Nossa história</p>
              <h2 className="text-4xl leading-tight sm:text-5xl">
                Do primeiro esboço à última suíte
              </h2>
              <div className="mt-6 space-y-4 text-base leading-relaxed text-muted sm:text-lg">
                <p>
                  Nascemos da vontade de elevar o mobiliário da hospitalidade
                  brasileira. Percebemos que hotéis precisavam de peças que
                  unissem beleza, conforto e resistência — sem depender de
                  importações caras e prazos incertos.
                </p>
                <p>
                  Hoje, atendemos projetos de norte a sul do país, com um ateliê
                  que combina o cuidado do feito à mão com a capacidade de
                  produzir em grande volume. Cada peça carrega essa dupla
                  natureza.
                </p>
              </div>
              <div className="mt-8 grid grid-cols-3 gap-6">
                <div>
                  <p className="font-display text-4xl text-brass">+120</p>
                  <p className="mt-1 text-sm text-muted">projetos entregues</p>
                </div>
                <div>
                  <p className="font-display text-4xl text-brass">15</p>
                  <p className="mt-1 text-sm text-muted">anos de ofício</p>
                </div>
                <div>
                  <p className="font-display text-4xl text-brass">98%</p>
                  <p className="mt-1 text-sm text-muted">no prazo</p>
                </div>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* Valores */}
      <section className="border-y border-line bg-paper py-20 lg:py-28">
        <Container>
          <div className="max-w-2xl">
            <p className="eyebrow mb-4">O que nos guia</p>
            <h2 className="text-4xl leading-tight sm:text-5xl">
              Princípios em cada peça
            </h2>
          </div>
          <div className="mt-14 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v, i) => (
              <Reveal key={v.title} delay={i * 80}>
                <v.icon size={30} strokeWidth={1.4} className="text-brass" />
                <h3 className="mt-5 font-display text-2xl text-ink">{v.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{v.text}</p>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* Processo */}
      <section className="py-20 lg:py-28">
        <Container>
          <div className="max-w-2xl">
            <p className="eyebrow mb-4">Como trabalhamos</p>
            <h2 className="text-4xl leading-tight sm:text-5xl">
              Um processo, quatro passos
            </h2>
          </div>
          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <Reveal
                key={s.n}
                delay={i * 80}
                className="border-t border-ink/15 pt-6"
              >
                <p className="font-display text-5xl text-brass/40">{s.n}</p>
                <h3 className="mt-4 font-display text-2xl text-ink">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.text}</p>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden">
        <Image
          src="/img/about/about-banner-02.jpg"
          alt=""
          width={1920}
          height={800}
          className="h-[50vh] min-h-[360px] w-full object-cover"
        />
        <div className="absolute inset-0 bg-ink/70" />
        <Container className="absolute inset-0 flex items-center">
          <Reveal className="max-w-xl text-cream">
            <h2 className="text-4xl leading-tight text-cream sm:text-5xl">
              Vamos criar algo memorável juntos
            </h2>
            <p className="mt-4 text-cream/80">
              Conte-nos sobre o seu projeto e receba uma proposta sob medida.
            </p>
            <div className="mt-8">
              <Button href="/contato" variant="light" size="lg">
                Falar com o ateliê
              </Button>
            </div>
            <p className="mt-5 text-sm text-cream/60">{site.address}</p>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
