import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { classifyHouseUa, listCatalogVisits, recordCatalogVisit } from "./tape-store.ts";

test("tags only the named house User-Agents", () => {
  assert.equal(classifyHouseUa("FLOOR-Watch"), "FLOOR-Watch");
  assert.equal(classifyHouseUa("FLOOR-Watch/1.0"), "FLOOR-Watch");
  assert.equal(classifyHouseUa("curl"), "curl");
  assert.equal(classifyHouseUa("curl/8.5.0"), "curl");
  assert.equal(classifyHouseUa("FLOOR Demand"), "FLOOR Demand");
  assert.equal(classifyHouseUa("FLOOR-Demand"), "FLOOR Demand");
  assert.equal(classifyHouseUa("FLOOR Protocol/0.1"), "FLOOR Protocol");
  assert.equal(classifyHouseUa("FLOOR-Protocol"), "FLOOR Protocol");
  assert.equal(classifyHouseUa("FLOOR Sales"), "FLOOR Sales");
  assert.equal(classifyHouseUa("FLOOR-Sales"), "FLOOR Sales");
});

test("does not invent shopping-bot names from other User-Agents", () => {
  assert.equal(classifyHouseUa("verify-routes-catalog"), null);
  assert.equal(classifyHouseUa("Mozilla/5.0"), null);
  assert.equal(classifyHouseUa("unknown"), null);
  assert.equal(classifyHouseUa(""), null);
});

test("records User-Agent, time, path, and status without an IP", () => {
  process.env.FLOOR_TAPE_FILE = "tape.test.json";
  mkdirSync(join(process.cwd(), "data"), { recursive: true });
  writeFileSync(join(process.cwd(), "data", "tape.test.json"), "[]\n");

  recordCatalogVisit({
    path: "/api/catalog",
    userAgent: "verify-routes-catalog",
    status: 200,
    at: new Date("2026-09-03T12:00:00.000Z"),
  });

  const visits = listCatalogVisits();
  assert.equal(visits.length, 1);
  assert.equal(visits[0].user_agent, "verify-routes-catalog");
  assert.equal(visits[0].path, "/api/catalog");
  assert.equal(visits[0].status, 200);
  assert.equal(visits[0].at, "2026-09-03T12:00:00.000Z");
  assert.equal("ip" in visits[0], false);
  assert.doesNotMatch(JSON.stringify(visits[0]), /"ip"/);

  const raw = readFileSync(join(process.cwd(), "data", "tape.test.json"), "utf8");
  assert.match(raw, /verify-routes-catalog/);
  assert.match(raw, /"status": 200/);
  assert.doesNotMatch(raw, /"ip"/);
});
