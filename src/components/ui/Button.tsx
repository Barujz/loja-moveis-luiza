import Link from "next/link";
import { cn } from "@/lib/cn";

type Variant = "solid" | "outline" | "ghost" | "light";
type Size = "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 font-sans font-medium tracking-wide transition-all duration-300 rounded-full whitespace-nowrap disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass";

const variants: Record<Variant, string> = {
  solid: "bg-ink text-cream hover:bg-brass",
  outline: "border border-ink/25 text-ink hover:border-brass hover:text-brass",
  ghost: "text-ink hover:text-brass",
  light: "bg-cream text-ink hover:bg-brass hover:text-cream",
};

const sizes: Record<Size, string> = {
  md: "text-sm px-6 py-3",
  lg: "text-sm px-8 py-4",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
};

export function Button({
  href,
  variant = "solid",
  size = "md",
  className,
  children,
  ...rest
}: CommonProps &
  ({ href: string } | { href?: undefined }) &
  React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const classes = cn(base, variants[variant], sizes[size], className);

  if (href) {
    const external = href.startsWith("http") || href.startsWith("mailto:");
    if (external) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}
