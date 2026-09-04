const FOOTER_LINKS = [
  ["/", "Home"],
  ["/desk", "Desk"],
  ["/thanks", "Thanks"],
  ["/feedback", "Feedback"],
  ["/for-agents", "How to list"],
  ["/listings", "Listings"],
  ["/tape", "Tape"],
  ["/llms.txt", "llms.txt"],
  ["/openapi.yaml", "OpenAPI"],
  ["/.well-known/agent.json", "agent.json"],
  ["/.well-known/x402", "x402"],
  ["/api/catalog", "Catalog"],
] as const;

export function SiteFooter() {
  return (
    <footer>
      FLOOR · seller accounts for shopping bots
      {FOOTER_LINKS.map(([href, label]) => (
        <span key={href}>
          <span>·</span>
          <a href={href}>{label}</a>
        </span>
      ))}
    </footer>
  );
}
