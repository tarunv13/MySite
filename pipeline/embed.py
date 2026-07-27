#!/usr/bin/env python3
"""
Embed the data files into index.html.

WHY THIS EXISTS
---------------
Browsers block fetch() of local files under the file:// protocol. Double-clicking
index.html therefore produced a page where every data-driven section rendered
empty — the JSON was fine, the page simply could not read it.

So the data is now embedded directly into index.html inside a JSON script tag.
The page reads that immediately, then tries fetch() and quietly upgrades if it
gets something newer. Result:

  file://           works — uses the embedded copy
  local http        works — fetch succeeds, same data
  GitHub Pages      works — fetch succeeds, refreshed weekly by Actions

Run this after fetch.py, adapt.py, or any hand-edit of data/*.json. The workflow
does it automatically.

    python pipeline/embed.py
"""

import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PAGE = ROOT / "index.html"
START = "<!--DATA:START-->"
END = "<!--DATA:END-->"

FILES = {
    "opportunities": "data/opportunities.json",
    "funding": "data/funding.json",
    "geo": "data/geo.json",
    "external": "data/external.json",
    "social": "data/social.json",
}


def main():
    if not PAGE.exists():
        sys.exit("index.html not found")

    bundle = {}
    for key, rel in FILES.items():
        p = ROOT / rel
        if p.exists():
            try:
                bundle[key] = json.loads(p.read_text(encoding="utf-8"))
            except json.JSONDecodeError as e:
                print(f"  skip {rel}: {e}")
        else:
            print(f"  skip {rel}: not present")

    bundle["_embedded"] = datetime.now(timezone.utc).isoformat(timespec="seconds")

    # Separators keep it compact; the browser does not need our indentation.
    payload = json.dumps(bundle, ensure_ascii=False, separators=(",", ":"))
    # </script> inside a string would close the tag early.
    payload = payload.replace("</", "<\\/")

    block = (f'{START}\n<script id="bootstrap" type="application/json">'
             f'{payload}</script>\n{END}')

    html = PAGE.read_text(encoding="utf-8")
    if START in html and END in html:
        html = re.sub(re.escape(START) + r".*?" + re.escape(END), lambda _: block,
                      html, flags=re.S)
    else:
        # First run — insert just before our main script block.
        anchor = '<script src="https://unpkg.com/leaflet'
        if anchor not in html:
            sys.exit("could not find the insertion point in index.html")
        html = html.replace(anchor, block + "\n" + anchor, 1)

    PAGE.write_text(html, encoding="utf-8")
    kb = len(payload) / 1024
    print(f"embedded {len(bundle) - 1} datasets, {kb:.0f} KB")
    for k, v in bundle.items():
        if k.startswith("_"):
            continue
        n = (v.get("counts") or {}).get("total") or len(
            v.get("leads") or v.get("funding") or v.get("institutions")
            or v.get("positions") or [])
        print(f"  {k:<16}{n}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
