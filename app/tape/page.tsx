import type { Metadata } from "next";
import { DIRECTORY_SUBMISSIONS } from "@/lib/directories";
import { classifyHouseUa, listCatalogVisits, type CatalogVisit } from "@/lib/tape-store";
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

function VisitRow({ visit, house }: { visit: CatalogVisit; house: boolean }) {
  const status = visit.status === undefined ? "status unlogged" : `status ${visit.status}`;
  return (
    <>
      <strong>
        {visit.user_agent}
        {house ? <em className="ua-tag">House</em> : null}
      </strong>
      <span>
        {visit.path} · {formatTime(visit.at)} · {status}
      </span>
    </>
  );
}

export default function TapePage() {
  const visits = listCatalogVisits().slice().reverse();
  const visitors = visits.filter((visit) => !classifyHouseUa(visit.user_agent));
  const house = visits.filter((visit) => classifyHouseUa(visit.user_agent));

  return (
    <main className="wrap">
      <p className="kicker">Public tape</p>
      <h1>Who hit the list.</h1>
      <p className="lede">
        Directories we submitted, and real requests to the public product list.
        We log User-Agent, time, path, and status. We do not invent bot names.
        We do not show IP addresses.
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
          Raw User-Agent, path, time, and status. Newest first. Last 200
          requests. House checks are listed separately so they are not mistaken
          for shopping bots.
        </p>
        {visitors.length === 0 ? (
          <p className="lede">No catalog visits logged yet.</p>
        ) : (
          <ul className="catalog">
            {visitors.map((visit, index) => (
              <li key={`${visit.at}-${index}`}>
                <VisitRow visit={visit} house={false} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="band">
        <p className="kicker">House</p>
        <h2>Our own checks</h2>
        <p className="lede">
          Tagged when the User-Agent is FLOOR-Watch, curl, FLOOR Demand, FLOOR
          Protocol, or FLOOR Sales. Same raw string. Not shopping bots.
        </p>
        {house.length === 0 ? (
          <p className="lede">No house checks logged yet.</p>
        ) : (
          <ul className="catalog">
            {house.map((visit, index) => (
              <li key={`${visit.at}-house-${index}`}>
                <VisitRow visit={visit} house />
              </li>
            ))}
          </ul>
        )}
      </section>

      <SiteFooter />
    </main>
  );
}
