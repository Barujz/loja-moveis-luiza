"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/cn";

export function ProductGallery({
  images,
  name,
}: {
  images: string[];
  name: string;
}) {
  const [active, setActive] = useState(0);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-4/5 overflow-hidden rounded-sm bg-paper">
        <Image
          src={images[active]}
          alt={name}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover"
        />
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-3">
          {images.map((img, i) => (
            <button
              key={img + i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Ver imagem ${i + 1}`}
              className={cn(
                "relative aspect-square overflow-hidden rounded-sm bg-paper ring-offset-2 transition-all",
                active === i
                  ? "ring-2 ring-brass"
                  : "opacity-70 hover:opacity-100",
              )}
            >
              <Image
                src={img}
                alt=""
                fill
                sizes="120px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
