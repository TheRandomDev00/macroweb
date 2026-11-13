"use client";
import { ArrowUpRight, Download, Gamepad2, Play } from "lucide-react";
import { motion, useReducedMotion, useScroll } from "motion/react";
import { SceneProgressContext } from "@/components/motion/SceneContext";
import { useContext, useRef } from "react";
import { SectionLayer } from "@/components/layout/SectionLayer";
import { Reveal } from "@/components/motion/Reveal";
const steps = [
  {
    title: "Find your fit.",
    text: "Choose a tool for the game you love. Explore the options and find the routine that works for you.",
    icon: Gamepad2,
  },
  {
    title: "Make it yours.",
    text: "Follow the official setup guide, download your tool, and get everything ready to go.",
    icon: Download,
  },
  {
    title: "Get back to the good part.",
    text: "Start your routine and let a little automation take care of the repetition.",
    icon: Play,
  },
];
export function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 75%", "end 65%"],
  });
  const reduced = useReducedMotion();
  const sceneProgress = useContext(SceneProgressContext);
  return (
    <SectionLayer id="how-it-works" className="how-section section-padding">
      <div className="page-width how-grid" ref={ref}>
        <Reveal className="how-intro">
          <span className="eyebrow">LESS TO DO. MORE TO ENJOY.</span>
          <h2>
            Goodbye, grind.
            <br />
            Hello, <span className="gradient-text">free time.</span>
          </h2>
          <p>
            You don’t need a complicated setup.
            <br />
            Just your game, your tools, and a few minutes.
          </p>
          <a
            className="text-link"
            href="#how-it-works"
            target="_blank"
            rel="noopener noreferrer"
          >
            Read the setup guides <ArrowUpRight size={16} />
          </a>
        </Reveal>
        <div className="how-steps">
          <div className="steps-track" aria-hidden="true">
            <motion.span
              style={{
                scaleY: reduced ? 1 : (sceneProgress ?? scrollYProgress),
              }}
            />
          </div>
          {steps.map((step, i) => (
            <Reveal key={step.title} delay={i * 0.08} className="how-step">
              <span className="step-number">0{i + 1}</span>
              <div>
                <span className="how-step-icon">
                  <step.icon size={17} />
                </span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </SectionLayer>
  );
}
