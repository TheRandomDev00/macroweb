import {
  ArrowUpRight,
  Heart,
  MessageCircle,
  Radio,
  Sparkles,
} from "lucide-react";
import { SectionLayer } from "@/components/layout/SectionLayer";
import { Reveal } from "@/components/motion/Reveal";

export function Community() {
  return (
    <SectionLayer id="community" className="community-section section-padding">
      <div className="page-width">
        <Reveal className="section-heading">
          <span className="eyebrow">
            <Heart size={13} /> BETTER, TOGETHER
          </span>
          <h2>
            Your people.
            <br className="mobile-break" />{" "}
            <span className="gradient-text">Your next level.</span>
          </h2>
          <p>A place to ask, share, and figure things out together.</p>
        </Reveal>
        <div className="community-grid">
          <Reveal>
            <article className="community-card discord-card">
              <div className="community-visual" aria-hidden="true">
                <div className="community-orbit orbit-one" />
                <div className="community-orbit orbit-two" />
                <span className="community-core">
                  <img
                    src="/images/informaal.png"
                    width="68"
                    height="68"
                    alt=""
                  />
                </span>
                <span className="orbit-item item-one">
                  <MessageCircle size={23} />
                </span>
                <span className="orbit-item item-two">
                  <img
                    src="/images/adventures.png"
                    width="42"
                    height="42"
                    alt=""
                    loading="lazy"
                  />
                </span>
                <span className="orbit-item item-three">
                  <Sparkles size={22} />
                </span>
                <span className="orbit-item item-four">
                  <img
                    src="/images/vanguards.png"
                    width="42"
                    height="42"
                    alt=""
                    loading="lazy"
                  />
                </span>
                <span className="orbit-item item-five">
                  <Heart size={21} />
                </span>
              </div>
              <div className="community-card-copy">
                <span className="eyebrow">THE INFORMAAL COMMUNITY</span>
                <h3>
                  Good company.
                  <br />
                  Even better possibilities.
                </h3>
                <p>
                  Find setup help, share your discoveries, and meet the players
                  behind the routines.
                </p>
                <a
                  href="https://discord.com/invite/informaal"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="button button-discord"
                >
                  <MessageCircle size={17} /> Find us on Discord{" "}
                  <ArrowUpRight size={16} />
                </a>
              </div>
            </article>
          </Reveal>
          <Reveal delay={0.12}>
            <article className="community-card updates-card">
              <div className="update-visual" aria-hidden="true">
                <span className="update-icon">
                  <Radio size={37} />
                </span>
                <span className="update-pill">
                  <span className="status-dot" /> ALWAYS MOVING FORWARD
                </span>
                <div className="update-lines">
                  <i />
                  <i />
                  <i />
                </div>
              </div>
              <span className="eyebrow">STAY IN THE LOOP</span>
              <h3>
                The next little
                <br />
                improvement.
              </h3>
              <p>
                New versions, small refinements, and what’s coming next. Keep up
                with the official updates.
              </p>
              <a
                className="text-link"
                href="https://www.informaal.com/updates"
                target="_blank"
                rel="noopener noreferrer"
              >
                Explore the changelog <ArrowUpRight size={16} />
              </a>
            </article>
          </Reveal>
        </div>
      </div>
    </SectionLayer>
  );
}
