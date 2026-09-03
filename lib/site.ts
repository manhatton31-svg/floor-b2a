export const PROTOCOL = "floor.b2a/v1" as const;

export const DESK_PRICE = "$49 once";
export const DESK_CTA = "Open a desk · $49 once";
export const DESK_CHECKOUT = "https://whop.com/checkout/plan_j7hRIj9BQowga";
export const DESK_PRODUCT = "https://whop.com/floor-6c10/floor-b2a-desk";
export const AFFILIATE_PARAM = "a";

export const HERO_IMAGE =
  "https://assets-2-prod.whop.com/public/uploads/2026-09-03/13a90210-82d1-40d4-bece-e649130468c7/image.jpg";

const FALLBACK_ORIGIN = "https://floor-desk-ecru.vercel.app";

export function siteOrigin(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  const vercel = process.env.VERCEL_URL;
  if (vercel) return `https://${vercel.replace(/\/$/, "")}`;

  return FALLBACK_ORIGIN;
}

export function affiliateFromUnknown(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (!/^[A-Za-z0-9._-]{1,64}$/.test(trimmed)) return undefined;
  return trimmed;
}

export function deskCheckoutUrl(affiliate?: string): string {
  if (!affiliate) return DESK_CHECKOUT;
  const url = new URL(DESK_CHECKOUT);
  url.searchParams.set(AFFILIATE_PARAM, affiliate);
  return url.toString();
}

export const SKIP_RULES = [
  "null or missing return_days",
  "empty or missing inventory",
  "missing lead_time",
  "fewer than six specs",
  "at most one fill per mandate",
  "ignore marketing blurbs",
] as const;

export const PUBLIC_PATHS = [
  "/",
  "/how-to-sell-to-agents",
  "/api/catalog",
  "/llms.txt",
  "/openapi.yaml",
  "/.well-known/agent.json",
] as const;
