import { handleWhopWebhook } from "@/lib/whop-webhook";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return handleWhopWebhook(request);
}
