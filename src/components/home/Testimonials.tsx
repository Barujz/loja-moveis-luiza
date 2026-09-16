"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { Container } from "@/components/ui/Container";

type Testimonial = {
  quote: string;
  name: string;
  role: string;
  avatar: string;
};

const testimonials: Testimonial[] = [
  {
    quote:
      "O mobiliário elevou o padrão das nossas suítes. O acabamento impressiona os hóspedes e resiste ao uso diário sem perder o charme.",
    name: "Marina Alcântara",
    role: "Diretora-geral · Hotel Vista Mar",
    avatar: "/img/testimonial/tmnl-01.jpg",
  },
  {
    quote:
      "Trabalhar com um único parceiro do projeto à entrega mudou o jogo. Prazos cumpridos e uma curadoria impecável.",
    name: "Rafael Nogueira",
    role: "Arquiteto · Estúdio N",
    avatar: "/img/testimonial/tmnl-05.jpg",
  },
  {
    quote:
      "As peças sob medida deram identidade ao nosso lobby. Recebemos elogios diários — virou cartão de visita do resort.",
    name: "Camila Duarte",
    role: "Gerente de Operações · Serra Resort",
    avatar: "/img/testimonial/tmnl-09.jpg",
  },
];

export function Testimonials() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selected, setSelected] = useState(0);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

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
    <section className="bg-forest py-24 text-cream">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <Quote size={40} className="mx-auto text-brass" />
          <div className="mt-8 overflow-hidden" ref={emblaRef}>
            <div className="flex">
              {testimonials.map((t, i) => (
                <div key={i} className="min-w-0 flex-[0_0_100%] px-2">
                  <blockquote className="font-display text-2xl leading-relaxed text-cream sm:text-3xl">
                    “{t.quote}”
                  </blockquote>
                  <div className="mt-8 flex items-center justify-center gap-4">
                    <div className="relative h-14 w-14 overflow-hidden rounded-full">
                      <Image
                        src={t.avatar}
                        alt={t.name}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-cream">{t.name}</p>
                      <p className="text-sm text-cream/70">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={scrollPrev}
              aria-label="Depoimento anterior"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-cream/25 text-cream transition-colors hover:border-brass hover:text-brass"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex gap-2">
              {testimonials.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    selected === i ? "w-8 bg-brass" : "w-1.5 bg-cream/30"
                  }`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={scrollNext}
              aria-label="Próximo depoimento"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-cream/25 text-cream transition-colors hover:border-brass hover:text-brass"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </Container>
    </section>
  );
}
