import type { CatalogItem, CatalogSpec, ProductKind } from "./catalog";
import { buildPayment, parseCheckoutUrl } from "./payment.ts";

const HYPE_VALUE =
  /^(premium|quality|perfect|best|amazing|luxury|exclusive|professional|ready|high[- ]quality|top[- ]quality|the best|great quality)$/i;
const HYPE_PHRASE =
  /\b(feels premium|amazing quality|best in class|world[- ]class|must[- ]have|luxury feel|premium quality)\b/i;

export type ListingInput = {
  title?: unknown;
  name?: unknown;
  kind?: unknown;
  specs?: unknown;
  inventory?: unknown;
  return_days?: unknown;
  refund_days?: unknown;
  warranty?: unknown;
  ships_from?: unknown;
  lead_time?: unknown;
  delivery_time?: unknown;
  checkout?: unknown;
  delivery?: unknown;
  delivery_method?: unknown;
  payTo?: unknown;
  network?: unknown;
  x402_price?: unknown;
  resource?: unknown;
  payment?: unknown;
  owner?: unknown;
  owner_name?: unknown;
};

export type ListingFail = {
  ok: false;
  reason: string;
  field: string;
  skip: string[];
  existing_id?: string;
};

export type ValidatedListing = { ok: true; item: CatalogItem } | ListingFail;

function fail(field: string, skip: string, reason: string, extra?: { existing_id?: string }): ListingFail {
  return { ok: false, reason, field, skip: [skip], ...extra };
}

function asText(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

/** Accept the human form body or the agent POST shape. */
export function normalizeListingInput(raw: unknown): ListingInput {
  const input = asRecord(raw) ?? {};
  const payment = asRecord(input.payment) ?? {};
  const x402 = asRecord(payment.x402) ?? payment;
  const owner = asRecord(input.owner);
  return {
    ...input,
    title: input.title ?? input.name,
    return_days: input.return_days ?? input.refund_days,
    lead_time: input.lead_time ?? input.delivery_time,
    delivery: input.delivery ?? input.delivery_method,
    checkout: input.checkout ?? payment.checkout_url ?? payment.checkout,
    payTo: input.payTo ?? x402.payTo ?? payment.payTo,
    network: input.network ?? x402.network ?? payment.network,
    x402_price: input.x402_price ?? x402.price ?? payment.price ?? payment.x402_price,
    resource: input.resource ?? x402.resource ?? payment.resource,
    owner_name: asText(owner?.name ?? input.owner_name ?? input.owner),
  };
}

function asInt(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value)) return value;
  if (typeof value === "string" && /^\d+$/.test(value.trim())) return Number(value.trim());
  return null;
}

export function slugFromTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function parseSlaHours(text: string): number | null {
  const t = text.trim().toLowerCase();
  if (!t) return null;
  if (/^(instant|immediately|immediate|now)$/.test(t)) return 0;
  const hours = t.match(/(\d+(?:\.\d+)?)\s*(hours?|hrs?|h)\b/);
  if (hours) return Math.max(0, Math.round(Number(hours[1])));
  const days = t.match(/(\d+(?:\.\d+)?)\s*(days?|d)\b/);
  if (days) return Math.max(0, Math.round(Number(days[1]) * 24));
  const weeks = t.match(/(\d+(?:\.\d+)?)\s*(weeks?|wks?)\b/);
  if (weeks) return Math.max(0, Math.round(Number(weeks[1]) * 24 * 7));
  if (/^\d+$/.test(t)) return Number(t);
  const first = t.match(/(\d+)/);
  if (first) return Math.max(0, Number(first[1]) * 24);
  return null;
}

export function parseCheckout(value: unknown): string | null {
  return parseCheckoutUrl(value);
}

function isMarketingSpec(spec: CatalogSpec): boolean {
  const name = spec.name.trim();
  const value = spec.value.trim();
  if (HYPE_VALUE.test(value)) return true;
  if (HYPE_PHRASE.test(`${name} ${value}`)) return true;
  return false;
}

function readSpecs(raw: unknown): CatalogSpec[] | null {
  if (!Array.isArray(raw)) return null;
  const specs: CatalogSpec[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const name = asText((row as { name?: unknown }).name);
    const value = asText((row as { value?: unknown }).value);
    if (!name && !value) continue;
    specs.push({ name, value });
  }
  return specs;
}

function readKind(value: unknown): ProductKind | null {
  const kind = asText(value).toLowerCase();
  if (!kind || kind === "physical") return "physical";
  if (kind === "digital") return "digital";
  return null;
}

function readInventory(
  value: unknown,
  kind: ProductKind,
): { inventory: number; unlimited: boolean } | { reason: string } {
  const text = asText(value).toLowerCase();
  if (kind === "digital" && /^(unlimited|no limit|none)$/.test(text)) {
    return { inventory: 0, unlimited: true };
  }
  const inventory = asInt(value);
  if (inventory === null) {
    return {
      reason:
        kind === "digital"
          ? "Say how many you can sell, as a number, or write unlimited."
          : "Bots skip listings with no stock. Enter how many you have, as a number.",
    };
  }
  if (kind === "physical" && inventory <= 0) {
    return {
      reason: "Bots skip listings with no stock. Enter how many you have. Zero does not count.",
    };
  }
  if (kind === "digital" && inventory < 0) {
    return { reason: "Inventory cannot be negative. Use a number or write unlimited." };
  }
  return { inventory, unlimited: false };
}

export function validateListing(input: ListingInput, existingIds: string[] = []): ValidatedListing {
  const body = normalizeListingInput(input);
  const title = asText(body.title);
  const ownerName = asText(body.owner_name) || "desk";
  if (title.length < 3) {
    return fail("title", "no title", "Give the product a real name.");
  }

  const id = slugFromTitle(title);
  if (!id) {
    return fail("title", "no title", "Give the product a real name.");
  }
  if (existingIds.includes(id)) {
    return fail("title", "duplicate_title", "That product name is already on the list.", {
      existing_id: id,
    });
  }

  const kind = readKind(body.kind);
  if (!kind) {
    return fail("kind", "no kind", "Say if it is a physical thing or a digital thing.");
  }

  const paid = buildPayment({
    checkout: body.checkout,
    payTo: body.payTo,
    network: body.network,
    price: body.x402_price,
    resource: body.resource,
    id,
    title,
  });
  if (!paid.ok) {
    return fail("payment", "no payment", paid.reason);
  }

  const specs = readSpecs(body.specs);
  if (!specs) {
    return fail("specs", "no specs", "Bots skip listings with fewer than six real specs. Add at least six facts.");
  }

  const incomplete = specs.find((spec) => spec.name.length < 2 || spec.value.length < 2);
  if (incomplete) {
    return fail(
      "specs",
      "no specs",
      "Each spec needs a name and a fact, like Color and navy. Empty rows do not count.",
    );
  }

  const marketing = specs.find(isMarketingSpec);
  if (marketing) {
    return fail(
      "specs",
      "marketing_specs",
      "Bots skip marketing talk. Use facts like size, material, or weight — not words like premium or perfect.",
    );
  }

  if (specs.length < 6) {
    return fail("specs", "no specs", "Bots skip listings with fewer than six real specs. Add at least six facts.");
  }

  const stock = readInventory(body.inventory, kind);
  if ("reason" in stock) {
    return fail("inventory", "no inventory", stock.reason);
  }

  const returnDays = asInt(body.return_days);
  if (returnDays === null) {
    return fail(
      "return_days",
      "no return_days",
      kind === "digital"
        ? "Bots skip listings with no refund days. Enter a number. Use 0 if you do not give refunds."
        : "Bots skip listings with no return days. Enter a number. Use 0 if you do not take returns.",
    );
  }
  if (returnDays < 0) {
    return fail(
      "return_days",
      "no return_days",
      kind === "digital"
        ? "Refund days cannot be negative. Enter a number. Use 0 if you do not give refunds."
        : "Return days cannot be negative. Enter a number. Use 0 if you do not take returns.",
    );
  }

  const warranty = asText(body.warranty);
  if (!warranty) {
    return fail(
      "warranty",
      "no warranty",
      kind === "digital"
        ? "Say what the warranty is. If there is none, write none. If access lasts 12 months, write that."
        : "Say what the warranty is. If there is none, write none.",
    );
  }

  const leadTime = asText(body.lead_time);
  if (!leadTime) {
    return fail(
      "lead_time",
      "no lead_time",
      kind === "digital"
        ? "Bots skip listings with no delivery time. Say how long until they get it. Instant is allowed."
        : "Bots skip listings with no shipping time. Say how long until it ships, like 48 hours or 2 days.",
    );
  }

  const slaHours = parseSlaHours(leadTime);
  if (slaHours === null) {
    return fail(
      "lead_time",
      "no lead_time",
      kind === "digital"
        ? "Bots skip listings with no delivery time. Say how long until they get it, like instant or 1 hour."
        : "Bots skip listings with no shipping time. Say how long until it ships, like 48 hours or 2 days.",
    );
  }

  if (kind === "digital") {
    const delivery = asText(body.delivery);
    if (!delivery) {
      return fail(
        "delivery",
        "no delivery",
        "Bots skip digital listings with no delivery method. Say how they get it: account access, download, email, or login.",
      );
    }

    return {
      ok: true,
      item: {
        sku: id,
        title,
        kind,
        owner: { type: "desk", name: ownerName },
        specs,
        inventory: stock.inventory,
        unlimited: stock.unlimited || undefined,
        lead_time: leadTime,
        return_days: returnDays,
        warranty,
        payment: paid.payment,
        checkout: paid.checkout,
        sla_hours: slaHours,
        delivery,
      },
    };
  }

  const shipsFrom = asText(body.ships_from);
  if (!shipsFrom) {
    return fail("ships_from", "no ships_from", "Say where it ships from, like a city or warehouse.");
  }

  return {
    ok: true,
    item: {
      sku: id,
      title,
      kind,
      owner: { type: "desk", name: ownerName },
      specs,
      inventory: stock.inventory,
      lead_time: leadTime,
      return_days: returnDays,
      warranty,
      payment: paid.payment,
      checkout: paid.checkout,
      sla_hours: slaHours,
      ships_from: shipsFrom,
    },
  };
}
