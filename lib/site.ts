export const PROTOCOL = "floor.b2a/v1" as const;

export const DESK_PRICE = "$49 once";
export const DESK_CTA = "Open a desk · $49 once";
export const DESK_ACCESS = "12 months of merchant desk access";
export const DESK_EXPIRATION_DAYS = 365;
export const DESK_CHECKOUT = "https://whop.com/checkout/plan_j7hRIj9BQowga";
export const DESK_PRODUCT = "https://whop.com/floor-6c10/floor-b2a-desk";
export const AFFILIATE_PARAM = "a";
export const SUPPLIER = "FLOOR";
export const PROCESSOR = "Whop";

export const HERO_IMAGE =
  "https://assets-2-prod.whop.com/public/uploads/2026-09-03/13a90210-82d1-40d4-bece-e649130468c7/image.jpg";

export function originFromRequest(request: Request): string {
  return new URL(request.url).origin;
}

export async function siteOrigin(): Promise<string> {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  try {
    const { headers } = await import("next/headers");
    const h = await headers();
    const host = (h.get("x-forwarded-host") || h.get("host") || "").split(",")[0].trim();
    if (host) {
      const proto = h.get("x-forwarded-proto") || (process.env.VERCEL ? "https" : "http");
      return `${proto}://${host}`;
    }
  } catch {
    // headers() is unavailable outside a request
  }

  const vercel = process.env.VERCEL_URL;
  if (vercel) return `https://${vercel.replace(/\/$/, "")}`;

  return "http://127.0.0.1:3000";
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
