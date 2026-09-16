import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Check, MessageCircle, Ruler } from "lucide-react";
import {
  formatPrice,
  getAllProducts,
  getCategory,
  getProductBySlug,
  getRelatedProducts,
} from "@/lib/products";
import { site, whatsappLink } from "@/lib/site";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductCard } from "@/components/product/ProductCard";

export function generateStaticParams() {
  return getAllProducts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return { title: "Produto não encontrado" };
  return {
    title: product.name,
    description: product.shortDescription,
    openGraph: {
      title: product.name,
      description: product.shortDescription,
      images: [product.images[0]],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();

  const category = getCategory(product.category);
  const related = getRelatedProducts(product);
  const wpp = whatsappLink(
    `Olá! Tenho interesse na peça "${product.name}". Poderiam me enviar um orçamento?`,
  );

  return (
    <>
      <Container className="py-8">
        <nav className="flex flex-wrap items-center gap-1.5 text-sm text-muted">
          <Link href="/" className="hover:text-brass">
            Início
          </Link>
          <span>/</span>
          <Link href="/catalogo" className="hover:text-brass">
            Catálogo
          </Link>
          <span>/</span>
          {category && (
            <>
              <Link
                href={`/catalogo?categoria=${category.slug}`}
                className="hover:text-brass"
              >
                {category.name}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-ink">{product.name}</span>
        </nav>
      </Container>

      <Container className="pb-20">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <ProductGallery images={product.images} name={product.name} />

          <div className="lg:py-4">
            {category && (
              <p className="text-[11px] uppercase tracking-[0.2em] text-brass">
                {category.name}
              </p>
            )}
            <h1 className="mt-3 text-4xl leading-tight sm:text-5xl">
              {product.name}
            </h1>

            <div className="mt-5 flex items-baseline gap-3">
              <span className="font-display text-3xl text-ink">
                {formatPrice(product)}
              </span>
              {typeof product.price === "number" && (
                <span className="text-sm text-muted">valor de referência</span>
              )}
            </div>

            <div className="mt-6 space-y-4 text-base leading-relaxed text-muted">
              {product.description.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>

            {/* Acabamentos */}
            <div className="mt-8">
              <h3 className="text-xs uppercase tracking-[0.18em] text-ink">
                Acabamentos disponíveis
              </h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {product.finishes.map((f) => (
                  <span
                    key={f}
                    className="rounded-full border border-line bg-paper px-4 py-1.5 text-sm text-ink"
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>

            {/* Materiais */}
            <div className="mt-6">
              <h3 className="text-xs uppercase tracking-[0.18em] text-ink">
                Materiais
              </h3>
              <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {product.materials.map((m) => (
                  <li key={m} className="flex items-center gap-2 text-sm text-muted">
                    <Check size={15} className="text-brass" />
                    {m}
                  </li>
                ))}
              </ul>
            </div>

            {/* Dimensões */}
            <div className="mt-6 rounded-sm border border-line bg-paper p-5">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-ink">
                <Ruler size={15} className="text-brass" />
                Dimensões
              </div>
              <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                {[
                  { label: "Largura", value: product.dimensions.largura },
                  { label: "Profundidade", value: product.dimensions.profundidade },
                  { label: "Altura", value: product.dimensions.altura },
                ].map((d) => (
                  <div key={d.label}>
                    <p className="font-display text-xl text-ink">{d.value}</p>
                    <p className="mt-1 text-xs text-muted">{d.label}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-center text-xs text-muted">
                Prazo de produção: {product.leadTime}
              </p>
            </div>

            {/* CTAs */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                href={`/contato?produto=${product.slug}`}
                size="lg"
                className="flex-1"
              >
                Solicitar orçamento
              </Button>
              <Button
                href={wpp}
                variant="outline"
                size="lg"
                className="flex-1"
              >
                <MessageCircle size={18} />
                WhatsApp
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted">
              Dúvidas? Fale com um especialista: {site.phone}
            </p>
          </div>
        </div>
      </Container>

      {/* Relacionados */}
      {related.length > 0 && (
        <section className="border-t border-line bg-paper py-20">
          <Container>
            <h2 className="text-3xl sm:text-4xl">Você também pode gostar</h2>
            <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-3">
              {related.map((p) => (
                <ProductCard key={p.slug} product={p} />
              ))}
            </div>
          </Container>
        </section>
      )}
    </>
  );
}
