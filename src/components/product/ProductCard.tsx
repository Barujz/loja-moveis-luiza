import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { formatPrice, getCategory, type Product } from "@/lib/products";

export function ProductCard({ product }: { product: Product }) {
  const category = getCategory(product.category);

  return (
    <Link href={`/produto/${product.slug}`} className="group block">
      <div className="relative aspect-4/5 overflow-hidden rounded-sm bg-paper">
        <Image
          src={product.images[0]}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />

        {product.badge && (
          <span className="absolute left-4 top-4 rounded-full bg-cream/90 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-ink backdrop-blur">
            {product.badge}
          </span>
        )}

        <div className="absolute inset-x-0 bottom-0 flex translate-y-3 items-center justify-between gap-2 bg-linear-to-t from-ink/70 to-transparent px-5 pb-5 pt-16 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
          <span className="text-sm font-medium text-cream">Ver detalhes</span>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cream text-ink">
            <ArrowUpRight size={18} />
          </span>
        </div>
      </div>

      <div className="mt-4">
        {category && (
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted">
            {category.name}
          </p>
        )}
        <div className="mt-1 flex items-baseline justify-between gap-3">
          <h3 className="font-display text-xl text-ink transition-colors group-hover:text-brass">
            {product.name}
          </h3>
          <span className="shrink-0 text-sm text-muted">
            {formatPrice(product)}
          </span>
        </div>
        <p className="mt-1 line-clamp-1 text-sm text-muted">
          {product.shortDescription}
        </p>
      </div>
    </Link>
  );
}
