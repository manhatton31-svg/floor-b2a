import { randomBytes } from "node:crypto";
import { appendJsonl, dataFile } from "./data-file.ts";
import { validateFeedback, type FeedbackRow } from "./feedback.ts";

export {
  FEEDBACK_TRIED,
  validateFeedback,
  type FeedbackFail,
  type FeedbackOk,
  type FeedbackRow,
  type FeedbackTried,
} from "./feedback.ts";

function storePath(): string {
  return dataFile(process.env.FLOOR_FEEDBACK_FILE || "feedback.jsonl", "floor-feedback.jsonl");
}

export function addFeedback(partial: Omit<FeedbackRow, "id" | "at">): FeedbackRow {
  const row: FeedbackRow = {
    ...partial,
    id: `fb_${randomBytes(8).toString("hex")}`,
    at: new Date().toISOString(),
  };
  appendJsonl(storePath(), row);
  return row;
}

export function saveFeedback(input: unknown) {
  const result = validateFeedback(input);
  if (!result.ok) return result;
  return { ok: true as const, row: addFeedback(result.row) };
}
