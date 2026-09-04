import { redirectTo } from "@/lib/redirect";

export const dynamic = "force-dynamic";

/** Old human checkbox. It is not proof of payment and does not set a paid cookie. */
export function POST(request: Request) {
  return redirectTo(request, "/thanks");
}

export function GET(request: Request) {
  return redirectTo(request, "/thanks");
}
