import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/src/lib/admin/auth";
import { readLimitedBody } from "@/src/lib/commerce/request";
import { sendOrderConfirmation } from "@/src/lib/commerce/email";
import { sql } from "@/src/lib/db";
export const runtime = "nodejs",
  dynamic = "force-dynamic";
export async function POST(request: NextRequest) {
  const denied = requireAdmin(request, true);
  if (denied) return denied;
  try {
    const { orderId } = z
      .object({ orderId: z.string().uuid() })
      .strict()
      .parse(JSON.parse(await readLimitedBody(request, 2048)));
    // Staff explicitly requesting another delivery opens a new bounded retry window.
    // A sent message or an active delivery lease is never reset.
    const db = sql();
    await db`UPDATE orders SET email_attempts=0 WHERE id=${orderId} AND status IN ('paid','partially_refunded') AND email_status IN ('failed','not_configured')`;
    return NextResponse.json({
      emailStatus: await sendOrderConfirmation(orderId),
    });
  } catch {
    return NextResponse.json(
      { error: "Email could not be retried." },
      { status: 400 },
    );
  }
}
