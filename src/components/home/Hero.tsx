"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/cn";

type Slide = {
  image: string;
  eyebrow: string;
  title: string;
  text: string;
  href: string;
  cta: string;
};

const slides: Slide[] = [
  {
    image: "/img/about/about-banner-03.jpg",
    eyebrow: "Coleção 2026",
    title: "Ambientes que hóspedes lembram",
    text: "Mobiliário autoral para hotéis, resorts e projetos de hospitalidade — do lobby à última suíte.",
    href: "/catalogo",
    cta: "Explorar catálogo",
  },
  {
    image: "/img/home-v3/banner-slider-01.jpg",
    eyebrow: "Feito sob medida",
    title: "Cada peça, uma assinatura",
    text: "Conforto projetado para uso intenso, sem abrir mão da elegância que define a sua marca.",
    href: "/sobre",
    cta: "Conheça o ateliê",
  },
  {
    image: "/img/about/about-banner-02.jpg",
    eyebrow: "Para hotelaria",
    title: "Do projeto à entrega",
    text: "Curadoria, produção e logística em um só parceiro. Escala e acabamento impecável.",
    href: "/contato",
    cta: "Falar com especialista",
  },
];

export function Hero() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 6000, stopOnInteraction: false }),
  ]);
  const [selected, setSelected] = useState(0);

  const scrollTo = useCallback(
    (i: number) => emblaApi?.scrollTo(i),
    [emblaApi],
  );

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
    onSelect();
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  return (
    <section className="relative">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {slides.map((slide, i) => (
            <div key={i} className="relative min-w-0 flex-[0_0_100%]">
              <div className="relative h-[82vh] min-h-[560px] w-full">
                <Image
                  src={slide.image}
                  alt=""
                  fill
                  priority={i === 0}
                  sizes="100vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-linear-to-r from-ink/65 via-ink/25 to-transparent" />

                <Container className="relative flex h-full items-center">
                  <div
                    className={cn(
                      "max-w-xl text-cream transition-all duration-700",
                      selected === i
                        ? "translate-y-0 opacity-100"
                        : "translate-y-4 opacity-0",
                    )}
                  >
                    <p className="mb-5 text-xs font-medium uppercase tracking-[0.28em] text-cream/80">
                      {slide.eyebrow}
                    </p>
                    <h1 className="font-display text-5xl leading-[1.05] sm:text-6xl lg:text-7xl">
                      {slide.title}
                    </h1>
                    <p className="mt-6 max-w-md text-base leading-relaxed text-cream/85 sm:text-lg">
                      {slide.text}
                    </p>
                    <Link
                      href={slide.href}
                      className="group mt-8 inline-flex items-center gap-3 rounded-full bg-cream px-8 py-4 text-sm font-medium text-ink transition-colors duration-300 hover:bg-brass hover:text-cream"
                    >
                      {slide.cta}
                      <ArrowRight
                        size={18}
                        className="transition-transform duration-300 group-hover:translate-x-1"
                      />
                    </Link>
                  </div>
                </Container>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Indicadores */}
      <Container className="pointer-events-none absolute inset-x-0 bottom-8 z-10">
        <div className="flex gap-3">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => scrollTo(i)}
              aria-label={`Ir para o slide ${i + 1}`}
              className={cn(
                "pointer-events-auto h-1 rounded-full transition-all duration-500",
                selected === i ? "w-12 bg-cream" : "w-6 bg-cream/40 hover:bg-cream/70",
              )}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}
