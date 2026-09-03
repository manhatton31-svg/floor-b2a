#!/usr/bin/env bash
set -euo pipefail
BASE="${1:-http://127.0.0.1:3000}"
CTA="Open a desk · \$49 once · 12 months"
PAY="https://whop.com/checkout/plan_j7hRIj9BQowga"
SPECS='[{"name":"Capacity","value":"12 oz"},{"name":"Material","value":"ceramic"},{"name":"Color","value":"navy"},{"name":"Weight","value":"380 g"},{"name":"Dishwasher","value":"yes"},{"name":"Microwave","value":"safe"}]'
DIGITAL_SPECS='[{"name":"Format","value":"JPEG"},{"name":"Count","value":"24 photos"},{"name":"Resolution","value":"4000 px"},{"name":"Color","value":"sRGB"},{"name":"License","value":"one buyer"},{"name":"Size","value":"120 MB"}]'

echo "== GET /api/catalog =="
curl -sS -D /tmp/floor-catalog.hdr -o /tmp/floor-catalog.json -A "verify-routes-catalog" "$BASE/api/catalog"
grep -i '^content-type: application/json' /tmp/floor-catalog.hdr
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

echo "== GET /llms.txt =="
curl -sS -o /tmp/floor-llms.txt -w "status:%{http_code}\n" "$BASE/llms.txt"
grep -q "$CTA" /tmp/floor-llms.txt
grep -q "GET /api/catalog" /tmp/floor-llms.txt
grep -q "/desk" /tmp/floor-llms.txt
! grep -q FLOORQA /tmp/floor-llms.txt
! grep -q "?a=WHOP_USERNAME" /tmp/floor-llms.txt
! grep -qi "money does not move" /tmp/floor-llms.txt

echo "== GET /openapi.yaml =="
curl -sS -o /tmp/floor-openapi.yaml -w "status:%{http_code}\n" "$BASE/openapi.yaml"
grep -q "/api/catalog" /tmp/floor-openapi.yaml
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
assert "/desk" in body["human"]["desk"]
PY

echo "== GET /robots.txt =="
curl -sS -o /tmp/floor-robots.txt -w "status:%{http_code}\n" "$BASE/robots.txt"
grep -q "sitemap" /tmp/floor-robots.txt

echo "== GET /sitemap.xml =="
curl -sS -o /tmp/floor-sitemap.xml -w "status:%{http_code}\n" "$BASE/sitemap.xml"
grep -q "/api/catalog" /tmp/floor-sitemap.xml
grep -q "/for-agents" /tmp/floor-sitemap.xml
grep -q "/desk" /tmp/floor-sitemap.xml
grep -q "/tape" /tmp/floor-sitemap.xml
grep -q "/badge.svg" /tmp/floor-sitemap.xml

echo "== GET /badge.svg =="
curl -sS -D /tmp/floor-badge.hdr -o /tmp/floor-badge.svg -w "status:%{http_code}\n" "$BASE/badge.svg"
grep -q "<svg" /tmp/floor-badge.svg

echo "== GET /for-agents =="
code=$(curl -sS -o /tmp/floor-for.html -w "%{http_code}" "$BASE/for-agents")
test "$code" = "200"
grep -q "$CTA" /tmp/floor-for.html
! grep -qiE "isn't human|Agents fill SKUs|keep the desk|keep the seat|lifetime|12-month access|FLOORQA|money does not move" /tmp/floor-for.html

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
grep -q "List your first product free" /tmp/floor-home.html
! grep -q "?a=WHOP_USERNAME" /tmp/floor-home.html

echo "== GET /desk =="
code=$(curl -sS -o /tmp/floor-desk.html -w "%{http_code}" "$BASE/desk")
test "$code" = "200"
grep -q "$CTA" /tmp/floor-desk.html
grep -q "List your first product free" /tmp/floor-desk.html
grep -q "How the bot pays" /tmp/floor-desk.html
grep -q "How bots pay you" /tmp/floor-desk.html
grep -q "Stripe Payment Link" /tmp/floor-desk.html
grep -q "PayPal" /tmp/floor-desk.html
grep -q "Never enter a seed, private key, password, or Stripe sk_live" /tmp/floor-desk.html
grep -q "x402 wallet address" /tmp/floor-desk.html
grep -q "A digital thing" /tmp/floor-desk.html
! grep -qiE "isn't human|Agents fill SKUs|keep the desk|keep the seat|lifetime|12-month access|FLOORQA|merchant seat|money does not move" /tmp/floor-desk.html
! grep -qiE 'name="(seed|private_key|password|sk_live)"' /tmp/floor-desk.html

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

echo "== GET /directories =="
code=$(curl -sS -o /tmp/floor-dirs.html -w "%{http_code}" "$BASE/directories")
test "$code" = "200"

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
PY

echo "== free first listing is accepted =="
jar=/tmp/floor-desk.jar
rm -f "$jar"
TITLE="12oz ceramic mug ${RANDOM}"
code=$(curl -sS -c "$jar" -b "$jar" -o /tmp/floor-listing-ok.json -w "%{http_code}" \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"$TITLE\",\"kind\":\"physical\",\"checkout\":\"https://pay.example.com/mug\",\"specs\":$SPECS,\"inventory\":20,\"return_days\":30,\"warranty\":\"1 year\",\"ships_from\":\"Austin, TX\",\"lead_time\":\"2 days\"}" \
  "$BASE/api/listings")
test "$code" = "200"
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
PY

echo "== second listing without desk is refused =="
code=$(curl -sS -c "$jar" -b "$jar" -o /tmp/floor-listing-second.json -w "%{http_code}" \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"Second mug ${RANDOM}\",\"kind\":\"physical\",\"checkout\":\"https://pay.example.com/mug2\",\"specs\":$SPECS,\"inventory\":4,\"return_days\":30,\"warranty\":\"none\",\"ships_from\":\"Austin\",\"lead_time\":\"2 days\"}" \
  "$BASE/api/listings")
test "$code" = "401"
python3 - <<'PY'
import json
from pathlib import Path
body = json.loads(Path("/tmp/floor-listing-second.json").read_text())
assert body["ok"] is False
assert "desk" in body["reason"].lower()
PY

echo "== digital listing after desk ack =="
curl -sS -c "$jar" -b "$jar" -o /dev/null -X POST "$BASE/desk/ack"
DTITLE="Photo pack ${RANDOM}"
code=$(curl -sS -c "$jar" -b "$jar" -o /tmp/floor-listing-digital.json -w "%{http_code}" \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"$DTITLE\",\"kind\":\"digital\",\"checkout\":\"https://pay.example.com/photos\",\"payTo\":\"0x000000000000000000000000000000000000dEaD\",\"network\":\"base\",\"x402_price\":\"12.50\",\"delivery\":\"download\",\"specs\":$DIGITAL_SPECS,\"inventory\":\"unlimited\",\"return_days\":0,\"warranty\":\"none\",\"lead_time\":\"instant\"}" \
  "$BASE/api/listings")
test "$code" = "200"
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

echo "All routes verified against $BASE"
