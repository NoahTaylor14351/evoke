import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/src/lib/db";
import { hash } from "@/src/lib/commerce/security.mjs";
import { retrieveCheckoutSession } from "@/src/lib/stripe";
import { verifySessionOrder, itemForApi } from "@/src/lib/commerce/orders";
export const dynamic = "force-dynamic",
  runtime = "nodejs";
export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id"),
    owner = request.cookies.get("evoke_order_owner")?.value;
  if (!sessionId || !/^cs_[A-Za-z0-9_]{10,250}$/.test(sessionId) || !owner)
    return NextResponse.json({ status: "unverified" }, { status: 404 });
  try {
    const db = sql();
    const [order] =
      await db`SELECT * FROM orders WHERE stripe_session_id=${sessionId} AND owner_hash=${hash(owner)}`;
    if (!order)
      return NextResponse.json({ status: "unverified" }, { status: 404 });
    const session = await retrieveCheckoutSession(sessionId);
    const items =
      await db`SELECT * FROM order_items WHERE order_id=${order.id} ORDER BY line_position`;
    const verified = verifySessionOrder(session, order, items);
    if (!verified)
      return NextResponse.json({ status: "unverified" }, { status: 409 });
    const paid = session.payment_status === "paid";
    return NextResponse.json(
      {
        status: ["refunded", "partially_refunded"].includes(order.status)
          ? order.status
          : paid
            ? "paid"
            : order.status === "paid"
              ? "processing"
              : order.status,
        reference: paid ? order.id.slice(0, 8).toUpperCase() : undefined,
        cartFingerprint: order.cart_fingerprint,
        items: items.map(itemForApi),
        amountTotal: session.amount_total,
        amountSubtotal: session.amount_subtotal,
        shippingTotal: session.total_details?.amount_shipping ?? 0,
        taxTotal: session.total_details?.amount_tax ?? 0,
        currency: session.currency,
        emailStatus: order.email_status,
        fulfilmentStatus: order.fulfilment_status,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json({ status: "unverified" }, { status: 503 });
  }
}
