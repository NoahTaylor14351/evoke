import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/src/lib/admin/auth";
import { sql } from "@/src/lib/db";
import { csvCell } from "@/src/lib/admin/export";
export const runtime = "nodejs",
  dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  try {
    const db = sql();
    const rows =
      await db`SELECT o.id,o.created_at,o.status,o.fulfilment_status,o.customer_name,o.customer_email,o.shipping_details,o.payment_intent_id,o.stripe_session_id,o.total_amount,o.shipping_amount,o.tax_amount,o.currency,o.tracking_reference,i.variant_id,i.size,i.printed_name,i.quantity,i.unit_amount,i.total_amount AS item_total,i.print_spec FROM orders o JOIN order_items i ON i.order_id=o.id WHERE o.status IN ('paid','partially_refunded') ORDER BY o.created_at DESC,i.line_position LIMIT 10001`;
    if (rows.length > 10000)
      return NextResponse.json(
        {
          error:
            "This export exceeds 10,000 order lines. Use a database export for the complete manufacturing list.",
        },
        { status: 413 },
      );
    const headings = [
      "Order",
      "Created UTC",
      "Payment status",
      "Fulfilment status",
      "Customer",
      "Email",
      "Shipping address",
      "Payment reference",
      "Stripe session",
      "Order total cents",
      "Shipping cents",
      "Tax cents",
      "Currency",
      "Tracking reference",
      "Colour",
      "Size",
      "Print name",
      "Quantity",
      "Unit cents",
      "Line cents",
      "Print specification",
    ];
    const lines = rows.map((row) =>
      [
        row.id,
        new Date(Number(row.created_at)).toISOString(),
        row.status,
        row.fulfilment_status,
        row.customer_name,
        row.customer_email,
        JSON.stringify(row.shipping_details),
        row.payment_intent_id,
        row.stripe_session_id,
        row.total_amount,
        row.shipping_amount,
        row.tax_amount,
        row.currency,
        row.tracking_reference,
        row.variant_id,
        row.size,
        row.printed_name,
        row.quantity,
        row.unit_amount,
        row.item_total,
        JSON.stringify(row.print_spec),
      ]
        .map(csvCell)
        .join(","),
    );
    return new NextResponse(
      [headings.map(csvCell).join(","), ...lines].join("\r\n"),
      {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition":
            'attachment; filename="evoke-paid-preorders.csv"',
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff",
        },
      },
    );
  } catch {
    return NextResponse.json(
      { error: "Order export is unavailable." },
      { status: 503 },
    );
  }
}
