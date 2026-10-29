import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/src/lib/admin/auth";
import { sql } from "@/src/lib/db";
import { orderForAdmin } from "@/src/lib/commerce/orders";
import { readLimitedBody } from "@/src/lib/commerce/request";
export const runtime = "nodejs",
  dynamic = "force-dynamic";
const statusSchema = z.enum([
  "all",
  "paid",
  "pending",
  "failed",
  "expired",
  "cancelled",
  "refunded",
  "partially_refunded",
]);
export async function GET(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  try {
    const status = statusSchema.parse(
        request.nextUrl.searchParams.get("status") ?? "paid",
      ),
      page = z.coerce
        .number()
        .int()
        .min(1)
        .max(10000)
        .parse(request.nextUrl.searchParams.get("page") ?? 1),
      db = sql();
    const rows =
      await db`SELECT * FROM orders WHERE (${status}='all' OR status=${status}) ORDER BY created_at DESC LIMIT 26 OFFSET ${(page - 1) * 25}`;
    const visible = rows.slice(0, 25),
      ids = visible.map((row) => row.id),
      items = ids.length
        ? await db`SELECT * FROM order_items WHERE order_id IN ${db(ids)} ORDER BY line_position`
        : [];
    return NextResponse.json(
      {
        orders: visible.map((row) =>
          orderForAdmin(
            row,
            items.filter((item) => item.order_id === row.id),
          ),
        ),
        page,
        hasMore: rows.length > 25,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Orders could not be loaded." },
      { status: 503 },
    );
  }
}
export async function PATCH(request: NextRequest) {
  const denied = requireAdmin(request, true);
  if (denied) return denied;
  try {
    const input = z
      .object({
        orderId: z.string().uuid(),
        fulfilmentStatus: z.enum([
          "preorder",
          "in_production",
          "dispatched",
          "fulfilled",
        ]),
        trackingReference: z.string().trim().max(300).optional(),
      })
      .strict()
      .parse(JSON.parse(await readLimitedBody(request, 4096)));
    const db = sql();
    let updated = false;
    await db.begin(async (tx) => {
      const [order] =
        await tx`SELECT * FROM orders WHERE id=${input.orderId} FOR UPDATE`;
      if (!order) return;
      if (!["paid", "partially_refunded"].includes(order.status))
        throw Error("Only verified paid orders can be fulfilled");
      await tx`UPDATE orders SET fulfilment_status=${input.fulfilmentStatus},tracking_reference=${input.trackingReference ?? order.tracking_reference},updated_at=${Date.now()} WHERE id=${input.orderId}`;
      await tx`INSERT INTO order_audit(id,order_id,action,details,created_at) VALUES (${randomUUID()},${order.id},'fulfilment_updated',${tx.json({ previous: order.fulfilment_status, status: input.fulfilmentStatus, trackingReference: input.trackingReference ?? null })},${Date.now()})`;
      updated = true;
    });
    return updated
      ? NextResponse.json({ updated: true })
      : NextResponse.json({ error: "Order not found." }, { status: 404 });
  } catch {
    return NextResponse.json(
      {
        error:
          "The fulfilment update was not accepted. Only paid orders can be fulfilled.",
      },
      { status: 400 },
    );
  }
}
