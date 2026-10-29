import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  ADMIN_COOKIE,
  adminConfigured,
  isAdmin,
  validAdminPassword,
  validAdminOrigin,
  createAdminSession,
} from "@/src/lib/admin/auth";
import { sql } from "@/src/lib/db";
import { readLimitedBody } from "@/src/lib/commerce/request";
export const runtime = "nodejs",
  dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  return NextResponse.json(
    { configured: adminConfigured(), authenticated: isAdmin(request) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
export async function POST(request: NextRequest) {
  if (!adminConfigured())
    return NextResponse.json(
      { error: "Staff administration is not configured." },
      { status: 503 },
    );
  if (!validAdminOrigin(request))
    return NextResponse.json(
      { error: "Invalid request origin." },
      { status: 403 },
    );
  try {
    const input = z
      .object({ password: z.string().min(1).max(256) })
      .strict()
      .parse(JSON.parse(await readLimitedBody(request, 2048)));
    const db = sql(),
      now = Date.now(),
      key = `admin-login:${Math.floor(now / 600000)}`;
    const [rate] =
      await db`INSERT INTO checkout_rate_limits(key,count,expires_at) VALUES (${key},1,${now + 600000}) ON CONFLICT(key) DO UPDATE SET count=checkout_rate_limits.count+1 RETURNING count`;
    if (rate.count > 20)
      return NextResponse.json(
        { error: "Too many attempts. Try again later." },
        { status: 429 },
      );
    if (!validAdminPassword(input.password))
      return NextResponse.json(
        { error: "The staff password was not accepted." },
        { status: 401 },
      );
    const response = NextResponse.json(
      { authenticated: true },
      { headers: { "Cache-Control": "no-store" } },
    );
    response.cookies.set(ADMIN_COOKIE, createAdminSession(), {
      httpOnly: true,
      secure:
        (
          process.env.SITE_URL ||
          process.env.NEXT_PUBLIC_SITE_URL ||
          ""
        ).startsWith("https://") || request.nextUrl.protocol === "https:",
      sameSite: "strict",
      path: "/",
      maxAge: 8 * 60 * 60,
    });
    return response;
  } catch {
    return NextResponse.json(
      { error: "Unable to sign in. Check your request and try again." },
      { status: 400 },
    );
  }
}
export async function DELETE(request: NextRequest) {
  if (!validAdminOrigin(request))
    return NextResponse.json(
      { error: "Invalid request origin." },
      { status: 403 },
    );
  const response = NextResponse.json({ authenticated: false });
  response.cookies.set(ADMIN_COOKIE, "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
    sameSite: "strict",
  });
  return response;
}
