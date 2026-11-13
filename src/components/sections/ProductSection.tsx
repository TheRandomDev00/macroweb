"use client";
import { ArrowRight, ArrowUpRight, Search, Sparkles, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Reveal } from "@/components/motion/Reveal";
import { SectionLayer } from "@/components/layout/SectionLayer";
import { ProductDialog } from "@/components/ui/ProductDialog";
import { products, type Product } from "@/content/landing";

const categories = ["All tools", "Tower defense", "Adventure"] as const;

export function ProductSection() {
  const [category, setCategory] = useState<string>("All tools");
  const [query, setQuery] = useState("");
  const [monthly, setMonthly] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);
  const filtered = useMemo(
    () =>
      products.filter(
        (product) =>
          (category === "All tools" || product.category === category) &&
          product.name.toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [category, query],
  );
  return (
    <SectionLayer id="store" className="store-section section-padding">
      <div className="page-width">
        <Reveal className="section-heading">
          <span className="eyebrow">
            <Sparkles size={13} /> A LITTLE EXTRA ADVANTAGE
          </span>
          <h2>
            Go <span className="gradient-text">Premium.</span>
          </h2>
          <p>
            Your game. Your routine. Your next level.
            <br />
            Find the right tools to make more of your time.
          </p>
          <span className="heading-rule" />
        </Reveal>
        <div className="store-toolbar">
          <div
            className="filter-tabs"
            role="group"
            aria-label="Filter tools by category"
          >
            {categories.map((tab) => (
              <button
                key={tab}
                aria-pressed={category === tab}
                className={category === tab ? "active" : ""}
                onClick={() => setCategory(tab)}
              >
                {tab}
                {tab === "All tools" && <span>{products.length}</span>}
              </button>
            ))}
          </div>
          <div className="store-options">
            <label className="search-field">
              <Search size={15} />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Find your game"
                aria-label="Search games"
              />
            </label>
            <div
              className="billing-toggle"
              role="group"
              aria-label="Payment option"
            >
              <button
                aria-pressed={!monthly}
                className={!monthly ? "active" : ""}
                onClick={() => setMonthly(false)}
              >
                One-time
              </button>
              <button
                aria-pressed={monthly}
                className={monthly ? "active" : ""}
                onClick={() => setMonthly(true)}
              >
                Monthly
              </button>
            </div>
          </div>
        </div>
        <p className="sr-only" aria-live="polite">
          {filtered.length} {filtered.length === 1 ? "tool" : "tools"} found
        </p>
        <div className="product-grid">
          {filtered.map((product, i) => {
            const isMonthly = monthly && product.monthlyPrice !== null;
            const price = isMonthly ? product.monthlyPrice! : product.price;
            return (
              <Reveal
                key={product.id}
                delay={(i % 3) * 0.055}
                distance={32}
                className="product-reveal"
              >
                <article className={`product-card theme-${product.color}`}>
                  <button
                    className="product-art"
                    onClick={() => setSelected(product)}
                    aria-label={`View ${product.name} details`}
                  >
                    <img
                      src={product.image}
                      alt={`${product.name} game artwork`}
                      width="512"
                      height="512"
                      loading="lazy"
                    />
                    <span className="art-shade" />
                    <span className="product-category">{product.category}</span>
                    <span className="art-open">
                      <ArrowUpRight size={19} />
                    </span>
                  </button>
                  <div className="product-body">
                    <div className="product-topline">
                      <span className="product-type">PREMIUM TOOL</span>
                      <span className="version-label">v{product.version}</span>
                    </div>
                    <h3>
                      <button onClick={() => setSelected(product)}>
                        {product.name}
                      </button>
                    </h3>
                    <p>{product.tagline}</p>
                    <div className="product-bottom">
                      <div className="product-price">
                        <strong>${price.toFixed(2)}</strong>
                        <span>{isMonthly ? "/ month" : "one-time"}</span>
                      </div>
                      <button
                        className="product-view"
                        onClick={() => setSelected(product)}
                        aria-label={`Explore ${product.name}`}
                      >
                        <ArrowRight size={18} />
                      </button>
                    </div>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
        {filtered.length === 0 && (
          <div className="empty-state">
            <Search size={26} />
            <h3>No tools found.</h3>
            <p>Try another game or explore the full collection.</p>
            <button
              className="button button-secondary"
              onClick={() => {
                setQuery("");
                setCategory("All tools");
              }}
            >
              <X size={14} /> Clear filters
            </button>
          </div>
        )}
        <div className="store-footnote">
          <span>Prices shown in USD · Catalogue snapshot, Nov 2026</span>
          <a
            href="#store"
            target="_blank"
            rel="noopener noreferrer"
          >
            Explore the catalogue <ArrowUpRight size={13} />
          </a>
        </div>
      </div>
      {selected && (
        <ProductDialog
          product={selected}
          monthly={monthly}
          onClose={() => setSelected(null)}
        />
      )}
    </SectionLayer>
  );
}
