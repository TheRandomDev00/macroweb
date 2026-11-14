import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Sparkles,
} from "lucide-react";
import { GradientOrbs } from "@/components/effects/GradientOrbs";
import { Entrance } from "@/components/motion/Entrance";
import { ScreenshotCarousel } from "@/components/ui/ScreenshotCarousel";

export function Hero() {
  return (
    <section id="about" className="hero-stage" aria-labelledby="hero-title">
      <GradientOrbs />
      <div className="hero-grid-lines" aria-hidden="true" />
      <div className="hero-inner page-width">
        <div className="hero-copy">
          <div className="eyebrow hero-eyebrow">
            <span className="status-dot" /> EXCEL.
          </div>
          <h1 id="hero-title" className="hero-title-entrance">
            DEV
            <br />
            <span className="gradient-text">
              REALM<span className="title-sparkle">✦</span>
            </span>
          </h1>
          <Entrance delay={0}>
            <p className="hero-description">
              Roblox Anime Adventures automation
              <br className="desktop-break" /> Like steroids for Roblox.
            </p>
          </Entrance>
          <div className="hero-perks">
            <span>
              <Check size={13} /> Regularly updated
            </span>
            <span>
              <Check size={13} /> Extensive dev support
            </span>
            <span>
              <Check size={13} /> Highly optimized
            </span>
          </div>
        </div>
        <div className="hero-visual">
          <div className="visual-kicker">
            <span className="tiny-cross">+</span> {" "}
            <Sparkles size={12} />
          </div>
          <Entrance delay={0.3}>
            <ScreenshotCarousel />
          </Entrance>
        </div>
      </div>
    </section>
  );
}
