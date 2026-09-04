export const FEEDBACK_TRIED = ["list", "buy", "desk"] as const;
export type FeedbackTried = (typeof FEEDBACK_TRIED)[number];

export type FeedbackRow = {
  id: string;
  at: string;
  email?: string;
  message: string;
  tried: FeedbackTried;
};

export type FeedbackFail = { ok: false; reason: string; field: string; skip: string[] };
export type FeedbackOk = { ok: true; row: Omit<FeedbackRow, "id" | "at"> };

function asText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function validateFeedback(input: unknown): FeedbackOk | FeedbackFail {
  const body = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const message = asText(body.message);
  if (message.length < 3) {
    return {
      ok: false,
      reason: "Write what happened. A short message is enough.",
      field: "message",
      skip: ["no message"],
    };
  }
  if (message.length > 4000) {
    return {
      ok: false,
      reason: "Keep the message under 4000 characters.",
      field: "message",
      skip: ["long message"],
    };
  }

  const triedRaw = asText(body.tried).toLowerCase();
  if (!FEEDBACK_TRIED.includes(triedRaw as FeedbackTried)) {
    return {
      ok: false,
      reason: "Say what you tried: list, buy, or desk.",
      field: "tried",
      skip: ["no tried"],
    };
  }

  const email = asText(body.email);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return {
      ok: false,
      reason: "If you leave an email, it has to look like an email.",
      field: "email",
      skip: ["bad email"],
    };
  }

  const row: Omit<FeedbackRow, "id" | "at"> = {
    message,
    tried: triedRaw as FeedbackTried,
  };
  if (email) row.email = email;
  return { ok: true, row };
}
