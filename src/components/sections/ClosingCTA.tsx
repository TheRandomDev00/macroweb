import { ArrowRight, ArrowUpRight, Sparkles } from "lucide-react";
import { SectionLayer } from "@/components/layout/SectionLayer";
import { Reveal } from "@/components/motion/Reveal";
import { GradientOrbs } from "@/components/effects/GradientOrbs";
export function ClosingCTA() {
  return (
    <SectionLayer className="closing-cta">
      <GradientOrbs variant="cta" />
      <div className="cta-grid" aria-hidden="true" />
      <div className="page-width cta-content">
        <Reveal>
          <span className="cta-sparkle">
            <Sparkles size={25} />
          </span>
          <span className="eyebrow">MAKE A LITTLE MORE OF YOUR TIME</span>
          <h2>
            Ready to <span className="gradient-text">level up?</span>
          </h2>
          <p>
            Less repetition. More of what you love.
            <br />
            Find your tools and let the good part begin.
          </p>
        </Reveal>
        <Reveal delay={0.15} className="cta-actions">
          <a href="#store" className="button button-primary">
            Find your next advantage <ArrowRight size={17} />
          </a>
          <a href="#free-tools" className="button button-secondary">
            Start with the free tools <ArrowUpRight size={16} />
          </a>
        </Reveal>
        <span className="cta-signoff">YOUR GAME. A LITTLE SIMPLER.</span>
      </div>
    </SectionLayer>
  );
}
