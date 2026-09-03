import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { addListing, listListings } from "./listing-store.ts";
import { validateListing } from "./listing-validate.ts";

const complete = {
  title: "12oz ceramic mug",
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

test("complete listing becomes catalog JSON without invented money", () => {
  const result = validateListing(complete);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.item.title, "12oz ceramic mug");
  assert.equal(result.item.sku, "12oz-ceramic-mug");
  assert.equal(result.item.owner.type, "desk");
  assert.equal(result.item.specs.length, 6);
  assert.equal(result.item.sla_hours, 48);
  assert.equal(result.item.inventory, 20);
  assert.ok(!("gmv" in result.item));
});

test("incomplete listings fail with skip-rule English", () => {
  const few = validateListing({ ...complete, specs: complete.specs.slice(0, 3) });
  assert.equal(few.ok, false);
  if (few.ok) return;
  assert.match(few.reason, /fewer than six real specs/);

  const hype = validateListing({
    ...complete,
    specs: [...complete.specs.slice(0, 5), { name: "Feel", value: "premium" }],
  });
  assert.equal(hype.ok, false);
  if (hype.ok) return;
  assert.match(hype.reason, /marketing talk/);

  const stock = validateListing({ ...complete, inventory: 0 });
  assert.equal(stock.ok, false);
  if (stock.ok) return;
  assert.match(stock.reason, /no stock/);

  const returns = validateListing({ ...complete, return_days: "" });
  assert.equal(returns.ok, false);
  if (returns.ok) return;
  assert.match(returns.reason, /return days/);

  const ship = validateListing({ ...complete, lead_time: "" });
  assert.equal(ship.ok, false);
  if (ship.ok) return;
  assert.match(ship.reason, /shipping time/);
});

test("store writes appear on the catalog items array", () => {
  process.env.FLOOR_LISTINGS_FILE = "listings.test.json";
  mkdirSync(join(process.cwd(), "data"), { recursive: true });
  writeFileSync(join(process.cwd(), "data", "listings.test.json"), "[]\n");

  const result = validateListing({ ...complete, title: "Oak cutting board" });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  addListing(result.item);
  assert.equal(listListings().length, 1);
  const catalog = {
    protocol: "floor.b2a/v1",
    generated_at: new Date().toISOString(),
    items: listListings(),
    settlement: "not_settled",
  };
  assert.equal(catalog.protocol, "floor.b2a/v1");
  assert.equal(catalog.settlement, "not_settled");
  assert.equal(catalog.items.length, 1);
  assert.equal(catalog.items[0].title, "Oak cutting board");
  assert.ok(!("gmv" in catalog));
});
