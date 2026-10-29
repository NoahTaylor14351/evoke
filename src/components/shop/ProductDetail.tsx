"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  ChevronDown,
  LockKeyhole,
  Maximize2,
  ShoppingBag,
  X,
} from "lucide-react";
import {
  commerce,
  formatPrice,
  getProduct,
  products,
  type VariantId,
} from "@/src/config/commerce";
import {
  jerseyNameSchema,
  normalizeJerseyName,
  personalization,
} from "@/src/config/personalization";
import { addToCart } from "@/src/lib/cart/store";
import { JerseyPreview } from "./JerseyPreview";

type CheckoutConfig = {
  sizes: string[];
  preorderNotice?: string;
  termsUrl?: string;
};
export function ProductDetail({
  initialVariant,
}: {
  initialVariant: VariantId;
}) {
  const [variant, setVariant] = useState(initialVariant);
  const [view, setView] = useState<"front" | "back">("front");
  const [printedName, setPrintedName] = useState("");
  const [size, setSize] = useState("");
  const [config, setConfig] = useState<CheckoutConfig | null>(null);
  const [error, setError] = useState("");
  const [nameError, setNameError] = useState("");
  const [added, setAdded] = useState("");
  const [zoomed, setZoomed] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const nameInput = useRef<HTMLInputElement>(null);
  const sizeInput = useRef<HTMLSelectElement>(null);
  const product = getProduct(variant)!;
  const sizes: readonly string[] = config?.sizes.length
    ? config.sizes
    : commerce.sizes;
  const previewName = normalizeJerseyName(printedName).slice(
    0,
    personalization.maxLength,
  );

  useEffect(() => {
    document.title = `${product.name} | Evoke Esports`;
    const canonical = document.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]',
    );
    if (canonical)
      canonical.href = new URL(
        `/shop/${product.slug}`,
        window.location.origin,
      ).href;
  }, [product.name, product.slug]);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/checkout/config", {
      cache: "no-store",
      credentials: "same-origin",
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((value: unknown) => {
        if (!value || typeof value !== "object") return;
        const data = value as Partial<CheckoutConfig>;
        if (
          !Array.isArray(data.sizes) ||
          !data.sizes.every(
            (item) => typeof item === "string" && item.length <= 40,
          )
        )
          return;
        setConfig({
          sizes: data.sizes,
          preorderNotice:
            typeof data.preorderNotice === "string"
              ? data.preorderNotice
              : undefined,
        });
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);
  useEffect(() => {
    if (!zoomed) return;
    const element = dialog.current;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (element && !element.open) element.showModal();
    return () => {
      document.body.style.overflow = previous;
      if (element?.open) element.close();
    };
  }, [zoomed]);
  useEffect(() => {
    const restore = () => {
      const selected = getProduct(
        window.location.pathname.split("/").filter(Boolean).at(-1) || "",
      );
      if (selected) {
        setVariant(selected.id);
        setAdded("");
      }
    };
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, []);
  function selectVariant(next: VariantId) {
    setVariant(next);
    setError("");
    setAdded("");
    window.history.replaceState(null, "", `/shop/${getProduct(next)!.slug}`);
  }
  function validateName() {
    const result = jerseyNameSchema.safeParse(printedName);
    setNameError(result.success ? "" : result.error.issues[0].message);
    if (result.success) setPrintedName(result.data);
    return result;
  }
  function preorder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setAdded("");
    const name = validateName();
    if (!name.success) {
      nameInput.current?.focus();
      setView("back");
      return;
    }
    if (!sizes.includes(size)) {
      setError("Choose your jersey size before adding it to your bag.");
      sizeInput.current?.focus();
      return;
    }
    try {
      addToCart({
        variantId: variant,
        size,
        printedName: name.data,
        quantity: 1,
      });
      setAdded(`${product.color} jersey · ${size} · ${name.data}`);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "We couldn’t update your bag. Please try again.",
      );
    }
  }
  return (
    <main className="product-detail container personalized-product">
      <Link className="back-link" href="/shop">
        <ArrowLeft size={16} aria-hidden="true" />
        Back to the collection
      </Link>
      <div className="product-detail-grid">
        <div className="product-gallery">
          <button
            className="gallery-image"
            type="button"
            onClick={() => setZoomed(true)}
            aria-label={`Zoom ${product.color.toLowerCase()} jersey ${view}`}
          >
            <JerseyPreview
              variantId={variant}
              name={previewName}
              view={view}
              priority
            />
            <span className="gallery-zoom">
              <Maximize2 size={17} aria-hidden="true" />
              <span>Enlarge</span>
            </span>
          </button>
          <div className="gallery-thumbnails" aria-label="Product images">
            {(["front", "back"] as const).map((side) => (
              <button
                key={side}
                type="button"
                onClick={() => setView(side)}
                aria-pressed={view === side}
                aria-label={`Show ${side} view`}
              >
                <JerseyPreview
                  variantId={variant}
                  name={previewName}
                  view={side}
                />
                <span>{side === "front" ? "Front" : "Your name"}</span>
              </button>
            ))}
          </div>
          <p className="personalization-preview-note">
            {view === "back"
              ? "Live name preview. Your printed name is recorded with your order."
              : "Select the back view to preview your personalised name."}
          </p>
        </div>
        <div className="product-info">
          <span className="eyebrow">THE OFFICIAL COLLECTION</span>
          <h1>Evoke official jersey.</h1>
          <div className="product-price-line">
            <span className="price">
              {formatPrice(product.price)} <small>USD</small>
            </span>
            <span className="tag">AVAILABLE FOR PRE-ORDER</span>
          </div>
          <p>
            Our crown. Your name. Make the official Evoke jersey your own, in
            black or white.
          </p>
          <form onSubmit={preorder} noValidate>
            <fieldset className="color-options">
              <legend>
                Colour <span>{product.color}</span>
              </legend>
              <div className="color-swatches">
                {products.map((option) => (
                  <button
                    className={`color-swatch ${option.id}`}
                    key={option.id}
                    type="button"
                    aria-pressed={variant === option.id}
                    aria-label={`Select ${option.color.toLowerCase()} jersey`}
                    onClick={() => selectVariant(option.id)}
                  >
                    <span className="swatch-chip" aria-hidden="true">
                      {variant === option.id && <Check size={12} />}
                    </span>
                    <span>{option.color}</span>
                  </button>
                ))}
              </div>
            </fieldset>
            <section
              className="jersey-customizer"
              aria-labelledby="customize-title"
            >
              <h2 id="customize-title">CUSTOMISE YOUR JERSEY</h2>
              <p>
                Enter the name you'd like printed on the back of your jersey.
              </p>
              <div className="customizer-label">
                <label htmlFor="jersey-name">JERSEY NAME</label>
                <span aria-live="off">
                  {previewName.length}/{personalization.maxLength}
                </span>
              </div>
              <input
                ref={nameInput}
                id="jersey-name"
                type="text"
                placeholder="YOUR NAME"
                autoComplete="off"
                spellCheck={false}
                maxLength={personalization.maxLength}
                value={printedName}
                aria-invalid={!!nameError}
                aria-describedby={
                  nameError ? "jersey-name-error" : "jersey-name-help"
                }
                onFocus={() => setView("back")}
                onBlur={validateName}
                onChange={(event) => {
                  setPrintedName(
                    event.target.value.normalize("NFKC").toUpperCase(),
                  );
                  setNameError("");
                  setAdded("");
                }}
              />
              {nameError ? (
                <p id="jersey-name-error" className="field-error" role="alert">
                  {nameError}
                </p>
              ) : (
                <p id="jersey-name-help" className="field-help">
                  {personalization.help} Personalisation is included.
                </p>
              )}
            </section>
            <div className="size-selection">
              <label htmlFor="jersey-size">SIZE</label>
              <div className="select-wrap">
                <select
                  ref={sizeInput}
                  id="jersey-size"
                  value={size}
                  onChange={(event) => {
                    setSize(event.target.value);
                    setError("");
                    setAdded("");
                  }}
                  required
                >
                  <option value="">Choose your size</option>
                  {sizes.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <ChevronDown size={17} aria-hidden="true" />
              </div>
            </div>
            <div className="preorder-info">
              <span className="preorder-heading">
                <span className="shop-status-dot" aria-hidden="true" />
                Paid pre-order
              </span>
              <p>
                {config?.preorderNotice ||
                  "Payment is taken at checkout. Your personalised jersey will ship later; production and dispatch estimates will be shared when confirmed."}
              </p>
            </div>
            <button className="button purchase-button" type="submit">
              <ShoppingBag size={18} aria-hidden="true" />
              PRE-ORDER — {formatPrice(product.price)}
              <ArrowUpRight size={18} aria-hidden="true" />
            </button>
            <p className="secure-note">
              <LockKeyhole size={13} aria-hidden="true" />
              Secure Stripe checkout. Personalisation included.
            </p>
            {error && (
              <p className="form-message" role="alert">
                {error}
              </p>
            )}
            {added && (
              <div className="cart-added-message" role="status">
                <Check size={20} aria-hidden="true" />
                <div>
                  <strong>Added to your bag</strong>
                  <span>{added}</span>
                  <Link href="/cart" className="text-link">
                    View bag & checkout
                    <ArrowUpRight size={15} />
                  </Link>
                </div>
              </div>
            )}
          </form>
          <div className="product-disclosures">
            <details>
              <summary>
                Jersey details
                <ChevronDown size={16} aria-hidden="true" />
              </summary>
              <p>
                The official Evoke emblem, wordmark and signature linework. Your
                chosen name is printed on the back. Check the live preview and
                the spelling in your bag before paying.
              </p>
            </details>
            <details>
              <summary>
                Shipping & pre-orders
                <ChevronDown size={16} aria-hidden="true" />
              </summary>
              <p>
                Payment is taken before dispatch. Available destinations,
                shipping charges and applicable taxes are shown at checkout. No
                delivery date is assumed.{" "}
                <Link href="/shipping">Shipping policy.</Link>
              </p>
            </details>
            <details>
              <summary>
                Returns & support
                <ChevronDown size={16} aria-hidden="true" />
              </summary>
              <p>
                Read the <Link href="/returns">returns policy</Link> before
                ordering personalised merchandise. For questions,{" "}
                <Link href="/contact">contact Evoke.</Link>
              </p>
            </details>
          </div>
        </div>
      </div>
      {zoomed && (
        <dialog
          ref={dialog}
          className="image-dialog"
          aria-label={`${product.name}, enlarged ${view} view`}
          onClose={() => setZoomed(false)}
          onClick={(event) => {
            if (event.target === event.currentTarget) setZoomed(false);
          }}
        >
          <button
            className="dialog-close"
            type="button"
            onClick={() => setZoomed(false)}
            aria-label="Close enlarged image"
            autoFocus
          >
            <X size={24} aria-hidden="true" />
          </button>
          <JerseyPreview variantId={variant} name={previewName} view={view} />
        </dialog>
      )}
    </main>
  );
}
