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
          <h2>
            <span className="gradient-text">Join</span> us
          </h2>
          <p>
            Free your hands
          </p>
        </Reveal>
        <Reveal delay={0.15} className="cta-actions">
          <a href="#store" className="button button-primary">
            Find your next advantage <ArrowRight size={17} />
          </a>
          <a href="#free-tools" className="button button-secondary">
            Start with the free version <ArrowUpRight size={16} />
          </a>
        </Reveal>
        <span className="cta-signoff">DEVREALM.</span>
      </div>
    </SectionLayer>
  );
}
