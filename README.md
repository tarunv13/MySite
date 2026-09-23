# tarunverma.com

Personal research site of Tarun Kumar Verma, conservation social scientist.
Static HTML and CSS, no build step, no cookies, no trackers. Hosted on GitHub Pages with HTTPS.

```
index.html            About (landing)
work/                 Projects: WildTrace, Tide Turners, Protected Area Update, Sift QDA, Species on Screen, Kosma
writing/              Papers, citable software, talks, education
journey/              Timeline, mentors, life outside work
assets/css/site.css   The whole design system (tokens at the top)
assets/js/site.js     Reveals, hand-drawn marks, and the Field Journal game
assets/vendor/        rough-notation 0.5.1 (MIT), self-hosted
assets/fonts/         Fraunces, Source Serif 4, Caveat (SIL OFL), self-hosted
llms.txt              Plain summary for AI assistants
CNAME                 tarunverma.com
```

## Editing

- **Add a news item:** copy an `<li>` in the `what’s new` list in `index.html`.
- **Swap the illustration for a portrait:** save a square photo as `assets/img/tarun-verma-portrait.webp`
  and change the `<img src>` inside `.portrait` in `index.html`. Write a real alt text.
- **After any change,** update `<lastmod>` in `sitemap.xml` and `dateModified` in the homepage JSON-LD.
- **Security:** each page carries a Content-Security-Policy that allows only files from this site.
  Inline `style="..."` attributes and inline scripts will be blocked; put styles in `site.css`.

Text © Tarun Kumar Verma, CC BY 4.0. Code MIT.
