"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  LockKeyhole,
  Pencil,
  ShoppingBag,
  Trash2,
  X,
} from "lucide-react";
import { formatPrice, getProduct } from "@/src/config/commerce";
import {
  jerseyNameSchema,
  normalizeJerseyName,
  personalization,
} from "@/src/config/personalization";
import {
  removeCartLine,
  updateCartName,
  updateCartQuantity,
  useCart,
} from "@/src/lib/cart/store";
import {
  startCartCheckout,
  type PaymentMessage,
} from "@/src/lib/cart/checkout";
import { PaymentDialog } from "./PaymentDialog";
import { JerseyPreview } from "@/src/components/shop/JerseyPreview";

type Shipping = {
  configured?: boolean;
  free?: boolean;
  amount?: number | null;
  label?: string;
};
export function CartPage() {
  const cart = useCart();
  const [editing, setEditing] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [editError, setEditError] = useState("");
  const [notice, setNotice] = useState("");
  const [terms, setTerms] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<PaymentMessage | null>(null);
  const [shipping, setShipping] = useState<Shipping>({});
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/checkout/config", {
      cache: "no-store",
      credentials: "same-origin",
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.shipping && typeof data.shipping === "object")
          setShipping(data.shipping);
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);
  const quantity = cart.lines.reduce((sum, line) => sum + line.quantity, 0);
  const subtotal = cart.lines.reduce(
    (sum, line) => sum + getProduct(line.variantId)!.price * line.quantity,
    0,
  );
  const shippingAmount =
    typeof shipping.amount === "number" &&
    Number.isInteger(shipping.amount) &&
    shipping.amount >= 0
      ? shipping.amount
      : null;
  async function checkout(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    if (editing) {
      setNotice("Save or cancel your name edit before proceeding to checkout.");
      return;
    }
    setBusy(true);
    setNotice("");
    const result = await startCartCheckout(cart.lines, terms);
    if (result) {
      setMessage(result);
      setBusy(false);
    }
  }
  function saveName(id: string) {
    const parsed = jerseyNameSchema.safeParse(draftName);
    if (!parsed.success) {
      setEditError(parsed.error.issues[0].message);
      return;
    }
    try {
      updateCartName(id, parsed.data);
      setEditing(null);
      setEditError("");
      setNotice("Jersey name updated.");
    } catch (error) {
      setEditError(
        error instanceof Error
          ? error.message
          : "That name could not be saved. Please try again.",
      );
    }
  }
  return (
    <main className="cart-page container">
      <Link href="/shop" className="back-link">
        <ArrowLeft size={15} />
        Continue shopping
      </Link>
      <header className="cart-page-heading">
        <div>
          <span className="eyebrow">EVOKE / PAID PRE-ORDERS</span>
          <h1>Your bag.</h1>
        </div>
        <span>
          {cart.loaded
            ? `${quantity} ${quantity === 1 ? "jersey" : "jerseys"}`
            : ""}
        </span>
      </header>
      {!cart.loaded ? (
        <div className="cart-loading" role="status">
          <ShoppingBag size={26} />
          <p>Loading your bag…</p>
        </div>
      ) : !cart.lines.length ? (
        <section className="cart-empty">
          <ShoppingBag size={38} strokeWidth={1.25} />
          <h2>Your next chapter starts here.</h2>
          <p>Choose your colour, add your name and make it yours.</p>
          <Link href="/shop" className="button">
            Explore the collection
            <ArrowUpRight size={17} />
          </Link>
        </section>
      ) : (
        <div className="cart-layout">
          <section className="cart-lines" aria-label="Jerseys in your bag">
            {cart.lines.map((line) => {
              const product = getProduct(line.variantId)!;
              const isEditing = editing === line.id;
              return (
                <article className="cart-line" key={line.id}>
                  <Link
                    href={`/shop/${product.slug}`}
                    className="cart-line-preview"
                    aria-label={`View ${product.color.toLowerCase()} jersey`}
                  >
                    <JerseyPreview
                      variantId={line.variantId}
                      name={
                        isEditing
                          ? normalizeJerseyName(draftName).slice(
                              0,
                              personalization.maxLength,
                            )
                          : line.printedName
                      }
                      view="back"
                    />
                  </Link>
                  <div className="cart-line-content">
                    <div className="cart-line-top">
                      <div>
                        <span className="eyebrow">AVAILABLE FOR PRE-ORDER</span>
                        <h2>{product.name}</h2>
                        <p>
                          {product.color} / Size {line.size}
                        </p>
                      </div>
                      <strong>
                        {formatPrice(product.price * line.quantity)}
                      </strong>
                    </div>
                    {isEditing ? (
                      <div className="cart-name-editor">
                        <label htmlFor={`cart-name-${line.id}`}>
                          JERSEY NAME
                        </label>
                        <div className="cart-name-input-row">
                          <input
                            id={`cart-name-${line.id}`}
                            value={draftName}
                            maxLength={personalization.maxLength}
                            autoComplete="off"
                            spellCheck={false}
                            autoFocus
                            onChange={(event) => {
                              setDraftName(
                                event.target.value
                                  .normalize("NFKC")
                                  .toUpperCase(),
                              );
                              setEditError("");
                            }}
                            aria-invalid={!!editError}
                            aria-describedby={
                              editError
                                ? `cart-name-error-${line.id}`
                                : undefined
                            }
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                event.preventDefault();
                                saveName(line.id);
                              }
                              if (event.key === "Escape") {
                                setEditing(null);
                                setEditError("");
                              }
                            }}
                          />
                          <span>
                            {normalizeJerseyName(draftName).length}/
                            {personalization.maxLength}
                          </span>
                        </div>
                        {editError && (
                          <p
                            className="field-error"
                            id={`cart-name-error-${line.id}`}
                            role="alert"
                          >
                            {editError}
                          </p>
                        )}
                        <div className="cart-edit-actions">
                          <button
                            type="button"
                            onClick={() => saveName(line.id)}
                          >
                            <Check size={14} />
                            Save name
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditing(null);
                              setEditError("");
                            }}
                          >
                            <X size={14} />
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="cart-printed-name">
                        <span>Printed name</span>
                        <strong>{line.printedName}</strong>
                        <button
                          type="button"
                          onClick={() => {
                            setEditing(line.id);
                            setDraftName(line.printedName);
                            setEditError("");
                            setNotice("");
                          }}
                          disabled={busy}
                        >
                          <Pencil size={13} />
                          EDIT NAME
                        </button>
                      </div>
                    )}
                    <div className="cart-line-bottom">
                      <label>
                        Quantity
                        <select
                          aria-label={`Quantity for ${line.printedName}, ${product.color}, ${line.size}`}
                          value={line.quantity}
                          disabled={busy || isEditing}
                          onChange={(event) => {
                            try {
                              updateCartQuantity(
                                line.id,
                                Number(event.target.value),
                              );
                              setNotice("");
                            } catch (error) {
                              setNotice(
                                error instanceof Error
                                  ? error.message
                                  : "That quantity could not be saved.",
                              );
                            }
                          }}
                        >
                          {[1, 2, 3, 4, 5].map((value) => (
                            <option value={value} key={value}>
                              {value}
                            </option>
                          ))}
                        </select>
                      </label>
                      <span>{formatPrice(product.price)} each</span>
                      <button
                        className="cart-remove"
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          removeCartLine(line.id);
                          if (isEditing) setEditing(null);
                          setNotice("Jersey removed from your bag.");
                        }}
                        aria-label={`Remove ${line.printedName} ${product.color} jersey`}
                      >
                        <Trash2 size={14} />
                        Remove
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
            <p className="cart-feedback" role="status" aria-live="polite">
              {notice}
            </p>
            {cart.storageError && (
              <p className="field-error" role="status">
                Your browser couldn’t save this bag. Keep this tab open while
                checking out.
              </p>
            )}
          </section>
          <aside className="cart-summary">
            <span className="eyebrow">YOUR PRE-ORDER</span>
            <h2>Order summary</h2>
            <dl>
              <div>
                <dt>Subtotal</dt>
                <dd>{formatPrice(subtotal)}</dd>
              </div>
              <div>
                <dt>Personalisation</dt>
                <dd>Included</dd>
              </div>
              <div>
                <dt>Shipping</dt>
                <dd>
                  {shipping.free
                    ? "Included"
                    : shippingAmount !== null
                      ? formatPrice(shippingAmount)
                      : "Calculated at checkout"}
                </dd>
              </div>
              <div>
                <dt>Taxes</dt>
                <dd>Calculated at checkout</dd>
              </div>
            </dl>
            <div className="cart-summary-total">
              <span>
                {shippingAmount !== null && !shipping.free
                  ? "Estimated before tax"
                  : "Merchandise total"}
              </span>
              <strong>
                {formatPrice(
                  subtotal +
                    (shippingAmount !== null && !shipping.free
                      ? shippingAmount
                      : 0),
                )}
                <small>USD</small>
              </strong>
            </div>
            <p className="cart-preorder-notice">
              This is a paid pre-order. Payment is taken at checkout and your
              personalised jersey ships later. Final shipping and applicable
              taxes are confirmed before you pay.
            </p>
            <form onSubmit={checkout} noValidate>
              <label className="consent">
                <input
                  type="checkbox"
                  checked={terms}
                  disabled={busy}
                  onChange={(event) => setTerms(event.target.checked)}
                />
                <span>
                  I understand this is a pre-order and agree to the{" "}
                  <Link href="/terms">terms</Link>,{" "}
                  <Link href="/shipping">shipping</Link> and{" "}
                  <Link href="/returns">returns policy</Link>.
                </span>
              </label>
              <button
                className="button cart-checkout-button"
                type="submit"
                disabled={busy}
              >
                {busy ? "Opening secure checkout…" : "Proceed to checkout"}
                <ArrowUpRight size={17} />
              </button>
            </form>
            <p className="cart-secure">
              <LockKeyhole size={13} />
              Secure payment through Stripe
            </p>
          </aside>
        </div>
      )}
      <PaymentDialog message={message} onClose={() => setMessage(null)} />
    </main>
  );
}
