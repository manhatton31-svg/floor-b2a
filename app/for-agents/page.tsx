import type { Metadata } from "next";
import { affiliateFromUnknown, deskCheckoutUrl } from "@/lib/site";
import { Funnel } from "../components/funnel";
import { AgentListDocs } from "./agent-list-docs";

export const metadata: Metadata = {
  title: "FLOOR desk — $49 once for 12 months",
  description:
    "List products for shopping bots. $49 once for 12 months. Not forever.",
};

type PageProps = {
  searchParams: Promise<{ a?: string | string[] }>;
};

export default async function ForAgentsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const checkout = deskCheckoutUrl(affiliateFromUnknown(params.a));

  return (
    <Funnel
      checkout={checkout}
      eyebrow="How to list for shopping bots"
      heading="Put real facts on the list."
    >
      <AgentListDocs />
    </Funnel>
  );
}
