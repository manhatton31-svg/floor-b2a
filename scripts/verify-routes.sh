#!/usr/bin/env bash
set -euo pipefail
BASE="${1:-http://127.0.0.1:3000}"
CTA="Open a desk · \$49 once for 12 months"

echo "== GET /api/catalog =="
curl -sS -D /tmp/floor-catalog.hdr -o /tmp/floor-catalog.json "$BASE/api/catalog"
grep -i '^content-type: application/json' /tmp/floor-catalog.hdr
python3 - <<'PY'
import json
from pathlib import Path
body = json.loads(Path("/tmp/floor-catalog.json").read_text())
assert body["protocol"] == "floor.b2a/v1", body
assert body["settlement"] == "not_settled", body
assert body["items"] == []
assert "gmv" not in body
print(json.dumps(body, indent=2))
PY

echo "== GET /llms.txt =="
curl -sS -o /tmp/floor-llms.txt -w "status:%{http_code}\n" "$BASE/llms.txt"
grep -q "$CTA" /tmp/floor-llms.txt
grep -q "GET /api/catalog" /tmp/floor-llms.txt
grep -q "?a=WHOP_USERNAME" /tmp/floor-llms.txt
! grep -q FLOORQA /tmp/floor-llms.txt

echo "== GET /openapi.yaml =="
curl -sS -o /tmp/floor-openapi.yaml -w "status:%{http_code}\n" "$BASE/openapi.yaml"
grep -q "/api/catalog" /tmp/floor-openapi.yaml

echo "== GET /.well-known/agent.json =="
curl -sS -o /tmp/floor-agent.json -w "status:%{http_code}\n" "$BASE/.well-known/agent.json"
python3 - <<'PY'
import json
from pathlib import Path
body = json.loads(Path("/tmp/floor-agent.json").read_text())
assert body["protocol"] == "floor.b2a/v1"
assert body["settlement"] == "not_settled"
assert "/api/catalog" in body["catalog"]["url"]
PY

echo "== GET /robots.txt =="
curl -sS -o /tmp/floor-robots.txt -w "status:%{http_code}\n" "$BASE/robots.txt"
grep -q "sitemap" /tmp/floor-robots.txt

echo "== GET /sitemap.xml =="
curl -sS -o /tmp/floor-sitemap.xml -w "status:%{http_code}\n" "$BASE/sitemap.xml"
grep -q "/api/catalog" /tmp/floor-sitemap.xml
grep -q "/for-agents" /tmp/floor-sitemap.xml
grep -q "/badge.svg" /tmp/floor-sitemap.xml

echo "== GET /badge.svg =="
curl -sS -D /tmp/floor-badge.hdr -o /tmp/floor-badge.svg -w "status:%{http_code}\n" "$BASE/badge.svg"
grep -q "<svg" /tmp/floor-badge.svg

echo "== GET /for-agents =="
code=$(curl -sS -o /tmp/floor-for.html -w "%{http_code}" "$BASE/for-agents")
test "$code" = "200"
grep -q "$CTA" /tmp/floor-for.html
! grep -qiE "isn't human|Agents fill SKUs|keep the desk|keep the seat|lifetime|12-month access|FLOORQA" /tmp/floor-for.html

echo "== GET /how-to-sell-to-agents =="
code=$(curl -sS -o /tmp/floor-howto.html -w "%{http_code}" "$BASE/how-to-sell-to-agents")
test "$code" = "200"
grep -q "$CTA" /tmp/floor-howto.html

echo "== GET / =="
curl -sS -o /tmp/floor-home.html -w "status:%{http_code}\n" "$BASE/"
test "$(grep -o 'Open a desk · \$49 once for 12 months' /tmp/floor-home.html | wc -l)" -ge 3
! grep -qiE "isn't human|Agents fill SKUs|keep the desk|keep the seat|lifetime|12-month access|FLOORQA" /tmp/floor-home.html
grep -q "https://whop.com/checkout/plan_j7hRIj9BQowga" /tmp/floor-home.html

echo "All routes verified against $BASE"
