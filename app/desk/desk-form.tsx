"use client";

import { useMemo, useState, type FormEvent } from "react";
import type { CatalogItem, CatalogSpec, ProductKind } from "@/lib/catalog";
import { DESK_CHECKOUT, DESK_CTA } from "@/lib/site";
import { CHECKOUT_HINT, SECRET_HINT, X402_HINT } from "./how-bots-pay";

const EMPTY_SPECS: CatalogSpec[] = Array.from({ length: 6 }, () => ({
  name: "",
  value: "",
}));

type DeskFormProps = {
  initialItems: CatalogItem[];
  paid?: boolean;
  showForm?: boolean;
};

export function DeskForm({ initialItems, paid = false, showForm = true }: DeskFormProps) {
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<ProductKind>("physical");
  const [checkout, setCheckout] = useState("");
  const [payTo, setPayTo] = useState("");
  const [network, setNetwork] = useState("");
  const [x402Price, setX402Price] = useState("");
  const [delivery, setDelivery] = useState("");
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
  const [locked, setLocked] = useState(false);
  const formOpen = showForm && !locked;

  const listedTitle = listed?.title;

  const onSpecChange = (index: number, key: keyof CatalogSpec, value: string) => {
    setSpecs((current) =>
      current.map((spec, i) => (i === index ? { ...spec, [key]: value } : spec)),
    );
  };

  const body = useMemo(
    () => ({
      title,
      kind,
      checkout,
      payTo,
      network,
      x402_price: x402Price,
      delivery,
      specs,
      inventory,
      return_days: returnDays,
      warranty,
      ships_from: shipsFrom,
      lead_time: leadTime,
    }),
    [title, kind, checkout, payTo, network, x402Price, delivery, specs, inventory, returnDays, warranty, shipsFrom, leadTime],
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
        next?: "desk" | "list";
      };
      if (!res.ok || !data.ok || !data.item) {
        setReason(data.reason || "The listing was not complete. Fix it and try again.");
        return;
      }
      setListed(data.item);
      if (data.next === "desk") setLocked(true);
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
      {formOpen ? (
      <section className="band">
        <p className="kicker">What you do next</p>
        <h2>{paid ? "Put a product on the list." : "List your first product free."}</h2>
        <div className="prose">
          <ol>
            <li>Fill every field. Bots skip incomplete listings.</li>
            <li>Submit. The product goes on the public list.</li>
            <li>
              Bots can read it at <code>/api/catalog</code>. The bot pays at
              the checkout link or the x402 details you enter.
            </li>
          </ol>
        </div>
      </section>
      ) : null}

      {listed ? (
        <section className="ok" aria-live="polite">
          <p className="kicker">On the list</p>
          <h2>{listedTitle} is on the list.</h2>
          <p className="lede">
            Shopping bots can see it on the public product list. They pay at
            the listing’s checkout link or x402 details.
            {paid
              ? null
              : " That was your free listing. A desk is $49 once for 12 months if you want to list more."}
          </p>
          <div className="row">
            <a className="ghost" href="/api/catalog">
              See the public list
            </a>
            {paid ? null : (
              <a className="cta" href={DESK_CHECKOUT}>
                {DESK_CTA}
              </a>
            )}
          </div>
        </section>
      ) : null}

      {formOpen && reason ? (
        <p className="fail" role="alert">
          {reason}
        </p>
      ) : null}

      {formOpen ? (
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
          <legend>What kind of product?</legend>
          <div className="choices">
            <label>
              <input
                type="radio"
                name="kind"
                value="physical"
                checked={kind === "physical"}
                onChange={() => setKind("physical")}
              />
              A physical thing
            </label>
            <label>
              <input
                type="radio"
                name="kind"
                value="digital"
                checked={kind === "digital"}
                onChange={() => setKind("digital")}
              />
              A digital thing
            </label>
          </div>
        </fieldset>

        <fieldset className="field">
          <legend>How the bot pays</legend>
          <span className="hint">
            {CHECKOUT_HINT} {X402_HINT} {SECRET_HINT} Need a checkout URL
            and/or the x402 fields.
          </span>
          <label htmlFor="checkout">Checkout link</label>
          <input
            id="checkout"
            name="checkout"
            type="url"
            inputMode="url"
            placeholder="https://"
            value={checkout}
            onChange={(e) => setCheckout(e.target.value)}
            autoComplete="off"
          />
          <span className="hint">{CHECKOUT_HINT}</span>
          <label htmlFor="payTo">x402 wallet address</label>
          <input
            id="payTo"
            name="payTo"
            value={payTo}
            onChange={(e) => setPayTo(e.target.value)}
            autoComplete="off"
          />
          <span className="hint">
            Public USDC receive address only. That address is the only
            credential.
          </span>
          <label htmlFor="network">x402 network</label>
          <select
            id="network"
            name="network"
            value={network}
            onChange={(e) => setNetwork(e.target.value)}
          >
            <option value="">Choose if you use x402</option>
            <option value="base">Base</option>
            <option value="solana">Solana</option>
          </select>
          <label htmlFor="x402_price">x402 price in US dollars</label>
          <input
            id="x402_price"
            name="x402_price"
            value={x402Price}
            onChange={(e) => setX402Price(e.target.value)}
            autoComplete="off"
          />
          <span className="hint">
            USDC on the network you picked. Public details only. {SECRET_HINT}
          </span>
        </fieldset>

        {kind === "digital" ? (
          <div className="field">
            <label htmlFor="delivery">How does the buyer get it?</label>
            <input
              id="delivery"
              name="delivery"
              value={delivery}
              onChange={(e) => setDelivery(e.target.value)}
              autoComplete="off"
            />
            <span className="hint">Account access, download, email, or login.</span>
          </div>
        ) : null}

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
            value={inventory}
            onChange={(e) => setInventory(e.target.value)}
            autoComplete="off"
          />
          <span className="hint">
            {kind === "digital"
              ? "A number, or unlimited."
              : "How many you can ship. Zero does not count."}
          </span>
        </div>

        <div className="field">
          <label htmlFor="return_days">
            {kind === "digital"
              ? "How many days can they get a refund?"
              : "How many days can they return it?"}
          </label>
          <input
            id="return_days"
            name="return_days"
            inputMode="numeric"
            value={returnDays}
            onChange={(e) => setReturnDays(e.target.value)}
            autoComplete="off"
          />
          <span className="hint">
            {kind === "digital"
              ? "Use 0 if you do not give refunds."
              : "Use 0 if you do not take returns."}
          </span>
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
          <span className="hint">
            {kind === "digital"
              ? "If there is none, write none. If access lasts 12 months, write that."
              : "If there is none, write none."}
          </span>
        </div>

        {kind === "physical" ? (
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
        ) : null}

        <div className="field">
          <label htmlFor="lead_time">
            {kind === "digital" ? "How long until they get it?" : "How long until it ships?"}
          </label>
          <input
            id="lead_time"
            name="lead_time"
            value={leadTime}
            onChange={(e) => setLeadTime(e.target.value)}
            autoComplete="off"
          />
          <span className="hint">
            {kind === "digital" ? "Instant is allowed." : "Example: 48 hours or 2 days."}
          </span>
        </div>

        <div className="row">
          <button className="cta" type="submit" disabled={busy}>
            {busy ? "Listing…" : "Put it on the list"}
          </button>
        </div>
      </form>
      ) : null}

      <section className="band">
        <p className="kicker">What’s on the list</p>
        <h2>Public product list.</h2>
        {items.length === 0 ? (
          <p className="lede">Nothing on the list yet. Empty is honest.</p>
        ) : (
          <ul className="catalog">
            {items.map((item) => (
              <li key={item.sku}>
                <strong>
                  <a href={`/l/${item.sku}`}>{item.title}</a>
                </strong>
                <span>
                  {item.kind === "digital"
                    ? `${item.unlimited ? "unlimited" : item.inventory} · ${item.delivery || "digital"}`
                    : `${item.inventory} in stock${item.ships_from ? ` · ships from ${item.ships_from}` : ""}`}
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
