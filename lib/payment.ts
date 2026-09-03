/**
 * Public payment rails for catalog items.
 * x402 shapes follow documented HTTP 402 / PAYMENT-REQUIRED fields:
 * https://docs.x402.org/core-concepts/http-402
 * https://github.com/x402-foundation/x402
 * https://x402.org/
 *
 * This module never asks for or stores private keys, seed phrases, or secret API keys.
 * FLOOR does not settle x402 or hold customer funds.
 */

export const X402_SPEC = "https://x402.org/";
export const X402_DOCS = "https://docs.x402.org/core-concepts/http-402";

export type X402Network = "base" | "solana";

/** Public USDC contracts from https://docs.x402.org/core-concepts/network-and-token-support. 6 decimals. Not secrets. */
export const USDC = {
  base: {
    network: "base" as const,
    asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    decimals: 6,
    extra: { name: "USDC", version: "2" },
  },
  solana: {
    network: "solana" as const,
    asset: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    decimals: 6,
    extra: { name: "USDC" },
  },
} as const;

export type X402Accept = {
  scheme: "exact";
  network: X402Network;
  maxAmountRequired: string;
  asset: string;
  payTo: string;
  resource: string;
  description: string;
};

export type ListingPayment = {
  checkout_url?: string;
  accepts?: X402Accept[];
};

function asText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function parseCheckoutUrl(value: unknown): string | null {
  const raw = asText(value);
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:") return null;
    if (!url.hostname.includes(".")) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function usdToAtomic(usd: string, decimals = 6): string | null {
  const t = usd.trim();
  if (!/^\d+(\.\d{1,6})?$/.test(t)) return null;
  const [whole, frac = ""] = t.split(".");
  const fracPadded = (frac + "0".repeat(decimals)).slice(0, decimals);
  const atomic = `${whole}${fracPadded}`.replace(/^0+(?=\d)/, "");
  if (!atomic || atomic === "0" || /^0+$/.test(atomic)) return null;
  return atomic;
}

function validPayTo(network: X402Network, address: string): boolean {
  if (network === "base") return /^0x[a-fA-F0-9]{40}$/.test(address);
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
}

export function parseNetwork(value: unknown): X402Network | null {
  const t = asText(value).toLowerCase();
  if (t === "base" || t === "solana") return t;
  return null;
}

export function parseX402Input(input: {
  payTo?: unknown;
  network?: unknown;
  price?: unknown;
  resource?: unknown;
}): { ok: true; accept: Omit<X402Accept, "resource" | "description"> & { resource?: string } } | { ok: false; reason?: string } {
  const payTo = asText(input.payTo);
  const network = parseNetwork(input.network);
  const price = asText(input.price);
  const resource = asText(input.resource);
  const any = Boolean(payTo || input.network || price || resource);
  if (!any) return { ok: false };

  if (!network) {
    return { ok: false, reason: "Say which network: Base or Solana." };
  }
  if (!payTo || !validPayTo(network, payTo)) {
    return {
      ok: false,
      reason:
        network === "base"
          ? "Enter a public Base wallet address, starting with 0x. Never paste a private key."
          : "Enter a public Solana wallet address. Never paste a private key.",
    };
  }
  const maxAmountRequired = usdToAtomic(price);
  if (!maxAmountRequired) {
    return { ok: false, reason: "Enter the price in US dollars, like 49 or 12.50." };
  }

  return {
    ok: true,
    accept: {
      scheme: "exact",
      network,
      maxAmountRequired,
      asset: USDC[network].asset,
      payTo,
      resource: resource || undefined,
    },
  };
}

export function buildPayment(input: {
  checkout?: unknown;
  payTo?: unknown;
  network?: unknown;
  price?: unknown;
  resource?: unknown;
  id: string;
  title: string;
}): { ok: true; payment: ListingPayment; checkout?: string } | { ok: false; reason: string } {
  const checkout_url = parseCheckoutUrl(input.checkout) ?? undefined;
  const x402 = parseX402Input(input);

  if (x402.ok === false && x402.reason) {
    return { ok: false, reason: x402.reason };
  }

  const accepts: X402Accept[] = [];
  if (x402.ok) {
    accepts.push({
      ...x402.accept,
      scheme: "exact",
      resource: x402.accept.resource || `/pay/${input.id}`,
      description: input.title,
    });
  }

  if (!checkout_url && accepts.length === 0) {
    return {
      ok: false,
      reason:
        "Bots skip listings with no way to pay. Enter a https checkout link and/or a public x402 wallet address.",
    };
  }

  const payment: ListingPayment = {};
  if (checkout_url) payment.checkout_url = checkout_url;
  if (accepts.length) payment.accepts = accepts;
  return { ok: true, payment, checkout: checkout_url };
}

export function expandPayment(payment: ListingPayment | undefined, origin: string): ListingPayment {
  if (!payment) return {};
  const accepts = payment.accepts?.map((row) => ({
    ...row,
    resource: row.resource.startsWith("http") ? row.resource : `${origin}${row.resource}`,
  }));
  return {
    checkout_url: payment.checkout_url,
    accepts,
  };
}

export function paymentRequiredHeader(input: {
  origin: string;
  id: string;
  title: string;
  payment: ListingPayment;
  error: string;
}): string {
  const body = {
    x402Version: 2,
    error: input.error,
    resource: {
      url: `${input.origin}/pay/${input.id}`,
      description: input.title,
      mimeType: "application/json",
    },
    accepts: (input.payment.accepts ?? []).map((row) => ({
      scheme: row.scheme,
      network: row.network === "base" ? "eip155:8453" : "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
      amount: row.maxAmountRequired,
      asset: row.asset,
      payTo: row.payTo,
      maxTimeoutSeconds: 60,
      extra: USDC[row.network].extra,
    })),
  };
  return Buffer.from(JSON.stringify(body), "utf8").toString("base64");
}

export function hasPaymentSignature(request: Request): boolean {
  return Boolean(request.headers.get("PAYMENT-SIGNATURE") || request.headers.get("X-PAYMENT"));
}
