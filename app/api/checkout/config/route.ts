import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getCommerceConfig } from "@/src/lib/commerce/runtime";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  const config = await getCommerceConfig();
  const {
    ready,
    enabled,
    paymentStatus,
    sizes,
    countries,
    termsUrl,
    preorderNotice,
    blackAvailable,
    whiteAvailable,
    shipping,
    automaticTax,
  } = config;
  const response = NextResponse.json(
    {
      ready,
      enabled,
      paymentStatus,
      sizes,
      countries,
      termsUrl,
      preorderNotice,
      blackAvailable,
      whiteAvailable,
      shipping,
      automaticTax,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
  if (!request.cookies.get("evoke_order_owner")?.value.match(/^[a-f0-9-]{36}$/))
    response.cookies.set("evoke_order_owner", randomUUID(), {
      httpOnly: true,
      secure:
        config.baseUrl.startsWith("https://") ||
        request.nextUrl.protocol === "https:",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  return response;
}
