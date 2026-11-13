"use client";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  Mouse,
  Sparkles,
} from "lucide-react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import { useEffect, useRef, useState } from "react";
import { StarField } from "@/components/effects/StarField";
import { GradientOrbs } from "@/components/effects/GradientOrbs";
import { Entrance } from "@/components/motion/Entrance";
import { ScreenshotCarousel } from "@/components/ui/ScreenshotCarousel";
import { easeOut } from "@/lib/motion-presets";

export function Hero() {
  const section = useRef<HTMLElement>(null);
  const [height, setHeight] = useState(850);
  const [sticky, setSticky] = useState(false);
  const reduced = useReducedMotion();
  const { scrollY } = useScroll();
  const scale = useTransform(scrollY, [0, height], [1, 0.94]);
  const exitOpacity = useTransform(scrollY, [0, height * 0.85], [1, 0.35]);
  const titleOpacity = useMotionValue(1);
  const titleY = useMotionValue(0);
  useEffect(() => {
    const el = section.current;
    if (!el) return;
    const measure = () => {
      const h = el.getBoundingClientRect().height;
      setHeight(h);
      setSticky(window.innerWidth >= 768 && h <= window.innerHeight + 1);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    window.addEventListener("resize", measure);
    measure();
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);
  useEffect(() => {
    if (reduced) {
      titleOpacity.set(1);
      titleY.set(0);
      return;
    }
    titleOpacity.set(0);
    titleY.set(24);
    const fade = animate(titleOpacity, 1, { duration: 0.7, ease: easeOut });
    const slide = animate(titleY, 0, { duration: 0.8, ease: easeOut });
    return () => {
      fade.stop();
      slide.stop();
    };
  }, [reduced, titleOpacity, titleY]);
  return (
    <section
      id="about"
      ref={section}
      className={`hero-stage ${sticky && !reduced ? "can-stick" : ""}`}
      aria-labelledby="hero-title"
    >
      <GradientOrbs />
      <StarField />
      <div className="hero-grid-lines" aria-hidden="true" />
      <motion.div
        className="hero-inner page-width"
        style={{
          scale: sticky && !reduced ? scale : 1,
          opacity: sticky && !reduced ? exitOpacity : 1,
        }}
      >
        <div className="hero-copy">
          <div className="eyebrow hero-eyebrow">
            <span className="status-dot" /> LESS GRIND. MORE GAME.
          </div>
          <motion.h1
            id="hero-title"
            style={{ opacity: titleOpacity, y: titleY }}
          >
            INFORMAAL
            <br />
            <span className="gradient-text">
              FROG<span className="title-sparkle">✦</span>
            </span>
          </motion.h1>
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
              <Check size={13} /> Easy to set up
            </span>
            <span>
              <Check size={13} /> Free tools available
            </span>
            <span>
              <Check size={13} /> Made for players
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
      </motion.div>
      <div className="hero-bottom page-width">
        <a href="#store">
          <Mouse size={15} />
          <span>SCROLL TO DISCOVER</span>
          <ArrowDown size={12} />
        </a>
        <span>THE LITTLE THINGS. AUTOMATED.</span>
      </div>
    </section>
  );
}
