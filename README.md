# tarunverma.com

Personal research site of Tarun Kumar Verma, Conservation Science Researcher.
Static HTML and CSS, hosted on GitHub Pages with HTTPS. No cookies of its own; Microsoft Clarity for reading analytics.

```
index.html, work/, writing/, journey/, 404.html   generated pages (do not edit by hand)
assets/css/site.css        the design system ("the field record"): tokens at the top
assets/css/journey.css     scroll-told scene layouts, loaded on /journey/ only
assets/js/site.js          reveals, hand-drawn marks, the Field Journal game
assets/js/journey.js       GSAP + ScrollTrigger scroll-told stage
assets/js/analytics.js     Microsoft Clarity loader (id on <body data-clarity>, honours GPC)
assets/img/plates/         Hardwicke and Gray, Illustrations of Indian Zoology (1830s), public domain
assets/img/photos/         Tarun's own photographs (all rights reserved)
assets/vendor/             GSAP 3.15, rough-notation 0.5.1, self-hosted
assets/fonts/              Schibsted Grotesk, Newsreader, IBM Plex Mono (SIL OFL), self-hosted
llms.txt, sitemap.xml      summary for AI assistants; sitemap with images and the film
CNAME                      tarunverma.com
```

## Editing

The pages are generated from fragments so the head, navigation, footer, security policy and
structured data stay identical everywhere. `_private/` is not published.

```
edit   _private/build/pages/<page>.html      page body
edit   _private/build/build.py               titles, descriptions, JSON-LD, CSP, Clarity id
run    python _private/build/build.py        writes index.html, work/, writing/, journey/, 404.html
```

- `{{icon:name}}` in a fragment inlines a Phosphor icon from `_private/build/icons/`.
- The CSP forbids inline `style="..."`: add a class to the CSS instead.
- The film's source is `_private/video/film.html`; it is rendered frame by frame to `assets/video/`.
- Art in `assets/img/art/` is collage from public-domain works (sources fetched by `_private/art/commons.py`, cut out by `cutout.py`, composed by `compose.py` and `build_assets.py`). The brief for generated paintings is `_private/art/ART-DIRECTION.md`; drop results in `_private/art/incoming/`.

Text © Tarun Kumar Verma, CC BY 4.0. Photographs © Tarun Kumar Verma, all rights reserved. Code MIT.
