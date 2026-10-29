export function PartnerMark({ name, logo }: { name: string; logo: string | null }) {
  if (logo) {
    return (
      // O logo só entra quando já é uma URL https pública. Caminho interno não é publicado.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={logo} alt="" className="h-16 w-16 rounded-sm object-cover" />
    );
  }

  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();

  return (
    <span className="flex h-16 w-16 items-center justify-center rounded-sm bg-ink font-display text-xl text-cream">
      {initials || "L"}
    </span>
  );
}
