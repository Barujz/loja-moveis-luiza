"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { mainNav, site, whatsappLink } from "@/lib/site";
import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/cn";

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Fecha o menu ao trocar de rota
  useEffect(() => setOpen(false), [pathname]);

  // Trava o scroll com o menu mobile aberto
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-line bg-cream/85 backdrop-blur-md"
          : "border-b border-transparent bg-cream/40 backdrop-blur-sm",
      )}
    >
      <Container className="flex h-20 items-center justify-between">
        <Link href="/" className="group flex flex-col leading-none">
          <span className="font-display text-2xl font-semibold tracking-wide text-ink">
            {site.name}
          </span>
          <span className="mt-0.5 text-[10px] uppercase tracking-[0.28em] text-muted">
            Mobiliário de Luxo
          </span>
        </Link>

        <nav className="hidden items-center gap-9 md:flex">
          {mainNav.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "link-underline text-sm tracking-wide transition-colors",
                  active ? "text-brass" : "text-ink hover:text-brass",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden md:block">
          <a
            href={whatsappLink(
              "Olá! Gostaria de solicitar um orçamento de mobiliário.",
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-full bg-ink px-6 py-3 text-sm font-medium text-cream transition-colors duration-300 hover:bg-brass"
          >
            Solicitar orçamento
          </a>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open}
          className="text-ink md:hidden"
        >
          {open ? <X size={26} /> : <Menu size={26} />}
        </button>
      </Container>

      {/* Menu mobile */}
      <div
        className={cn(
          "fixed inset-x-0 top-20 bottom-0 z-40 origin-top bg-cream transition-all duration-300 md:hidden",
          open
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        )}
      >
        <Container className="flex h-full flex-col justify-between py-10">
          <nav className="flex flex-col gap-2">
            {mainNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="border-b border-line py-4 font-display text-3xl text-ink"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <a
            href={whatsappLink(
              "Olá! Gostaria de solicitar um orçamento de mobiliário.",
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center justify-center rounded-full bg-ink px-6 py-4 text-sm font-medium text-cream"
          >
            Solicitar orçamento
          </a>
        </Container>
      </div>
    </header>
  );
}
