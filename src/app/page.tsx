import { Hero } from "@/components/home/Hero";
import { TrustBar } from "@/components/home/TrustBar";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { HotelSection } from "@/components/home/HotelSection";
import { Testimonials } from "@/components/home/Testimonials";
import { CtaContact } from "@/components/home/CtaContact";

export default function HomePage() {
  return (
    <>
      <Hero />
      <TrustBar />
      <CategoryGrid />
      <FeaturedProducts />
      <HotelSection />
      <Testimonials />
      <CtaContact />
    </>
  );
}
