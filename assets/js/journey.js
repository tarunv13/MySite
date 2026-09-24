/* Journey: a scroll-driven stage that glides between chapters.
   Uses GSAP + ScrollTrigger (self-hosted in /assets/vendor). Scenes cross-fade in CSS; inside each scene,
   paper, paintings and numbers ease into place with soft expo and back curves.
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
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  scene.querySelectorAll('[data-enter]').forEach((el) => {
    const kind = el.dataset.enter, at = +(el.dataset.at || 0);
    const d = +(el.dataset.dur || 1.1);
    switch (kind) {
      case 'left': tl.fromTo(el, { xPercent: -30, opacity: 0 }, { xPercent: 0, opacity: 1, duration: d }, at); break;
      case 'right': tl.fromTo(el, { xPercent: 30, opacity: 0 }, { xPercent: 0, opacity: 1, duration: d }, at); break;
      case 'up': tl.fromTo(el, { yPercent: 18, opacity: 0 }, { yPercent: 0, opacity: 1, duration: d }, at); break;
      case 'drop': tl.fromTo(el, { yPercent: -24, rotation: -5, opacity: 0 }, { yPercent: 0, rotation: +(el.dataset.rot || 0), opacity: 1, duration: d * 1.1 }, at); break;
      case 'pop': tl.fromTo(el, { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: d * 0.9, ease: 'back.out(1.7)' }, at); break;
      case 'grow': tl.fromTo(el, { scaleY: 0, transformOrigin: '50% 100%' }, { scaleY: 1, duration: d, ease: 'power3.out' }, at); break;
      case 'fade': tl.fromTo(el, { opacity: 0 }, { opacity: 1, duration: d * 0.8, ease: 'power2.out' }, at); break;
      case 'type': splitType(el); tl.fromTo(el.querySelectorAll('.ch'), { opacity: 0 }, { opacity: 1, duration: 0.18, stagger: 0.028, ease: 'power1.out' }, at); break;
      case 'count': {
        const to = +el.dataset.to, fmt = el.dataset.fmt || '';
        const o = { v: 0 };
        tl.to(o, { v: to, duration: d * 1.4, ease: 'power3.out', onUpdate: () => { el.textContent = Math.round(o.v).toLocaleString('en-GB') + fmt; } }, at);
        break;
      }
      case 'walk': tl.fromTo(el, { xPercent: +(el.dataset.from || 60), opacity: 0 }, { xPercent: 0, opacity: 1, duration: d * 1.8, ease: 'power2.out' }, at); break;
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
