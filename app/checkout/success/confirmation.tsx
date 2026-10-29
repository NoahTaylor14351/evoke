"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, CheckCircle2, Clock3, RefreshCw } from "lucide-react";
import { formatPrice, getProduct, type VariantId } from "@/src/config/commerce";
import { clearVerifiedCheckoutCart } from "@/src/lib/cart/store";

type OrderItem = {
  variantId: VariantId;
  size: string;
  printedName: string;
  quantity: number;
  unitAmount: number;
  totalAmount?: number;
};
type OrderStatus = {
  status: string;
  reference?: string;
  items?: OrderItem[];
  amountTotal?: number;
  amountSubtotal?: number;
  shippingTotal?: number;
  taxTotal?: number;
  currency?: string;
  emailStatus?: string;
};
export default function Confirmation() {
  const [state, setState] = useState<OrderStatus>({ status: "loading" });
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const controller = new AbortController();
    const session = new URLSearchParams(window.location.search).get(
      "session_id",
    );
    if (!session || !/^cs_[A-Za-z0-9_]{10,250}$/.test(session)) {
      setState({ status: "unverified" });
      return;
    }
    setState({ status: "loading" });
    const check = async () => {
      try {
        const response = await fetch(
          `/api/checkout/status?session_id=${encodeURIComponent(session)}`,
          {
            cache: "no-store",
            credentials: "same-origin",
            signal: controller.signal,
          },
        );
        const result: unknown = await response.json();
        if (!active) return;
        if (
          !response.ok ||
          !result ||
          typeof result !== "object" ||
          !("status" in result) ||
          typeof result.status !== "string"
        ) {
          setState({ status: "unverified" });
          return;
        }
        const status = result as OrderStatus;
        setState(status);
        if (status.status === "paid") {
          clearVerifiedCheckoutCart(session);
        } else if (
          ["pending", "processing"].includes(status.status) &&
          ++attempts < 12
        ) {
          timer = setTimeout(check, 2500);
        }
      } catch (error) {
        if (active && !controller.signal.aborted)
          setState({ status: "unverified" });
      }
    };
    void check();
    return () => {
      active = false;
      controller.abort();
      if (timer) clearTimeout(timer);
    };
  }, [retry]);
  const paid = state.status === "paid";
  const refunded = ["refunded", "partially_refunded"].includes(state.status);
  const waiting = ["loading", "pending", "processing"].includes(state.status);
  const items = Array.isArray(state.items)
    ? state.items
        .filter(
          (item) =>
            getProduct(item.variantId) &&
            typeof item.printedName === "string" &&
            typeof item.size === "string" &&
            Number.isInteger(item.quantity),
        )
        .slice(0, 20)
    : [];
  return (
    <main className="confirmation-page container">
      <section className="confirmation-card">
        <span className={`confirmation-symbol ${paid ? "is-paid" : ""}`}>
          {paid ? (
            <CheckCircle2 size={38} strokeWidth={1.3} />
          ) : (
            <Clock3 size={38} strokeWidth={1.3} />
          )}
        </span>
        <span className="eyebrow">EVOKE / PAID PRE-ORDERS</span>
        <h1>
          {paid
            ? "Your name. Our next chapter."
            : refunded
              ? state.status === "refunded" ? "Your payment was refunded." : "Your payment was partially refunded."
            : waiting
              ? "Confirming your pre-order…"
              : "Payment not yet verified."}
        </h1>
        <p className="confirmation-intro" aria-live="polite">
          {paid
            ? "Your payment is confirmed and your personalised pre-order is recorded."
            : refunded
              ? "Your order records reflect a refund. Contact Evoke if you need help with the amount or your remaining pre-order."
            : waiting
              ? "We’re securely checking your payment. This page will update when confirmation is available."
              : "We haven’t confirmed a successful payment for this visit. If you completed checkout, keep your Stripe receipt and check again shortly."}
        </p>
        {paid && (
          <>
            <div className="confirmation-reference">
              <span>ORDER REFERENCE</span>
              <strong>{state.reference || "Recorded securely"}</strong>
              <span className="tag">PAID — PRE-ORDER</span>
            </div>
            {items.length > 0 && (
              <div className="confirmed-items">
                {items.map((item, index) => (
                  <div
                    className="confirmed-item"
                    key={`${item.variantId}-${index}`}
                  >
                    <div>
                      <strong>{getProduct(item.variantId)?.name}</strong>
                      <span>
                        Size {item.size} · Printed name:{" "}
                        <b>{item.printedName}</b> · Qty {item.quantity}
                      </span>
                    </div>
                    {typeof item.unitAmount === "number" && (
                      <strong>
                        {formatPrice(item.unitAmount * item.quantity)}
                      </strong>
                    )}
                  </div>
                ))}
              </div>
            )}
            {typeof state.amountTotal === "number" && (
              <dl className="confirmation-totals">
                {typeof state.shippingTotal === "number" && (
                  <div>
                    <dt>Shipping</dt>
                    <dd>{formatPrice(state.shippingTotal)}</dd>
                  </div>
                )}
                {typeof state.taxTotal === "number" && (
                  <div>
                    <dt>Tax</dt>
                    <dd>{formatPrice(state.taxTotal)}</dd>
                  </div>
                )}
                <div className="confirmation-total">
                  <dt>Amount paid</dt>
                  <dd>{formatPrice(state.amountTotal)} USD</dd>
                </div>
              </dl>
            )}
            <p className="confirmation-delivery">
              This is a pre-order. Your jersey ships later, according to the
              information shown at checkout.{" "}
              {state.emailStatus === "sent"
                ? "Your confirmation email has been sent."
                : "Your order remains securely recorded; keep your order reference for support."}
            </p>
          </>
        )}
        <div className="confirmation-actions">
          {!paid && (
            <button
              type="button"
              className="button secondary"
              onClick={() => setRetry((value) => value + 1)}
            >
              <RefreshCw size={15} />
              Check payment again
            </button>
          )}
          <Link href={paid ? "/shop" : "/cart"} className="button">
            {paid ? "Continue exploring" : "Return to your bag"}
            <ArrowUpRight size={16} />
          </Link>
        </div>
        <p className="confirmation-support">
          Need help? <Link href="/contact">Contact Evoke</Link>.
        </p>
      </section>
    </main>
  );
}
