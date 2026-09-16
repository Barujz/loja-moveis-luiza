import Image from "next/image";
import { Check } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";

const benefits = [
  "Projetos personalizados para a identidade de cada hotel",
  "Amostras de tecidos, madeiras e acabamentos",
  "Produção em escala com prazo garantido",
  "Condições comerciais para grandes volumes",
  "Acompanhamento do projeto à instalação",
];

export function HotelSection() {
  return (
    <section className="py-24">
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <Reveal className="relative">
            <div className="relative aspect-4/5 overflow-hidden rounded-sm">
              <Image
                src="/img/about/about-banner-03.jpg"
                alt="Ambiente de hotelaria mobiliado pela Luiza"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -right-2 rounded-sm bg-ink px-8 py-6 text-cream shadow-xl sm:-right-6">
              <p className="font-display text-4xl font-semibold text-brass">+120</p>
              <p className="mt-1 text-sm text-cream/75">
                projetos de hospitalidade entregues
              </p>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <p className="eyebrow mb-4">Parceria com hotéis</p>
            <h2 className="text-4xl leading-[1.1] sm:text-5xl">
              Um parceiro para toda a operação
            </h2>
            <p className="mt-5 text-base leading-relaxed text-muted sm:text-lg">
              Entendemos a rotina da hotelaria: mobiliário que resiste ao uso
              intenso, encanta o hóspede e chega no prazo. Da concepção à última
              entrega, cuidamos de tudo.
            </p>

            <ul className="mt-8 space-y-4">
              {benefits.map((b) => (
                <li key={b} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brass/15 text-brass">
                    <Check size={15} />
                  </span>
                  <span className="text-ink/85">{b}</span>
                </li>
              ))}
            </ul>

            <div className="mt-10">
              <Button href="/contato" size="lg">
                Solicitar orçamento
              </Button>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
