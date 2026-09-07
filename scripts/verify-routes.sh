#!/usr/bin/env bash
set -euo pipefail
BASE="${1:-http://127.0.0.1:3000}"
CTA="Open a desk · \$49 once · 12 months"
PAY="https://whop.com/checkout/plan_j7hRIj9BQowga"
SPECS='[{"name":"Capacity","value":"12 oz"},{"name":"Material","value":"ceramic"},{"name":"Color","value":"navy"},{"name":"Weight","value":"380 g"},{"name":"Dishwasher","value":"yes"},{"name":"Microwave","value":"safe"}]'
DIGITAL_SPECS='[{"name":"Format","value":"JPEG"},{"name":"Count","value":"24 photos"},{"name":"Resolution","value":"4000 px"},{"name":"Color","value":"sRGB"},{"name":"License","value":"one buyer"},{"name":"Size","value":"120 MB"}]'

echo "== CORS OPTIONS on catalog / listings / buy =="
for path in /api/catalog /api/listings /api/buy /api/desk/unlock; do
  curl -sS -D "/tmp/floor-cors-${path##*/}.hdr" -o /dev/null -X OPTIONS "$BASE$path"
  grep -i '^access-control-allow-origin: \*' "/tmp/floor-cors-${path##*/}.hdr"
  grep -i '^access-control-allow-methods:.*GET' "/tmp/floor-cors-${path##*/}.hdr"
  grep -i '^access-control-allow-methods:.*POST' "/tmp/floor-cors-${path##*/}.hdr"
done

echo "== GET /api/catalog =="
curl -sS -D /tmp/floor-catalog.hdr -o /tmp/floor-catalog.json -A "verify-routes-catalog" "$BASE/api/catalog"
grep -i '^content-type: application/json' /tmp/floor-catalog.hdr
grep -i '^access-control-allow-origin: \*' /tmp/floor-catalog.hdr
python3 - <<'PY'
import json
from pathlib import Path
body = json.loads(Path("/tmp/floor-catalog.json").read_text())
assert body["protocol"] == "floor.b2a/v1", body
assert body["settlement"] == "not_settled", body
assert isinstance(body["items"], list), body
assert "gmv" not in body
desk = next(item for item in body["items"] if item["title"] == "FLOOR desk")
assert desk["kind"] == "digital"
assert desk["payment"]["checkout_url"] == "https://whop.com/checkout/plan_j7hRIj9BQowga"
accepts = desk["payment"]["accepts"]
assert len(accepts) == 2
base = next(row for row in accepts if row["network"] == "base")
sol = next(row for row in accepts if row["network"] == "solana")
assert base["scheme"] == "exact"
assert base["payTo"] == "0x0Cd76DDBCF3c249a6437FAA09a2D61E208d86f10"
assert base["asset"] == "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
assert base["maxAmountRequired"] == "49000000"
assert sol["scheme"] == "exact"
assert sol["payTo"] == "D6Spkkf3oVJBfnTojWKGXZd3TBYpvF4HFe2CihrX9AGL"
assert sol["asset"] == "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
assert sol["maxAmountRequired"] == "49000000"
assert "payTo" not in desk
assert len(desk["specs"]) >= 6
print(json.dumps(body, indent=2))
PY

echo "== GET /l/floor-desk =="
code=$(curl -sS -o /tmp/floor-l-desk.html -w "%{http_code}" "$BASE/l/floor-desk")
test "$code" = "200"
grep -q "FLOOR desk" /tmp/floor-l-desk.html
grep -q "0x0Cd76DDBCF3c249a6437FAA09a2D61E208d86f10" /tmp/floor-l-desk.html
grep -q "D6Spkkf3oVJBfnTojWKGXZd3TBYpvF4HFe2CihrX9AGL" /tmp/floor-l-desk.html
grep -q "$PAY" /tmp/floor-l-desk.html
grep -q 'id="floor-item"' /tmp/floor-l-desk.html
grep -q '"sku":"floor-desk"' /tmp/floor-l-desk.html
! grep -qiE "lifetime|gmv" /tmp/floor-l-desk.html

echo "== GET /l/unknown-sku is 404 =="
code=$(curl -sS -o /tmp/floor-l-missing.html -w "%{http_code}" "$BASE/l/not-a-real-sku")
test "$code" = "404"
grep -q "Not on the list" /tmp/floor-l-missing.html

echo "== GET /listings =="
code=$(curl -sS -o /tmp/floor-listings.html -w "%{http_code}" "$BASE/listings")
test "$code" = "200"
grep -q "FLOOR desk" /tmp/floor-listings.html
grep -q 'href="/l/floor-desk"' /tmp/floor-listings.html
grep -q "GET /api/catalog" /tmp/floor-listings.html
! grep -qiE "popular|lifetime|gmv" /tmp/floor-listings.html

echo "== GET /llms.txt starts with three curls =="
curl -sS -o /tmp/floor-llms.txt -w "status:%{http_code}\n" "$BASE/llms.txt"
python3 - <<PY
from pathlib import Path
lines = [line for line in Path("/tmp/floor-llms.txt").read_text().splitlines() if line.strip()]
assert lines[0].startswith("curl -sS -X POST ") and "/api/listings" in lines[0], lines[0]
assert lines[1].startswith("curl -sS -X POST ") and "/api/buy" in lines[1] and "floor-desk" in lines[1], lines[1]
assert lines[2].startswith("curl -sS -X POST ") and "/api/listings" in lines[2], lines[2]
PY
grep -q "$CTA" /tmp/floor-llms.txt
grep -q "GET /api/catalog" /tmp/floor-llms.txt
grep -q "/l/{sku}" /tmp/floor-llms.txt
grep -q "/listings" /tmp/floor-llms.txt
grep -q "POST" /tmp/floor-llms.txt
grep -q "/api/listings" /tmp/floor-llms.txt
grep -q "/api/buy" /tmp/floor-llms.txt
grep -q "0x0Cd76DDBCF3c249a6437FAA09a2D61E208d86f10" /tmp/floor-llms.txt
grep -q "D6Spkkf3oVJBfnTojWKGXZd3TBYpvF4HFe2CihrX9AGL" /tmp/floor-llms.txt
grep -q "/desk" /tmp/floor-llms.txt
grep -q "/thanks" /tmp/floor-llms.txt
grep -q "/api/feedback" /tmp/floor-llms.txt
grep -q "/api/desk/ack" /tmp/floor-llms.txt
grep -q "/api/desk/unlock" /tmp/floor-llms.txt
grep -q "/api/webhooks/whop" /tmp/floor-llms.txt
grep -q "/.well-known/x402" /tmp/floor-llms.txt
! grep -q FLOORQA /tmp/floor-llms.txt
! grep -q "?a=WHOP_USERNAME" /tmp/floor-llms.txt
! grep -qi "money does not move" /tmp/floor-llms.txt
! grep -qiE "lifetime|gmv" /tmp/floor-llms.txt

echo "== GET /openapi.yaml =="
curl -sS -o /tmp/floor-openapi.yaml -w "status:%{http_code}\n" "$BASE/openapi.yaml"
grep -q "/api/catalog" /tmp/floor-openapi.yaml
grep -q "/api/listings" /tmp/floor-openapi.yaml
grep -q "/l/{sku}" /tmp/floor-openapi.yaml
grep -q "/listings" /tmp/floor-openapi.yaml
grep -q "/api/buy" /tmp/floor-openapi.yaml
grep -q "/api/feedback" /tmp/floor-openapi.yaml
grep -q "/api/desk/ack" /tmp/floor-openapi.yaml
grep -q "/api/desk/unlock" /tmp/floor-openapi.yaml
grep -q "/api/webhooks/whop" /tmp/floor-openapi.yaml
grep -q "/.well-known/x402" /tmp/floor-openapi.yaml
grep -q "checkout" /tmp/floor-openapi.yaml

echo "== GET /.well-known/agent.json =="
curl -sS -o /tmp/floor-agent.json -w "status:%{http_code}\n" "$BASE/.well-known/agent.json"
python3 - <<'PY'
import json
from pathlib import Path
body = json.loads(Path("/tmp/floor-agent.json").read_text())
assert body["protocol"] == "floor.b2a/v1"
assert body["settlement"] == "not_settled"
assert "/api/catalog" in body["catalog"]["url"]
assert "/api/listings" in body["listings"]["url"]
assert "POST" in body["listings"]["methods"]
assert "/api/buy" in body["buy"]["url"]
assert body["buy"]["settled"] is False
assert body["desk"]["checkout"] == "https://whop.com/checkout/plan_j7hRIj9BQowga"
assert body["desk"]["x402"][0]["payTo"] == "0x0Cd76DDBCF3c249a6437FAA09a2D61E208d86f10"
assert body["desk"]["x402"][1]["payTo"] == "D6Spkkf3oVJBfnTojWKGXZd3TBYpvF4HFe2CihrX9AGL"
assert "/desk" in body["human"]["desk"]
assert "/listings" in body["human"]["listings"]
assert "/l/{sku}" in body["human"]["listing"]
assert "/thanks" in body["human"]["thanks"]
assert "/feedback" in body["human"]["feedback"]
assert "/api/feedback" in body["feedback"]["url"]
assert "/api/desk/ack" in body["desk_ack"]["url"]
assert "/api/desk/unlock" in body["desk_unlock"]["url"]
assert "/api/webhooks/whop" in body["webhook"]["url"]
assert "gmv" not in body
assert "FLOORQA" not in json.dumps(body)
assert "/.well-known/x402" in body["x402"]
PY

echo "== GET /.well-known/x402 =="
curl -sS -D /tmp/floor-x402.hdr -o /tmp/floor-x402.json -w "status:%{http_code}\n" "$BASE/.well-known/x402"
grep -i '^content-type: application/json' /tmp/floor-x402.hdr
python3 - <<'PY'
import json
from pathlib import Path
body = json.loads(Path("/tmp/floor-x402.json").read_text())
assert body["x402Version"] == 2
assert body["kind"] == "resource-server"
assert body["settlement"] == "not_settled"
assert body["checkout"] == "https://whop.com/checkout/plan_j7hRIj9BQowga"
text = json.dumps(body).lower()
assert "facilitator" not in body
assert "bazaar" not in text
assert "/settle" not in text
assert "gmv" not in text
assert "lifetime" not in text
urls = {row["url"] for row in body["resources"]}
assert any(url.endswith("/pay/floor-desk") for url in urls)
assert any(url.endswith("/api/buy") for url in urls)
buy = next(row for row in body["resources"] if row["method"] == "POST")
assert buy["body"] == {"item_id": "floor-desk"}
pay = next(row for row in body["resources"] if row["method"] == "GET")
assert pay["accepts"] == buy["accepts"]
assert len(pay["accepts"]) == 2
assert {row["network"] for row in pay["accepts"]} == {"base", "solana"}
assert any(row["payTo"] == "0x0Cd76DDBCF3c249a6437FAA09a2D61E208d86f10" for row in pay["accepts"])
assert any(row["payTo"] == "D6Spkkf3oVJBfnTojWKGXZd3TBYpvF4HFe2CihrX9AGL" for row in pay["accepts"])
assert all(row["maxAmountRequired"] == "49000000" for row in pay["accepts"])
PY

echo "== GET /robots.txt =="
curl -sS -o /tmp/floor-robots.txt -w "status:%{http_code}\n" "$BASE/robots.txt"
grep -q "sitemap" /tmp/floor-robots.txt

echo "== GET /sitemap.xml =="
curl -sS -o /tmp/floor-sitemap.xml -w "status:%{http_code}\n" "$BASE/sitemap.xml"
grep -q "/api/catalog" /tmp/floor-sitemap.xml
grep -q "/api/listings</loc>" /tmp/floor-sitemap.xml
grep -q "/listings</loc>" /tmp/floor-sitemap.xml
grep -q "/l/floor-desk</loc>" /tmp/floor-sitemap.xml
grep -q "/for-agents" /tmp/floor-sitemap.xml
grep -q "/desk" /tmp/floor-sitemap.xml
grep -q "/thanks" /tmp/floor-sitemap.xml
grep -q "/api/desk/unlock" /tmp/floor-sitemap.xml
grep -q "/feedback" /tmp/floor-sitemap.xml
grep -q "/tape" /tmp/floor-sitemap.xml
grep -q "/badge.svg" /tmp/floor-sitemap.xml
grep -q "/.well-known/x402" /tmp/floor-sitemap.xml

echo "== GET /badge.svg =="
curl -sS -D /tmp/floor-badge.hdr -o /tmp/floor-badge.svg -w "status:%{http_code}\n" "$BASE/badge.svg"
grep -q "<svg" /tmp/floor-badge.svg

echo "== GET /for-agents =="
code=$(curl -sS -o /tmp/floor-for.html -w "%{http_code}" "$BASE/for-agents")
test "$code" = "200"
grep -q "$CTA" /tmp/floor-for.html
grep -q "How an agent lists" /tmp/floor-for.html
grep -q "POST /api/listings" /tmp/floor-for.html
grep -q "/l/" /tmp/floor-for.html
grep -q "/listings" /tmp/floor-for.html
grep -q "/api/desk/unlock" /tmp/floor-for.html
grep -q "0x0Cd76DDBCF3c249a6437FAA09a2D61E208d86f10" /tmp/floor-for.html
grep -q "D6Spkkf3oVJBfnTojWKGXZd3TBYpvF4HFe2CihrX9AGL" /tmp/floor-for.html
! grep -qiE "isn't human|Agents fill SKUs|keep the desk|keep the seat|lifetime|12-month access|FLOORQA|money does not move" /tmp/floor-for.html
! grep -qi gmv /tmp/floor-for.html

echo "== GET /how-to-sell-to-agents =="
code=$(curl -sS -o /tmp/floor-howto.html -w "%{http_code}" "$BASE/how-to-sell-to-agents")
test "$code" = "200"
grep -q "$CTA" /tmp/floor-howto.html

echo "== GET / =="
curl -sS -o /tmp/floor-home.html -w "status:%{http_code}\n" "$BASE/"
test "$(grep -o 'Open a desk · \$49 once · 12 months' /tmp/floor-home.html | wc -l)" -ge 3
! grep -qiE "isn't human|Agents fill SKUs|keep the desk|keep the seat|lifetime|12-month access|FLOORQA|money does not move" /tmp/floor-home.html
grep -q "$PAY" /tmp/floor-home.html
grep -q 'href="/desk"' /tmp/floor-home.html
grep -q 'href="/thanks"' /tmp/floor-home.html
grep -q 'href="/feedback"' /tmp/floor-home.html
grep -q 'href="/api/catalog"' /tmp/floor-home.html
grep -q "List your first product free" /tmp/floor-home.html
! grep -q "?a=WHOP_USERNAME" /tmp/floor-home.html

echo "== GET /desk =="
code=$(curl -sS -o /tmp/floor-desk.html -w "%{http_code}" "$BASE/desk")
test "$code" = "200"
grep -q "$CTA" /tmp/floor-desk.html
grep -q "List your first product free" /tmp/floor-desk.html
grep -q "$PAY" /tmp/floor-desk.html
grep -q 'href="/feedback"' /tmp/floor-desk.html
grep -q 'href="/for-agents"' /tmp/floor-desk.html
grep -q 'href="/api/catalog"' /tmp/floor-desk.html
grep -q "How the bot pays" /tmp/floor-desk.html
grep -q "How bots pay you" /tmp/floor-desk.html
grep -q "Stripe Payment Link" /tmp/floor-desk.html
grep -q "PayPal" /tmp/floor-desk.html
grep -q "Never enter a seed, private key, password, or Stripe sk_live" /tmp/floor-desk.html
grep -q "x402 wallet address" /tmp/floor-desk.html
grep -q "A digital thing" /tmp/floor-desk.html
! grep -qiE "isn't human|Agents fill SKUs|keep the desk|keep the seat|lifetime|12-month access|FLOORQA|merchant seat|money does not move" /tmp/floor-desk.html
! grep -qiE 'name="(seed|private_key|password|sk_live)"' /tmp/floor-desk.html
! grep -q "I paid \$49" /tmp/floor-desk.html

echo "== GET /thanks =="
code=$(curl -sS -o /tmp/floor-thanks.html -w "%{http_code}" "$BASE/thanks")
test "$code" = "200"
grep -q "You have 12 months" /tmp/floor-thanks.html
grep -q "12 months on Whop" /tmp/floor-thanks.html
grep -q "once access is active" /tmp/floor-thanks.html
grep -q "does not ask you to paste" /tmp/floor-thanks.html
grep -q "/desk" /tmp/floor-thanks.html
grep -q "/api/catalog" /tmp/floor-thanks.html
grep -q "/for-agents" /tmp/floor-thanks.html
grep -q "/feedback" /tmp/floor-thanks.html
grep -q "$PAY" /tmp/floor-thanks.html
grep -q "If you have not paid yet" /tmp/floor-thanks.html
grep -q "whop.com/floor-6c10/floor-b2a-desk" /tmp/floor-thanks.html
grep -q "floor-desk-ecru.vercel.app/thanks" /tmp/floor-thanks.html
! grep -qiE 'name="(payment_id|membership_id|receipt_id)"' /tmp/floor-thanks.html
! grep -qiE "lifetime|FLOORQA|gmv" /tmp/floor-thanks.html
! grep -qiE "money does not move|keep forever" /tmp/floor-thanks.html

echo "== GET /feedback =="
code=$(curl -sS -o /tmp/floor-feedback.html -w "%{http_code}" "$BASE/feedback")
test "$code" = "200"
grep -q "What did you try" /tmp/floor-feedback.html
grep -q 'name="message"' /tmp/floor-feedback.html
grep -q 'name="email"' /tmp/floor-feedback.html
grep -q 'name="tried"' /tmp/floor-feedback.html
! grep -qiE "lifetime|FLOORQA|gmv" /tmp/floor-feedback.html

echo "== POST /api/feedback =="
code=$(curl -sS -o /tmp/floor-feedback.json -w "%{http_code}" \
  -H "Content-Type: application/json" \
  -d '{"tried":"desk","message":"Second listing returned 402.","email":"ada@example.com"}' \
  "$BASE/api/feedback")
test "$code" = "201"
python3 - <<'PY'
import json
from pathlib import Path
body = json.loads(Path("/tmp/floor-feedback.json").read_text())
assert body["ok"] is True
assert body["tried"] == "desk"
assert body.get("id")
assert "gmv" not in body
PY

echo "== house User-Agents are tagged, not named as shopping bots =="
curl -sS -A "FLOOR-Watch" -o /dev/null "$BASE/api/catalog"
curl -sS -A "FLOOR Demand" -o /dev/null "$BASE/api/catalog"
curl -sS -A "FLOOR-Protocol" -o /dev/null "$BASE/api/catalog"
curl -sS -A "FLOOR Sales" -o /dev/null "$BASE/api/catalog"

echo "== GET /tape =="
code=$(curl -sS -o /tmp/floor-tape.html -w "%{http_code}" "$BASE/tape")
test "$code" = "200"
grep -q "Catalog visitors" /tmp/floor-tape.html
grep -q "verify-routes-catalog" /tmp/floor-tape.html
grep -q "status 200" /tmp/floor-tape.html
grep -q "FLOOR-Watch" /tmp/floor-tape.html
grep -q "FLOOR Demand" /tmp/floor-tape.html
grep -q "FLOOR-Protocol" /tmp/floor-tape.html
grep -q "FLOOR Sales" /tmp/floor-tape.html
grep -q "Our own checks" /tmp/floor-tape.html
! grep -qiE "FLOORQA|lifetime|money does not move" /tmp/floor-tape.html
grep -q "Grok Agent Store" /tmp/floor-tape.html
grep -q "LLMS Central" /tmp/floor-tape.html
grep -q "Zearches Software" /tmp/floor-tape.html
grep -q "llmstxt.info" /tmp/floor-tape.html
grep -q "search=floor-desk-ecru.vercel.app" /tmp/floor-tape.html
! grep -qi MeshKore /tmp/floor-tape.html

echo "== GET /directories =="
code=$(curl -sS -o /tmp/floor-dirs.html -w "%{http_code}" "$BASE/directories")
test "$code" = "200"
grep -q "llmstxt.info" /tmp/floor-dirs.html
grep -q "search=floor-desk-ecru.vercel.app" /tmp/floor-dirs.html
! grep -qi MeshKore /tmp/floor-dirs.html

echo "== GET /pay/floor-desk =="
code=$(curl -sS -D /tmp/floor-pay.hdr -o /tmp/floor-pay.json -w "%{http_code}" "$BASE/pay/floor-desk")
test "$code" = "402"
grep -qi 'PAYMENT-REQUIRED' /tmp/floor-pay.hdr
python3 - <<'PY'
import json
from pathlib import Path
body = json.loads(Path("/tmp/floor-pay.json").read_text())
assert body["x402Version"] == 1
assert body["checkout_url"] == "https://whop.com/checkout/plan_j7hRIj9BQowga"
assert body["settlement"] == "not_settled"
accepts = body["accepts"]
assert len(accepts) == 2
base = next(row for row in accepts if row["network"] == "base")
sol = next(row for row in accepts if row["network"] == "solana")
assert base["payTo"] == "0x0Cd76DDBCF3c249a6437FAA09a2D61E208d86f10"
assert base["asset"] == "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
assert base["maxAmountRequired"] == "49000000"
assert sol["payTo"] == "D6Spkkf3oVJBfnTojWKGXZd3TBYpvF4HFe2CihrX9AGL"
assert sol["asset"] == "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
assert sol["maxAmountRequired"] == "49000000"
PY

echo "== POST /api/buy house desk is unpaid 402 =="
code=$(curl -sS -D /tmp/floor-buy.hdr -o /tmp/floor-buy.json -w "%{http_code}" \
  -H "Content-Type: application/json" \
  -d '{"item_id":"floor-desk"}' \
  "$BASE/api/buy")
test "$code" = "402"
grep -qi 'PAYMENT-REQUIRED' /tmp/floor-buy.hdr
grep -i '^access-control-allow-origin: \*' /tmp/floor-buy.hdr
python3 - <<'PY'
import json
from pathlib import Path
body = json.loads(Path("/tmp/floor-buy.json").read_text())
pay = json.loads(Path("/tmp/floor-pay.json").read_text())
assert body["x402Version"] == pay["x402Version"] == 1
assert body["settlement"] == "not_settled"
assert body["settled"] is False
assert body["receipt_id"]
assert body["checkout_url"] == "https://whop.com/checkout/plan_j7hRIj9BQowga"
assert len(body["accepts"]) == 2
assert {row["network"] for row in body["accepts"]} == {"base", "solana"}
assert any(row["payTo"] == "0x0Cd76DDBCF3c249a6437FAA09a2D61E208d86f10" for row in body["accepts"])
assert any(row["payTo"] == "D6Spkkf3oVJBfnTojWKGXZd3TBYpvF4HFe2CihrX9AGL" for row in body["accepts"])
assert "desk_token" not in body
assert body["accepts"] == pay["accepts"]
assert body["checkout_url"] == pay["checkout_url"]
PY

echo "== POST incomplete listing without pay method =="
code=$(curl -sS -o /tmp/floor-listing-denied.json -w "%{http_code}" \
  -H "Content-Type: application/json" \
  -d '{"title":"Nope"}' \
  "$BASE/api/listings")
test "$code" = "400"
python3 - <<'PY'
import json
from pathlib import Path
body = json.loads(Path("/tmp/floor-listing-denied.json").read_text())
assert body["ok"] is False
assert "pay" in body["reason"].lower() or "name" in body["reason"].lower()
assert body.get("field")
assert body.get("skip")
assert "gmv" not in body
PY

echo "== POST incomplete listing missing return_days =="
code=$(curl -sS -o /tmp/floor-listing-noreturn.json -w "%{http_code}" \
  -H "Content-Type: application/json" \
  -d "{\"kind\":\"digital\",\"name\":\"No refund days ${RANDOM}\",\"specs\":$DIGITAL_SPECS,\"inventory\":\"unlimited\",\"warranty\":\"none\",\"delivery\":\"download\",\"lead_time\":\"instant\",\"payment\":{\"checkout_url\":\"https://pay.example.com/photos\"}}" \
  "$BASE/api/listings")
test "$code" = "400"
python3 - <<'PY'
import json
from pathlib import Path
body = json.loads(Path("/tmp/floor-listing-noreturn.json").read_text())
assert body["ok"] is False
assert body["field"] == "return_days"
assert body["skip"] == ["no return_days"]
PY

echo "== agent POST digital listing is 201 on catalog and listings =="
AGENT_TITLE="Agent photos ${RANDOM}"
code=$(curl -sS -D /tmp/floor-agent-list.hdr -o /tmp/floor-agent-list.json -w "%{http_code}" \
  -H "Content-Type: application/json" \
  -d "{\"kind\":\"digital\",\"name\":\"$AGENT_TITLE\",\"specs\":$DIGITAL_SPECS,\"inventory\":\"unlimited\",\"refund_days\":0,\"warranty\":\"none\",\"delivery\":\"download\",\"lead_time\":\"instant\",\"payment\":{\"checkout_url\":\"https://pay.example.com/photos\",\"network\":\"base\",\"payTo\":\"0x000000000000000000000000000000000000dEaD\",\"price\":\"12.50\"},\"owner\":{\"name\":\"Ada\"}}" \
  "$BASE/api/listings")
test "$code" = "201"
grep -i '^access-control-allow-origin: \*' /tmp/floor-agent-list.hdr
curl -sS -o /tmp/floor-catalog-agent.json "$BASE/api/catalog"
curl -sS -D /tmp/floor-listings-get.hdr -o /tmp/floor-listings-get.json "$BASE/api/listings"
grep -i '^access-control-allow-origin: \*' /tmp/floor-listings-get.hdr
AGENT_TITLE="$AGENT_TITLE" python3 - <<'PY'
import json, os
from pathlib import Path
title = os.environ["AGENT_TITLE"]
posted = json.loads(Path("/tmp/floor-agent-list.json").read_text())
assert posted["ok"] is True
assert posted["item"]["kind"] == "digital"
assert posted["item"]["owner"]["name"] == "Ada"
assert posted["item"]["payment"]["accepts"][0]["payTo"].endswith("dEaD")
assert posted["settlement"] == "not_settled"
catalog = json.loads(Path("/tmp/floor-catalog-agent.json").read_text())
listings = json.loads(Path("/tmp/floor-listings-get.json").read_text())
assert catalog["protocol"] == listings["protocol"] == "floor.b2a/v1"
assert any(item["title"] == title and item.get("payment", {}).get("accepts") for item in catalog["items"])
assert any(item["title"] == title and item.get("payment", {}).get("accepts") for item in listings["items"])
assert "gmv" not in catalog and "gmv" not in listings
PY

echo "== free first listing is accepted =="
jar=/tmp/floor-desk.jar
rm -f "$jar"
TITLE="12oz ceramic mug ${RANDOM}"
code=$(curl -sS -c "$jar" -b "$jar" -o /tmp/floor-listing-ok.json -w "%{http_code}" \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"$TITLE\",\"kind\":\"physical\",\"checkout\":\"https://pay.example.com/mug\",\"specs\":$SPECS,\"inventory\":20,\"return_days\":30,\"warranty\":\"1 year\",\"ships_from\":\"Austin, TX\",\"lead_time\":\"2 days\"}" \
  "$BASE/api/listings")
test "$code" = "201"
curl -sS -o /tmp/floor-catalog-after.json "$BASE/api/catalog"
TITLE="$TITLE" python3 - <<'PY'
import json, os
from pathlib import Path
title = os.environ["TITLE"]
posted = json.loads(Path("/tmp/floor-listing-ok.json").read_text())
assert posted["ok"] is True
assert posted["item"]["payment"]["checkout_url"].startswith("https://")
assert posted["settlement"] == "not_settled"
catalog = json.loads(Path("/tmp/floor-catalog-after.json").read_text())
assert any(item["title"] == title and item.get("payment", {}).get("checkout_url", "").startswith("https://") for item in catalog["items"])
assert any(item["title"] == "FLOOR desk" for item in catalog["items"])
assert "gmv" not in catalog
sku = next(item["sku"] for item in catalog["items"] if item["title"] == title)
open("/tmp/floor-free-sku.txt","w").write(sku)
PY
sku=$(cat /tmp/floor-free-sku.txt)
code=$(curl -sS -o /tmp/floor-l-free.html -w "%{http_code}" "$BASE/l/$sku")
test "$code" = "200"
grep -q "$TITLE" /tmp/floor-l-free.html
grep -q "https://pay.example.com/mug" /tmp/floor-l-free.html

echo "== second listing without desk is refused =="
code=$(curl -sS -c "$jar" -b "$jar" -o /tmp/floor-listing-second.json -w "%{http_code}" \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"Second mug ${RANDOM}\",\"kind\":\"physical\",\"checkout\":\"https://pay.example.com/mug2\",\"specs\":$SPECS,\"inventory\":4,\"return_days\":30,\"warranty\":\"none\",\"ships_from\":\"Austin\",\"lead_time\":\"2 days\"}" \
  "$BASE/api/listings")
test "$code" = "402"
python3 - <<'PY'
import json
from pathlib import Path
body = json.loads(Path("/tmp/floor-listing-second.json").read_text())
assert body["ok"] is False
assert "desk" in body["reason"].lower()
assert body["desk"]["checkout"] == "https://whop.com/checkout/plan_j7hRIj9BQowga"
assert body["desk"]["x402"][0]["payTo"] == "0x0Cd76DDBCF3c249a6437FAA09a2D61E208d86f10"
assert body["desk"]["x402"][1]["payTo"] == "D6Spkkf3oVJBfnTojWKGXZd3TBYpvF4HFe2CihrX9AGL"
assert "12 months" in body["reason"]
assert "gmv" not in body
assert "desk_token" not in body
PY

echo "== fake Bearer does not open a second listing =="
code=$(curl -sS -c "$jar" -b "$jar" -o /tmp/floor-listing-fake-bearer.json -w "%{http_code}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer desk_not_a_real_token" \
  -d "{\"title\":\"Fake bearer mug ${RANDOM}\",\"kind\":\"physical\",\"checkout\":\"https://pay.example.com/mug3\",\"specs\":$SPECS,\"inventory\":4,\"return_days\":30,\"warranty\":\"none\",\"ships_from\":\"Austin\",\"lead_time\":\"2 days\"}" \
  "$BASE/api/listings")
test "$code" = "402"

echo "== same listing payload returns the original 201 after free is used =="
code=$(curl -sS -c "$jar" -b "$jar" -o /tmp/floor-listing-replay.json -w "%{http_code}" \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"$TITLE\",\"kind\":\"physical\",\"checkout\":\"https://pay.example.com/mug\",\"specs\":$SPECS,\"inventory\":20,\"return_days\":30,\"warranty\":\"1 year\",\"ships_from\":\"Austin, TX\",\"lead_time\":\"2 days\"}" \
  "$BASE/api/listings")
test "$code" = "201"
python3 - <<'PY'
import json
from pathlib import Path
posted = json.loads(Path("/tmp/floor-listing-ok.json").read_text())
replay = json.loads(Path("/tmp/floor-listing-replay.json").read_text())
assert posted["item"]["sku"] == replay["item"]["sku"]
PY

echo "== listing Idempotency-Key returns the original 201 =="
KEY="verify-idemp-${RANDOM}"
ITITLE="Idemp pack ${RANDOM}"
code1=$(curl -sS -o /tmp/floor-idemp-1.json -w "%{http_code}" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $KEY" \
  -d "{\"kind\":\"digital\",\"name\":\"$ITITLE\",\"specs\":$DIGITAL_SPECS,\"inventory\":\"unlimited\",\"refund_days\":0,\"warranty\":\"none\",\"delivery\":\"download\",\"lead_time\":\"instant\",\"payment\":{\"checkout_url\":\"https://pay.example.com/photos\"}}" \
  "$BASE/api/listings")
code2=$(curl -sS -o /tmp/floor-idemp-2.json -w "%{http_code}" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $KEY" \
  -d "{\"kind\":\"digital\",\"name\":\"$ITITLE\",\"specs\":$DIGITAL_SPECS,\"inventory\":\"unlimited\",\"refund_days\":0,\"warranty\":\"none\",\"delivery\":\"download\",\"lead_time\":\"instant\",\"payment\":{\"checkout_url\":\"https://pay.example.com/photos\"}}" \
  "$BASE/api/listings")
test "$code1" = "201"
test "$code2" = "201"
python3 - <<'PY'
import json
from pathlib import Path
a = json.loads(Path("/tmp/floor-idemp-1.json").read_text())
b = json.loads(Path("/tmp/floor-idemp-2.json").read_text())
assert a["item"]["sku"] == b["item"]["sku"]
PY

echo "== POST /api/webhooks/whop without secret is 503 =="
if [ -z "${WHOP_WEBHOOK_SECRET:-}" ]; then
  code=$(curl -sS -o /tmp/floor-whop-hook.txt -w "%{http_code}" \
    -H "Content-Type: application/json" \
    -d '{"type":"payment.succeeded","data":{"id":"pay_example"}}' \
    "$BASE/api/webhooks/whop")
  test "$code" = "503"
  grep -q "WHOP_WEBHOOK_SECRET" /tmp/floor-whop-hook.txt
  ! grep -q desk_token /tmp/floor-whop-hook.txt
fi

echo "== POST /api/desk/unlock without confirm does not mint =="
if [ -z "${WHOP_API_KEY:-}" ]; then
  code=$(curl -sS -D /tmp/floor-unlock.hdr -o /tmp/floor-unlock.json -w "%{http_code}" \
    -H "Content-Type: application/json" \
    -d '{"payment_id":"pay_example"}' \
    "$BASE/api/desk/unlock")
  test "$code" = "503"
else
  code=$(curl -sS -D /tmp/floor-unlock.hdr -o /tmp/floor-unlock.json -w "%{http_code}" \
    -H "Content-Type: application/json" \
    -d '{}' \
    "$BASE/api/desk/unlock")
  test "$code" = "400"
fi
grep -i '^access-control-allow-origin: \*' /tmp/floor-unlock.hdr
python3 - <<'PY'
import json
from pathlib import Path
body = json.loads(Path("/tmp/floor-unlock.json").read_text())
assert body["ok"] is False
assert body["settled"] is False
assert "desk_token" not in body
assert "gmv" not in body
PY

echo "== POST /api/desk/ack without secret does not mint =="
code=$(curl -sS -o /tmp/floor-ack-off.json -w "%{http_code}" \
  -H "Content-Type: application/json" \
  -d '{"secret":"not-the-test-secret"}' \
  "$BASE/api/desk/ack")
if [ -n "${FLOOR_TEST_DESK_SECRET:-}" ]; then
  test "$code" = "403"
else
  test "$code" = "404"
fi
python3 - <<'PY'
import json
from pathlib import Path
body = json.loads(Path("/tmp/floor-ack-off.json").read_text())
assert body["ok"] is False
assert body["settled"] is False
assert "desk_token" not in body
assert "gmv" not in body
PY

echo "== locked /desk after free listing shows \$49 checkout =="
code=$(curl -sS -c "$jar" -b "$jar" -o /tmp/floor-desk-locked.html -w "%{http_code}" "$BASE/desk")
test "$code" = "200"
grep -q "Further listings need a desk" /tmp/floor-desk-locked.html
grep -q "Paid desks unlock after Whop confirms" /tmp/floor-desk-locked.html
grep -q "$CTA" /tmp/floor-desk-locked.html
grep -q "$PAY" /tmp/floor-desk-locked.html
grep -q "How bots pay you" /tmp/floor-desk-locked.html
grep -q 'href="/feedback"' /tmp/floor-desk-locked.html
! grep -q "I paid \$49" /tmp/floor-desk-locked.html
! grep -qiE 'name="(payment_id|membership_id|receipt_id)"' /tmp/floor-desk-locked.html

echo "== digital listing after test desk ack =="
if [ -z "${FLOOR_TEST_DESK_SECRET:-}" ]; then
  echo "skip paid listing: FLOOR_TEST_DESK_SECRET unset (test mint off)"
else
code=$(curl -sS -c "$jar" -b "$jar" -D /tmp/floor-ack.hdr -o /tmp/floor-ack.json -w "%{http_code}" \
  -H "Content-Type: application/json" \
  -d "{\"secret\":\"$FLOOR_TEST_DESK_SECRET\"}" \
  "$BASE/api/desk/ack")
test "$code" = "201"
TOKEN=$(python3 - <<'PY'
import json
from pathlib import Path
body = json.loads(Path("/tmp/floor-ack.json").read_text())
assert body["ok"] is True
assert body["test"] is True
assert body["settled"] is False
assert body["desk_token"].startswith("desk_")
assert "gmv" not in body
print(body["desk_token"])
PY
)
DTITLE="Photo pack ${RANDOM}"
code=$(curl -sS -c "$jar" -b "$jar" -o /tmp/floor-listing-digital.json -w "%{http_code}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"title\":\"$DTITLE\",\"kind\":\"digital\",\"checkout\":\"https://pay.example.com/photos\",\"payTo\":\"0x000000000000000000000000000000000000dEaD\",\"network\":\"base\",\"x402_price\":\"12.50\",\"delivery\":\"download\",\"specs\":$DIGITAL_SPECS,\"inventory\":\"unlimited\",\"return_days\":0,\"warranty\":\"none\",\"lead_time\":\"instant\"}" \
  "$BASE/api/listings")
test "$code" = "201"
curl -sS -o /tmp/floor-catalog-digital.json "$BASE/api/catalog"
DTITLE="$DTITLE" python3 - <<'PY'
import json, os
from pathlib import Path
title = os.environ["DTITLE"]
posted = json.loads(Path("/tmp/floor-listing-digital.json").read_text())
assert posted["ok"] is True
assert posted["item"]["kind"] == "digital"
assert posted["item"]["unlimited"] is True
assert posted["item"]["payment"]["accepts"][0]["scheme"] == "exact"
assert posted["item"]["payment"]["accepts"][0]["maxAmountRequired"] == "12500000"
catalog = json.loads(Path("/tmp/floor-catalog-digital.json").read_text())
match = next(item for item in catalog["items"] if item["title"] == title)
assert match["kind"] == "digital"
assert match["payment"]["accepts"][0]["payTo"].endswith("dEaD")
slug = match["sku"]
open("/tmp/floor-digital-slug.txt","w").write(slug)
PY
slug=$(cat /tmp/floor-digital-slug.txt)
code=$(curl -sS -o /tmp/floor-pay-digital.json -w "%{http_code}" "$BASE/pay/$slug")
test "$code" = "402"
python3 - <<'PY'
import json
from pathlib import Path
body = json.loads(Path("/tmp/floor-pay-digital.json").read_text())
assert body["x402Version"] == 1
assert body["accepts"][0]["scheme"] == "exact"
assert body["accepts"][0]["network"] == "base"
assert body["checkout_url"].startswith("https://")
PY

echo "== GET /thanks?desk_token= shows the token once =="
code=$(curl -sS -c "$jar" -b "$jar" -o /tmp/floor-thanks-once.html -w "%{http_code}" \
  -L "$BASE/thanks?desk_token=$TOKEN")
test "$code" = "200"
grep -q "$TOKEN" /tmp/floor-thanks-once.html
grep -q "Authorization" /tmp/floor-thanks-once.html
fi

echo "All routes verified against $BASE"
