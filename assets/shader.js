// assets/shader.js
(() => {
  const canvas = document.getElementById("bg-canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d", { alpha: true });
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  let W = 0, H = 0;
const smallScreen = window.matchMedia("(max-width: 480px)").matches;

  // ----- parameters you can tune -----
const PCOUNT = smallScreen ? 60 : 360;        // fewer particles on small screens
  const SPRING = 0.0045;       // pull back to home (higher = snappier return)
  const FRICTION = 0.985;      // velocity damping
  const DRIFT = 0.18;          // random per-frame jitter (keeps field lively)
  const MAX_SPEED = 1.0;       // clamp particle speed (px/frame @ dpr=1)
const MOUSE_RADIUS = smallScreen ? 120 : 160; // smaller influence zone on phones
  const MOUSE_STRENGTH = 0.03; // how strongly nearby particles are pulled
  const LINK_DIST = 140;       // max distance for connecting lines (px)
  // -----------------------------------

  const BG = "rgba(10,10,10,1)";
  const DOT = "rgba(138,91,255,0.85)";    // purple particles
  const LINK = "rgba(138,91,255,0.15)";   // faint connecting lines

  // homes are stored normalized so resize keeps layout
  const particles = [];
  const rand = (min, max) => Math.random() * (max - min) + min;

function resize() {
  const cssW = window.innerWidth;
  const cssH = window.innerHeight; // full page height
  W = Math.floor(cssW * dpr);
  H = Math.floor(cssH * dpr);
  canvas.style.width = cssW + "px";
  canvas.style.height = cssH + "px";
  canvas.width = W;
  canvas.height = H;

  particles.forEach(p => {
    p.hx = p.ux * W;
    p.hy = p.uy * H;
    if (p.x == null) { p.x = p.hx; p.y = p.hy; }
  });
}


  // mouse state (in device pixels)
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  function lerp(a,b,t){ return a + (b - a) * t; }

  function onMove(e) {
    const rect = canvas.getBoundingClientRect();
    mouse.tx = (e.clientX - rect.left) * dpr;
    mouse.ty = (e.clientY - rect.top) * dpr;
  }
  function onLeave() {
    // park the target roughly toward upper center when mouse leaves
    mouse.tx = W * 0.5; mouse.ty = H * 0.4;
  }

  window.addEventListener("mousemove", onMove, { passive: true });
  window.addEventListener("touchmove", (e) => {
    if (e.touches && e.touches[0]) onMove(e.touches[0]);
  }, { passive: true });
  window.addEventListener("mouseleave", onLeave);
  window.addEventListener("blur", onLeave);

  // init particles (with normalized homes so layout survives resize)
  for (let i = 0; i < PCOUNT; i++) {
    const ux = Math.random();           // 0..1 across width
    const uy = Math.random() * 0.9 + 0.05; // avoid very top edge
    particles.push({
      ux, uy,                  // normalized home coords
      hx: 0, hy: 0,            // home (px) filled on resize()
      x: null, y: null,        // current pos (px)
      vx: rand(-0.25, 0.25),   // velocity
      vy: rand(-0.25, 0.25),
      r: rand(1.1, 2.4)        // radius
    });
  }

  window.addEventListener("resize", resize, { passive: true });
  resize();
  onLeave(); // initialize mouse target

  const hasReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let raf = 0;
  function tick() {
    // ease mouse for smoothness
    mouse.x = lerp(mouse.x, mouse.tx, 0.1);
    mouse.y = lerp(mouse.y, mouse.ty, 0.1);

    // clear
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    const rInfluence2 = (MOUSE_RADIUS * dpr) ** 2;
    const linkDist2 = (LINK_DIST * dpr) ** 2;
    const maxSp2 = (MAX_SPEED * dpr) ** 2;

    // update + draw dots
    ctx.fillStyle = DOT;
    for (let p of particles) {
      // spring back toward home
      let ax = (p.hx - p.x) * SPRING;
      let ay = (p.hy - p.y) * SPRING;

      // local mouse attraction only if close enough
      const dx = mouse.x - p.x;
      const dy = mouse.y - p.y;
      const d2 = dx*dx + dy*dy;

      if (d2 < rInfluence2) {
        // proportionally stronger when closer; gentle at edge
        const falloff = 1 - d2 / rInfluence2; // 0..1
        ax += dx * MOUSE_STRENGTH * falloff;
        ay += dy * MOUSE_STRENGTH * falloff;
      }

      // small random drift (keeps field alive)
      ax += (Math.random() - 0.5) * DRIFT * dpr * 0.01;
      ay += (Math.random() - 0.5) * DRIFT * dpr * 0.01;

      // integrate
      p.vx = (p.vx + ax) * FRICTION;
      p.vy = (p.vy + ay) * FRICTION;

      // clamp speed
      const sp2 = p.vx*p.vx + p.vy*p.vy;
      if (sp2 > maxSp2) {
        const s = Math.sqrt(maxSp2 / sp2);
        p.vx *= s; p.vy *= s;
      }

      p.x += p.vx;
      p.y += p.vy;

      // draw dot
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // connecting lines between nearby particles
    ctx.strokeStyle = LINK;
    for (let i = 0; i < particles.length; i++) {
      const a = particles[i];
      for (let j = i + 1; j < particles.length; j++) {
        const b = particles[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d2 = dx*dx + dy*dy;
        if (d2 < linkDist2) {
          const alpha = 1 - d2 / linkDist2;
          ctx.globalAlpha = alpha * 0.9;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    raf = requestAnimationFrame(tick);
  }

  if (!hasReducedMotion) {
    tick();
  } else {
    // static render for reduced motion
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = DOT;
    for (let p of particles) {
      ctx.beginPath();
      ctx.arc(p.hx, p.hy, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  window.addEventListener("pagehide", () => cancelAnimationFrame(raf));
})();
