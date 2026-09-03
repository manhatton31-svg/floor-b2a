#!/usr/bin/env bash
set -euo pipefail
BASE="${1:-http://127.0.0.1:3000}"

echo "== GET /api/catalog =="
curl -sS -D /tmp/floor-catalog.hdr -o /tmp/floor-catalog.json "$BASE/api/catalog"
grep -i '^content-type: application/json' /tmp/floor-catalog.hdr
python3 - <<'PY'
import json
from pathlib import Path
body = json.loads(Path("/tmp/floor-catalog.json").read_text())
assert body["protocol"] == "floor.b2a/v1", body
assert "generated_at" in body
assert isinstance(body["items"], list)
assert "gmv" not in body
assert "fills" not in body
print(json.dumps(body, indent=2))
PY

echo "== GET /llms.txt =="
curl -sS -o /tmp/floor-llms.txt -w "status:%{http_code}\n" "$BASE/llms.txt"
grep -q "floor.b2a/v1" /tmp/floor-llms.txt
grep -q "Open a desk" /tmp/floor-llms.txt
grep -q "?a=WHOP_USERNAME" /tmp/floor-llms.txt
test ! -s /tmp/floor-llms.txt || ! grep -q FLOORQA /tmp/floor-llms.txt

echo "== GET /openapi.yaml =="
curl -sS -o /tmp/floor-openapi.yaml -w "status:%{http_code}\n" "$BASE/openapi.yaml"
grep -q "/api/catalog" /tmp/floor-openapi.yaml

echo "== GET /.well-known/agent.json =="
curl -sS -o /tmp/floor-agent.json "$BASE/.well-known/agent.json"
python3 - <<'PY'
import json
from pathlib import Path
body = json.loads(Path("/tmp/floor-agent.json").read_text())
assert body["protocol"] == "floor.b2a/v1"
assert "/api/catalog" in body["catalog"]["url"]
print(json.dumps(body, indent=2)[:800])
PY

echo "== GET /robots.txt =="
curl -sS -o /tmp/floor-robots.txt -w "status:%{http_code}\n" "$BASE/robots.txt"
grep -q "sitemap" /tmp/floor-robots.txt

echo "== GET /sitemap.xml =="
curl -sS -o /tmp/floor-sitemap.xml -w "status:%{http_code}\n" "$BASE/sitemap.xml"
grep -q "/api/catalog" /tmp/floor-sitemap.xml
grep -q "/how-to-sell-to-agents" /tmp/floor-sitemap.xml

echo "== GET /how-to-sell-to-agents =="
curl -sS -o /tmp/floor-howto.html -w "status:%{http_code}\n" "$BASE/how-to-sell-to-agents"
grep -q "Open a desk" /tmp/floor-howto.html
! grep -q FLOORQA /tmp/floor-howto.html

echo "All protocol routes verified against $BASE"
