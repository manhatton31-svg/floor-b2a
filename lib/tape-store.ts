import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

export type CatalogVisit = {
  at: string;
  path: string;
  user_agent: string;
};

const MAX_VISITS = 200;

function storePath(): string {
  if (process.env.VERCEL) return join("/tmp", "floor-tape.json");
  const name = process.env.FLOOR_TAPE_FILE || "tape.json";
  const safe = /^[A-Za-z0-9._-]+$/.test(name) ? name : "tape.json";
  return join(process.cwd(), "data", safe);
}

function readVisits(): CatalogVisit[] {
  const path = storePath();
  try {
    if (!existsSync(path)) return [];
    const parsed = JSON.parse(readFileSync(path, "utf8")) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((row): row is CatalogVisit => {
      if (!row || typeof row !== "object") return false;
      const visit = row as CatalogVisit;
      return (
        typeof visit.at === "string" &&
        typeof visit.path === "string" &&
        typeof visit.user_agent === "string"
      );
    });
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

export function listCatalogVisits(): CatalogVisit[] {
  return readVisits();
}

export function recordCatalogVisit(input: { path: string; userAgent: string | null; at?: Date }) {
  const user_agent = (input.userAgent || "unknown").replace(/\s+/g, " ").trim().slice(0, 300) || "unknown";
  const path = input.path.startsWith("/") ? input.path.slice(0, 80) : "/api/catalog";
  const visits = readVisits();
  visits.push({
    at: (input.at ?? new Date()).toISOString(),
    path,
    user_agent,
  });
  persist(visits.slice(-MAX_VISITS));
}
