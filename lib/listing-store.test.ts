import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { buildCatalog } from "./catalog.ts";
import {
  addListing,
  listListings,
  listingStoreKind,
  parseListingDocument,
} from "./listing-store.ts";
import { validateListing } from "./listing-validate.ts";

const file = `listings.durable.${process.pid}.json`;
const dataPath = join(process.cwd(), "data", file);

function isolateFileStore() {
  process.env.FLOOR_LISTINGS_FILE = file;
  delete process.env.BLOB_READ_WRITE_TOKEN;
  delete process.env.VERCEL;
  mkdirSync(join(process.cwd(), "data"), { recursive: true });
  writeFileSync(dataPath, "[]\n");
}

const completePhysical = {
  title: "Oak board durability",
  kind: "physical",
  checkout: "https://pay.example.com/oak",
  specs: [
    { name: "Material", value: "oak" },
    { name: "Size", value: "12 in" },
    { name: "Thickness", value: "1 in" },
    { name: "Finish", value: "oil" },
    { name: "Edge", value: "square" },
    { name: "Groove", value: "none" },
  ],
  inventory: 3,
  return_days: 14,
  warranty: "none",
  ships_from: "Austin, TX",
  lead_time: "2 days",
};

test("file store is selected without a Blob token", () => {
  isolateFileStore();
  assert.equal(listingStoreKind(), "file");
});

test("empty store still returns the house desk on the catalog", async () => {
  isolateFileStore();
  assert.deepEqual(await listListings(), []);
  const catalog = await buildCatalog(new Date("2026-09-04T00:00:00.000Z"), "https://example.test");
  assert.equal(catalog.protocol, "floor.b2a/v1");
  assert.equal(catalog.settlement, "not_settled");
  assert.equal(catalog.items.length, 1);
  const desk = catalog.items[0];
  assert.equal(desk.sku, "floor-desk");
  assert.equal(desk.title, "FLOOR desk");
  assert.equal(desk.payment.checkout_url, "https://whop.com/checkout/plan_j7hRIj9BQowga");
  const payTos = new Set((desk.payment.accepts ?? []).map((row) => row.payTo));
  assert.ok(payTos.has("0x0Cd76DDBCF3c249a6437FAA09a2D61E208d86f10"));
  assert.ok(payTos.has("D6Spkkf3oVJBfnTojWKGXZd3TBYpvF4HFe2CihrX9AGL"));
  assert.ok(!("gmv" in catalog));
});

test("legacy array files and house sku rows still parse", () => {
  const fromArray = parseListingDocument([
    { sku: "mug", title: "Mug" },
    { sku: "floor-desk", title: "should drop" },
    { title: "no sku" },
  ]);
  assert.deepEqual(
    fromArray.items.map((item) => item.sku),
    ["mug"],
  );
  const fromDoc = parseListingDocument({
    items: [{ sku: "photos", title: "Photos" }],
    idempotency: [{ key: "k1", sku: "photos" }],
  });
  assert.equal(fromDoc.items[0].sku, "photos");
  assert.equal(fromDoc.idempotency[0].key, "k1");
});

test("POST listing persists across a new process reading the same file", async () => {
  isolateFileStore();
  const result = validateListing(completePhysical);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  await addListing(result.item, { idempotencyKey: "durability-1" });

  const onDisk = parseListingDocument(JSON.parse(readFileSync(dataPath, "utf8")));
  assert.equal(onDisk.items[0].sku, "oak-board-durability");
  assert.equal(onDisk.idempotency[0].key, "durability-1");

  const script = `
import { listListings } from ${JSON.stringify(new URL("./listing-store.ts", import.meta.url).href)};
const items = await listListings();
if (items.length !== 1 || items[0].sku !== "oak-board-durability") {
  console.error(JSON.stringify(items));
  process.exit(2);
}
if (items[0].payment.checkout_url !== "https://pay.example.com/oak") process.exit(3);
console.log("restart-read", items[0].sku);
`;
  const child = spawnSync(process.execPath, ["--experimental-strip-types", "--input-type=module", "-e", script], {
    cwd: process.cwd(),
    encoding: "utf8",
    env: {
      ...process.env,
      FLOOR_LISTINGS_FILE: file,
      BLOB_READ_WRITE_TOKEN: "",
      VERCEL: "",
    },
  });
  assert.equal(child.status, 0, child.stderr || child.stdout);
  assert.match(child.stdout, /restart-read oak-board-durability/);

  const catalog = await buildCatalog();
  assert.ok(catalog.items.some((item) => item.sku === "floor-desk"));
  assert.ok(catalog.items.some((item) => item.sku === "oak-board-durability"));

  rmSync(dataPath, { force: true });
});
