# Deploy

## Opening it locally

**Do not double-click `index.html`.** It will open under `file://`, where
browsers block reading local JSON. The page now ships with its data embedded so
it works anyway — but if you ever edit `data/*.json` by hand, run
`python pipeline/embed.py` afterwards or the page will show the old numbers.

To preview it properly:

```bash
cd MySite
python3 -m http.server 8000
# then open http://localhost:8000
```

---

The site does not exist online yet. This repo is empty on GitHub, so there is no
link to give you until you push. Four steps, about ten minutes.

## 1. Push

```bash
git clone https://github.com/tarunv13/MySite.git
cd MySite
# copy the contents of this folder in
git add .
git commit -m "site + pipeline"
git push origin main
```

## 2. Turn on Pages

**Settings → Pages → Source: Deploy from a branch → `main` / `(root)` → Save**

Your URL will be:

```
https://tarunv13.github.io/MySite/
```

It takes two or three minutes to appear the first time.

## 3. Allow the workflow to commit

**Settings → Actions → General → Workflow permissions → Read and write permissions**

Without this the weekly refresh runs, fetches correctly, and then fails silently
at the commit step. This is the single most common way this setup breaks.

## 4. Populate it now

**Actions tab → Refresh opportunities → Run workflow**

Otherwise the site shows whatever is in `data/opportunities.json` until Monday.

---

## Before you publish

Three placeholders in `index.html`:

| Find | Replace |
|---|---|
| `REPLACE@example.com` | your email |
| `data-edit="linkedin"` | your LinkedIn URL in the `href` |
| `data-edit="scholar"` / `data-edit="orcid"` | those URLs, or delete the links |

Dead `href="#"` links look worse than no links.

If you do not have an ORCID, get one first. It is free, takes five minutes, and
its absence on a researcher's page is more conspicuous than its contents.

## Files

```
index.html                      the site
data/opportunities.json         generated weekly — do not hand-edit
data/people.json                roster you maintain
data/funding.json               funding routes you maintain
pipeline/fetch.py               regenerates opportunities.json
pipeline/README.md              sources, matching logic, known failure modes
.github/workflows/refresh.yml   weekly automation
DEPLOY.md                       this file
```

## Custom domain, later

Add a `CNAME` file containing your domain, then point a CNAME record at
`tarunv13.github.io`. Worth doing before you start sending the link to
supervisors — a personal domain reads better than a github.io subdomain.
