import { NextRequest, NextResponse } from "next/server";
import { checkoutInputSchema } from "@/src/config/personalization";
import { getCommerceConfig } from "@/src/lib/commerce/runtime";
import { sql } from "@/src/lib/db";
import { hash } from "@/src/lib/commerce/security.mjs";
import { readLimitedBody, BodyLimitError } from "@/src/lib/commerce/request";
import { priceCart, createPendingOrder } from "@/src/lib/commerce/orders";
import {
  stripeRequest,
  PaymentProviderError,
  type StripeSession,
} from "@/src/lib/stripe";
export const runtime = "nodejs",
  dynamic = "force-dynamic";
const fail = (error: string, code: string, status: number) =>
  NextResponse.json(
    { error, code },
    { status, headers: { "Cache-Control": "no-store" } },
  );
export async function POST(request: NextRequest) {
  try {
    const raw = await readLimitedBody(request, 20000);
    let data;
    try {
      data = checkoutInputSchema.parse(JSON.parse(raw));
    } catch {
      return fail(
        "Check your jersey selections, printed names and pre-order consent.",
        "INVALID_CART",
        400,
      );
    }
    const config = await getCommerceConfig();
    if (!config.ready)
      return fail(
        "Payment Configuration Not Setup",
        "PAYMENT_NOT_CONFIGURED",
        503,
      );
    if (request.headers.get("origin") !== config.baseUrl)
      return fail("Start checkout from the Evoke shop.", "INVALID_ORIGIN", 403);
    if (
      data.items.some(
        (i) =>
          !config.sizes.includes(i.size) ||
          !(i.variantId === "black"
            ? config.blackAvailable
            : config.whiteAvailable),
      )
    )
      return fail(
        "A selected jersey or size is unavailable. Update your cart.",
        "INVALID_SELECTION",
        409,
      );
    const owner = request.cookies.get("evoke_order_owner")?.value;
    if (!owner || !/^[a-f0-9-]{36}$/.test(owner))
      return fail("Refresh the shop and try again.", "SESSION_REQUIRED", 409);
    let items;
    try {
      items = priceCart(data.items);
    } catch {
      return fail(
        "A maximum of five identical personalised jerseys is allowed.",
        "INVALID_CART",
        400,
      );
    }
    const db = sql(),
      now = Date.now(),
      ownerHash = hash(owner);
    for (const [key, maximum] of [
      [`${ownerHash}:${Math.floor(now / 60000)}`, 10],
      [`global:${Math.floor(now / 60000)}`, 100],
    ] as const) {
      const [rate] =
        await db`INSERT INTO checkout_rate_limits (key,count,expires_at) VALUES (${key},1,${now + 60000}) ON CONFLICT(key) DO UPDATE SET count=checkout_rate_limits.count+1 RETURNING count`;
      if (rate.count > maximum)
        return fail(
          "Too many checkout attempts. Please try again shortly.",
          "RATE_LIMITED",
          429,
        );
    }
    await db`DELETE FROM checkout_rate_limits WHERE expires_at<${now - 60000}`;
    const result = await createPendingOrder(
        ownerHash,
        data.idempotencyKey,
        items,
      ),
      order = result.order;
    if (result.conflict)
      return fail(
        "This request was used for a different cart. Please try checkout again.",
        "IDEMPOTENCY_CONFLICT",
        409,
      );
    if (order.status !== "pending")
      return fail(
        "This checkout is already closed. Review your order or start a new checkout.",
        "CHECKOUT_CLOSED",
        409,
      );
    const params = new URLSearchParams({
      mode: "payment",
      client_reference_id: order.id,
      "metadata[order_id]": order.id,
      "metadata[cart_fingerprint]": order.cart_fingerprint,
      "payment_intent_data[metadata][order_id]": order.id,
      "payment_intent_data[metadata][cart_fingerprint]": order.cart_fingerprint,
      success_url: `${config.baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${config.baseUrl}/checkout/cancelled`,
      "automatic_tax[enabled]": String(config.automaticTax),
      billing_address_collection: "required",
      "custom_text[submit][message]": config.preorderNotice,
    });
    items.forEach((item, index) => {
      const prefix = `line_items[${index}]`;
      params.set(`${prefix}[price_data][currency]`, "usd");
      params.set(`${prefix}[price_data][unit_amount]`, String(item.unitAmount));
      params.set(`${prefix}[price_data][tax_behavior]`, config.taxBehavior);
      params.set(
        `${prefix}[price_data][product_data][name]`,
        `${item.productName} / ${item.size} / ${item.printedName}`,
      );
      params.set(
        `${prefix}[price_data][product_data][description]`,
        `Paid pre-order. Printed name: ${item.printedName}. Size: ${item.size}.`,
      );
      params.set(`${prefix}[quantity]`, String(item.quantity));
    });
    config.countries.forEach((country, index) =>
      params.set(
        `shipping_address_collection[allowed_countries][${index}]`,
        country,
      ),
    );
    if (config.shippingRate)
      params.set("shipping_options[0][shipping_rate]", config.shippingRate);
    else {
      params.set(
        "shipping_options[0][shipping_rate_data][type]",
        "fixed_amount",
      );
      params.set(
        "shipping_options[0][shipping_rate_data][fixed_amount][amount]",
        String(config.freeShipping ? 0 : config.flatAmount),
      );
      params.set(
        "shipping_options[0][shipping_rate_data][fixed_amount][currency]",
        "usd",
      );
      params.set(
        "shipping_options[0][shipping_rate_data][display_name]",
        config.shipping.label,
      );
    }
    const session = order.stripe_session_id
      ? await stripeRequest<StripeSession>(
          `/checkout/sessions/${encodeURIComponent(order.stripe_session_id)}`,
        )
      : await stripeRequest<StripeSession>(
          "/checkout/sessions",
          params,
          `evoke-order-${order.id}`,
        );
    if (session.status !== "open" || !session.url)
      return fail(
        "This checkout has closed. Please begin a new checkout.",
        "CHECKOUT_CLOSED",
        409,
      );
    const url = new URL(session.url);
    if (url.protocol !== "https:" || url.hostname !== "checkout.stripe.com")
      throw new PaymentProviderError();
    await db`UPDATE orders SET stripe_session_id=${session.id},updated_at=${Date.now()} WHERE id=${order.id} AND (stripe_session_id IS NULL OR stripe_session_id=${session.id})`;
    return NextResponse.json(
      { url: session.url, orderId: order.id, sessionId: session.id },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof BodyLimitError)
      return fail("Request too large.", "INVALID_REQUEST", 413);
    if (error instanceof PaymentProviderError)
      return fail(
        "The payment provider could not open checkout. Please try again later.",
        "PAYMENT_PROVIDER_ERROR",
        502,
      );
    return fail(
      "Checkout is temporarily unavailable. Your cart has been kept.",
      "CHECKOUT_ERROR",
      503,
    );
  }
}
