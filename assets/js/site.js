// tarunverma.com: progressive enhancement only. Every page reads fully without this file.
import { startAnalytics } from '/assets/js/analytics.js';

document.documentElement.classList.remove('no-js');
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- reveal on scroll ---------- */
const revealers = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window && !reduced) {
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }, { rootMargin: '0px 0px -8% 0px' });
  revealers.forEach((el) => io.observe(el));
} else revealers.forEach((el) => el.classList.add('in'));

/* ---------- hand-drawn marks (rough-notation, self-hosted) ---------- */
window.__rno_kf_s = true; // keyframes live in site.css, so the CSP needs no inline <style>
const marks = [...document.querySelectorAll('[data-mark]')];
if (marks.length) {
  import('/assets/vendor/rough-notation.esm.js').then(({ annotate }) => {
    const css = getComputedStyle(document.documentElement);
    const colour = (k) => css.getPropertyValue(`--c-${k}`).trim() || css.getPropertyValue('--brand-bright').trim();
    const show = (el) => {
      const type = el.dataset.mark;
      annotate(el, {
        type, color: colour(el.dataset.colour || 'pau'),
        strokeWidth: type === 'highlight' ? 1 : 1.5,
        padding: type === 'circle' ? [4, 8] : 2,
        iterations: type === 'circle' ? 1 : 2,
        multiline: true, animate: !reduced, animationDuration: 900,
      }).show();
    };
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { setTimeout(() => show(e.target), 250); io.unobserve(e.target); }
    }, { rootMargin: '0px 0px -15% 0px' });
    marks.forEach((m) => io.observe(m));
  }).catch(() => {});
}

/* ---------- the field journal: nine species from Hardwicke's plates, hidden in the text ---------- */
const P = '/assets/img/plates/';
const SPECIES = [
  { k: 'bustard', img: 'great-indian-bustard-ardeotis-nigriceps-hardwicke-1830s', name: 'Great Indian bustard', latin: 'Ardeotis nigriceps', where: 'Home', note: 'Rajasthan’s state bird, now holding on mostly in the Thar desert of the state I grew up in.' },
  { k: 'pangolin', img: 'indian-pangolin-manis-crassicaudata-hardwicke-1830s', name: 'Indian pangolin', latin: 'Manis crassicaudata', where: 'Home', note: 'Its scales travel under four regional names, and all four went into my trade lexicon at WCS-India.' },
  { k: 'turtle', img: 'narrow-headed-softshell-turtle-chitra-indica-hardwicke-1830s', name: 'Narrow-headed softshell turtle', latin: 'Chitra indica', where: 'Work', note: 'A river turtle of South Asia, and one of many freshwater turtles that turn up in seizure records.' },
  { k: 'egret', img: 'little-egret-egretta-garzetta-hardwicke-1830s', name: 'Little egret', latin: 'Egretta garzetta', where: 'Work', note: 'A familiar bird on the IIT Bombay campus, where I joined the birdwatching group.' },
  { k: 'mongoose', img: 'crab-eating-mongoose-herpestes-urva-hardwicke-1830s', name: 'Crab-eating mongoose', latin: 'Herpestes urva', where: 'Work', note: 'Mongooses are protected in India, and their hair is still seized from the paintbrush trade.' },
  { k: 'vulture', img: 'white-rumped-vulture-gyps-bengalensis-hardwicke-1830s', name: 'White-rumped vulture', latin: 'Gyps bengalensis', where: 'Writing', note: 'Once common across India, it fell by more than 99% in the 1990s, largely from the veterinary drug diclofenac.' },
  { k: 'cat', img: 'jungle-cat-felis-chaus-hardwicke-1830s', name: 'Jungle cat', latin: 'Felis chaus', where: 'Journey', note: 'The wild cats of Ranthambhore were the subject of my uncle’s photographs, and my first sense of what a picture can do.' },
  { k: 'blackbuck', img: 'blackbuck-antilope-cervicapra-hardwicke-1830s', name: 'Blackbuck', latin: 'Antilope cervicapra', where: 'Journey', note: 'Protected for centuries by Bishnoi communities in Rajasthan, which is a lesson in whose knowledge counts.' },
  { k: 'owl', img: 'dusky-eagle-owl-bubo-coromandus-hardwicke-1830s', name: 'Dusky eagle-owl', latin: 'Bubo coromandus', where: 'Home', note: 'The bird beside my portrait on the front page, because everything on this site starts with who was looking.' },
];
const thumb = (s) => `<img src="${P}${s.img}.webp" alt="" width="60" height="60" loading="lazy" decoding="async">`;
const KEY = 'tv-field-journal-v2';
const load = () => { try { return new Set(JSON.parse(localStorage.getItem(KEY) || '[]')); } catch { return new Set(); } };
const save = (s) => { try { localStorage.setItem(KEY, JSON.stringify([...s])); } catch { /* private mode: it still works for this visit */ } };
let seen = load();

const btn = document.createElement('button');
btn.className = 'journal-btn'; btn.type = 'button';
btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-controls', 'field-journal');
btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 3.5h11a3 3 0 0 1 3 3v14H8a3 3 0 0 1-3-3z"/><path d="M5 17.5a3 3 0 0 1 3-3h11M9 7.5h6M9 10.5h4"/></svg><span>Field journal</span><span class="count" aria-live="polite"></span>`;
const panel = document.createElement('section');
panel.id = 'field-journal'; panel.className = 'journal'; panel.hidden = true; panel.setAttribute('aria-label', 'Field journal');

function render() {
  btn.querySelector('.count').textContent = `${seen.size}/${SPECIES.length}`;
  const all = seen.size === SPECIES.length;
  panel.innerHTML = `<h2>Field journal</h2>
    <p class="how">Nine species from Thomas Hardwicke’s 1830s <i>Illustrations of Indian Zoology</i> are hiding in the text of this site, in small dashed circles. Tap one to add it here. My work starts with who was looking, so this is a small game about looking closely.</p>
    <ol>${SPECIES.map((s) => `<li class="${seen.has(s.k) ? 'seen' : ''}"><span class="g">${thumb(s)}</span><span><b>${seen.has(s.k) ? `${s.name} <i class="muted">${s.latin}</i>` : `Not yet spotted · look on ${s.where}`}</b><span class="note">${s.note}</span></span></li>`).join('')}</ol>
    ${all ? '<p class="done">All nine. You looked more closely than most records do. Thank you for reading this far.</p>' : ''}
    ${seen.size ? '<button class="reset" type="button">Start the journal again</button>' : ''}`;
  panel.querySelector('.reset')?.addEventListener('click', () => { seen = new Set(); save(seen); sync(); render(); });
}
const toggle = (open) => { const o = open ?? panel.hidden; panel.hidden = !o; btn.setAttribute('aria-expanded', String(o)); };
btn.addEventListener('click', () => toggle());
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !panel.hidden) { toggle(false); btn.focus(); } });
document.addEventListener('click', (e) => { if (!panel.hidden && !panel.contains(e.target) && !btn.contains(e.target) && !e.target.closest('.spot')) toggle(false); });
const sync = () => document.querySelectorAll('.spot').forEach((b) => b.setAttribute('aria-pressed', String(seen.has(b.dataset.species))));

document.querySelectorAll('.spot-slot').forEach((slot) => {
  const s = SPECIES.find((x) => x.k === slot.dataset.species);
  if (!s) return;
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'spot'; b.dataset.species = s.k; b.title = s.name;
  b.setAttribute('aria-label', `Spot the ${s.name} for your field journal`);
  b.innerHTML = thumb(s);
  b.addEventListener('click', () => {
    const fresh = !seen.has(s.k);
    seen.add(s.k); save(seen); sync(); render();
    b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop');
    if (fresh) { btn.classList.remove('bump'); void btn.offsetWidth; btn.classList.add('bump'); }
    toggle(true);
  });
  slot.replaceWith(b);
});
document.body.append(panel, btn);
sync(); render();

/* ---------- analytics, last, so it never delays the page ---------- */
if ('requestIdleCallback' in window) requestIdleCallback(() => startAnalytics(), { timeout: 3000 });
else setTimeout(startAnalytics, 1500);
