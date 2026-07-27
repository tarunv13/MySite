# Pipeline

Regenerates `../data/opportunities.json`, which `index.html` renders.

## Why not the Horizon Dashboard

The URL you started from —
`dashboard.tech.ec.europa.eu/qs_digit_dashboard_mt/...` — is a **Qlik Sense
application**. Fetching it returns an empty HTML shell; every figure you see
arrives over a websocket after JavaScript boots. There is no page to parse and
no documented public API behind it. The EU's own guidance says the dashboard's
raw data cannot be downloaded automatically, only exported by hand to xlsx.

So this pipeline goes to the sources the dashboard itself is built from.

## Sources

| Layer | Source | Cadence | What it gives |
|---|---|---|---|
| Leads | CORDIS bulk CSV | monthly | Every funded project: PI, host, dates, abstract |
| Calls | Funding & Tenders Portal (SEDIA) | continuous | Open and forthcoming calls with deadlines |

Both are public reads. Neither needs an EU Login or an API key you have to apply for.

## Run

```bash
python pipeline/fetch.py                        # full run
python pipeline/fetch.py --no-h2020             # Horizon Europe only, much faster
python pipeline/fetch.py --fixture some.csv     # test scoring offline
python pipeline/fetch.py --no-calls             # skip SEDIA
```

No dependencies beyond the Python 3.12 standard library. Nothing to install.

## Automation

`.github/workflows/refresh.yml` runs it every Monday at 06:00 UTC and commits
the result. You can also trigger it by hand from the repo's **Actions** tab.

Two safety behaviours worth knowing:

- The previous JSON is backed up before each run and **restored if the fetch
  fails**, so a source outage leaves the site stale rather than empty.
- A sanity check fails the run loudly if the result set is empty. A sudden
  collapse in record count almost always means a source URL moved, not that
  Europe stopped funding research.

## Tuning it

Everything that decides relevance lives in three constants at the top of
`fetch.py`:

- `TERMS` — regex patterns and weights. This is the file's opinion about what
  matters, and it encodes one specific research profile. Rewrite it for yours.
- `MIN_FIT` — the score threshold. Lower it for a wider net.
- `MIN_END` — grants ending before this date are dropped, because they cannot
  host a doctorate starting in 2027. Move it as your timeline moves.

The scoring function is pure and takes plain strings, so you can test changes
without touching the network:

```python
from pipeline.fetch import score
score("Illegal wildlife trade and zoonotic spillover in Southeast Asia")
# (12, ['trade', 'zoonotic', 'biodiv'])
```

## What this cannot do

**It does not find vacancies.** A live grant tells you someone holds money and
plausibly needs people. It does not mean a position is open. Actual PhD posts
are announced by individual universities on their own boards, in dozens of
formats, many behind JavaScript. No feed aggregates them honestly and any tool
claiming otherwise is either scraping fragilely or making things up.

That limitation is the strategy, not a gap in it. Working the leads layer —
writing to a PI whose grant runs to 2030 before any post is advertised — is a
better position than competing on listings everyone else can also see.


---

## The roster (`data/people.json`)

A hand-maintained list of researchers. On every run the pipeline matches each
name against the CORDIS grant records it just downloaded and writes the result
back into `opportunities.json` under `roster`. A person marked **live grant** has
been checked against the funding record — not assumed.

### Why matching is strict

The naive version — substring search on surname — is worse than useless:
`"Fink"` matches `"Finkenrath"`, and any UK grant by any `Jones` matches Kate
Jones. On the first run that produced four confident false positives.

The matcher now requires **all three**:

1. Word-boundary surname hit in the PI field
2. First-initial agreement on the specific name within that field
3. Institution-word overlap between roster entry and grant host,
   after stripping generic words (*university, institute, research, centre…*)

Under-matching is the correct failure mode. A missed grant costs you one lookup.
A false one costs you an email that makes you look careless to the exact person
you were trying to impress.

### Editing

Edit `name`, `inst`, `group`, `focus`, `why`, `track`, `status`, `verified`,
`note`. Never edit `grants` or `live_grant` — they are overwritten on each run.

`track` is the field that matters:

- `salaried` — employment-model doctorate. No scholarship needed, no nationality
  quota, no ranking requirement. Highest control.
- `svs` — needs the state scholarship, so needs a **THE** top-50 institution,
  an offer letter, and the age gate satisfied.
- `either` — check the funding model per position.

`verified` is either `erc-data` (confirmed against the grant record) or
`unverified` (a name from a list, affiliation not checked). The site renders that
distinction, so unverified entries stay visibly unverified until you check them.

### Matching gotchas, learned the hard way

Three bugs surfaced while building this roster, all silent — they produced wrong
answers rather than errors:

1. **Substring surnames.** `"Fink"` matches `"Finkenrath"`; any UK grant by any
   `Jones` matches Kate Jones. Fixed with word-boundary regex plus a
   first-initial check.
2. **Diacritics.** `University of Tromsø` in the roster never matched
   `University of Tromso` in the export. Everything is now folded through
   `deaccent()` before comparison.
3. **Multi-PI names.** Synergy grants have four PIs, so roster entries read
   `"George Adamson (+ Gagné, Natarajan, Ely)"` — and `surname()` was returning
   `"Ely)"`. Parenthesised text is now stripped first.

Each one produced a plausible-looking roster with a wrong `live_grant` flag. If
you extend the matcher, test against a known-answer set rather than eyeballing
the output.

### Fixture formats

`--fixture` accepts CSV or XLSX. Prefer XLSX from the ERC dashboard export:
the CSV mangles non-ASCII names (`Tamás Faragó` → `Tam?s Farag?`) and turns the
EU contribution column into unparseable strings.

Note that the dashboard export ships near-duplicate rows — the same project
number twice, one copy with the acronym and one with `-`. There were 1,426 such
pairs in a 20,034-row export, concentrated in FP7. Dedup prefers the richer row.

---

## Social discovery (`social.py`)

### What it fetches, and why not the platforms you named

| Platform | Status | Why |
|---|---|---|
| **Bluesky** | Fetched directly | AT Protocol public AppView. No key, no auth, documented, stable. Academics migrated here in numbers after 2023. |
| **Mastodon** | Fetched directly | Public tag timelines across three instances including fediscience.org and ecoevo.social. No key. |
| LinkedIn | Deep links only | No public post-search API. Blocks datacentre IPs. Any scraper breaks within weeks. |
| Instagram | Deep links only | Terms of use prohibit automated scraping. Hashtag search crippled when logged out. |
| X / Twitter | Deep links only | Free API withdrawn. Paid tiers cost more than this job search justifies. |

The legal position on public data is genuinely contested — platforms have lost
several scraping cases where the data was logged-out and public. But that is not
the deciding factor here. The engineering one is: a scraper against those three
would break constantly, get your IP banned, and cost more maintenance than it
saves.

For the closed three, the highest-yield route is not a scraper anyway. Google's
`site:linkedin.com/posts` operator surfaces public posts that LinkedIn's own
search buries. Those URLs are generated for you to open in your own logged-in
session — permitted, and more reliable than any scraper.

### The filter

A post must carry **both** a topic signal and a hiring signal. Either alone is
noise: "beautiful sunset over the wildlife reserve" has the topic, "we are hiring
a software engineer" has the hiring language, and neither is a lead. Tested
against both cases.

```bash
python pipeline/social.py         # writes data/social.json
python pipeline/social.py --dry   # print without writing
```

Runs weekly alongside the grants fetch, with `continue-on-error` — the open APIs
are free but not contractually reliable, and a social outage should not block the
grant refresh.

---

## Using PhD-Seeker (or any other board scraper)

[PhD-Seeker](https://github.com/Aghababaei/PhD-Seeker) scrapes FindAPhD and
ScholarshipDb and writes CSV. If you want to run it, run it — then feed the CSV
to `adapt.py`. It is deliberately **not** a dependency of this repo. Three
concrete reasons:

**1. Licence.** PhD-Seeker is GPL-3.0. Importing or vendoring it makes this
entire repository GPL-3.0, personal site included. An adapter that reads a CSV
touches none of its code and inherits none of its licence.

**2. It drops the field you actually need.** Its output schema is
`Country / Date / Title / Link`. FindAPhD displays funding status explicitly —
*Funded PhD Programme (Students Worldwide)*, *Self-Funded PhD Students Only*,
*Funded PhD Project (UK Students Only)* — and that distinction is the whole basis
of the SVS strategy. PhD-Seeker does not extract it. Working perfectly, its
output still cannot tell you which listings you are eligible for.

**3. TLS verification is off.** `main.py` line 122:

```python
async with httpx.AsyncClient(verify=(repo == "findaphd")) as client:
```

but `repo.yaml` defines the repos as `findaphd-eu` and `findaphd-noneu`. Neither
equals `"findaphd"`, so `verify` evaluates to `False` on every request —
certificate verification disabled for all traffic. This appears to have been
introduced in v0.5.1 (March 2025) when the repos were renamed. Worth reporting
upstream; it is a one-word fix.

Also worth knowing: it sets `user-agent: curl/7.83.0`, its selectors are Bootstrap
utility classes (`"h4 text-dark mx-0 mb-3"`), and the last commit was March 2025.
Selector-based scrapers of commercial boards break on any CSS refresh.

### The adapter

```bash
python pipeline/adapt.py exported.csv
python pipeline/adapt.py exported.csv --the-list the_top50.txt
```

Accepts any CSV with a Title column. Recognises Title/Position/Name, Link/URL,
Country, Institution/University, Date/Deadline, Funding/Eligibility — all
case-insensitively, so it works with exports from other tools too.

It classifies funding from whatever text the export contained and marks each row
**actionable** or not:

| Funding | Actionable? |
|---|---|
| Students Worldwide | yes |
| Funded / Competition Funded | yes, verify international fees |
| Self-funded | **only if the institution is on your THE list** |
| UK/Home students only | no — blocked |
| EU students only | no — blocked |
| Not stated | no — open it and check |

`--the-list` takes one institution per line. **Paste the SVS annexure**, not a
rankings website. The annexure attached to the notification is what governs your
application; a QS or THE web page is not.

Output lands in `data/external.json` and appears on the site under
Listings → Board positions.

### A better source than scraping

FindAPhD runs its own email alerts ("PhDs by Email"). That is a sanctioned push
channel, it never breaks, and it carries the funding label that PhD-Seeker drops.
Set up alerts on your keywords and let them arrive; use `adapt.py` for bulk
exports when you want them.

---

## embed.py — run this after anything that writes to `data/`

Browsers block `fetch()` of local files under `file://`. Double-clicking
`index.html` therefore produced a page where every data-driven section rendered
empty — the JSON was fine, the page just could not read it.

`embed.py` writes the current contents of `data/*.json` into `index.html` inside
a JSON script tag. The page reads that immediately, then tries `fetch()` and
quietly upgrades if it gets something newer.

| Opened how | Result |
|---|---|
| Double-click (`file://`) | works — embedded copy |
| `python -m http.server` | works — fetch succeeds |
| GitHub Pages | works — fetch succeeds, refreshed weekly |

```bash
python pipeline/fetch.py      # or adapt.py, or hand-edit data/*.json
python pipeline/embed.py      # then always this
```

The workflow runs it automatically after every fetch. **If you edit a data file
by hand and skip this step, the published page will keep showing the old
numbers** even though the JSON is correct — that is the one failure mode to
remember.
