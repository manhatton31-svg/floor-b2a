import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

export type CatalogVisit = {
  at: string;
  path: string;
  user_agent: string;
  status?: number;
};

/** Known in-house User-Agents only. Do not invent shopping-bot names. */
export type HouseUa =
  | "FLOOR-Watch"
  | "curl"
  | "FLOOR Demand"
  | "FLOOR Protocol"
  | "FLOOR Sales";

const MAX_VISITS = 200;

function storePath(): string {
  if (process.env.VERCEL) return join("/tmp", "floor-tape.json");
  const name = process.env.FLOOR_TAPE_FILE || "tape.json";
  const safe = /^[A-Za-z0-9._-]+$/.test(name) ? name : "tape.json";
  return join(process.cwd(), "data", safe);
}

function isVisit(row: unknown): row is CatalogVisit {
  if (!row || typeof row !== "object") return false;
  const visit = row as CatalogVisit;
  if (
    typeof visit.at !== "string" ||
    typeof visit.path !== "string" ||
    typeof visit.user_agent !== "string"
  ) {
    return false;
  }
  if (visit.status !== undefined && !Number.isInteger(visit.status)) return false;
  return true;
}

function readVisits(): CatalogVisit[] {
  const path = storePath();
  try {
    if (!existsSync(path)) return [];
    const parsed = JSON.parse(readFileSync(path, "utf8")) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isVisit);
  } catch {
    return [];
  }
}

function persist(visits: CatalogVisit[]) {
  const path = storePath();
  try {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, `${JSON.stringify(visits, null, 2)}\n`);
  } catch {
    // The public tape stays empty if the file cannot be written.
  }
}

export function classifyHouseUa(userAgent: string): HouseUa | null {
  const ua = userAgent.replace(/\s+/g, " ").trim();
  if (!ua) return null;
  if (/FLOOR-Watch/i.test(ua)) return "FLOOR-Watch";
  if (/FLOOR[- ]Demand/i.test(ua)) return "FLOOR Demand";
  if (/FLOOR[- ]Protocol/i.test(ua)) return "FLOOR Protocol";
  if (/FLOOR[- ]Sales/i.test(ua)) return "FLOOR Sales";
  if (/^curl(?:\/|\s|$)/i.test(ua)) return "curl";
  return null;
}

export function listCatalogVisits(): CatalogVisit[] {
  return readVisits();
}

export function recordCatalogVisit(input: {
  path: string;
  userAgent: string | null;
  status: number;
  at?: Date;
}) {
  const user_agent = (input.userAgent || "unknown").replace(/\s+/g, " ").trim().slice(0, 300) || "unknown";
  const path = input.path.startsWith("/") ? input.path.slice(0, 80) : "/api/catalog";
  const status = Number.isInteger(input.status) ? input.status : 0;
  const visits = readVisits();
  visits.push({
    at: (input.at ?? new Date()).toISOString(),
    path,
    user_agent,
    status,
  });
  persist(visits.slice(-MAX_VISITS));
}
