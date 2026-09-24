/* Journey: a scroll-driven stop-motion stage.
   Uses GSAP + ScrollTrigger (self-hosted in /assets/vendor). Stepped eases give the stop-motion feel;
   a turbulence filter whose seed changes at 8 fps makes paper edges "boil" like hand-animated film.
   With reduced motion, scenes simply cross-fade and nothing moves on its own. */
const gsap = window.gsap, ScrollTrigger = window.ScrollTrigger;
const stage = document.querySelector('.stage');
const chapters = [...document.querySelectorAll('.chapter[data-scene]')];
const scenes = new Map([...document.querySelectorAll('.scene')].map((s) => [s.dataset.scene, s]));
const frameEl = document.querySelector('.frame-count b');
const yearEl = document.querySelector('.frame-count span');
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let current = null;

function splitType(el) {
  if (el.dataset.split) return;
  el.dataset.split = '1';
  // split every text node into one span per character, keeping coloured child spans intact
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const n of nodes) {
    const frag = document.createDocumentFragment();
    for (const ch of n.nodeValue) { const s = document.createElement('span'); s.className = 'ch'; s.textContent = ch; frag.append(s); }
    n.replaceWith(frag);
  }
}

function enter(scene) {
  if (!gsap || reduced) return;
  const tl = gsap.timeline();
  scene.querySelectorAll('[data-enter]').forEach((el) => {
    const kind = el.dataset.enter, at = +(el.dataset.at || 0), steps = +(el.dataset.steps || 6);
    const ease = `steps(${steps})`;
    const d = +(el.dataset.dur || 0.9);
    switch (kind) {
      case 'left': tl.fromTo(el, { xPercent: -140, opacity: 1 }, { xPercent: 0, duration: d, ease }, at); break;
      case 'right': tl.fromTo(el, { xPercent: 140, opacity: 1 }, { xPercent: 0, duration: d, ease }, at); break;
      case 'up': tl.fromTo(el, { yPercent: 120, opacity: 1 }, { yPercent: 0, duration: d, ease }, at); break;
      case 'drop': tl.fromTo(el, { yPercent: -160, rotation: -8, opacity: 1 }, { yPercent: 0, rotation: +(el.dataset.rot || 0), duration: d, ease }, at); break;
      case 'pop': tl.fromTo(el, { scale: 0, opacity: 1 }, { scale: 1, duration: d * 0.6, ease: `steps(${Math.max(3, steps - 2)})` }, at); break;
      case 'grow': tl.fromTo(el, { scaleY: 0, transformOrigin: '50% 100%' }, { scaleY: 1, duration: d, ease }, at); break;
      case 'fade': tl.fromTo(el, { opacity: 0 }, { opacity: 1, duration: d * 0.5, ease: 'steps(3)' }, at); break;
      case 'type': splitType(el); tl.fromTo(el.querySelectorAll('.ch'), { opacity: 0 }, { opacity: 1, duration: 0.01, stagger: 0.035 }, at); break;
      case 'count': {
        const to = +el.dataset.to, fmt = el.dataset.fmt || '';
        const o = { v: 0 };
        tl.to(o, { v: to, duration: d * 1.4, ease: `steps(${steps * 2})`, onUpdate: () => { el.textContent = Math.round(o.v).toLocaleString('en-GB') + fmt; } }, at);
        break;
      }
      case 'walk': tl.fromTo(el, { xPercent: +(el.dataset.from || 160) }, { xPercent: 0, duration: d * 1.6, ease: `steps(${steps * 2})` }, at)
        .fromTo(el, { yPercent: 0 }, { yPercent: -4, duration: 0.12, ease: 'steps(1)', repeat: Math.round(d * 1.6 / 0.12), yoyo: true }, at); break;
      default: break;
    }
  });
  return tl;
}

function show(id, chapter) {
  if (id === current) return;
  current = id;
  scenes.forEach((s, k) => s.classList.toggle('on', k === id));
  const scene = scenes.get(id);
  if (scene) enter(scene);
  if (yearEl && chapter) yearEl.textContent = chapter.dataset.year || '';
  stage?.setAttribute('aria-label', `Illustration: ${scene?.dataset.label || ''}`);
}

// the "boiling line": swap turbulence seeds at 8 fps while the stage is on screen
const turb = document.querySelector('#boil feTurbulence');
if (turb && !reduced) {
  let seed = 1, visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(stage);
  setInterval(() => { if (visible && !document.hidden) turb.setAttribute('seed', String((seed = (seed % 7) + 1))); }, 125);
}

if (gsap && ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger);
  chapters.forEach((ch) => {
    ScrollTrigger.create({
      trigger: ch, start: 'top 55%', end: 'bottom 55%',
      onToggle: (self) => { if (self.isActive) show(ch.dataset.scene, ch); },
    });
  });
  // frame counter: the whole journey is 240 "frames" of film
  const total = 240;
  ScrollTrigger.create({
    trigger: '.chapters', start: 'top 60%', end: 'bottom bottom',
    onUpdate: (self) => { if (frameEl) frameEl.textContent = String(Math.max(1, Math.round(self.progress * total))).padStart(3, '0'); },
  });
} else {
  // no GSAP (blocked or failed): show scenes as chapters come into view
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) show(e.target.dataset.scene, e.target);
  }, { rootMargin: '-45% 0px -45% 0px' });
  chapters.forEach((c) => io.observe(c));
}
show(chapters[0]?.dataset.scene, chapters[0]);
