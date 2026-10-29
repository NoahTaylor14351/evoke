"use client";

import { checkoutInputSchema } from "@/src/config/personalization";
import {
  cartFingerprint,
  cartSelections,
  saveCheckoutSnapshot,
  type CartLine,
} from "./store";

export type PaymentMessage = { title: string; message: string };
export const missingPaymentMessage: PaymentMessage = {
  title: "Payment Configuration Not Setup",
  message: "Online payments are not available yet. Please try again later.",
};
const ATTEMPT_KEY = "evoke-checkout-attempt-v1";
let memoryAttempt: { fingerprint: string; key: string } | undefined;
function attemptKey(lines: CartLine[]) {
  const fingerprint = cartFingerprint(lines);
  try {
    const saved: unknown = JSON.parse(
      localStorage.getItem(ATTEMPT_KEY) || "null",
    );
    if (
      saved &&
      typeof saved === "object" &&
      "fingerprint" in saved &&
      saved.fingerprint === fingerprint &&
      "key" in saved &&
      typeof saved.key === "string" &&
      /^[a-f0-9-]{36}$/i.test(saved.key)
    )
      return saved.key;
  } catch {}
  if (memoryAttempt?.fingerprint === fingerprint) return memoryAttempt.key;
  const key = crypto.randomUUID();
  memoryAttempt = { fingerprint, key };
  try {
    localStorage.setItem(ATTEMPT_KEY, JSON.stringify(memoryAttempt));
  } catch {}
  return key;
}
function resetAttempt() {
  memoryAttempt = undefined;
  try {
    localStorage.removeItem(ATTEMPT_KEY);
  } catch {}
}
export async function startCartCheckout(
  lines: CartLine[],
  termsAccepted: boolean,
): Promise<PaymentMessage | null> {
  if (!lines.length)
    return {
      title: "Your bag is empty",
      message: "Add a personalised jersey before continuing to checkout.",
    };
  if (!termsAccepted)
    return {
      title: "Review the pre-order terms",
      message:
        "Please confirm that you understand this is a paid pre-order and agree to the terms before continuing.",
    };
  const parsed = checkoutInputSchema.safeParse({
    items: cartSelections(lines),
    idempotencyKey: attemptKey(lines),
    termsAccepted: true,
  });
  if (!parsed.success)
    return {
      title: "Check your bag",
      message:
        parsed.error.issues[0]?.message ||
        "Check the names, sizes and quantities in your bag.",
    };
  try {
    // Establish the same-site owner cookie before creating a checkout session.
    const configResponse = await fetch("/api/checkout/config", {
      credentials: "same-origin",
      cache: "no-store",
    });
    if (!configResponse.ok)
      return {
        title: "Unable to start payment",
        message:
          "We couldn’t check payment availability. Please try again shortly.",
      };
    const config = await configResponse.json();
    if (
      config.ready === false ||
      config.paymentStatus === "missing" ||
      (config.ready === undefined && config.enabled === false)
    )
      return missingPaymentMessage;
    const response = await fetch("/api/checkout", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    const result = (await response.json().catch(() => ({}))) as {
      code?: string;
      url?: string;
      sessionId?: string;
    };
    if (!response.ok) {
      if (result.code === "PAYMENT_NOT_CONFIGURED")
        return missingPaymentMessage;
      if (
        ["CHECKOUT_CLOSED", "IDEMPOTENCY_CONFLICT"].includes(result.code || "")
      )
        resetAttempt();
      if (
        ["INVALID_SELECTION", "INVALID_CART", "PRODUCT_UNAVAILABLE"].includes(
          result.code || "",
        )
      )
        return {
          title: "Check your bag",
          message:
            "A jersey selection needs updating. Please review each name, size and quantity, then try again.",
        };
      if (result.code === "RATE_LIMITED")
        return {
          title: "Please try again shortly",
          message:
            "There have been several checkout attempts. Wait a moment, then try again.",
        };
      return {
        title: "Unable to start payment",
        message:
          "The payment service couldn’t start checkout. Your bag has been kept. Please try again later.",
      };
    }
    if (
      typeof result.url !== "string" ||
      typeof result.sessionId !== "string" ||
      !/^cs_[A-Za-z0-9_]+$/.test(result.sessionId)
    )
      throw new Error("Invalid checkout response");
    const url = new URL(result.url);
    if (url.protocol !== "https:" || url.hostname !== "checkout.stripe.com")
      throw new Error("Invalid checkout address");
    saveCheckoutSnapshot(result.sessionId, lines);
    window.location.assign(url.href);
    return null;
  } catch {
    return {
      title: "Unable to start payment",
      message:
        "We couldn’t connect to checkout. Your bag has been kept. Please check your connection and try again.",
    };
  }
}
