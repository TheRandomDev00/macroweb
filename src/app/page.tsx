import { ScrollSection } from "@/components/motion/ScrollSection";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ScrollProgress } from "@/components/motion/ScrollProgress";
import { Hero } from "@/components/sections/Hero";
import { Stats } from "@/components/sections/Stats";
import { PromoBanner } from "@/components/sections/PromoBanner";
import { ProductSection } from "@/components/sections/ProductSection";
import { FreeTools } from "@/components/sections/FreeTools";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { Community } from "@/components/sections/Community";
import { FAQ } from "@/components/sections/FAQ";
import { ClosingCTA } from "@/components/sections/ClosingCTA";

export default function Home() {
  return (
    <>
      <a className="skip-link" href="#store">
        Skip to tools
      </a>
      <ScrollProgress />
      <SiteHeader />
      <main id="top">
        <Hero />
        <div className="covering-content">
          <ScrollSection direction="left">
            <Stats />
          </ScrollSection>
          <PromoBanner />
          <ProductSection />
          <FreeTools />
          <HowItWorks />
          <Community />
          <FAQ />
          <ClosingCTA />
          <ScrollSection direction="right">
            <SiteFooter />
          </ScrollSection>
        </div>
      </main>
    </>
  );
}
