import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ desk_token?: string | string[]; token?: string | string[] }>;
};

function first(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return (raw || "").trim();
}

export default async function WelcomePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const token = first(params.desk_token) || first(params.token);
  redirect(token ? `/thanks?desk_token=${encodeURIComponent(token)}` : "/thanks");
}
