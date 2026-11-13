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
            INFORMAAL
            <br />
            <span className="gradient-text">
              FROG<span className="title-sparkle">✦</span>
            </span>
          </h1>
          <Entrance delay={0.25}>
            <p className="hero-description">
              Your time is worth more than the grind.
              <br className="desktop-break" /> Automate your games, simplify the
              routine,
              <br className="desktop-break" /> and get back to the good part.
            </p>
          </Entrance>
          <Entrance delay={0.4}>
            <div className="hero-actions">
              <a className="button button-primary" href="#store">
                Find your tools <ArrowRight size={17} />
              </a>
              <a
                className="button button-secondary"
                href="https://discord.com/invite/informaal"
                target="_blank"
                rel="noopener noreferrer"
              >
                Join the community <ArrowUpRight size={16} />
              </a>
            </div>
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
            <span className="tiny-cross">+</span> BUILT AROUND THE WAY YOU PLAY{" "}
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
