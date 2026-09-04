import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

export function dataFile(name: string, tmpName: string): string {
  if (process.env.VERCEL) return join("/tmp", tmpName);
  const safe = /^[A-Za-z0-9._-]+$/.test(name) ? name : tmpName;
  return join(process.cwd(), "data", safe);
}

export function readJsonFile<T>(path: string, fallback: T): T {
  try {
    if (!existsSync(path)) return fallback;
    return JSON.parse(readFileSync(path, "utf8")) as T;
  } catch {
    return fallback;
  }
}

export function writeJsonFile(path: string, value: unknown) {
  try {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
  } catch {
    // Public routes stay up if a local file cannot be written.
  }
}

export function appendJsonl(path: string, value: unknown) {
  try {
    mkdirSync(dirname(path), { recursive: true });
    appendFileSync(path, `${JSON.stringify(value)}\n`);
  } catch {
    // Public routes stay up if a local file cannot be written.
  }
}
