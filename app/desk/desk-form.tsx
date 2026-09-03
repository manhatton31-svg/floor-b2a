"use client";

import { useMemo, useState, type FormEvent } from "react";
import type { CatalogItem, CatalogSpec } from "@/lib/catalog";

const EMPTY_SPECS: CatalogSpec[] = Array.from({ length: 6 }, () => ({
  name: "",
  value: "",
}));

type DeskFormProps = {
  initialItems: CatalogItem[];
};

export function DeskForm({ initialItems }: DeskFormProps) {
  const [title, setTitle] = useState("");
  const [specs, setSpecs] = useState<CatalogSpec[]>(EMPTY_SPECS);
  const [inventory, setInventory] = useState("");
  const [returnDays, setReturnDays] = useState("");
  const [warranty, setWarranty] = useState("");
  const [shipsFrom, setShipsFrom] = useState("");
  const [leadTime, setLeadTime] = useState("");
  const [reason, setReason] = useState("");
  const [listed, setListed] = useState<CatalogItem | null>(null);
  const [items, setItems] = useState<CatalogItem[]>(initialItems);
  const [busy, setBusy] = useState(false);

  const listedTitle = listed?.title;

  const onSpecChange = (index: number, key: keyof CatalogSpec, value: string) => {
    setSpecs((current) =>
      current.map((spec, i) => (i === index ? { ...spec, [key]: value } : spec)),
    );
  };

  const body = useMemo(
    () => ({
      title,
      specs,
      inventory,
      return_days: returnDays,
      warranty,
      ships_from: shipsFrom,
      lead_time: leadTime,
    }),
    [title, specs, inventory, returnDays, warranty, shipsFrom, leadTime],
  );

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setReason("");
    setListed(null);
    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        reason?: string;
        item?: CatalogItem;
      };
      if (!res.ok || !data.ok || !data.item) {
        setReason(data.reason || "The listing was not complete. Fix it and try again.");
        return;
      }
      setListed(data.item);
      const catalog = await fetch("/api/catalog", { cache: "no-store" });
      const next = (await catalog.json()) as { items?: CatalogItem[] };
      if (Array.isArray(next.items)) setItems(next.items);
    } catch {
      setReason("Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <section className="band">
        <p className="kicker">What you do next</p>
        <h2>Put one product on the list.</h2>
        <div className="prose">
          <ol>
            <li>Fill every field. Bots skip incomplete listings.</li>
            <li>Submit. The product goes on the public list.</li>
            <li>
              Bots can read it at <code>/api/catalog</code>. A bot buy does not
              take money yet.
            </li>
          </ol>
        </div>
      </section>

      {listed ? (
        <section className="ok" aria-live="polite">
          <p className="kicker">On the list</p>
          <h2>{listedTitle} is on the list.</h2>
          <p className="lede">
            Shopping bots can see it on the public product list. A bot buy does
            not take money yet. Money has not moved.
          </p>
          <div className="row">
            <a className="ghost" href="/api/catalog">
              See the public list
            </a>
          </div>
        </section>
      ) : null}

      {reason ? (
        <p className="fail" role="alert">
          {reason}
        </p>
      ) : null}

      <form className="band" onSubmit={onSubmit}>
        <p className="kicker">One product</p>
        <h2>Product facts.</h2>
        <p className="lede">
          Use real facts. Sales talk gets skipped. Do not make up a product
          code. Do not claim money moved.
        </p>

        <div className="field">
          <label htmlFor="title">Product name</label>
          <input
            id="title"
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoComplete="off"
          />
        </div>

        <fieldset className="field">
          <legend>Six real specs</legend>
          <span className="hint">
            Facts like size, material, color, weight, voltage, and capacity.
            Not “premium” or “perfect.”
          </span>
          {specs.map((spec, index) => (
            <div className="spec-row" key={index}>
              <label className="sr-only" htmlFor={`spec-name-${index}`}>
                Spec {index + 1} name
              </label>
              <input
                id={`spec-name-${index}`}
                placeholder={`Fact ${index + 1} name`}
                value={spec.name}
                onChange={(e) => onSpecChange(index, "name", e.target.value)}
                autoComplete="off"
              />
              <label className="sr-only" htmlFor={`spec-value-${index}`}>
                Spec {index + 1} value
              </label>
              <input
                id={`spec-value-${index}`}
                placeholder="The fact"
                value={spec.value}
                onChange={(e) => onSpecChange(index, "value", e.target.value)}
                autoComplete="off"
              />
            </div>
          ))}
        </fieldset>

        <div className="field">
          <label htmlFor="inventory">How many do you have?</label>
          <input
            id="inventory"
            name="inventory"
            inputMode="numeric"
            value={inventory}
            onChange={(e) => setInventory(e.target.value)}
            autoComplete="off"
          />
        </div>

        <div className="field">
          <label htmlFor="return_days">How many days can they return it?</label>
          <input
            id="return_days"
            name="return_days"
            inputMode="numeric"
            value={returnDays}
            onChange={(e) => setReturnDays(e.target.value)}
            autoComplete="off"
          />
          <span className="hint">Use 0 if you do not take returns.</span>
        </div>

        <div className="field">
          <label htmlFor="warranty">Warranty</label>
          <input
            id="warranty"
            name="warranty"
            value={warranty}
            onChange={(e) => setWarranty(e.target.value)}
            autoComplete="off"
          />
          <span className="hint">If there is none, write none.</span>
        </div>

        <div className="field">
          <label htmlFor="ships_from">Where does it ship from?</label>
          <input
            id="ships_from"
            name="ships_from"
            value={shipsFrom}
            onChange={(e) => setShipsFrom(e.target.value)}
            autoComplete="off"
          />
        </div>

        <div className="field">
          <label htmlFor="lead_time">How long until it ships?</label>
          <input
            id="lead_time"
            name="lead_time"
            value={leadTime}
            onChange={(e) => setLeadTime(e.target.value)}
            autoComplete="off"
          />
          <span className="hint">Example: 48 hours or 2 days.</span>
        </div>

        <div className="row">
          <button className="cta" type="submit" disabled={busy}>
            {busy ? "Listing…" : "Put it on the list"}
          </button>
        </div>
      </form>

      <section className="band">
        <p className="kicker">What’s on the list</p>
        <h2>Public product list.</h2>
        {items.length === 0 ? (
          <p className="lede">Nothing on the list yet. Empty is honest.</p>
        ) : (
          <ul className="catalog">
            {items.map((item) => (
              <li key={item.sku}>
                <strong>{item.title}</strong>
                <span>
                  {item.inventory} in stock · ships from {item.ships_from}
                </span>
              </li>
            ))}
          </ul>
        )}
        <div className="row">
          <a className="ghost" href="/api/catalog">
            See the public list
          </a>
        </div>
      </section>
    </>
  );
}
