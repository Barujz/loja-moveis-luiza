"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { mainNav, site, whatsappLink } from "@/lib/site";
import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/cn";
import { logout } from "@/lib/auth/actions";

const commercialWhatsapp = whatsappLink("Olá, gostaria de falar com a Luiza.");

export function Header({ signedIn = false }: { signedIn?: boolean }) {
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

        <nav className="hidden items-center gap-7 xl:flex">
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
                  "link-underline whitespace-nowrap text-sm tracking-wide transition-colors",
                  active ? "text-brass" : "text-ink hover:text-brass",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-5 xl:flex">
          {signedIn ? (
            <>
              <Link href="/conta" className="text-sm tracking-wide text-ink hover:text-brass">
                Conta
              </Link>
              <form action={logout}>
                <button type="submit" className="text-sm tracking-wide text-ink hover:text-brass">
                  Sair
                </button>
              </form>
            </>
          ) : (
            <Link href="/entrar" className="text-sm tracking-wide text-ink hover:text-brass">
              Entrar
            </Link>
          )}
          {commercialWhatsapp ? (
            <a
              href={commercialWhatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm tracking-wide text-ink hover:text-brass"
            >
              WhatsApp
            </a>
          ) : null}
          <CatalogEntry className="inline-flex items-center rounded-full bg-ink px-6 py-3 text-sm font-medium text-cream transition-colors duration-300 hover:bg-brass" />
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open}
          className="text-ink xl:hidden"
        >
          {open ? <X size={26} /> : <Menu size={26} />}
        </button>
      </Container>

      {/* Menu mobile */}
      <div
        className={cn(
          "fixed inset-x-0 top-20 bottom-0 z-40 origin-top bg-cream transition-all duration-300 xl:hidden",
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
            <Link href={signedIn ? "/conta" : "/entrar"} className="border-b border-line py-4 font-display text-3xl text-ink">
              {signedIn ? "Conta" : "Entrar"}
            </Link>
          </nav>
          <div className="mt-8 flex flex-col gap-4">
            {signedIn ? (
              <form action={logout}>
                <button type="submit" className="text-sm text-ink underline underline-offset-4">
                  Sair
                </button>
              </form>
            ) : null}
            {commercialWhatsapp ? (
              <a
                href={commercialWhatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-ink underline underline-offset-4"
              >
                WhatsApp
              </a>
            ) : null}
            <CatalogEntry className="inline-flex items-center justify-center rounded-full bg-ink px-6 py-4 text-sm font-medium text-cream" />
          </div>
        </Container>
      </div>
    </header>
  );
}

function CatalogEntry({ className }: { className: string }) {
  return (
    <Link href="/catalogo" className={cn(className, "whitespace-nowrap")}>
      Ver catálogos
    </Link>
  );
}
