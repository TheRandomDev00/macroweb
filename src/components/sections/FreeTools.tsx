import {
  ArrowUpRight,
  Check,
  Gift,
  Layers3,
  MousePointer2,
  Sparkles,
  Workflow,
} from "lucide-react";
import { SectionLayer } from "@/components/layout/SectionLayer";
import { Reveal } from "@/components/motion/Reveal";

export function FreeTools() {
  return (
    <SectionLayer id="free-tools" className="free-section section-padding">
      <div className="page-width">
        <Reveal className="section-heading">
          <span className="eyebrow">
            <Gift size={13} /> GOOD THINGS START HERE
          </span>
          <h2>
            A head start. <span className="gradient-text">For free.</span>
          </h2>
          <p>Dip your toes in. Take a little busywork off your plate.</p>
        </Reveal>
        <div className="free-grid">
          <Reveal>
            <article className="free-card free-card-task">
              <div className="free-card-top">
                <span className="free-icon">
                  <Workflow size={23} />
                </span>
                <span className="free-tag">FREE TOOL</span>
              </div>
              <h3>
                Less clicking.
                <br />
                <span>More living.</span>
              </h3>
              <p>
                Meet Informaal Task. A simpler way to automate the little things
                that fill your day.
              </p>
              <a
                href="https://www.informaal.com/informaaltask"
                target="_blank"
                rel="noopener noreferrer"
                className="text-link"
              >
                Explore Informaal Task <ArrowUpRight size={16} />
              </a>
              <div className="task-illustration" aria-hidden="true">
                <div className="task-illustration-top">
                  <span className="status-dot" /> YOUR EVERYDAY, SIMPLIFIED{" "}
                  <span>↗</span>
                </div>
                {[
                  "Open your workspace",
                  "Run your daily routine",
                  "Make time for what matters",
                ].map((step, i) => (
                  <div className="task-row" key={step}>
                    <span className={i === 2 ? "task-pending" : "task-check"}>
                      {i === 2 ? <Sparkles size={12} /> : <Check size={12} />}
                    </span>
                    <span>{step}</span>
                    <span>{i === 2 ? "NEXT" : "DONE"}</span>
                  </div>
                ))}
                <MousePointer2 className="task-cursor" size={24} />
              </div>
            </article>
          </Reveal>
          <Reveal delay={0.12}>
            <article className="free-card free-card-games">
              <div className="free-card-top">
                <span className="free-icon">
                  <Layers3 size={23} />
                </span>
                <span className="free-tag">FREE VERSIONS</span>
              </div>
              <h3>
                Find your
                <br />
                <span>starting point.</span>
              </h3>
              <p>
                Get to know the tools with available free versions. Your next
                favorite routine starts here.
              </p>
              <a
                href="https://www.informaal.com/download"
                target="_blank"
                rel="noopener noreferrer"
                className="text-link"
              >
                Browse free versions <ArrowUpRight size={16} />
              </a>
              <div className="game-stack" aria-hidden="true">
                <img
                  src="/images/adventures.png"
                  alt=""
                  width="512"
                  height="512"
                  loading="lazy"
                />
                <img
                  src="/images/vanguards.png"
                  alt=""
                  width="512"
                  height="512"
                  loading="lazy"
                />
                <img
                  src="/images/expeditions.png"
                  alt=""
                  width="512"
                  height="512"
                  loading="lazy"
                />
                <span className="stack-badge">
                  <Gift size={16} /> A little boost, on us.
                </span>
              </div>
            </article>
          </Reveal>
        </div>
      </div>
    </SectionLayer>
  );
}
