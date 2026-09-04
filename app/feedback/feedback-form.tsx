"use client";

import { useState, type FormEvent } from "react";
import { FEEDBACK_TRIED, type FeedbackTried } from "@/lib/feedback";

export function FeedbackForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [tried, setTried] = useState<FeedbackTried>("desk");
  const [reason, setReason] = useState("");
  const [ok, setOk] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setReason("");
    setOk("");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, message, tried }),
      });
      const data = (await res.json()) as { ok?: boolean; reason?: string; id?: string };
      if (!res.ok || !data.ok) {
        setReason(data.reason || "The note was not saved. Try again.");
        return;
      }
      setOk("Saved. Thank you.");
      setMessage("");
    } catch {
      setReason("Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="band" onSubmit={onSubmit}>
      <p className="kicker">Write to FLOOR</p>
      <h2>What happened.</h2>
      <p className="lede">Email is optional. The message is required.</p>

      <fieldset className="field">
        <legend>What did you try?</legend>
        <div className="choices">
          {FEEDBACK_TRIED.map((value) => (
            <label key={value}>
              <input
                type="radio"
                name="tried"
                value={value}
                checked={tried === value}
                onChange={() => setTried(value)}
              />
              {value === "list" ? "List a product" : value === "buy" ? "Buy" : "The desk"}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="field">
        <label htmlFor="email">Email (optional)</label>
        <input
          id="email"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
      </div>

      <div className="field">
        <label htmlFor="message">Message</label>
        <textarea
          id="message"
          name="message"
          rows={6}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
        />
      </div>

      {reason ? (
        <p className="fail" role="alert">
          {reason}
        </p>
      ) : null}
      {ok ? (
        <p className="lede" aria-live="polite">
          {ok}
        </p>
      ) : null}

      <div className="row">
        <button className="cta" type="submit" disabled={busy}>
          {busy ? "Sending…" : "Send"}
        </button>
      </div>
    </form>
  );
}
