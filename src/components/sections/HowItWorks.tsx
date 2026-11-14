"use client";
import { useContext, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Gauge, Radio, SlidersHorizontal, Users, Zap } from "lucide-react";
import { easeOut } from "@/lib/motion-presets";
import { SceneProgressContext } from "@/components/motion/SceneContext";
import { usePageScroll } from "@/components/motion/PageScrollProvider";
import { SectionLayer } from "@/components/layout/SectionLayer";
type FeatureEntry = {
  title: string;
  icon: typeof Zap;
  description: string;
  screenshot: { src: string; width: number; height: number; crop?: "ocr"; alt: string };
};

const entries: FeatureEntry[] = [
  {
    title: "Efficiency",
    icon: Zap,
    description: "Automatically chooses the most efficient actions using a customizable priority system.",
    screenshot: {
      src: "/images/features/image%20copy%203.png",
      width: 491,
      height: 352,
      alt: "NITMAS card priority settings with a customizable ranked list of normal cards.",
    },
  },
  {
    title: "Performance",
    icon: Gauge,
    description: "Settings designed for low-end PCs significantly reduce idle resource usage, with a fast OCR engine to keep things running efficiently.",
    screenshot: {
      src: "/images/features/image%20copy.png",
      width: 506,
      height: 678,
      crop: "ocr",
      alt: "NITMAS text reading settings with Low CPU OCR selected and ready.",
    },
  },
  {
    title: "Remote",
    icon: Radio,
    description: "Get detailed Discord messages about each run in real time, wherever you are.",
    screenshot: {
      src: "/images/features/image%20copy%204.png",
      width: 504,
      height: 719,
      alt: "NITMAS Discord settings showing remote commands and webhook notifications for victories, defeats, and rare drops.",
    },
  },
  {
    title: "Multi account",
    icon: Users,
    description: "Run macros on up to 4 accounts simultaneously.",
    screenshot: {
      src: "/images/features/image.png",
      width: 534,
      height: 290,
      alt: "NITMAS Party settings for using alternate accounts or following a friend's party.",
    },
  },
  {
    title: "Customizable",
    icon: SlidersHorizontal,
    description: "Advanced users have extensive freedom to define their own action sets and parameters through a flexible configuration system.",
    screenshot: {
      src: "/images/features/image%20copy%202.png",
      width: 491,
      height: 661,
      alt: "NITMAS adaptation settings with automatic choices, wheel type, and customizable attack and defense priorities.",
    },
  },
];

export function HowItWorks() {
  const panel = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);
  const [headingRevealed, setHeadingRevealed] = useState(false);
  const [selected, setSelected] = useState(entries[0]);
  const reduced = useReducedMotion();
  const sceneProgress = useContext(SceneProgressContext);
  const { y } = usePageScroll();

  useEffect(() => {
    // Scene content moves with transforms, so measure after the scene paints.
    const update = () => {
      if (!panel.current) return;
      const port = panel.current.closest<HTMLElement>(".scene-stack[data-mode='pinned']");
      const viewport = port?.getBoundingClientRect();
      const visibleRatio = (element: HTMLElement | null) => {
        if (!element) return 0;
        const rect = element.getBoundingClientRect();
        const visibleHeight = Math.max(0,
          Math.min(rect.bottom, viewport?.bottom ?? window.innerHeight) -
          Math.max(rect.top, viewport?.top ?? 0));
        const visibleWidth = Math.max(0,
          Math.min(rect.right, viewport?.right ?? window.innerWidth) -
          Math.max(rect.left, viewport?.left ?? 0));
        return rect.width > 0 && rect.height > 0
          ? (visibleWidth * visibleHeight) / (rect.width * rect.height)
          : 0;
      };
      const panelRatio = visibleRatio(panel.current);
      const headingRatio = visibleRatio(heading.current);
      setRevealed((previous) => panelRatio === 0 ? false : panelRatio >= 0.1 || previous);
      setHeadingRevealed((previous) => headingRatio === 0 ? false : headingRatio >= 0.2 || previous);
    };
    const frame = requestAnimationFrame(update);
    const unsubscribeScroll = y.on("change", update);
    const unsubscribeScene = sceneProgress?.on("change", update);
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(frame);
      unsubscribeScroll();
      unsubscribeScene?.();
      window.removeEventListener("resize", update);
    };
  }, [sceneProgress, y]);

  return (
    <SectionLayer id="how-it-works" className="how-section section-padding">
      <div className="page-width how-grid">
        <motion.div
          ref={heading}
          className="how-intro"
          initial={{ opacity: 0, x: -36 }}
          animate={{ opacity: headingRevealed ? 1 : 0, x: headingRevealed || reduced ? 0 : -36 }}
          transition={{ duration: reduced || !headingRevealed ? 0 : 0.28, ease: easeOut }}
        >
          <h1><span className="gradient-text">Features</span></h1>

        </motion.div>
        <motion.div
          ref={panel}
          className="how-panel"
          initial={{ opacity: 0, filter: "blur(12px)" }}
          animate={{
            opacity: revealed ? 1 : 0,
            filter: revealed ? "blur(0px)" : "blur(12px)",
          }}
          transition={{
            duration: reduced || !revealed ? 0 : 0.5,
            delay: reduced || !revealed ? 0 : 0.12,
            ease: easeOut,
          }}
          inert={!revealed}
        >
          <div className="how-panel-list" aria-label="Features">
            {entries.map((entry) => (
              <button
                key={entry.title}
                type="button"
                className="how-panel-entry"
                aria-pressed={selected === entry}
                aria-controls="feature-preview"
                onClick={() => setSelected(entry)}
              >
                <entry.icon className="how-panel-entry-icon" size={22} strokeWidth={1.7} aria-hidden="true" />
                <span className="how-panel-entry-label">{entry.title}</span>
              </button>
            ))}
          </div>
          <div id="feature-preview" className="how-panel-preview" aria-live="polite" aria-atomic="true">
            <div>
              <h2 className="gradient-text">{selected.title}</h2>
              <p>{selected.description}</p>
                <figure className={`feature-screenshot${selected.screenshot.crop ? ` feature-screenshot--${selected.screenshot.crop}` : ""}`}>
                  <a href={selected.screenshot.src} target="_blank" rel="noopener noreferrer" aria-label={`View full ${selected.title.toLowerCase()} screenshot`}>
                  <img
                    src={selected.screenshot.src}
                    alt={selected.screenshot.alt}
                    width={selected.screenshot.width}
                    height={selected.screenshot.height}
                    loading="lazy"
                  />
                  </a>
                </figure>
            </div>
          </div>
        </motion.div>
      </div>
    </SectionLayer>
  );
}
