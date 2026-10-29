import { Hero } from "@/components/home/Hero";
import { TrustBar } from "@/components/home/TrustBar";
import { PublicCatalogs } from "@/components/home/PublicCatalogs";
import { CtaContact } from "@/components/home/CtaContact";

export default function HomePage() {
  return (
    <>
      <Hero />
      <TrustBar />
      <PublicCatalogs />
      <CtaContact />
    </>
  );
}
