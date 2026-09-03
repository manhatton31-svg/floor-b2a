import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { addListing, listListings } from "./listing-store.ts";
import { validateListing } from "./listing-validate.ts";
import { usdToAtomic } from "./payment.ts";

const completePhysical = {
  title: "12oz ceramic mug",
  kind: "physical",
  checkout: "https://pay.example.com/mug",
  specs: [
    { name: "Capacity", value: "12 oz" },
    { name: "Material", value: "ceramic" },
    { name: "Color", value: "navy" },
    { name: "Weight", value: "380 g" },
    { name: "Dishwasher", value: "yes" },
    { name: "Microwave", value: "safe" },
  ],
  inventory: 20,
  return_days: 30,
  warranty: "1 year",
  ships_from: "Austin, TX",
  lead_time: "2 days",
};

const completeDigital = {
  title: "Photo pack",
  kind: "digital",
  checkout: "https://pay.example.com/photos",
  delivery: "download",
  specs: [
    { name: "Format", value: "JPEG" },
    { name: "Count", value: "24 photos" },
    { name: "Resolution", value: "4000 px" },
    { name: "Color", value: "sRGB" },
    { name: "License", value: "one buyer" },
    { name: "Size", value: "120 MB" },
  ],
  inventory: "unlimited",
  return_days: 0,
  warranty: "none",
  lead_time: "instant",
};

test("USD price stores USDC atomic units", () => {
  assert.equal(usdToAtomic("49"), "49000000");
  assert.equal(usdToAtomic("12.50"), "12500000");
  assert.equal(usdToAtomic("0"), null);
});

test("complete physical listing needs a pay method", () => {
  const result = validateListing(completePhysical);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.item.payment.checkout_url, "https://pay.example.com/mug");
  assert.ok(!result.item.payment.accepts);
  assert.ok(!("gmv" in result.item));
});

test("x402 public config is stored without inventing a sale", () => {
  const result = validateListing({
    ...completeDigital,
    checkout: "",
    payTo: "0x000000000000000000000000000000000000dEaD",
    network: "base",
    x402_price: "12.50",
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.item.payment.checkout_url, undefined);
  assert.equal(result.item.payment.accepts?.[0].scheme, "exact");
  assert.equal(result.item.payment.accepts?.[0].network, "base");
  assert.equal(result.item.payment.accepts?.[0].maxAmountRequired, "12500000");
  assert.equal(result.item.payment.accepts?.[0].payTo, "0x000000000000000000000000000000000000dEaD");
  assert.equal(result.item.payment.accepts?.[0].resource, "/pay/photo-pack");
});

test("missing pay method is a skip", () => {
  const none = validateListing({ ...completePhysical, checkout: "" });
  assert.equal(none.ok, false);
  if (none.ok) return;
  assert.match(none.reason, /no way to pay/);
});

test("incomplete listings fail with skip-rule English", () => {
  const few = validateListing({ ...completePhysical, specs: completePhysical.specs.slice(0, 3) });
  assert.equal(few.ok, false);
  if (few.ok) return;
  assert.match(few.reason, /fewer than six real specs/);

  const stock = validateListing({ ...completePhysical, inventory: 0 });
  assert.equal(stock.ok, false);
  if (stock.ok) return;
  assert.match(stock.reason, /no stock/);

  const delivery = validateListing({ ...completeDigital, delivery: "" });
  assert.equal(delivery.ok, false);
  if (delivery.ok) return;
  assert.match(delivery.reason, /delivery method/);
});

test("store writes appear on the catalog items array", () => {
  process.env.FLOOR_LISTINGS_FILE = "listings.test.json";
  mkdirSync(join(process.cwd(), "data"), { recursive: true });
  writeFileSync(join(process.cwd(), "data", "listings.test.json"), "[]\n");

  const result = validateListing({ ...completePhysical, title: "Oak cutting board" });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  addListing(result.item);
  assert.equal(listListings()[0].payment.checkout_url, "https://pay.example.com/mug");
});
