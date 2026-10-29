import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/src/lib/db";
import { verifyStripeSignature } from "@/src/lib/commerce/security.mjs";
import { stripeRequest, retrieveCheckoutSession } from "@/src/lib/stripe";
import { readLimitedBody, BodyLimitError } from "@/src/lib/commerce/request";
import { verifySessionOrder } from "@/src/lib/commerce/orders";
import { sendOrderConfirmation } from "@/src/lib/commerce/email";
export const runtime = "nodejs",
  dynamic = "force-dynamic";
const accepted = new Set([
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "checkout.session.async_payment_failed",
  "checkout.session.expired",
  "charge.refunded",
]);
export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret)
    return NextResponse.json(
      { error: "Webhook unavailable." },
      { status: 503 },
    );
  let body: string;
  try {
    body = await readLimitedBody(request, 1000000);
  } catch (error) {
    return new NextResponse(null, {
      status: error instanceof BodyLimitError ? 413 : 400,
    });
  }
  if (
    !verifyStripeSignature(
      body,
      request.headers.get("stripe-signature"),
      secret,
    )
  )
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  try {
    const event = JSON.parse(body) as {
      id: string;
      type: string;
      data: { object: { id: string } };
    };
    if (!accepted.has(event.type)) return NextResponse.json({ received: true });
    if (!/^evt_[A-Za-z0-9_]+$/.test(event.id) || !event.data?.object?.id)
      return NextResponse.json({ error: "Invalid event." }, { status: 400 });
    const db = sql();
    const existing =
      await db`SELECT id FROM stripe_events WHERE id=${event.id}`;
    if (event.type === "charge.refunded") {
      if (existing.length) return NextResponse.json({ received: true });
      if (!/^ch_[A-Za-z0-9]+$/.test(event.data.object.id))
        return NextResponse.json({ error: "Invalid charge." }, { status: 400 });
      const charge = await stripeRequest<{
        id: string;
        payment_intent: string;
        amount: number;
        amount_refunded: number;
        currency: string;
        refunded: boolean;
      }>(`/charges/${encodeURIComponent(event.data.object.id)}`);
      const [order] =
        await db`SELECT * FROM orders WHERE payment_intent_id=${charge.payment_intent}`;
      if (!order)
        return NextResponse.json(
          { error: "Order not yet recorded." },
          { status: 409 },
        );
      if (
        charge.currency !== order.currency ||
        charge.amount !== order.total_amount ||
        !Number.isSafeInteger(charge.amount_refunded) ||
        charge.amount_refunded <= 0 ||
        charge.amount_refunded > charge.amount
      )
        return NextResponse.json(
          { error: "Refund mismatch." },
          { status: 400 },
        );
      await db.begin(async (tx) => {
        const inserted =
          await tx`INSERT INTO stripe_events(id,type,processed_at) VALUES (${event.id},${event.type},${Date.now()}) ON CONFLICT(id) DO NOTHING RETURNING id`;
        if (!inserted.length) return;
        await tx`UPDATE orders SET status=${charge.amount_refunded === charge.amount ? "refunded" : "partially_refunded"},refunded_amount=${charge.amount_refunded},updated_at=${Date.now()} WHERE id=${order.id} AND status IN ('paid','partially_refunded','refunded')`;
        await tx`INSERT INTO order_audit(id,order_id,action,details,created_at) VALUES (${randomUUID()},${order.id},'refund_reconciled',${tx.json({ amount: charge.amount_refunded })},${Date.now()})`;
      });
      return NextResponse.json({ received: true });
    }
    if (!/^cs_[A-Za-z0-9_]+$/.test(event.data.object.id))
      return NextResponse.json({ error: "Invalid session." }, { status: 400 });
    if (existing.length) {
      const [saved] =
        await db`SELECT * FROM orders WHERE stripe_session_id=${event.data.object.id}`;
      if (saved && saved.status === "paid") {
        if ((await sendOrderConfirmation(saved.id)) === "failed")
          throw Error("Confirmation delivery should be retried");
      }
      return NextResponse.json({ received: true });
    }
    const session = await retrieveCheckoutSession(event.data.object.id);
    const [order] =
      await db`SELECT * FROM orders WHERE id=${session.metadata?.order_id ?? ""}`;
    if (!order)
      return NextResponse.json(
        { error: "Order not yet recorded." },
        { status: 409 },
      );
    const items =
      await db`SELECT * FROM order_items WHERE order_id=${order.id} ORDER BY line_position`;
    if (!verifySessionOrder(session, order, items))
      return NextResponse.json(
        { error: "Payment does not match order." },
        { status: 400 },
      );
    const status =
      session.payment_status === "paid"
        ? "paid"
        : session.status === "expired"
          ? "expired"
          : event.type === "checkout.session.async_payment_failed"
            ? "failed"
            : "pending";
    const paymentReference =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : (session.payment_intent?.id ?? null);
    const shipping =
      session.collected_information?.shipping_details ??
      session.shipping_details ??
      null;
    await db.begin(async (tx) => {
      const inserted =
        await tx`INSERT INTO stripe_events (id,type,processed_at) VALUES (${event.id},${event.type},${Date.now()}) ON CONFLICT(id) DO NOTHING RETURNING id`;
      if (!inserted.length) return;
      await tx`UPDATE orders SET status=CASE WHEN status IN ('refunded','partially_refunded') THEN status WHEN status='paid' THEN 'paid' WHEN status IN ('failed','expired','cancelled') AND ${status}='pending' THEN status ELSE ${status} END,stripe_session_id=${session.id},payment_intent_id=COALESCE(${paymentReference},payment_intent_id),customer_email=${session.customer_details?.email ?? null},customer_name=${session.customer_details?.name ?? null},customer_phone=${session.customer_details?.phone ?? null},shipping_details=${shipping ? tx.json(shipping as never) : null},subtotal_amount=${session.amount_subtotal},total_amount=${session.amount_total},shipping_amount=${session.total_details?.amount_shipping ?? 0},tax_amount=${session.total_details?.amount_tax ?? 0},updated_at=${Date.now()} WHERE id=${order.id}`;
      await tx`INSERT INTO order_audit(id,order_id,action,details,created_at) VALUES (${randomUUID()},${order.id},'payment_reconciled',${tx.json({ event: event.id, status })},${Date.now()})`;
    });
    if (
      status === "paid" &&
      (await sendOrderConfirmation(order.id)) === "failed"
    )
      throw Error("Confirmation delivery should be retried");
    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json(
      { error: "Processing failed; retry delivery." },
      { status: 500 },
    );
  }
}
