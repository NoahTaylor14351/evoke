import "server-only";
import {
  createHmac,
  randomUUID,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  publicOrigin,
  databaseConfigured,
} from "@/src/lib/commerce/configuration";
export const ADMIN_COOKIE = "evoke_staff_session";
export function adminConfigured() {
  return (
    /^scrypt:[a-f0-9]{32,64}:[a-f0-9]{128}$/.test(
      process.env.ADMIN_PASSWORD_HASH ?? "",
    ) &&
    (process.env.ADMIN_SESSION_SECRET?.length ?? 0) >= 32 &&
    databaseConfigured(process.env.DATABASE_URL) &&
    Boolean(
      publicOrigin(process.env.SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL),
    )
  );
}
export function validAdminPassword(password: string) {
  const parts = (process.env.ADMIN_PASSWORD_HASH ?? "").split(":");
  if (parts.length !== 3) return false;
  try {
    const expected = Buffer.from(parts[2], "hex"),
      actual = scryptSync(password, Buffer.from(parts[1], "hex"), 64);
    return (
      expected.length === actual.length && timingSafeEqual(expected, actual)
    );
  } catch {
    return false;
  }
}
export function createAdminSession() {
  const payload = Buffer.from(
    JSON.stringify({
      v: 1,
      exp: Date.now() + 8 * 60 * 60 * 1000,
      nonce: randomUUID(),
    }),
  ).toString("base64url");
  return `${payload}.${createHmac("sha256", process.env.ADMIN_SESSION_SECRET!).update(payload).digest("base64url")}`;
}
export function isAdmin(request: NextRequest) {
  if (!adminConfigured()) return false;
  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  if (!token || token.length > 1024) return false;
  const [payload, signature, ...rest] = token.split(".");
  if (rest.length || !payload || !signature) return false;
  try {
    const expected = createHmac("sha256", process.env.ADMIN_SESSION_SECRET!)
        .update(payload)
        .digest(),
      actual = Buffer.from(signature, "base64url");
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected))
      return false;
    const value = JSON.parse(Buffer.from(payload, "base64url").toString());
    return (
      value.v === 1 &&
      typeof value.exp === "number" &&
      value.exp > Date.now() &&
      typeof value.nonce === "string"
    );
  } catch {
    return false;
  }
}
export function validAdminOrigin(request: NextRequest) {
  return (
    request.headers.get("origin") ===
    publicOrigin(process.env.SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL)
  );
}
export function requireAdmin(request: NextRequest, mutating = false) {
  if (!isAdmin(request))
    return NextResponse.json(
      { error: "Staff authentication required." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  if (mutating && !validAdminOrigin(request))
    return NextResponse.json(
      { error: "Invalid request origin." },
      { status: 403 },
    );
  return null;
}
