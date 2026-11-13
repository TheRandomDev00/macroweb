"use client";
import { ArrowUpRight, Check, ExternalLink, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Product } from "@/content/landing";

export function ProductDialog({
  product,
  monthly,
  onClose,
}: {
  product: Product;
  monthly: boolean;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [container, setContainer] = useState<HTMLElement | null>(null);
  useEffect(() => setContainer(document.body), []);
  const isMonthly = monthly && product.monthlyPrice !== null;
  const price = isMonthly ? product.monthlyPrice! : product.price;
  useEffect(() => {
    const el = ref.current;
    if (!el || !container) return;
    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const port = document.querySelector<HTMLElement>(
      '.scene-stack[data-mode="pinned"]',
    );
    const portOverflow = port?.style.overflowY ?? "";
    if (port) port.style.overflowY = "hidden";
    el.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
      el.close();
      if (port) port.style.overflowY = portOverflow;
      previousFocus?.focus({ preventScroll: true });
    };
  }, [container]);
  if (!container) return null;
  return createPortal(
    <dialog
      ref={ref}
      className="product-dialog"
      aria-labelledby="product-dialog-title"
      aria-describedby="product-dialog-description"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="dialog-inner">
        <button
          className="dialog-close icon-button"
          onClick={onClose}
          aria-label="Close product details"
          autoFocus
        >
          <X size={20} />
        </button>
        <div className={`dialog-art theme-${product.color}`}>
          <img
            src={product.image}
            width="512"
            height="512"
            alt={`${product.name} game artwork`}
          />
          <span className="art-shade" />
          <span className="product-category">{product.category}</span>
        </div>
        <div className="dialog-content">
          <span className="eyebrow">FIND YOUR NEXT ADVANTAGE</span>
          <h2 id="product-dialog-title">{product.name}</h2>
          <p id="product-dialog-description">{product.description}</p>
          <div className="dialog-price">
            <strong>${price.toFixed(2)}</strong>
            <span>{isMonthly ? "/ month" : "one-time"}</span>
          </div>
          <ul className="dialog-notes">
            <li>
              <Check size={15} />{" "}
              {isMonthly ? "Monthly option" : "Permanent option"}
            </li>
            <li>
              <Check size={15} /> Version {product.version}
            </li>
            <li>
              <ExternalLink size={14} /> Setup and support on the official site
            </li>
          </ul>
          <a
            className="button button-primary"
            href="https://www.informaal.com/#store"
            target="_blank"
            rel="noopener noreferrer"
          >
            Continue to official store <ArrowUpRight size={16} />
          </a>
          <p className="dialog-fine-print">
            Catalogue snapshot · November 13, 2026.
            <br />
            Confirm current pricing and terms on informaal.com.
          </p>
        </div>
      </div>
    </dialog>,
    container,
  );
}
