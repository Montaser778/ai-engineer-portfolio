/* motion.js — v5 §37 curtain page transitions + §39 scroll-velocity skew.
   Additive IIFE. No-ops under prefers-reduced-motion or on failure. */
(function () {
  try {
    var reduce = false;
    try { reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
    if (reduce) return;

    /* ---- §37 curtain transitions ---- */
    (function curtain() {
      if (document.getElementById('mh-curtain')) return;
      var wrap = document.createElement('div');
      wrap.id = 'mh-curtain';
      wrap.setAttribute('aria-hidden', 'true');
      for (var i = 0; i < 5; i++) {
        var p = document.createElement('div');
        p.className = 'mh-panel';
        p.style.animationDelay = (i * 50) + 'ms';
        wrap.appendChild(p);
      }
      document.documentElement.appendChild(wrap);

      function playIn() {
        wrap.classList.remove('mh-out');
        wrap.classList.add('mh-in');
        setTimeout(function () { wrap.classList.remove('mh-in'); }, 650);
      }
      playIn();

      window.addEventListener('pageshow', function (e) {
        if (e.persisted) { wrap.classList.remove('mh-in', 'mh-out'); }
      });

      document.addEventListener('click', function (e) {
        var a = e.target.closest && e.target.closest('a');
        if (!a) return;
        if (a.target === '_blank' || a.hasAttribute('download')) return;
        var href = a.getAttribute('href');
        if (!href || href.charAt(0) === '#') return;
        if (href.indexOf('mailto:') === 0 || href.indexOf('tel:') === 0) return;
        var url;
        try { url = new URL(href, window.location.href); } catch (e2) { return; }
        if (url.origin !== window.location.origin) return;
        if (url.pathname === window.location.pathname && url.hash) return;
        e.preventDefault();
        wrap.classList.add('mh-out');
        setTimeout(function () { window.location.href = url.href; }, 520);
      }, true);
    })();

    /* ---- §39 scroll-velocity skew ---- */
    (function skew() {
      var isFine = window.matchMedia && window.matchMedia('(pointer: fine)').matches;
      var els = document.querySelectorAll('[data-skew]');
      if (!els.length) return;
      var lastY = window.scrollY || 0;
      var vel = 0;
      var raf = null;

      function onScroll() {
        var y = window.scrollY || 0;
        var dy = y - lastY;
        lastY = y;
        dy = Math.max(-42, Math.min(42, dy));
        vel += (dy - vel) * 0.1;
        if (!raf) raf = requestAnimationFrame(tick);
      }

      function tick() {
        raf = null;
        vel *= 0.86;
        var deg = vel * 0.06;
        if (Math.abs(deg) < 0.05) {
          els.forEach(function (el) { el.style.transform = ''; });
          return;
        }
        var scaleY = 1 - Math.abs(deg) * 0.002;
        els.forEach(function (el) {
          el.style.transform = 'skewY(' + deg.toFixed(3) + 'deg) scaleY(' + scaleY.toFixed(4) + ')';
        });
        raf = requestAnimationFrame(tick);
      }

      window.addEventListener('scroll', onScroll, { passive: true });
    })();
  } catch (e) {
    /* degrade to nothing */
  }
})();
