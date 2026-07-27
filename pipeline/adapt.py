#!/usr/bin/env python3
"""
Adapter for externally-produced position lists.

WHY AN ADAPTER RATHER THAN A DEPENDENCY
---------------------------------------
PhD-Seeker (github.com/Aghababaei/PhD-Seeker) scrapes FindAPhD and ScholarshipDb
and writes CSV. It is a reasonable tool and you may well want to run it. But
importing its code into this repo would be a mistake for three specific reasons:

  1. LICENCE. PhD-Seeker is GPL-3.0. Vendoring or importing it makes this whole
     repository GPL-3.0, including your personal site. An adapter that reads a
     CSV touches none of its code and carries none of its licence.

  2. IT DOES NOT CAPTURE THE FIELD YOU NEED. Its output schema is
     Country / Date / Title / Link. FindAPhD *displays* the funding status —
     "Funded PhD Programme (Students Worldwide)", "Self-Funded PhD Students Only",
     "Funded PhD Project (UK Students Only)" — and that distinction is the entire
     basis of your strategy. PhD-Seeker does not extract it. So even running
     perfectly, its output cannot tell you which listings you are eligible for.

  3. TLS VERIFICATION IS DISABLED. main.py line 122 reads
     `httpx.AsyncClient(verify=(repo == "findaphd"))`, but repo.yaml defines the
     repos as `findaphd-eu` and `findaphd-noneu`. Neither string equals
     "findaphd", so `verify` is False on every request. Certificate verification
     is off for all traffic. Reported here rather than worked around.

So: run whatever you like, export a CSV, and point this at it. Your risk, your
choice, your machine — but the licence stays clean and this repo stays working
when their selectors break.

ACCEPTED SCHEMA
---------------
Any CSV with a Title column. These are recognised, case-insensitively:
  Title / Position / Name        -> title      (required)
  Link / URL / Href              -> url
  Country                        -> country
  Institution / University       -> institution
  Date / Deadline / Posted       -> date
  Funding / Funded / Eligibility -> funding_raw

Usage:
    python pipeline/adapt.py exported.csv
    python pipeline/adapt.py exported.csv --the-list the_top50.txt
"""

import argparse
import csv
import json
import re
import sys
import unicodedata
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "external.json"

COLS = {
    "title": ["title", "position", "name", "project"],
    "url": ["link", "url", "href"],
    "country": ["country", "location"],
    "institution": ["institution", "university", "host", "provider"],
    "date": ["date", "deadline", "posted", "closing"],
    "funding_raw": ["funding", "funded", "eligibility", "status", "type"],
}

# FindAPhD's own vocabulary. This is the classification PhD-Seeker drops.
FUNDING = [
    (r"self[\s-]*funded", "self-funded", "needs SVS — institution must be THE top 50"),
    (r"UK students only|home students only", "home-only", "BLOCKED — restricted to UK/home students"),
    (r"EU students only", "eu-only", "BLOCKED — restricted to EU students"),
    (r"competition funded", "competition", "Funded but competitive — check nationality terms"),
    (r"students worldwide|international students", "worldwide", "Open to you — funding covers international"),
    (r"funded", "funded", "Funded — verify whether international fees are covered"),
]


def deaccent(s):
    s = unicodedata.normalize("NFKD", str(s))
    return "".join(c for c in s if not unicodedata.combining(c))


def norm(s):
    return re.sub(r"[^a-z]", "", deaccent(str(s)).lower())


def pick(row, keys):
    for k in keys:
        for col in row:
            if col and norm(col) == norm(k):
                v = str(row[col]).strip()
                if v and v.lower() not in ("nan", "none"):
                    return v
    return ""


def classify(text):
    for pat, code, meaning in FUNDING:
        if re.search(pat, text, re.I):
            return code, meaning
    return "unknown", "Funding status not stated — open the listing and check"


def load_the_list(path):
    """One institution name per line. Paste the SVS annexure here, not a
    rankings website — the annexure is what governs your application."""
    if not path:
        return []
    p = Path(path)
    if not p.exists():
        print(f"warning: {path} not found — THE filtering disabled", file=sys.stderr)
        return []
    return [l.strip() for l in p.read_text(encoding="utf-8").splitlines() if l.strip()]


def the_match(text, approved):
    if not approved:
        return None
    hay = deaccent(text).lower()
    for name in approved:
        n = deaccent(name).lower().strip()
        if len(n) > 4 and n in hay:
            return name
    return False


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("csvfile")
    ap.add_argument("--the-list", help="text file of SVS-approved institutions, one per line")
    args = ap.parse_args()

    approved = load_the_list(args.the_list)
    rows, skipped = [], 0

    with open(args.csvfile, encoding="utf-8-sig", errors="replace") as fh:
        for r in csv.DictReader(fh):
            title = pick(r, COLS["title"])
            if not title:
                skipped += 1
                continue
            blob = " ".join(str(v) for v in r.values())
            code, meaning = classify(blob)
            inst = pick(r, COLS["institution"])
            hit = the_match(f"{inst} {title}", approved)

            rows.append({
                "title": title[:240],
                "url": pick(r, COLS["url"]),
                "country": pick(r, COLS["country"]),
                "institution": inst,
                "date": pick(r, COLS["date"]),
                "funding": code,
                "meaning": meaning,
                "the_ok": hit if hit is not False else None,
                "actionable": code in ("worldwide", "funded", "competition")
                              or (code == "self-funded" and bool(hit)),
            })

    # Blocked last, actionable first, then by funding certainty
    order = {"worldwide": 0, "funded": 1, "competition": 2, "self-funded": 3,
             "unknown": 4, "eu-only": 5, "home-only": 6}
    rows.sort(key=lambda x: (order.get(x["funding"], 9), x["title"]))

    from collections import Counter
    tally = Counter(r["funding"] for r in rows)

    doc = {
        "generated": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "source": Path(args.csvfile).name,
        "counts": {"total": len(rows), "actionable": sum(r["actionable"] for r in rows),
                   "by_funding": dict(tally)},
        "the_filter": bool(approved),
        "note": ("Imported from an external export. Funding status is classified from "
                 "whatever text the export contained — if the tool did not capture it, "
                 "most rows will read 'unknown' and must be opened individually."),
        "positions": rows[:300],
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(doc, indent=1, ensure_ascii=False), encoding="utf-8")

    print(f"{len(rows)} positions ({skipped} rows lacked a title)")
    for k, v in tally.most_common():
        print(f"  {v:4}  {k}")
    print(f"actionable: {doc['counts']['actionable']}")
    if tally.get("unknown", 0) > len(rows) * 0.5:
        print("\nNOTE: over half have no funding status. The export did not capture "
              "that column, which is the one that decides your eligibility.")
    print(f"wrote {OUT.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
