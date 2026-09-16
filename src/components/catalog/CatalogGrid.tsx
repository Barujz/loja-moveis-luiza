"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { categories, getAllProducts, type CategorySlug } from "@/lib/products";
import { ProductCard } from "@/components/product/ProductCard";
import { cn } from "@/lib/cn";

type Filter = CategorySlug | "todos";

export function CatalogGrid({ initialCategory }: { initialCategory: Filter }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [active, setActive] = useState<Filter>(initialCategory);

  const all = getAllProducts();
  const filtered = useMemo(
    () => (active === "todos" ? all : all.filter((p) => p.category === active)),
    [active, all],
  );

  function selectFilter(f: Filter) {
    setActive(f);
    const params = new URLSearchParams(searchParams.toString());
    if (f === "todos") params.delete("categoria");
    else params.set("categoria", f);
    const qs = params.toString();
    router.replace(qs ? `/catalogo?${qs}` : "/catalogo", { scroll: false });
  }

  const filters: { slug: Filter; name: string }[] = [
    { slug: "todos", name: "Todos" },
    ...categories.map((c) => ({ slug: c.slug, name: c.name })),
  ];

  return (
    <div>
      {/* Filtros */}
      <div className="flex flex-wrap gap-2.5">
        {filters.map((f) => (
          <button
            key={f.slug}
            type="button"
            onClick={() => selectFilter(f.slug)}
            className={cn(
              "rounded-full border px-5 py-2.5 text-sm transition-all duration-300",
              active === f.slug
                ? "border-ink bg-ink text-cream"
                : "border-line text-ink hover:border-brass hover:text-brass",
            )}
          >
            {f.name}
          </button>
        ))}
      </div>

      {/* Contagem */}
      <p className="mt-8 text-sm text-muted">
        {filtered.length}{" "}
        {filtered.length === 1 ? "peça encontrada" : "peças encontradas"}
      </p>

      {/* Grade */}
      <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-3">
        {filtered.map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="py-20 text-center text-muted">
          Nenhuma peça nesta categoria por enquanto.
        </p>
      )}
    </div>
  );
}
