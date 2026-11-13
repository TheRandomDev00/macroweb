import { SceneStack } from "@/components/motion/SceneStack";
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
        <SceneStack
          labels={[
            "Discover & set up",
            "Find your tools",
            "Community & support",
          ]}
        >
          <div className="chapter chapter-discover">
            <Hero />
            <Stats />
            <HowItWorks />
          </div>
          <div className="chapter chapter-tools">
            <PromoBanner />
            <ProductSection />
            <FreeTools />
          </div>
          <div className="chapter chapter-community">
            <Community />
            <FAQ />
            <ClosingCTA />
            <SiteFooter />
          </div>
        </SceneStack>
      </main>
    </>
  );
}
