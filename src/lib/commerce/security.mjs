import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const hash = (value) => createHash("sha256").update(value).digest("hex");
export function verifyStripeSignature(
  payload,
  signature,
  secret,
  now = Date.now(),
) {
  if (!signature || !secret) return false;
  const parts = signature.split(",");
  const timestamp = parts.find((part) => part.startsWith("t="))?.slice(2);
  if (
    !timestamp ||
    !/^\d+$/.test(timestamp) ||
    Math.abs(now / 1000 - Number(timestamp)) > 300
  )
    return false;
  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`)
    .digest();
  return parts
    .filter((part) => part.startsWith("v1="))
    .some((part) => {
      const value = part.slice(3);
      return (
        /^[0-9a-f]{64}$/i.test(value) &&
        timingSafeEqual(Buffer.from(value, "hex"), expected)
      );
    });
}
