"use client";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Pause,
  Play,
  RotateCcw,
  Settings2,
  Sparkles,
} from "lucide-react";
import { useState } from "react";

const slides = [
  "The command center",
  "Build your routine",
  "Your session, at a glance",
];

export function ScreenshotCarousel() {
  const [slide, setSlide] = useState(0);
  const [running, setRunning] = useState(false);
  const change = (step: number) =>
    setSlide((current) => (current + step + slides.length) % slides.length);
  return (
    <div
      className="showcase"
      role="region"
      aria-roledescription="carousel"
      aria-label="Tool previews"
      onKeyDown={(e) => {
        if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
          e.preventDefault();
          const step = e.key === "ArrowRight" ? 1 : -1;
          change(step);
          if (
            e.target instanceof HTMLElement &&
            e.target.getAttribute("role") === "tab"
          ) {
            const next = (slide + step + slides.length) % slides.length;
            requestAnimationFrame(() =>
              document.getElementById(`preview-tab-${next}`)?.focus(),
            );
          }
        }
      }}
    >
      <div className="showcase-halo" aria-hidden="true" />
      <div className="showcase-window">
        <div className="window-chrome">
          <div className="window-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
          <span>
            DEVREALM / {slide === 0 ? "COMMAND CENTER" : "INTERACTIVE PREVIEW"}
          </span>
          <Settings2 size={12} />
        </div>
        <div
          id="tool-preview-panel"
          className="carousel-stage"
          role="tabpanel"
          aria-labelledby={`preview-tab-${slide}`}
          aria-live="polite"
          aria-atomic="true"
        >
          {slide === 0 && (
            <div
              className="screenshot-slide"
              role="group"
              aria-roledescription="slide"
              aria-label="1 of 3: Command center"
            >
              <img
                src="/images/devrealm-preview.svg"
                alt="DevRealm Anime Vanguards interface with map and routine selectors"
                width="1301"
                height="781"
                fetchPriority="high"
              />
            </div>
          )}
          {slide === 1 && (
            <div
              className="routine-slide"
              role="group"
              aria-roledescription="slide"
              aria-label="2 of 3: Routine builder preview"
            >
              <div className="preview-title">
                <span className="preview-icon">
                  <RotateCcw size={18} />
                </span>
                <div>
                  <h3>Your routine. Your rules.</h3>
                  <p>An interactive interface preview</p>
                </div>
                <span className="small-tag">PREVIEW</span>
              </div>
              <div className="routine-steps">
                {[
                  "Select a game",
                  "Choose your routine",
                  "Let it do its thing",
                ].map((label, i) => (
                  <div
                    className={`routine-step ${running ? "is-running" : ""}`}
                    key={label}
                  >
                    <span>
                      {i === 0 || running ? <Check size={13} /> : `0${i + 1}`}
                    </span>
                    <p>{label}</p>
                    <span className="step-detail">
                      {i === 0
                        ? "Anime Vanguards"
                        : i === 1
                          ? "Custom map"
                          : running
                            ? "Preview running"
                            : "Ready when you are"}
                    </span>
                  </div>
                ))}
              </div>
              <button
                className={`preview-run ${running ? "running" : ""}`}
                onClick={() => setRunning(!running)}
              >
                {running ? <Pause size={14} /> : <Play size={14} />}
                {running ? "Pause preview" : "Run preview"}
              </button>
            </div>
          )}
          {slide === 2 && (
            <div
              className="session-slide"
              role="group"
              aria-roledescription="slide"
              aria-label="3 of 3: Illustrative session dashboard"
            >
              <div className="preview-title">
                <span className="preview-icon">
                  <Sparkles size={18} />
                </span>
                <div>
                  <h3>Every little win, together.</h3>
                  <p>Illustrative session dashboard</p>
                </div>
              </div>
              <div className="session-metrics">
                <div>
                  <span>Session time</span>
                  <strong>
                    02:48<span>:32</span>
                  </strong>
                </div>
                <div>
                  <span>Routines complete</span>
                  <strong>
                    24<span>/24</span>
                  </strong>
                </div>
              </div>
              <div
                className="session-chart"
                aria-label="Illustrative activity chart"
              >
                {[28, 42, 36, 56, 46, 67, 60, 78, 71, 86, 79, 95, 88, 100].map(
                  (height, i) => (
                    <span
                      key={i}
                      style={{
                        height: `${height}%`,
                        animationDelay: `${i * 0.07}s`,
                      }}
                    />
                  ),
                )}
              </div>
              <div className="session-caption">
                <span>SESSION ACTIVITY</span>
                <span className="status-dot" />
                ALL SYSTEMS GO
              </div>
            </div>
          )}
        </div>
        <div className="window-bottom">
          <div className="game-label">
            <img src="/images/vanguards.png" width="28" height="28" alt="" />
            <span>
              Anime Vanguards<small>Automation, made simple.</small>
            </span>
          </div>
          <span className="window-status">
            <i /> Ready to run
          </span>
        </div>
      </div>
      <div className="showcase-floating" aria-hidden="true">
        <span className="success-icon">
          <Check size={14} />
        </span>
        <div>
          Less grind.<strong>More possibilities.</strong>
        </div>
        <Sparkles size={15} />
      </div>
      <div className="carousel-controls">
        <div
          className="carousel-pagination"
          role="tablist"
          aria-label="Select a tool preview"
        >
          {slides.map((name, i) => (
            <button
              key={name}
              role="tab"
              id={`preview-tab-${i}`}
              aria-selected={i === slide}
              aria-controls="tool-preview-panel"
              aria-label={name}
              tabIndex={i === slide ? 0 : -1}
              onClick={() => setSlide(i)}
              className={i === slide ? "active" : ""}
            />
          ))}
        </div>
        <span className="carousel-caption">{slides[slide]}</span>
        <div className="carousel-arrows">
          <button aria-label="Previous preview" onClick={() => change(-1)}>
            <ArrowLeft size={15} />
          </button>
          <button aria-label="Next preview" onClick={() => change(1)}>
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
