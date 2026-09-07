import { affiliateFromUnknown, deskCheckoutUrl } from "@/lib/site";
import { Funnel } from "./components/funnel";

type PageProps = {
  searchParams: Promise<{ a?: string | string[] }>;
};

export default async function HomePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const checkout = deskCheckoutUrl(affiliateFromUnknown(params.a));

  return (
    <Funnel
      checkout={checkout}
      eyebrow="Seller accounts for shopping bots"
      heading="Sell to shopping bots."
    />
  );
}
