# MySite

Research profile and a live listings board for EU conservation funding.
Static HTML, no build step, no tracking. Data refreshed weekly by GitHub Actions.

```
index.html                      the whole site
data/opportunities.json         generated — do not edit by hand
pipeline/fetch.py               regenerates the JSON
pipeline/README.md              sources, tuning, limits
.github/workflows/refresh.yml   weekly automation
```

## Deploy

1. Commit everything to `main`.
2. **Settings → Pages** → Deploy from a branch → `main` / `(root)`.
3. **Settings → Actions → General → Workflow permissions** → *Read and write*.
   Without this the weekly refresh cannot commit and will fail.
4. **Actions** tab → *Refresh opportunities* → *Run workflow* to populate it now
   rather than waiting for Monday.

Live at `https://tarunv13.github.io/MySite/`.

## Before publishing — three edits

| Find in `index.html` | Replace with |
|---|---|
| `REPLACE@example.com` | your email |
| `data-edit="linkedin"` | your LinkedIn URL in the `href` |
| `data-edit="scholar"` / `data-edit="orcid"` | those URLs, or delete the links |

Dead `href="#"` links look worse than absent ones.

## The two layers

The listings board separates **leads** from **calls**, and the difference decides
how you use it.

**Leads** are live grants. Someone holds money, the end date tells you how much
runway, and the "new grant" flag marks awards that started recently — a team
being built right now is the most recruitable state a lab has. These are people
to write to, not posts to apply for.

**Calls** are openings with deadlines you can act on.

Neither is a vacancy feed. See `pipeline/README.md` for why that is deliberate.

## Content review

`REVIEWED` near the bottom of `index.html` drives the footer date. The listings
stamp themselves automatically and flag as stale after three weeks.
