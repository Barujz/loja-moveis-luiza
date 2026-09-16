import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { site, whatsappLink } from "@/lib/site";

export function CtaContact() {
  return (
    <section className="relative overflow-hidden">
      <div className="relative">
        <Image
          src="/img/home-v3/banner-slider-01.jpg"
          alt=""
          width={1920}
          height={900}
          className="h-[60vh] min-h-[420px] w-full object-cover"
        />
        <div className="absolute inset-0 bg-ink/70" />

        <Container className="absolute inset-0 flex items-center">
          <Reveal className="max-w-2xl text-cream">
            <p className="eyebrow mb-4 text-brass">Vamos conversar</p>
            <h2 className="text-4xl leading-[1.1] text-cream sm:text-5xl lg:text-6xl">
              Pronto para transformar o seu espaço?
            </h2>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-cream/80 sm:text-lg">
              Conte-nos sobre o seu projeto. Preparamos uma proposta sob medida
              com prazos, acabamentos e condições para o seu volume.
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Button href="/contato" variant="light" size="lg">
                Solicitar orçamento
              </Button>
              <Button
                href={whatsappLink(
                  "Olá! Gostaria de conversar sobre um projeto de mobiliário.",
                )}
                variant="outline"
                size="lg"
                className="border-cream/40 text-cream hover:border-brass hover:text-brass"
              >
                Chamar no WhatsApp
              </Button>
            </div>
            <p className="mt-6 text-sm text-cream/60">
              Ou ligue: {site.phone}
            </p>
          </Reveal>
        </Container>
      </div>
    </section>
  );
}
