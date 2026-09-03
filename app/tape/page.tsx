import type { Metadata } from "next";
import { DIRECTORY_SUBMISSIONS } from "@/lib/directories";
import { listCatalogVisits } from "@/lib/tape-store";
import { SiteFooter } from "../components/site-footer";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "FLOOR tape — directories and catalog visitors",
  description:
    "Directories we submitted, and who requested the public product list. No invented bots.",
};

function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toISOString().replace("T", " ").replace(/\.\d{3}Z$/, " UTC");
}

export default function TapePage() {
  const visits = listCatalogVisits().slice().reverse();

  return (
    <main className="wrap">
      <p className="kicker">Public tape</p>
      <h1>Who hit the list.</h1>
      <p className="lede">
        Directories we submitted, and real requests to the public product list.
        We do not invent bot names. We do not show IP addresses.
      </p>

      <section className="band">
        <p className="kicker">Directories</p>
        <h2>Where we sent the list.</h2>
        {DIRECTORY_SUBMISSIONS.length === 0 ? (
          <p className="lede">
            None yet. Empty is honest. Demand can add a row when a directory is
            actually submitted.
          </p>
        ) : (
          <ul className="catalog">
            {DIRECTORY_SUBMISSIONS.map((row) => (
              <li key={`${row.name}-${row.url}`}>
                <strong>
                  <a href={row.url}>{row.name}</a>
                </strong>
                <span>{row.note}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="band">
        <p className="kicker">Catalog visitors</p>
        <h2>GET /api/catalog</h2>
        <p className="lede">
          User agent, path, and time. Newest first. Last 200 requests.
        </p>
        {visits.length === 0 ? (
          <p className="lede">No catalog visits logged yet.</p>
        ) : (
          <ul className="catalog">
            {visits.map((visit, index) => (
              <li key={`${visit.at}-${index}`}>
                <strong>{visit.user_agent}</strong>
                <span>
                  {visit.path} · {formatTime(visit.at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <SiteFooter />
    </main>
  );
}
