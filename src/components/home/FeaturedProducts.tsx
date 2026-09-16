import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getFeaturedProducts } from "@/lib/products";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { ProductCard } from "@/components/product/ProductCard";

export function FeaturedProducts() {
  const featured = getFeaturedProducts(4);

  return (
    <section className="border-t border-line bg-paper py-24">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <Reveal className="max-w-xl">
            <p className="eyebrow mb-4">Destaques</p>
            <h2 className="text-4xl leading-[1.1] sm:text-5xl">
              Peças em evidência
            </h2>
          </Reveal>
          <Reveal>
            <Link
              href="/catalogo"
              className="link-underline inline-flex items-center gap-2 text-sm font-medium text-ink hover:text-brass"
            >
              Ver todo o catálogo
              <ArrowRight size={16} />
            </Link>
          </Reveal>
        </div>

        <div className="mt-14 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
          {featured.map((product, i) => (
            <Reveal key={product.slug} delay={i * 80}>
              <ProductCard product={product} />
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
