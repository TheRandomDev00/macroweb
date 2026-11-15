import { ArrowUpRight, Coins, Crown, Gift, Sparkles } from "lucide-react";
import { SectionLayer } from "@/components/layout/SectionLayer";
import { Reveal } from "@/components/motion/Reveal";
import { Entrance } from "../motion/Entrance";
import { Changelog } from "./Changelog";
import { RobuxPurchase } from "@/components/ui/RobuxPurchase";

const versions = [
  {
    id: "free-tools",
    name: "Free version",
    icon: Gift,
    tagline: "Your starting point.",
    price: "Free",
    description:
      "Basic functionality",
    action: "Start for free",
    premium: false,
  },
  {
    id: "premium-tools",
    name: "Premium",
    icon: Crown,
    tagline: "",
    price: "4 USD",
    description:
      "Advanced smart features for maximized efficiency",
    action: "Explore premium",
    premium: true,
  },
];

export function FreeTools() {
  return (
    <SectionLayer className="free-section section-padding">
      <div className="page-width">
        <div id="store">
        <Entrance whenInView>
        <Reveal className="section-heading">
          <span className="eyebrow">
            <Sparkles size={13} /> ANIME ADVENTURES
          </span>
          <h2>
             Pricing
          </h2>
          <p>Free    |    Premium</p>
        </Reveal>


        <div className="free-grid">
          {versions.map((version, index) => (
            <Reveal key={version.id} delay={index * 0.12}>
              <article
                id={version.id}
                className={`free-card version-card${version.premium ? " version-card--premium" : ""}`}
                aria-labelledby={`${version.id}-title`}
              >
                <div className="free-card-top">
                  <span className="free-icon" aria-hidden="true">
                    <version.icon size={25} />
                  </span>
                  <span className="version-price">{version.price}</span>
                </div>
                <h3 id={`${version.id}-title`}>{version.name}</h3>
                <span className="version-tagline">{version.tagline}</span>
                <p>{version.description}</p>
                {!version.premium && (
                  <div className="version-actions">
                    <a className="button button-secondary" href="https://github.com/TheRandomDev00/NITMASAAMacroFree/releases" target="_blank" rel="noopener noreferrer">
                      Get the free version <ArrowUpRight size={17} />
                    </a>
                  </div>
                )}
                {version.premium && (
                  <section className="version-payments version-purchase-grid" aria-label="Purchase options">
                      <a className="button button-primary version-purchase-main" href="https://ko-fi.com/notrandomdev" target="_blank" rel="noopener noreferrer">
                        <span>Purchase</span><ArrowUpRight size={17} />
                      </a>
                      <ul className="version-payment-tags-main" aria-label="Purchase payment methods">
                      <li>
                        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <path opacity=".5" d="M10 7h6c4 0 5 2 4 5-.7 3-3 5-6 5h-2l-1 5H7Z" />
                          <path d="M6 2h7c4 0 6 2 5 6-.7 4-3 6-7 6H9l-1 5H3L6 2Zm4 4-1 5h2c2 0 3-1 3-3 .4-1.4-.3-2-2-2h-2Z" />
                        </svg>
                        PayPal
                      </li>
                      <li><Coins size={19} aria-hidden="true" /> Crypto</li>
                      </ul>
                      <RobuxPurchase href="https://www.roblox.com/game-pass/2053882629/Lelouch-britania-commands-u" />
                      <ul className="version-payment-tags-robux" aria-label="Robux purchase payment method">
                        <li>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                            <path d="m12 2 9 5v10l-9 5-9-5V7Z" />
                            <path d="m12 7 5 5-5 5-5-5Z" />
                          </svg>
                          Robux
                        </li>
                      </ul>
                  </section>
                )}
              </article>
            </Reveal>
          ))}
        </div>
        </Entrance>
        </div>
        <Changelog />
      </div>
    </SectionLayer>
  );
}
