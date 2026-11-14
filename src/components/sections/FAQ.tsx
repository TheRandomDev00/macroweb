"use client";
import { ArrowUpRight, Plus } from "lucide-react";
import { useState } from "react";
import { SectionLayer } from "@/components/layout/SectionLayer";
import { Reveal } from "@/components/motion/Reveal";
import { faqs } from "@/content/landing";
export function FAQ() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <SectionLayer id="faq" className="faq-section section-padding">
      <div className="page-width">
        <Reveal className="section-heading">
          <h2>
             F<span className="gradient-text">A</span>Q
          </h2>
          <p>commonly asked questions</p>
        </Reveal>
        <div className="faq-grid">
          {faqs.map((faq, i) => (
            <Reveal key={faq.question} delay={i * 0.06} distance={15}>
              <article className={`faq-item ${open === i ? "is-open" : ""}`}>
                <h3>
                  <button
                    type="button"
                    aria-expanded={open === i}
                    aria-controls={`faq-answer-${i}`}
                    id={`faq-question-${i}`}
                    onClick={() => setOpen(open === i ? null : i)}
                  >
                    <span>{faq.question}</span>
                    <span className="faq-plus">
                      <Plus size={16} />
                    </span>
                  </button>
                </h3>
                <div className="faq-answer-grid" inert={open !== i}>
                  <div>
                    <div
                      id={`faq-answer-${i}`}
                      className="faq-answer"
                      role="region"
                      aria-labelledby={`faq-question-${i}`}
                      aria-hidden={open !== i}
                    >
                      {faq.answer}
                    </div>
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
        <Reveal className="faq-help">
          <a
            href="#community"
          >
            Discord <ArrowUpRight size={14} />
          </a>
        </Reveal>
      </div>
    </SectionLayer>
  );
}
