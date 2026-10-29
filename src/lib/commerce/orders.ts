import "server-only";
import { randomUUID } from "node:crypto";
import { getProduct } from "@/src/config/commerce";
import type { CartSelection } from "@/src/config/personalization";
import { hash } from "./security.mjs";
import { sql } from "@/src/lib/db";
import type { StripeSession } from "@/src/lib/stripe";

export type PricedItem = CartSelection & {
  id: string;
  unitAmount: number;
  totalAmount: number;
  imageUrl: string;
  productName: string;
};
export function priceCart(input: CartSelection[]): PricedItem[] {
  const grouped = new Map<string, CartSelection>();
  for (const item of input) {
    const key = JSON.stringify([item.variantId, item.size, item.printedName]);
    const previous = grouped.get(key);
    const quantity = item.quantity + (previous?.quantity ?? 0);
    if (quantity > 5)
      throw new Error(
        "A maximum of five identical personalised jerseys is allowed.",
      );
    grouped.set(key, { ...item, quantity });
  }
  return [...grouped.values()]
    .sort((a, b) =>
      JSON.stringify([a.variantId, a.size, a.printedName]).localeCompare(
        JSON.stringify([b.variantId, b.size, b.printedName]),
      ),
    )
    .map((item) => {
      const product = getProduct(item.variantId);
      if (!product) throw Error("Invalid product");
      return {
        ...item,
        id: randomUUID(),
        unitAmount: product.price,
        totalAmount: product.price * item.quantity,
        imageUrl: product.back,
        productName: product.name,
      };
    });
}
export function cartFingerprint(
  items: Pick<
    PricedItem,
    "variantId" | "size" | "printedName" | "quantity" | "unitAmount"
  >[],
) {
  return hash(
    JSON.stringify(
      items.map((i) => ({
        variantId: i.variantId,
        size: i.size,
        printedName: i.printedName,
        quantity: i.quantity,
        unitAmount: i.unitAmount,
      })),
    ),
  );
}
export async function createPendingOrder(
  ownerHash: string,
  idempotencyKey: string,
  items: PricedItem[],
) {
  const db = sql(),
    now = Date.now(),
    fingerprint = cartFingerprint(items),
    subtotal = items.reduce((sum, i) => sum + i.totalAmount, 0),
    first = items[0];
  return await db.begin(async (tx) => {
    const inserted =
      await tx`INSERT INTO orders (id,owner_hash,idempotency_key,variant_id,size,quantity,unit_amount,currency,status,cart_fingerprint,base_amount,subtotal_amount,total_amount,created_at,updated_at) VALUES (${randomUUID()},${ownerHash},${idempotencyKey},${first.variantId},${first.size},${first.quantity},${first.unitAmount},'usd','pending',${fingerprint},${subtotal},${subtotal},${subtotal},${now},${now}) ON CONFLICT(owner_hash,idempotency_key) DO NOTHING RETURNING *`;
    const order =
      inserted[0] ??
      (
        await tx`SELECT * FROM orders WHERE owner_hash=${ownerHash} AND idempotency_key=${idempotencyKey}`
      )[0];
    if (!order) throw Error("Order persistence failed");
    if (order.cart_fingerprint !== fingerprint)
      return { conflict: true as const, order };
    if (inserted.length) {
      for (let position = 0; position < items.length; position++) {
        const item = items[position];
        await tx`INSERT INTO order_items (id,order_id,variant_id,size,printed_name,quantity,unit_amount,total_amount,image_url,product_name,print_spec,line_position) VALUES (${item.id},${order.id},${item.variantId},${item.size},${item.printedName},${item.quantity},${item.unitAmount},${item.totalAmount},${item.imageUrl},${item.productName},${tx.json({ text: item.printedName, placement: "upper_back", template: "evoke-upper-back-v1", manufacturingProofRequired: true })},${position})`;
      }
    }
    return { conflict: false as const, order };
  });
}
export function verifySessionOrder(
  session: StripeSession,
  order: Record<string, any>,
  items: Record<string, any>[],
) {
  const lines = session.line_items;
  if (
    !lines ||
    lines.length !== items.length ||
    session.metadata?.order_id !== order.id ||
    session.metadata?.cart_fingerprint !== order.cart_fingerprint ||
    session.currency !== order.currency ||
    (order.stripe_session_id && order.stripe_session_id !== session.id)
  )
    return false;
  const signature = (description: string, quantity: number, amount: number) =>
    JSON.stringify([description, quantity, amount]);
  const expected = items
    .map((item) =>
      signature(
        `${item.product_name} / ${item.size} / ${item.printed_name}`,
        item.quantity,
        item.unit_amount,
      ),
    )
    .sort();
  const actual = lines
    .map((line) =>
      signature(line.description, line.quantity, line.price?.unit_amount ?? -1),
    )
    .sort();
  if (
    JSON.stringify(expected) !== JSON.stringify(actual) ||
    lines.some(
      (line) =>
        line.currency !== order.currency ||
        line.price?.currency !== order.currency,
    )
  )
    return false;
  const base = items.reduce(
      (sum, item) => sum + item.unit_amount * item.quantity,
      0,
    ),
    subtotal = lines.reduce((sum, line) => sum + line.amount_subtotal, 0),
    total =
      lines.reduce((sum, line) => sum + line.amount_total, 0) +
      (session.shipping_cost?.amount_total ?? 0);
  return (
    base === Number(order.base_amount) &&
    subtotal === session.amount_subtotal &&
    total === session.amount_total &&
    (session.total_details?.amount_discount ?? 0) === 0 &&
    Number.isSafeInteger(total) &&
    total > 0
  );
}
export function itemForApi(item: Record<string, any>) {
  return {
    id: item.id,
    variantId: item.variant_id,
    size: item.size,
    printedName: item.printed_name,
    quantity: item.quantity,
    unitAmount: item.unit_amount,
    totalAmount: item.total_amount,
    printSpec: item.print_spec,
  };
}
export function orderForAdmin(
  order: Record<string, any>,
  items: Record<string, any>[],
) {
  return {
    id: order.id,
    status: order.status,
    paymentStatus: order.status,
    fulfilmentStatus: order.fulfilment_status,
    createdAt: Number(order.created_at),
    updatedAt: Number(order.updated_at),
    customerEmail: order.customer_email,
    customerName: order.customer_name,
    customerPhone: order.customer_phone,
    shippingDetails: order.shipping_details,
    amountTotal: order.total_amount,
    amountSubtotal: order.subtotal_amount,
    shippingTotal: order.shipping_amount,
    taxTotal: order.tax_amount,
    refundedTotal: order.refunded_amount,
    currency: order.currency,
    trackingReference: order.tracking_reference,
    stripeSessionId: order.stripe_session_id,
    paymentReference: order.payment_intent_id,
    preorder: order.preorder,
    emailStatus: order.email_status,
    items: items.map(itemForApi),
  };
}
