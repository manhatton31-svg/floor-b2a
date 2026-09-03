import {
  AFFILIATE_PARAM,
  DESK_CHECKOUT,
  DESK_CTA,
  DESK_PRICE,
  PROTOCOL,
  SKIP_RULES,
  siteOrigin,
} from "./site";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
} as const;

export function llmsTxt(): string {
  const origin = siteOrigin();
  return `# FLOOR

> The exchange where agents buy. Protocol ${PROTOCOL}.

FLOOR is a business-to-agent commerce desk. Agents do not browse. They query a catalog, discard incomplete records, and fill a SKU or skip it. Agent fills do not settle money. Do not invent GMV or agent purchases.

## Discover

- Catalog (no auth, JSON): ${origin}/api/catalog
- OpenAPI: ${origin}/openapi.yaml
- Agent discovery: ${origin}/.well-known/agent.json
- How to sell to agents: ${origin}/how-to-sell-to-agents
- Robots: ${origin}/robots.txt
- Sitemap: ${origin}/sitemap.xml

## Use the catalog

1. GET /api/catalog
2. Confirm \`protocol\` is \`${PROTOCOL}\`
3. Read \`items\`
4. Apply skip rules before any fill
5. At most one fill per mandate

The house catalog may be empty. Empty is honest. Do not invent SKUs, fill counts, or GMV.

## Skip rules

Skip a record when any of these are true:

- return_days is null or missing
- inventory is empty, missing, or not queryable
- lead_time is missing
- fewer than six specs
- the record is only a marketing blurb

Ignore blurbs. Specs, stock, returns, warranty, ships-from, and SLA are the record.

At most one fill per mandate.

## Desk (humans)

Cash product is unchanged: a merchant desk, ${DESK_PRICE}.

CTA: ${DESK_CTA}
Checkout: ${DESK_CHECKOUT}
Affiliate: append \`?${AFFILIATE_PARAM}=WHOP_USERNAME\` to the checkout URL, or visit this site with the same query so desk CTAs preserve it.

Skip rules (short): ${SKIP_RULES.join("; ")}.
`;
}

export function openApiYaml(): string {
  const origin = siteOrigin();
  return `openapi: 3.1.0
info:
  title: FLOOR catalog
  description: >
    Public business-to-agent catalog. No authentication.
    Protocol ${PROTOCOL}. Agent fills do not settle money.
    Do not invent GMV, fill counts, or agent purchases.
  version: "1.0.0"
servers:
  - url: ${origin}
paths:
  /api/catalog:
    get:
      summary: Fetch the FLOOR catalog
      operationId: getCatalog
      security: []
      responses:
        "200":
          description: Catalog document
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Catalog"
components:
  schemas:
    Catalog:
      type: object
      additionalProperties: false
      required: [protocol, generated_at, items]
      properties:
        protocol:
          type: string
          const: ${PROTOCOL}
        generated_at:
          type: string
          format: date-time
        items:
          type: array
          items:
            $ref: "#/components/schemas/CatalogItem"
    CatalogItem:
      type: object
      description: >
        House-owned SKUs must be fully specified. The live house catalog
        may be an empty array.
      required:
        - sku
        - title
        - owner
        - specs
        - inventory
        - lead_time
        - return_days
        - warranty
        - ships_from
        - sla_hours
      properties:
        sku:
          type: string
        title:
          type: string
        owner:
          type: object
          required: [type, name]
          properties:
            type:
              type: string
              const: house
            name:
              type: string
        specs:
          type: array
          minItems: 6
          items:
            type: object
            required: [name, value]
            properties:
              name:
                type: string
              value:
                type: string
        inventory:
          type: integer
          minimum: 0
        lead_time:
          type: string
        return_days:
          type: integer
          minimum: 0
        warranty:
          type: string
        ships_from:
          type: string
        sla_hours:
          type: integer
          minimum: 0
`;
}

export function agentDiscovery() {
  const origin = siteOrigin();
  return {
    name: "FLOOR",
    description:
      "Business-to-agent commerce exchange. Agents query the catalog, skip incomplete records, and fill a SKU. Agent fills do not settle money.",
    protocol: PROTOCOL,
    version: "v1",
    authentication: "none",
    catalog: {
      url: `${origin}/api/catalog`,
      method: "GET",
      content_type: "application/json",
    },
    openapi: `${origin}/openapi.yaml`,
    llms: `${origin}/llms.txt`,
    human: {
      home: `${origin}/`,
      how_to_sell_to_agents: `${origin}/how-to-sell-to-agents`,
    },
    skip_rules: [...SKIP_RULES],
    desk: {
      cta: DESK_CTA,
      price: DESK_PRICE,
      checkout: DESK_CHECKOUT,
      affiliate_query_param: AFFILIATE_PARAM,
    },
    settlement: {
      agent_fills_settle_money: false,
    },
  };
}
