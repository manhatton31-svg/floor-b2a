export const dynamic = "force-static";

const BADGE = `<svg xmlns="http://www.w3.org/2000/svg" width="280" height="48" viewBox="0 0 280 48" role="img" aria-label="FLOOR seller account">
  <rect width="280" height="48" fill="#09090b"/>
  <rect x="0.5" y="0.5" width="279" height="47" fill="none" stroke="#2a2a2e"/>
  <text x="16" y="30" fill="#f2f1ee" font-family="Georgia, serif" font-size="15">FLOOR · shopping bots</text>
</svg>
`;

export function GET() {
  return new Response(BADGE, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
