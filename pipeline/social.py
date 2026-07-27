#!/usr/bin/env python3
"""
Parallel Pipeline — social discovery.

WHY THIS LOOKS DIFFERENT FROM WHAT YOU ASKED FOR
------------------------------------------------
You asked for LinkedIn, Twitter/X and Instagram. Here is the honest position:

  LinkedIn   Aggressive anti-scraping, blocks datacentre IPs on sight, and any
             scraper breaks within weeks. No public read API for post search.
  Instagram  Terms of use state plainly that automated scraping is prohibited.
             Hashtag search is crippled for logged-out clients.
  Twitter/X  Free API access was withdrawn. Paid tiers start well above what a
             job search justifies.

Courts have distinguished logged-out public data from login-walled data, and
platforms have lost some of those cases — so this is not purely a legal question.
It is an engineering one. A scraper against those three would get your IP banned,
break constantly, and cost you more maintenance than it saves.

So this module uses networks that publish genuinely open APIs, which academics
have migrated to in large numbers since 2023:

  Bluesky    AT Protocol public AppView. No key, no auth, documented.
  Mastodon   Public tag timelines. No key. Federated, so several instances.

For the closed three, the highest-yield method is not a scraper anyway — it is
Google's site: operator, which indexes public LinkedIn posts that LinkedIn's own
search buries. Those URLs are generated into the site so you click and read them
in your own logged-in session, which is both permitted and more reliable.

Usage:
    python pipeline/social.py            # writes data/social.json
    python pipeline/social.py --dry      # print, don't write
"""

import argparse
import json
import re
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import quote
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "social.json"
UA = "ParallelPipeline/1.0 (+https://github.com/tarunv13/MySite) research-monitoring"

BSKY = "https://public.api.bsky.app/xrpc/app.bsky.feed.searchPosts"
MASTO = ["https://mastodon.social", "https://fediscience.org", "https://ecoevo.social"]

# Your terms crossed with the language people actually use when announcing money.
TOPICS = [
    "wildlife trade", "conservation culturomics", "biodiversity monitoring",
    "zoonotic spillover", "One Health", "conservation technology",
    "digital conservation", "environmental communication", "iEcology",
]
HIRING = [
    "PhD position", "fully funded PhD", "doctoral researcher",
    "postdoc", "we are hiring", "join my lab", "call for applications",
]
TAGS = [
    "PhDposition", "fullyfunded", "AcademicJobs", "ConservationJobs",
    "EcologyJobs", "PhDvacancy", "OpenPosition", "sciencejobs",
]


def log(m):
    print(f"[{datetime.now(timezone.utc):%H:%M:%S}] {m}", flush=True)


def get(url):
    req = Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    with urlopen(req, timeout=45) as r:
        return json.loads(r.read())


def bluesky(query, limit=25):
    """Public AppView search. No authentication required."""
    try:
        d = get(f"{BSKY}?q={quote(query)}&limit={limit}")
    except Exception as e:
        log(f"  bluesky '{query[:34]}': {e}")
        return []
    out = []
    for p in d.get("posts", []):
        rec = p.get("record", {}) or {}
        text = str(rec.get("text", ""))
        a = p.get("author", {}) or {}
        out.append({
            "net": "Bluesky",
            "text": text[:400],
            "author": a.get("displayName") or a.get("handle", ""),
            "handle": a.get("handle", ""),
            "at": rec.get("createdAt", "")[:10],
            "url": f"https://bsky.app/profile/{a.get('handle','')}/post/{p.get('uri','').split('/')[-1]}",
            "query": query,
        })
    return out


def mastodon(tag, limit=20):
    """Public tag timeline. No authentication required."""
    out = []
    for host in MASTO:
        try:
            d = get(f"{host}/api/v1/timelines/tag/{quote(tag)}?limit={limit}")
        except Exception:
            continue
        for s in d:
            text = re.sub(r"<[^>]+>", " ", str(s.get("content", "")))
            text = re.sub(r"\s+", " ", text).strip()
            acct = s.get("account", {}) or {}
            out.append({
                "net": "Mastodon",
                "text": text[:400],
                "author": acct.get("display_name") or acct.get("acct", ""),
                "handle": acct.get("acct", ""),
                "at": str(s.get("created_at", ""))[:10],
                "url": s.get("url", ""),
                "query": f"#{tag}",
            })
        time.sleep(0.6)          # be a good citizen
    return out


def relevant(post):
    """Both a topic AND a hiring signal. Either alone is noise."""
    t = post["text"].lower()
    topic = any(x.lower() in t for x in TOPICS) or any(
        w in t for w in ("conservation", "biodiversity", "wildlife", "ecolog"))
    hiring = any(x.lower() in t for x in HIRING) or any(
        w in t for w in ("phd", "postdoc", "vacancy", "fellowship", "position", "hiring"))
    return topic and hiring


def deep_links():
    """Pre-built searches for the platforms that cannot be fetched.

    Google's site: operator against LinkedIn posts consistently surfaces things
    LinkedIn's own search will not return.
    """
    links = []
    for t in TOPICS[:6]:
        for site, label in [("linkedin.com/posts", "LinkedIn"),
                            ("x.com", "X")]:
            q = f'site:{site} "PhD position" "{t}"'
            links.append({
                "label": f"{label} · {t}",
                "url": f"https://www.google.com/search?q={quote(q)}&tbs=qdr:w",
            })
    for tag in TAGS[:5]:
        links.append({
            "label": f"LinkedIn · #{tag}",
            "url": f"https://www.linkedin.com/search/results/content/?keywords=%23{tag}&sortBy=%22date_posted%22",
        })
        links.append({
            "label": f"Instagram · #{tag.lower()}",
            "url": f"https://www.instagram.com/explore/tags/{tag.lower()}/",
        })
    return links


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry", action="store_true")
    args = ap.parse_args()

    posts, seen = [], set()

    log("Bluesky")
    for t in TOPICS:
        for h in HIRING[:3]:
            for p in bluesky(f"{t} {h}"):
                if p["url"] in seen:
                    continue
                seen.add(p["url"])
                posts.append(p)
            time.sleep(0.4)
    log(f"  {len(posts)} raw")

    log("Mastodon")
    before = len(posts)
    for tag in TAGS:
        for p in mastodon(tag):
            if p["url"] in seen:
                continue
            seen.add(p["url"])
            posts.append(p)
    log(f"  {len(posts) - before} raw")

    hits = [p for p in posts if relevant(p)]
    hits.sort(key=lambda p: p["at"], reverse=True)
    log(f"relevant after filtering: {len(hits)} of {len(posts)}")

    doc = {
        "generated": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "counts": {"scanned": len(posts), "relevant": len(hits)},
        "note": ("Bluesky and Mastodon publish open APIs and are fetched directly. "
                 "LinkedIn, X and Instagram do not, so those appear as pre-built "
                 "searches you open in your own logged-in session."),
        "posts": hits[:60],
        "deep_links": deep_links(),
    }

    if args.dry:
        print(json.dumps(doc, indent=1)[:2500])
        return 0
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(doc, indent=1, ensure_ascii=False), encoding="utf-8")
    log(f"wrote {OUT.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
