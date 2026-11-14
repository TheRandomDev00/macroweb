"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowUpRight, MessageCircle, X } from "lucide-react";

export function RobuxPurchase({ href }: { href: string }) {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    if (!open || !dialog.current) return;
    const modal = dialog.current;
    const port = document.querySelector<HTMLElement>('.scene-stack[data-mode="pinned"]');
    const previousOverflow = port?.style.overflowY ?? "";
    const bodyOverflow = document.body.style.overflow;
    if (port) port.style.overflowY = "hidden";
    document.body.style.overflow = "hidden";
    modal.showModal();
    return () => {
      modal.close();
      if (port) port.style.overflowY = previousOverflow;
      document.body.style.overflow = bodyOverflow;
      trigger.current?.focus({ preventScroll: true });
    };
  }, [open]);

  return (
    <>
      <a ref={trigger} className="button button-secondary version-purchase-robux" href={href} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(true)}>
        <span>Purchase with Robux</span><ArrowUpRight size={17} />
      </a>
      {open && createPortal(
        <dialog ref={dialog} className="product-dialog robux-verification" aria-labelledby="robux-verification-title" aria-describedby="robux-verification-description" onCancel={() => setOpen(false)} onClick={event => { if (event.target === event.currentTarget) setOpen(false); }}>
          <button type="button" className="dialog-close icon-button" aria-label="Close purchase verification" onClick={() => setOpen(false)} autoFocus><X size={20} /></button>
          <span className="eyebrow">ROBUX PURCHASE</span>
          <h2 id="robux-verification-title">Verify your purchase</h2>
          <p id="robux-verification-description">After completing your Robux purchase, join the DevRealm Discord server and use the automatic verification bot to verify your purchase and receive access.</p>
          <a className="button button-discord" href="https://discord.gg/67gK8f5H" target="_blank" rel="noopener noreferrer"><MessageCircle size={18} /> Join Discord <ArrowUpRight size={16} /></a>
        </dialog>, document.body
      )}
    </>
  );
}
