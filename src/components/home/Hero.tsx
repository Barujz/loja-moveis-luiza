import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/Container";

export function Hero() {
  return (
    <section className="relative">
      <div className="relative h-[82vh] min-h-[560px] w-full">
        <Image
          src="/img/brand/hero-suite.jpg"
          alt="Suíte de hotel com mobiliário claro e luz baixa. Fotografia ilustrativa, não é um produto à venda."
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-r from-ink/75 via-ink/35 to-ink/10" />

        <Container className="relative flex h-full items-center">
          <div className="max-w-xl text-cream">
            <p className="mb-5 text-xs font-medium uppercase tracking-[0.28em] text-cream/80">Hospitalidade</p>
            <h1 className="font-display text-5xl leading-[1.05] sm:text-6xl lg:text-7xl">
              Catálogos de luxo para hotéis e resorts
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-cream/85 sm:text-lg">
              A Luiza reúne catálogos de fornecedores aprovados. Compradores aprovados consultam o acervo restrito e pedem orçamento no próprio catálogo.
            </p>
            <Link
              href="/catalogo"
              className="group mt-8 inline-flex items-center gap-3 rounded-full bg-cream px-8 py-4 text-sm font-medium text-ink transition-colors duration-300 hover:bg-brass hover:text-cream"
            >
              Explorar catálogos
              <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </Container>

        <p className="absolute bottom-8 right-5 text-[10px] uppercase tracking-[0.22em] text-cream/55 sm:right-8">
          Imagem ilustrativa
        </p>
      </div>
    </section>
  );
}
