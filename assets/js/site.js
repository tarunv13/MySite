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

/* ---------- project atmospheres fade in once painted ---------- */
document.querySelectorAll('.proj-bg img').forEach((img) => {
  const on = () => img.classList.add('is-on');
  if (img.complete && img.naturalWidth) on(); else img.addEventListener('load', on, { once: true });
});

/* ---------- hand-drawn marks (rough-notation, self-hosted) ----------
   One meaning per mark: circle = the question, underline = what changes, highlight = the evidence.
   The grammar is taught in context: the first time a visitor meets each kind, a margin note says what
   it means, then fades. After that the note returns only on hover, focus or tap. */
window.__rno_kf_s = true; // keyframes live in site.css, so the CSP needs no inline <style>
const marks = [...document.querySelectorAll('[data-mark]')];
const MEANING = { circle: 'the question', underline: 'what changes', highlight: 'the evidence' };
const LEARNT = 'tv-marks-learnt';
let learnt = new Set(); try { learnt = new Set(JSON.parse(localStorage.getItem(LEARNT) || '[]')); } catch { /* no storage */ }

const note = document.createElement('span');
note.className = 'mark-note'; note.setAttribute('aria-hidden', 'true');
let noteFor = null, noteTimer = 0;
function placeNote(el) {
  const rs = el.getClientRects(); if (!rs.length) return;
  const r = rs[0]; // where the mark begins, so a wrapped mark is labelled at its start
  note.textContent = MEANING[el.dataset.mark];
  note.dataset.type = el.dataset.mark;
  document.body.append(note);
  const w = note.offsetWidth;
  const x = Math.min(Math.max(8, r.left - 10), document.documentElement.clientWidth - w - 8);
  note.style.setProperty('--x', `${x + scrollX}px`);
  note.style.setProperty('--y', `${r.top + scrollY - note.offsetHeight - 10}px`);
  note.style.setProperty('--tip', `${Math.min(Math.max(12, r.left - x + Math.min(22, r.width / 2)), w - 12)}px`);
}
function openNote(el, ms) {
  clearTimeout(noteTimer); noteFor = el; placeNote(el);
  requestAnimationFrame(() => note.classList.add('on'));
  if (ms) noteTimer = setTimeout(closeNote, ms);
}
function closeNote() { note.classList.remove('on'); noteFor = null; }
addEventListener('resize', () => { if (noteFor) placeNote(noteFor); });

if (marks.length) {
  marks.forEach((el) => {
    el.tabIndex = 0;
    el.setAttribute('aria-label', `${el.textContent} (marked as ${MEANING[el.dataset.mark]})`);
    el.addEventListener('mouseenter', () => openNote(el));
    el.addEventListener('mouseleave', () => { if (noteFor === el) closeNote(); });
    el.addEventListener('focus', () => openNote(el));
    el.addEventListener('blur', closeNote);
    el.addEventListener('click', () => (noteFor === el && note.classList.contains('on') ? closeNote() : openNote(el, 2600)));
  });
  import('/assets/vendor/rough-notation.esm.js').then(({ annotate }) => {
    const css = getComputedStyle(document.documentElement);
    const VAR = { circle: '--mark-q', underline: '--mark-u', highlight: '--fluoro' };
    const colour = (type) => css.getPropertyValue(VAR[type] || '--mark-u').trim();
    const show = (el) => {
      const type = el.dataset.mark;
      annotate(el, {
        type, color: colour(type),
        strokeWidth: type === 'highlight' ? 1 : 1.5,
        padding: type === 'circle' ? [4, 8] : 2,
        iterations: type === 'circle' ? 1 : 2,
        multiline: true, animate: !reduced, animationDuration: 900,
      }).show();
      // first encounter with this kind of mark: teach it once, in the margin
      if (!learnt.has(type)) {
        learnt.add(type); try { localStorage.setItem(LEARNT, JSON.stringify([...learnt])); } catch { /* no storage */ }
        setTimeout(() => openNote(el, 4200), reduced ? 0 : 950);
      }
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
  { k: 'bustard', why: 'Where I grew up', img: 'great-indian-bustard-ardeotis-nigriceps-hardwicke-1830s', name: 'Great Indian bustard', latin: 'Ardeotis nigriceps', where: 'Home', note: 'Rajasthan’s state bird, now holding on mostly in the Thar desert of the state I grew up in.' },
  { k: 'pangolin', why: 'Online wildlife trade', img: 'indian-pangolin-manis-crassicaudata-hardwicke-1830s', name: 'Indian pangolin', latin: 'Manis crassicaudata', where: 'Home', note: 'Its scales travel under four regional names, and all four went into my trade lexicon at WCS-India.' },
  { k: 'turtle', why: 'Wildlife seizures', img: 'narrow-headed-softshell-turtle-chitra-indica-hardwicke-1830s', name: 'Narrow-headed softshell turtle', latin: 'Chitra indica', where: 'Work', note: 'A river turtle of South Asia, and one of many freshwater turtles that turn up in seizure records.' },
  { k: 'egret', why: 'Protected Area Update', img: 'little-egret-egretta-garzetta-hardwicke-1830s', name: 'Little egret', latin: 'Egretta garzetta', where: 'Work', note: 'A familiar bird on the IIT Bombay campus, where I joined the birdwatching group.' },
  { k: 'mongoose', why: 'Wildlife trade', img: 'crab-eating-mongoose-herpestes-urva-hardwicke-1830s', name: 'Crab-eating mongoose', latin: 'Herpestes urva', where: 'Work', note: 'Mongooses are protected in India, and their hair is still seized from the paintbrush trade.' },
  { k: 'vulture', why: 'Species decline', img: 'white-rumped-vulture-gyps-bengalensis-hardwicke-1830s', name: 'White-rumped vulture', latin: 'Gyps bengalensis', where: 'Writing', note: 'Once common across India, it fell by more than 99% in the 1990s, largely from the veterinary drug diclofenac.' },
  { k: 'cat', why: 'How I came to conservation', img: 'jungle-cat-felis-chaus-hardwicke-1830s', name: 'Jungle cat', latin: 'Felis chaus', where: 'Journey', note: 'The wild cats of Ranthambhore were the subject of my uncle’s photographs, and my first sense of what a picture can do.' },
  { k: 'blackbuck', why: 'Traditional knowledge', img: 'blackbuck-antilope-cervicapra-hardwicke-1830s', name: 'Blackbuck', latin: 'Antilope cervicapra', where: 'Journey', note: 'Protected for centuries by Bishnoi communities in Rajasthan, which is a lesson in whose knowledge counts.' },
  { k: 'owl', why: 'Who was looking', img: 'dusky-eagle-owl-bubo-coromandus-hardwicke-1830s', name: 'Dusky eagle-owl', latin: 'Bubo coromandus', where: 'Home', note: 'The bird beside my portrait on the front page, because everything on this site starts with who was looking.' },
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

let just = null; // the species most recently spotted, shown as a discovery card
function render() {
  btn.querySelector('.count').textContent = `${seen.size}/${SPECIES.length}`;
  const all = seen.size === SPECIES.length;
  const j = just && SPECIES.find((x) => x.k === just);
  const card = j ? `<div class="found" role="status"><span class="found-img"><img src="${P}${j.img}.webp" alt="" width="120" height="120"></span><div><p class="found-lab">Just spotted · ${seen.size} of ${SPECIES.length}</p><b>${j.name}</b><i>${j.latin}</i><span class="why">${j.why}</span><p>${j.note}</p></div></div>` : '';
  panel.innerHTML = `${card}<h2>Field journal</h2>
    <p class="how"><b>What is this?</b> Nine animals painted for Thomas Hardwicke’s <i>Illustrations of Indian Zoology</i> (1830s) are hidden in the words of this site, each in a small dashed circle. Every one is tied to a part of my work. Tap it to add it here and read why it matters. My research starts with who was looking, so this is a small game about looking closely.</p>
    <ol>${SPECIES.map((s) => `<li class="${seen.has(s.k) ? 'seen' : ''}${s.k === just ? ' just' : ''}" data-k="${s.k}"><span class="g">${thumb(s)}</span><span><b>${seen.has(s.k) ? `${s.name} <i class="muted">${s.latin}</i>` : `Not yet spotted · look on ${s.where}`}</b><span class="why">${s.why}</span><span class="note">${s.note}</span></span></li>`).join('')}</ol>
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
  b.setAttribute('aria-label', `${s.name}, linked to ${s.why.toLowerCase()}. Add it to your field journal`);
  b.innerHTML = `<span class="spot-face">${thumb(s)}</span><span class="spot-tip" aria-hidden="true"><img src="${P}${s.img}.webp" alt="" width="96" height="96" loading="lazy"><b>${s.name}</b><i>${s.latin}</i><span class="why">${s.why}</span><em>Tap to add to your field journal</em></span>`;
  b.addEventListener('click', () => {
    const fresh = !seen.has(s.k);
    seen.add(s.k); save(seen); sync(); just = s.k; render();
    b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop');
    if (fresh) { btn.classList.remove('bump'); void btn.offsetWidth; btn.classList.add('bump'); }
    toggle(true); panel.scrollTop = 0;
  });
  slot.replaceWith(b);
});
document.body.append(panel, btn);
const HINT = 'tv-journal-hint';
let hinted = false; try { hinted = localStorage.getItem(HINT) === '1'; } catch { /* no storage */ }
if (!hinted && !seen.size && document.querySelector('.spot')) {
  const tip = document.createElement('p');
  tip.className = 'journal-hint'; tip.setAttribute('role', 'note');
  tip.innerHTML = 'Nine animals are hiding in the text, in dashed circles. Tap one to see why it’s here. <button type="button" aria-label="Dismiss">✕</button>';
  const close = () => { tip.classList.remove('on'); try { localStorage.setItem(HINT, '1'); } catch { /* no storage */ } setTimeout(() => tip.remove(), 400); };
  tip.querySelector('button').addEventListener('click', close);
  btn.addEventListener('click', close, { once: true });
  document.querySelectorAll('.spot').forEach((sp) => sp.addEventListener('click', close, { once: true }));
  document.body.append(tip);
  setTimeout(() => tip.classList.add('on'), 3500);
  setTimeout(() => { if (tip.isConnected) close(); }, 16000);
}
sync(); render();

/* ---------- analytics, last, so it never delays the page ---------- */
if ('requestIdleCallback' in window) requestIdleCallback(() => startAnalytics(), { timeout: 3000 });
else setTimeout(startAnalytics, 1500);
