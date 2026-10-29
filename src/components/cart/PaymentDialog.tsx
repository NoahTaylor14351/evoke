"use client";

import { useEffect, useId, useRef } from "react";
import { AlertCircle, X } from "lucide-react";
import type { PaymentMessage } from "@/src/lib/cart/checkout";

export function PaymentDialog({
  message,
  onClose,
}: {
  message: PaymentMessage | null;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  useEffect(() => {
    const element = dialog.current;
    if (!message || !element) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    element.showModal();
    return () => {
      if (element.open) element.close();
      document.body.style.overflow = previous;
    };
  }, [message]);
  if (!message) return null;
  return (
    <dialog
      ref={dialog}
      className="payment-dialog"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <button
        type="button"
        className="payment-dialog-close"
        onClick={onClose}
        aria-label="Close payment message"
      >
        <X size={19} />
      </button>
      <span className="payment-dialog-symbol">
        <AlertCircle size={26} strokeWidth={1.5} />
      </span>
      <p className="eyebrow">EVOKE / CHECKOUT</p>
      <h2 id={titleId}>{message.title}</h2>
      <p id={descriptionId}>{message.message}</p>
      <button className="button" type="button" onClick={onClose} autoFocus>
        OK
      </button>
    </dialog>
  );
}
