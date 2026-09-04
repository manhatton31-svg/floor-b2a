import assert from "node:assert/strict";
import test from "node:test";
import { validateFeedback } from "./feedback.ts";

test("feedback needs a message and what they tried", () => {
  const missing = validateFeedback({ tried: "desk" });
  assert.equal(missing.ok, false);
  if (missing.ok) return;
  assert.equal(missing.field, "message");

  const tried = validateFeedback({ message: "The list failed.", tried: "other" });
  assert.equal(tried.ok, false);
  if (tried.ok) return;
  assert.equal(tried.field, "tried");

  const ok = validateFeedback({
    message: "Second listing returned 402.",
    tried: "list",
    email: "ada@example.com",
  });
  assert.equal(ok.ok, true);
  if (!ok.ok) return;
  assert.equal(ok.row.tried, "list");
  assert.equal(ok.row.email, "ada@example.com");
  assert.ok(!("gmv" in ok.row));
});
