import { commerce } from "@/src/config/commerce";
export function publicOrigin(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    if (
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      !["", "/"].includes(url.pathname)
    )
      return null;
    if (url.protocol !== "https:" && !(local && url.protocol === "http:"))
      return null;
    return url.origin;
  } catch {
    return null;
  }
}
export function databaseConfigured(value: string | undefined) {
  if (!value) return false;
  try {
    const url = new URL(value);
    return (
      ["postgres:", "postgresql:"].includes(url.protocol) &&
      Boolean(url.hostname && url.username && url.pathname.length > 1)
    );
  } catch {
    return false;
  }
}
export function detectPaymentConfiguration(
  env: NodeJS.ProcessEnv = process.env,
) {
  const secret = env.STRIPE_SECRET_KEY ?? "",
    webhook = env.STRIPE_WEBHOOK_SECRET ?? "";
  const publishable =
    env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? env.STRIPE_PUBLISHABLE_KEY ?? "";
  const keyMode = /^sk_(test|live)_[A-Za-z0-9]{16,}$/.exec(secret)?.[1],
    publicMode = /^pk_(test|live)_[A-Za-z0-9]{16,}$/.exec(publishable)?.[1];
  const baseUrl = publicOrigin(env.SITE_URL ?? env.NEXT_PUBLIC_SITE_URL);
  const sizes = [
    ...new Set(
      (env.JERSEY_SIZES?.trim() || commerce.sizes.join(","))
        .split(",")
        .map((v) => v.trim())
        .filter((v) => v.length > 0 && v.length <= 40),
    ),
  ];
  const countries = [
    ...new Set(
      (env.SHIPPING_COUNTRIES ?? "")
        .split(",")
        .map((v) => v.trim().toUpperCase())
        .filter(Boolean),
    ),
  ];
  const validCountries =
    countries.length > 0 &&
    countries.every(
      (value) => /^[A-Z]{2}$/.test(value) && STRIPE_COUNTRIES.has(value),
    );
  const shippingRate = env.STRIPE_SHIPPING_RATE_ID ?? "",
    validRate = /^shr_[A-Za-z0-9]{8,}$/.test(shippingRate),
    freeShipping = !validRate && env.FREE_SHIPPING === "true";
  const flatValue = env.SHIPPING_FLAT_RATE_CENTS,
    flatAmount =
      flatValue && /^\d{1,7}$/.test(flatValue) ? Number(flatValue) : null,
    flatConfigured = flatAmount !== null && flatAmount <= 1_000_000;
  const shippingConfigured =
      validCountries && (validRate || freeShipping || flatConfigured),
    preorderNotice = env.PREORDER_NOTICE?.trim() ?? "";
  const missing: string[] = [];
  if (!keyMode) missing.push("STRIPE_SECRET_KEY");
  if (!/^whsec_[A-Za-z0-9]{16,}$/.test(webhook))
    missing.push("STRIPE_WEBHOOK_SECRET");
  if (publishable && (!publicMode || publicMode !== keyMode))
    missing.push("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY");
  if (!databaseConfigured(env.DATABASE_URL)) missing.push("DATABASE_URL");
  if (!baseUrl) missing.push("SITE_URL");
  if (!sizes.length) missing.push("JERSEY_SIZES");
  if (!shippingConfigured) missing.push("SHIPPING_CONFIGURATION");
  if (preorderNotice.length < 20 || preorderNotice.length > 1200)
    missing.push("PREORDER_NOTICE");
  const ready = missing.length === 0;
  return {
    ready,
    enabled: ready,
    paymentStatus: ready ? ("ready" as const) : ("missing" as const),
    missing,
    baseUrl: baseUrl ?? "",
    sizes,
    countries: validCountries ? countries : [],
    preorderNotice,
    shippingRate: validRate ? shippingRate : "",
    freeShipping,
    flatAmount: flatConfigured ? flatAmount : null,
    shipping: {
      configured: shippingConfigured,
      free: freeShipping,
      amount: validRate
        ? null
        : freeShipping
          ? 0
          : flatConfigured
            ? flatAmount
            : null,
      label:
        env.SHIPPING_LABEL?.trim().slice(0, 80) ||
        (freeShipping ? "Free shipping" : "Shipping calculated at checkout"),
    },
    automaticTax: env.STRIPE_AUTOMATIC_TAX === "true",
    taxBehavior:
      env.STRIPE_TAX_BEHAVIOR === "inclusive"
        ? ("inclusive" as const)
        : ("exclusive" as const),
    blackAvailable: env.BLACK_JERSEY_AVAILABLE !== "false",
    whiteAvailable: env.WHITE_JERSEY_AVAILABLE !== "false",
    termsUrl: "/terms",
  };
}
const STRIPE_COUNTRIES = new Set(
  "AC AD AE AF AG AI AL AM AO AQ AR AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CD CF CG CH CI CK CL CM CN CO CR CV CW CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HN HR HT HU ID IE IL IM IN IO IQ IS IT JE JM JO JP KE KG KH KI KM KN KR KW KY KZ LA LB LC LI LK LR LS LT LU LV MA MC MD ME MF MG MK ML MM MN MO MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PY QA RE RO RS RU RW SA SB SC SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SZ TA TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG US UY UZ VA VC VE VG VN VU WF WS XK YE YT ZA ZM ZW".split(
    " ",
  ),
);
