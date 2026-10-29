import "server-only";
import { sql } from "@/src/lib/db";
const escape = (value: unknown) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ]!,
  );
export async function sendOrderConfirmation(orderId: string) {
  const db = sql();
  const apiKey = process.env.RESEND_API_KEY ?? "",
    from = process.env.ORDER_EMAIL_FROM ?? "";
  const configured =
    /^re_[A-Za-z0-9_]{16,}$/.test(apiKey) &&
    /^[^\r\n]+<[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+>$|^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(
      from,
    );
  if (!configured) {
    await db`UPDATE orders SET email_status='not_configured' WHERE id=${orderId} AND email_status<>'sent'`;
    return "not_configured";
  }
  const now = Date.now();
  const [order] =
    await db`UPDATE orders SET email_status='sending',email_attempts=email_attempts+1,email_last_attempt=${now} WHERE id=${orderId} AND status IN ('paid','partially_refunded') AND customer_email IS NOT NULL AND email_status<>'sent' AND email_attempts<3 AND (email_status<>'sending' OR email_last_attempt<${now - 300000}) RETURNING *`;
  if (!order) return "unchanged";
  const items =
    await db`SELECT * FROM order_items WHERE order_id=${orderId} ORDER BY line_position`;
  const amount = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(order.total_amount / 100),
    reference = order.id.slice(0, 8).toUpperCase();
  const lines = items
    .map(
      (item) =>
        `${item.quantity} × Evoke ${item.variant_id} jersey / Size ${item.size} / Printed name: ${item.printed_name}`,
    )
    .join("\n");
  const notice =
    process.env.PREORDER_NOTICE?.trim() ??
    "This is a paid pre-order. Your jersey will ship later.";
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: AbortSignal.timeout(10000),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `evoke-confirmation-${order.id}`,
      },
      body: JSON.stringify({
        from,
        to: [order.customer_email],
        subject: `Evoke pre-order confirmed — ${reference}`,
        text: `Your pre-order payment is confirmed.\nOrder ${reference}\n\n${lines}\n\nAmount paid: ${amount}\nShipping: $${(order.shipping_amount / 100).toFixed(2)}\nTax: $${(order.tax_amount / 100).toFixed(2)}\n\n${notice}`,
        html: `<h1>Your Evoke pre-order is confirmed.</h1><p>Order ${escape(reference)}</p><ul>${items.map((item) => `<li>${escape(item.quantity)} × ${escape(item.variant_id)} jersey — Size ${escape(item.size)} — Printed name: <strong>${escape(item.printed_name)}</strong></li>`).join("")}</ul><p>Amount paid: ${escape(amount)}</p><p>${escape(notice)}</p>`,
      }),
    });
    if (!response.ok) throw Error("Email provider error");
    const result = (await response.json()) as { id?: string };
    if (!result.id) throw Error("Email delivery not acknowledged");
    await db`UPDATE orders SET email_status='sent',email_sent_at=${Date.now()} WHERE id=${order.id}`;
    return "sent";
  } catch {
    await db`UPDATE orders SET email_status='failed' WHERE id=${order.id} AND email_status<>'sent'`;
    return "failed";
  }
}
