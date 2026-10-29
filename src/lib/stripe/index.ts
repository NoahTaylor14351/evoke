import "server-only";
export type StripeSession = {
  id: string;
  url: string | null;
  payment_status: string;
  status: string;
  amount_subtotal: number;
  amount_total: number;
  currency: string;
  metadata: Record<string, string>;
  payment_intent?: string | { id: string } | null;
  total_details?: {
    amount_shipping?: number;
    amount_tax?: number;
    amount_discount?: number;
  };
  customer_details?: {
    email?: string | null;
    name?: string | null;
    phone?: string | null;
  } | null;
  collected_information?: { shipping_details?: Record<string, unknown> | null };
  shipping_details?: Record<string, unknown> | null;
  shipping_cost?: { amount_total: number } | null;
  line_items?: StripeLineItem[];
};
export type StripeLineItem = {
  description: string;
  quantity: number;
  amount_subtotal: number;
  amount_total: number;
  currency: string;
  price: { unit_amount: number; currency: string } | null;
};
export class PaymentProviderError extends Error {
  constructor() {
    super("The payment provider could not complete this request.");
    this.name = "PaymentProviderError";
  }
}
export async function stripeRequest<T>(
  path: string,
  body?: URLSearchParams,
  idempotencyKey?: string,
): Promise<T> {
  try {
    const response = await fetch(`https://api.stripe.com/v1${path}`, {
      method: body ? "POST" : "GET",
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
      headers: {
        Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        ...(body
          ? { "Content-Type": "application/x-www-form-urlencoded" }
          : {}),
        ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
      },
      body,
    });
    if (!response.ok) throw new PaymentProviderError();
    return (await response.json()) as T;
  } catch {
    throw new PaymentProviderError();
  }
}
export async function retrieveCheckoutSession(id: string) {
  const session = await stripeRequest<StripeSession>(
    `/checkout/sessions/${encodeURIComponent(id)}`,
  );
  const lines = await stripeRequest<{
    data: StripeLineItem[];
    has_more: boolean;
  }>(`/checkout/sessions/${encodeURIComponent(id)}/line_items?limit=100`);
  if (lines.has_more || !Array.isArray(lines.data))
    throw new PaymentProviderError();
  return { ...session, line_items: lines.data };
}
