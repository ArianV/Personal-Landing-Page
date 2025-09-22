// assets/slideshow.js
document.addEventListener('DOMContentLoaded', () => {
  // -------------------------------
  // Slider (keep your existing logic)
  // -------------------------------
  const sliderRoot = document.querySelector('[data-slider]');
  if (sliderRoot) {
    const slideList = sliderRoot.querySelector('.slider-list');
    const slides = slideList ? [...slideList.querySelectorAll('.slide')] : [];
    let index = slides.findIndex(slide => slide.classList.contains('is-active'));
    if (index === -1) index = 0;


    let isAnimating = false;
    function setActive(newIndex, direction = 1) {
      if (isAnimating) return;
      newIndex = (newIndex + slides.length) % slides.length;
      if (newIndex === index) return;
      isAnimating = true;

      const oldIndex = index;
      const outgoing = slides[oldIndex];
      // If a previous transition left listeners/timeouts on the outgoing slide, clear them
      try {
        if (outgoing && outgoing._transitionHandler) {
          try { outgoing.removeEventListener('transitionend', outgoing._transitionHandler); } catch (e) {}
          try { clearTimeout(outgoing._transitionTimeout); } catch (e) {}
          delete outgoing._transitionHandler;
          delete outgoing._transitionTimeout;
        }
      } catch (e) { /* ignore */ }
      const incoming = slides[newIndex];

      // Clear any previous animation classes
      outgoing.classList.remove('slide-left', 'slide-right');
      incoming.classList.remove('slide-left', 'slide-right');

      // Prepare incoming: place it offscreen in the correct direction, then mark active
      if (direction === 1) {
        // moving forward: incoming comes from right
        incoming.classList.add('slide-right');
      } else {
        // moving backward: incoming comes from left
        incoming.classList.add('slide-left');
      }

      // Make incoming participate in layout (is-active) so transform is applied
      incoming.classList.add('is-active');
      incoming.setAttribute('aria-hidden', 'false');
      incoming.tabIndex = 0;
      // Move focus to the incoming slide now so we don't end up hiding a focused element
      try {
        incoming.focus({ preventScroll: true });
      } catch (err) {
        // some older browsers don't support the options object
        try { incoming.focus(); } catch (e) { /* ignore */ }
      }

      // Force a reflow so the browser registers the starting transform
      // then remove the positional class so it transitions to transform: 0
      void incoming.offsetWidth;
      incoming.classList.remove(direction === 1 ? 'slide-right' : 'slide-left');

      // Animate outgoing offscreen in the opposite direction
      if (direction === 1) {
        outgoing.classList.add('slide-left');
      } else {
        outgoing.classList.add('slide-right');
      }

      // When outgoing finishes transitioning, clean up classes
      const onOutgoingEnd = (e) => {
        if (e.target !== outgoing) return;
        // ensure focus is not inside the outgoing slide before hiding it
        try {
          if (outgoing.contains(document.activeElement)) {
            incoming.focus({ preventScroll: true });
          } else {
            // blur any focused element inside outgoing
            const active = outgoing.querySelector(':focus');
            if (active && typeof active.blur === 'function') active.blur();
          }
        } catch (err) {
          /* ignore focus errors */
        }

        outgoing.classList.remove('is-active', 'slide-left', 'slide-right');
        outgoing.setAttribute('aria-hidden', 'true');
        outgoing.tabIndex = -1;
        index = newIndex;
        isAnimating = false;
      };

      // Fallback: if no transitionend fires, ensure cleanup after max duration
      let finished = false;
      const timeout = setTimeout(() => {
        if (finished) return;
        finished = true;
        try { outgoing.removeEventListener('transitionend', transitionHandler); } catch (e) {}
        try { delete outgoing._transitionHandler; } catch (e) {}
        try { delete outgoing._transitionTimeout; } catch (e) {}
        onOutgoingEnd({ target: outgoing });
        try { incoming.focus(); } catch (e) {}
      }, 700);

      // Named transition handler so we can remove the exact same reference
      const transitionHandler = function (e) {
        if (finished) return;
        if (e.target !== outgoing) return;
        finished = true;
        clearTimeout(timeout);
        try { outgoing.removeEventListener('transitionend', transitionHandler); } catch (e) {}
        onOutgoingEnd(e);
      };

  // store references so we can clear them if a later transition interrupts
  try { outgoing._transitionHandler = transitionHandler; } catch (e) {}
  try { outgoing._transitionTimeout = timeout; } catch (e) {}
  outgoing.addEventListener('transitionend', transitionHandler);
    }

    // Arrow navigation
    const leftArrow = sliderRoot.querySelector('.slider-arrow-left');
    const rightArrow = sliderRoot.querySelector('.slider-arrow-right');
  if (leftArrow) leftArrow.addEventListener('click', function(e) { e.preventDefault(); setActive(index - 1, -1); });
  if (rightArrow) rightArrow.addEventListener('click', function(e) { e.preventDefault(); setActive(index + 1, 1); });

    // Fallback: delegated click handling on the slider root (catches buttons inserted differently)
    sliderRoot.addEventListener('click', function (e) {
      const btn = e.target.closest && e.target.closest('.slider-arrow');
      if (!btn) return;
      e.preventDefault();
      if (btn.classList.contains('slider-arrow-left')) {
        setActive(index - 1, -1);
      } else if (btn.classList.contains('slider-arrow-right')) {
        setActive(index + 1, 1);
      }
    });

    // Keyboard navigation (optional)
    sliderRoot.addEventListener('keydown', function(e) {
      if (e.key === 'ArrowLeft') { setActive(index - 1, -1); }
      if (e.key === 'ArrowRight') { setActive(index + 1, 1); }
    });

    // Ensure only the first slide is active on load
    // On load, show only the first slide
    slides.forEach((slide, idx) => {
      slide.classList.remove('slide-left', 'slide-right');
      const hasFocusInside = slide.contains(document.activeElement);
      if (idx === index) {
        slide.classList.add('is-active');
        slide.setAttribute('aria-hidden', 'false');
        slide.tabIndex = 0;
        if (hasFocusInside) try { slide.focus({ preventScroll: true }); } catch (e) { try { slide.focus(); } catch (e) {} }
      } else {
        slide.classList.remove('is-active');
        // If focus is inside a non-active slide, avoid hiding it — move focus to the active slide first
        if (hasFocusInside) {
          try { slides[index].focus({ preventScroll: true }); } catch (e) { try { slides[index].focus(); } catch (e) {} }
        }
        slide.setAttribute('aria-hidden', 'true');
        slide.tabIndex = -1;
      }
    });

    // -------------------------------
    // Auto-advance (autoplay)
    // -------------------------------
    const AUTO_MS = 5000; // 5 seconds
    let _autoTimer = null;

    function startAuto() {
      if (_autoTimer) return;
      if (!slides || slides.length <= 1) return;
      _autoTimer = setInterval(() => {
        // rely on setActive's guards
        try { setActive(index + 1, 1); } catch (e) { /* ignore */ }
      }, AUTO_MS);
    }

    function stopAuto() {
      if (!_autoTimer) return;
      clearInterval(_autoTimer);
      _autoTimer = null;
    }

    function resetAuto() {
      stopAuto();
      // small delay to avoid immediate flip when user clicked
      setTimeout(startAuto, 300);
    }

    // Pause when user interacts (hover or focus) and resume afterwards
    sliderRoot.addEventListener('mouseenter', stopAuto);
    sliderRoot.addEventListener('mouseleave', (e) => { startAuto(); });
    sliderRoot.addEventListener('focusin', stopAuto);
    sliderRoot.addEventListener('focusout', (e) => {
      const related = e.relatedTarget;
      if (!related || !sliderRoot.contains(related)) startAuto();
    });

    // Pause while tab is in background
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stopAuto(); else startAuto();
    });

    // Reset autoplay when user navigates manually
    if (leftArrow) leftArrow.addEventListener('click', resetAuto);
    if (rightArrow) rightArrow.addEventListener('click', resetAuto);
    sliderRoot.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') resetAuto();
    });

    // Start autoplay
    startAuto();

    // Cleanup on unload
    window.addEventListener('beforeunload', stopAuto);
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
