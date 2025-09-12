// assets/slideshow.js
document.addEventListener('DOMContentLoaded', () => {
  // -------------------------------
  // Slider (keep your existing logic)
  // -------------------------------
  const sliderRoot = document.querySelector('[data-slider]');
  if (sliderRoot) {
    const slides = [...sliderRoot.querySelectorAll('[data-slide]')];
    const dots   = [...sliderRoot.querySelectorAll('[data-dot]')];
    let index = 0;

    function setActive(i) {
      const prev = index;
      index = (i + slides.length) % slides.length;
      slides[prev]?.classList.remove('is-active');
      slides[index]?.classList.add('is-active');
      dots[prev]?.setAttribute('aria-selected', 'false');
      dots[index]?.setAttribute('aria-selected', 'true');
    }

    dots.forEach((d, i) => d.addEventListener('click', () => setActive(i)));
  }

  // -------------------------------
  // Scroll Spy (nav highlight on scroll)
  // -------------------------------
  const enableLogs = false; // flip to true for debugging
  const navLinks = [...document.querySelectorAll('.site-nav a')];
  if (!navLinks.length) return;

  // Build a map from section id -> nav link
  const linkById = new Map();
  navLinks.forEach(a => {
    const href = a.getAttribute('href') || '';
    if (href.startsWith('#') && href.length > 1) {
      linkById.set(href.slice(1), a);
    }
  });

  // Sections we care about (must have id that matches a nav href)
  const targets = [
    ...document.querySelectorAll('.hero'),           // if you have a hero with id
    ...document.querySelectorAll('main section')     // projects, about, skills, etc.
  ].filter(el => el.id && linkById.has(el.id));

  if (!targets.length) {
    if (enableLogs) console.warn('[scroll-spy] No matching targets found.');
    return;
  }

  // Helper: activate a given id in nav
  function activate(id) {
    navLinks.forEach(a => a.classList.remove('is-active'));
    const link = linkById.get(id);
    if (link) link.classList.add('is-active');
    if (enableLogs) console.debug('[scroll-spy] active ->', id);
  }

  // Initial activation (for mid-page loads)
  (function initialActivate() {
    const midY = window.innerHeight / 2;
    const current = targets.find(t => {
      const r = t.getBoundingClientRect();
      return r.top <= midY && r.bottom >= midY;
    });
    if (current) activate(current.id);
  })();

  // Use IntersectionObserver when available
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        // Choose the entry closest to viewport center that is intersecting
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => Math.abs(0.5 - a.intersectionRatio) - Math.abs(0.5 - b.intersectionRatio));

        if (visible.length) {
          // Prefer the one with the largest intersection ratio
          visible.sort((a, b) => b.intersectionRatio - a.intersectionRatio);
          activate(visible[0].target.id);
        }
      },
      {
        // Trigger around the middle of the viewport
        root: null,
        rootMargin: '-45% 0px -45% 0px',
        threshold: Array.from({ length: 11 }, (_, i) => i / 10) // 0, .1, .2, ... 1
      }
    );

    targets.forEach(t => io.observe(t));
  } else {
    // Fallback: scroll handler (rarely needed)
    const onScroll = () => {
      const midY = window.innerHeight / 2;
      let best = null;
      let bestDist = Infinity;
      targets.forEach(t => {
        const r = t.getBoundingClientRect();
        const dist = Math.abs((r.top + r.bottom) / 2 - midY);
        if (r.top <= midY && r.bottom >= 0 && dist < bestDist) {
          best = t; bestDist = dist;
        }
      });
      if (best) activate(best.id);
    };
    document.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
  }

  // Optional: smooth scrolling on nav click (CSS alternative: html{scroll-behavior:smooth})
  navLinks.forEach(a => {
    const href = a.getAttribute('href') || '';
    if (href.startsWith('#') && href.length > 1) {
      a.addEventListener('click', (e) => {
        const target = document.getElementById(href.slice(1));
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }
  });
});
