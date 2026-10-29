import { Cpu, Layers, Shield, Sparkles } from "lucide-react";

const icons = {
  layers: Layers,
  spark: Sparkles,
  shield: Shield,
  cpu: Cpu,
} as const;

export function SolutionMedia({
  title,
  imageUrl,
  icon,
}: {
  title: string;
  imageUrl: string | null;
  icon: string | null;
}) {
  if (imageUrl) {
    return (
      // A imagem só aparece quando o cadastro traz uma URL https.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={imageUrl} alt="" className="h-44 w-full object-cover" />
    );
  }

  const Icon = icon && icon in icons ? icons[icon as keyof typeof icons] : null;
  return (
    <div className="flex h-44 items-center justify-center bg-ink text-brass">
      {Icon ? <Icon size={28} aria-hidden /> : <span className="font-display text-3xl">{title.slice(0, 1)}</span>}
    </div>
  );
}
