"use client";

import { useSyncExternalStore } from "react";
import {
  cartItemSchema,
  jerseyNameSchema,
  type CartSelection,
} from "@/src/config/personalization";

export type CartLine = CartSelection & { id: string };
type CartState = { lines: CartLine[]; loaded: boolean; storageError: boolean };
const CART_KEY = "evoke-cart-v1";
const CHECKOUT_KEY = "evoke-checkout-snapshots-v1";
const emptyState: CartState = { lines: [], loaded: false, storageError: false };
let state = emptyState;
let initialized = false;
const subscribers = new Set<() => void>();

function decode(value: string | null): CartLine[] {
  if (!value) return [];
  try {
    const data: unknown = JSON.parse(value);
    if (!Array.isArray(data) || data.length > 20) return [];
    const ids = new Set<string>();
    return data.flatMap((candidate: unknown) => {
      if (!candidate || typeof candidate !== "object") return [];
      const { id, ...selection } = candidate as Record<string, unknown>;
      const parsed = cartItemSchema.safeParse(selection);
      if (
        typeof id !== "string" ||
        !/^[a-f0-9-]{36}$/i.test(id) ||
        ids.has(id) ||
        !parsed.success
      )
        return [];
      ids.add(id);
      return [{ id, ...parsed.data }];
    });
  } catch {
    return [];
  }
}

function emit() {
  subscribers.forEach((listener) => listener());
}
function initialize() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  try {
    state = {
      lines: decode(localStorage.getItem(CART_KEY)),
      loaded: true,
      storageError: false,
    };
  } catch {
    state = { lines: [], loaded: true, storageError: true };
  }
  window.addEventListener("storage", (event) => {
    if (event.key !== CART_KEY) return;
    state = {
      lines: decode(event.newValue),
      loaded: true,
      storageError: false,
    };
    emit();
  });
  emit();
}
function commit(lines: CartLine[]) {
  initialize();
  let storageError = false;
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(lines));
  } catch {
    storageError = true;
  }
  state = { lines, loaded: true, storageError };
  emit();
}
function sameSelection(first: CartSelection, second: CartSelection) {
  return (
    first.variantId === second.variantId &&
    first.size === second.size &&
    first.printedName === second.printedName
  );
}
function storeGroupedLine(candidate: CartLine): CartLine {
  const existing = state.lines.some((line) => line.id === candidate.id);
  const quantity =
    candidate.quantity +
    state.lines.reduce(
      (sum, line) =>
        sum +
        (line.id !== candidate.id && sameSelection(line, candidate)
          ? line.quantity
          : 0),
      0,
    );
  if (quantity > 5)
    throw new Error(
      "Keep each identical personalised jersey selection to 5 or fewer.",
    );
  const merged = { ...candidate, quantity };
  const lines = state.lines.flatMap((line) =>
    line.id === candidate.id
      ? [merged]
      : sameSelection(line, candidate)
        ? []
        : [line],
  );
  if (!existing) lines.push(merged);
  if (lines.length > 20)
    throw new Error(
      "Your bag can hold up to 20 personalised jersey selections.",
    );
  commit(lines);
  return merged;
}
function subscribe(listener: () => void) {
  subscribers.add(listener);
  initialize();
  return () => {
    subscribers.delete(listener);
  };
}
export function useCart() {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => emptyState,
  );
}
export function getCart() {
  initialize();
  return state;
}
export function addToCart(selection: CartSelection): CartLine {
  initialize();
  const data = cartItemSchema.parse(selection);
  const matching = state.lines.find((line) => sameSelection(line, data));
  return storeGroupedLine(
    matching
      ? { ...matching, quantity: matching.quantity + data.quantity }
      : { id: crypto.randomUUID(), ...data },
  );
}
export function removeCartLine(id: string) {
  initialize();
  commit(state.lines.filter((line) => line.id !== id));
}
export function updateCartQuantity(id: string, quantity: number) {
  initialize();
  const current = state.lines.find((line) => line.id === id);
  if (!current) return;
  const { id: _id, ...selection } = current;
  const parsed = cartItemSchema.parse({ ...selection, quantity });
  storeGroupedLine({ id, ...parsed });
}
export function updateCartName(id: string, printedName: string) {
  initialize();
  const name = jerseyNameSchema.parse(printedName);
  const current = state.lines.find((line) => line.id === id);
  if (current) storeGroupedLine({ ...current, printedName: name });
}
export function cartSelections(lines: CartLine[]): CartSelection[] {
  return lines.map(({ id: _id, ...selection }) => selection);
}
export function cartFingerprint(lines: CartLine[]) {
  return JSON.stringify(lines);
}

type CheckoutSnapshot = {
  sessionId: string;
  fingerprint: string;
  lines: CartLine[];
  createdAt: number;
};
function snapshots(): CheckoutSnapshot[] {
  try {
    const value: unknown = JSON.parse(
      localStorage.getItem(CHECKOUT_KEY) || "[]",
    );
    if (!Array.isArray(value)) return [];
    return value
      .filter(
        (item): item is CheckoutSnapshot =>
          !!item &&
          typeof item.sessionId === "string" &&
          typeof item.fingerprint === "string" &&
          typeof item.createdAt === "number" &&
          Date.now() - item.createdAt < 7 * 86400000,
      )
      .slice(-10);
  } catch {
    return [];
  }
}
export function saveCheckoutSnapshot(sessionId: string, lines: CartLine[]) {
  try {
    const existing = snapshots().filter((item) => item.sessionId !== sessionId);
    localStorage.setItem(
      CHECKOUT_KEY,
      JSON.stringify(
        [
          ...existing,
          {
            sessionId,
            fingerprint: cartFingerprint(lines),
            lines,
            createdAt: Date.now(),
          },
        ].slice(-10),
      ),
    );
  } catch {
    /* The bag is never cleared without a saved verified checkout snapshot. */
  }
}
export function clearVerifiedCheckoutCart(sessionId: string): boolean {
  initialize();
  const saved = snapshots();
  const snapshot = saved.find((item) => item.sessionId === sessionId);
  if (!snapshot || snapshot.fingerprint !== cartFingerprint(state.lines))
    return false;
  commit([]);
  try {
    localStorage.setItem(
      CHECKOUT_KEY,
      JSON.stringify(saved.filter((item) => item.sessionId !== sessionId)),
    );
  } catch {}
  return true;
}
