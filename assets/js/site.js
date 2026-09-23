// tarunverma.com: progressive enhancement only. Every page reads fully without this file.
document.documentElement.classList.remove('no-js');

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- reveal on scroll ---------- */
const revealers = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window && !reduced) {
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }, { rootMargin: '0px 0px -8% 0px' });
  revealers.forEach((el) => io.observe(el));
} else {
  revealers.forEach((el) => el.classList.add('in'));
}

/* ---------- hand-drawn marks (rough-notation, self-hosted) ---------- */
// The keyframes are in site.css; this flag stops the library injecting a <style> tag the CSP would block.
window.__rno_kf_s = true;
const marks = [...document.querySelectorAll('[data-mark]')];
if (marks.length) {
  import('/assets/vendor/rough-notation.esm.js').then(({ annotate }) => {
    const colours = { forest: '#23704f', saffron: '#d2811a', plum: '#8a4f7d', mint: '#a9dcc3', sun: '#f6d9a8' };
    const show = (el) => {
      const type = el.dataset.mark;
      const a = annotate(el, {
        type,
        color: colours[el.dataset.colour] || colours.saffron,
        strokeWidth: type === 'highlight' ? 1 : 1.6,
        padding: type === 'circle' ? [4, 8] : 2,
        iterations: type === 'circle' ? 1 : 2,
        multiline: true,
        animate: !reduced,
        animationDuration: 900,
      });
      a.show();
    };
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        for (const e of entries) if (e.isIntersecting) { setTimeout(() => show(e.target), 250); io.unobserve(e.target); }
      }, { rootMargin: '0px 0px -15% 0px' });
      marks.forEach((m) => io.observe(m));
    } else marks.forEach(show);
  }).catch(() => {});
}

/* ---------- the field journal ---------- */
const G = {
  tiger: '<path d="M12 21c-3.6 0-6-1.9-6-4.4 0-2.6 2.8-4.6 6-4.6s6 2 6 4.6C18 19.1 15.6 21 12 21z"/><ellipse cx="5.2" cy="10.4" rx="1.7" ry="2.2"/><ellipse cx="9.3" cy="6.6" rx="1.8" ry="2.4"/><ellipse cx="14.7" cy="6.6" rx="1.8" ry="2.4"/><ellipse cx="18.8" cy="10.4" rx="1.7" ry="2.2"/>',
  monitor: '<path d="M2.5 21c3-1 5-2.6 6.4-5.2S12 10.6 15 9s4.4-2.8 5.6-5"/><circle cx="21" cy="3.4" r="1.4"/><path d="M8.6 16.2 5.8 15M9.8 14.4l.8 3M14.4 9.8l-.6-3.1M15.8 9.1l3 .9"/>',
  pangolin: '<path d="M3 17c0-5.6 4.6-9.6 10.2-9.6 4.2 0 7.3 2.6 7.3 5.7 0 2.2-1.4 3.9-3.4 3.9H3z"/><path d="M7 13.6c1-1 2.2-1 3.2 0M11 11.2c1-1 2.2-1 3.2 0M14.4 13.6c1-1 2.2-1 3.2 0M9 16c1-1 2.2-1 3.2 0"/><path d="M3 17c-1.4.8-1.4 3 .8 3.2M20.5 13l2 1"/>',
  orchid: '<ellipse cx="12" cy="6.3" rx="2.2" ry="3.6"/><ellipse cx="6.6" cy="10.4" rx="3.6" ry="2.1" transform="rotate(-18 6.6 10.4)"/><ellipse cx="17.4" cy="10.4" rx="3.6" ry="2.1" transform="rotate(18 17.4 10.4)"/><path d="M9.8 12.6c.4 2.4 3.9 2.4 4.4 0-1.4-1-3-1-4.4 0z"/><path d="M12 14.2V22M12 19c-1.6-1.4-3.4-1.6-4.6-1"/>',
  turtle: '<ellipse cx="12" cy="13" rx="5.6" ry="6"/><circle cx="12" cy="4.6" r="1.7"/><path d="M7.2 9.4 3.8 7.2M16.8 9.4l3.4-2.2M7.4 16.8 4.4 19M16.6 16.8l3 2.2M12 7v12M8 13h8"/>',
  butterfly: '<path d="M12 11.5C9.5 5 3.4 4.6 3.6 9.3c.2 3.8 5.2 3.6 8.4 2.2zM12 11.5c2.5-6.5 8.6-6.9 8.4-2.2-.2 3.8-5.2 3.6-8.4 2.2zM12 12.4c-2.7.6-6 2.7-4.8 5.6 1 2.3 4.3.3 4.8-5.6zM12 12.4c2.7.6 6 2.7 4.8 5.6-1 2.3-4.3.3-4.8-5.6z"/><path d="M12 8v11M12 8l-1.6-3M12 8l1.6-3"/>',
  bustard: '<path d="M4.6 14.4c2.2-4 7-5 11-3.2l.8-5.4 2.2-1.2.6 1.2-1.4.8-.6 5.6c-1.6 3.6-7.4 4.8-12.6 2.2z"/><path d="M9.6 16v5M13 16.2v4.8M7 13.4c2-.6 4.4-.4 6.6.8"/>',
};
const glyph = (k) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${G[k]}</svg>`;

const SPECIES = [
  { k: 'tiger', name: 'Bengal tiger', latin: 'Panthera tigris', where: 'Home', note: 'Ranthambhore’s enforcement records are where my question started: what does a record show, and what did it actually measure?' },
  { k: 'monitor', name: 'Bengal monitor', latin: 'Varanus bengalensis', where: 'Home', note: 'Sold online as “hatha jodi”, a codeword that showed up in Hindi and not in English.' },
  { k: 'pangolin', name: 'Indian pangolin', latin: 'Manis crassicaudata', where: 'Work', note: 'Its scales travel under four regional names, and all four went into my trade lexicon at WCS-India.' },
  { k: 'orchid', name: 'Wild orchids', latin: 'Orchidaceae', where: 'Work', note: 'WildTrace follows plants too. Almost no orchid seizures reach the news, so their trade lives in CITES records.' },
  { k: 'turtle', name: 'Olive ridley turtle', latin: 'Lepidochelys olivacea', where: 'Work', note: 'Its nesting on Odisha’s coast is one of 6,000+ reports in the Protected Area Update archive.' },
  { k: 'butterfly', name: 'Blue Mormon', latin: 'Papilio polymnestor', where: 'Journey', note: 'Maharashtra’s state butterfly. The nature walks I ran at IIT Bombay were for people who were not already interested.' },
  { k: 'bustard', name: 'Great Indian bustard', latin: 'Ardeotis nigriceps', where: 'Journey', note: 'Rajasthan’s state bird, now holding on mostly in the Thar desert of the state I grew up in.' },
];

const KEY = 'tv-field-journal-v1';
const load = () => { try { return new Set(JSON.parse(localStorage.getItem(KEY) || '[]')); } catch { return new Set(); } };
const save = (s) => { try { localStorage.setItem(KEY, JSON.stringify([...s])); } catch { /* private mode: the game still works for this visit */ } };
let seen = load();

const btn = document.createElement('button');
btn.className = 'journal-btn';
btn.type = 'button';
btn.setAttribute('aria-expanded', 'false');
btn.setAttribute('aria-controls', 'field-journal');
btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 3.5h11a3 3 0 0 1 3 3v14H8a3 3 0 0 1-3-3z"/><path d="M5 17.5a3 3 0 0 1 3-3h11M9 7.5h6M9 10.5h4"/></svg><span>Field journal</span><span class="count" aria-live="polite"></span>`;

const panel = document.createElement('section');
panel.id = 'field-journal';
panel.className = 'journal';
panel.hidden = true;
panel.setAttribute('aria-label', 'Field journal');

function render() {
  btn.querySelector('.count').textContent = `${seen.size}/${SPECIES.length}`;
  const all = seen.size === SPECIES.length;
  panel.innerHTML = `
    <h2>Field journal</h2>
    <p class="how">Seven species are hiding in the text of this site, marked with a dashed circle. Tap one to add it to your journal. Everything I work on starts with who is looking, so this is a small game about looking closely.</p>
    <ol>${SPECIES.map((s) => `<li class="${seen.has(s.k) ? 'seen' : ''}"><span class="g">${glyph(s.k)}</span><span><b>${seen.has(s.k) ? `${s.name} <i class="muted">${s.latin}</i>` : `Not yet spotted · look on ${s.where}`}</b><span class="note">${s.note}</span></span></li>`).join('')}</ol>
    ${all ? '<p class="done">All seven! You looked more closely than most records do. Thank you for reading this far.</p>' : ''}
    ${seen.size ? '<button class="reset" type="button">Start the journal again</button>' : ''}`;
  panel.querySelector('.reset')?.addEventListener('click', () => { seen = new Set(); save(seen); syncSpots(); render(); });
}

function toggle(open) {
  const willOpen = open ?? panel.hidden;
  panel.hidden = !willOpen;
  btn.setAttribute('aria-expanded', String(willOpen));
}
btn.addEventListener('click', () => toggle());
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !panel.hidden) { toggle(false); btn.focus(); } });
document.addEventListener('click', (e) => { if (!panel.hidden && !panel.contains(e.target) && !btn.contains(e.target) && !e.target.closest('.spot')) toggle(false); });

function syncSpots() {
  document.querySelectorAll('.spot').forEach((b) => b.setAttribute('aria-pressed', String(seen.has(b.dataset.species))));
}

document.querySelectorAll('.spot-slot').forEach((slot) => {
  const s = SPECIES.find((x) => x.k === slot.dataset.species);
  if (!s) return;
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'spot';
  b.dataset.species = s.k;
  b.setAttribute('aria-label', `Spot the ${s.name} for your field journal`);
  b.title = s.name;
  b.innerHTML = glyph(s.k);
  b.addEventListener('click', () => {
    const fresh = !seen.has(s.k);
    seen.add(s.k); save(seen); syncSpots(); render();
    b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop');
    if (fresh) { btn.classList.remove('bump'); void btn.offsetWidth; btn.classList.add('bump'); }
    toggle(true);
  });
  slot.replaceWith(b);
});

document.body.append(panel, btn);
syncSpots();
render();
