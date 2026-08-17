/* site.js — UI chrome injected on every page. IIFE modules, each no-ops
   safely when its target markup is absent. */
(function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(pointer: fine)').matches;

  var PAGES = [
    { title: 'Home', href: 'index.html', key: 'h' },
    { title: 'Projects', href: 'projects.html', key: 'p' },
    { title: 'Muhawir case study', href: 'project-muhawir.html' },
    { title: 'Live demos', href: 'demos.html' },
    { title: 'Notes', href: 'notes.html', key: 'n' },
    { title: 'About', href: 'about.html', key: 'a' },
    { title: 'Services', href: 'services.html', key: 's' },
    { title: 'Pricing', href: 'pricing.html' },
    { title: 'Resume', href: 'resume.html', key: 'r' },
    { title: 'Contact', href: 'contact.html', key: 'c' },
    { title: 'Multi-agent case study', href: 'project-agents.html' },
    { title: 'Uses', href: 'uses.html' },
    { title: 'Changelog', href: 'changelog.html' },
    { title: 'Search', href: 'search.html' }
  ];

  /* =========================================================================
     0. Skip link + header/nav/footer injection is assumed already in markup.
        (Header/nav/footer are written per-page for clean progressive rendering,
        but the chrome behaviours below are fully JS-driven.)
     ========================================================================= */

  /* =========================================================================
     1. Preloader
     ========================================================================= */
  (function preloader() {
    var el = document.getElementById('preloader');
    if (!el) { document.body.classList.add('ready'); return; }
    var bar = el.querySelector('.pl-bar');
    var pct = el.querySelector('.pl-pct');
    var p = 0;
    var timer = setInterval(function () {
      p += Math.random() * 18 + 6;
      if (p >= 100) {
        p = 100;
        clearInterval(timer);
        setTimeout(function () { document.body.classList.add('ready'); }, 250);
      }
      if (bar) bar.style.width = p + '%';
      if (pct) pct.textContent = Math.floor(p) + '%';
    }, 140);
    window.addEventListener('load', function () {
      setTimeout(function () {
        if (!document.body.classList.contains('ready')) {
          p = 100; clearInterval(timer);
          if (bar) bar.style.width = '100%';
          if (pct) pct.textContent = '100%';
          document.body.classList.add('ready');
        }
      }, 1800);
    });
  })();

  /* =========================================================================
     2. Custom cursor
     ========================================================================= */
  (function cursor() {
    if (!fine || reduced) return;
    var dot = document.createElement('div');
    dot.className = 'cursor-dot';
    var ring = document.createElement('div');
    ring.className = 'cursor-ring';
    document.body.appendChild(dot);
    document.body.appendChild(ring);

    var mx = -100, my = -100, rx = -100, ry = -100;
    window.addEventListener('pointermove', function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = 'translate(' + mx + 'px,' + my + 'px) translate(-50%,-50%)';
      var target = e.target.closest && e.target.closest('a, button, input, textarea, select, .card, [data-tilt]');
      ring.classList.toggle('hover', !!target);
    }, { passive: true });

    function tick() {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px) translate(-50%,-50%)';
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  })();

  /* =========================================================================
     3. Scroll progress bar
     ========================================================================= */
  (function progressBar() {
    var bar = document.getElementById('scroll-progress');
    if (!bar) return;
    function update() {
      var doc = document.documentElement;
      var max = (doc.scrollHeight - window.innerHeight) || 1;
      var p = Math.min(Math.max(window.scrollY / max, 0), 1);
      bar.style.transform = 'scaleX(' + p + ')';
    }
    window.addEventListener('scroll', update, { passive: true });
    update();
  })();

  /* =========================================================================
     4. Command palette
     ========================================================================= */
  (function commandPalette() {
    var backdrop = document.createElement('div');
    backdrop.id = 'cmdk-backdrop';
    backdrop.innerHTML =
      '<div id="cmdk" role="dialog" aria-modal="true" aria-label="Command palette">' +
      '<input type="text" placeholder="Jump to a page, or type a command..." aria-label="Search pages and actions" />' +
      '<ul role="listbox"></ul>' +
      '</div>';
    document.body.appendChild(backdrop);
    var input = backdrop.querySelector('input');
    var list = backdrop.querySelector('ul');

    var actions = [
      { title: 'Copy page link', run: function () {
          if (navigator.clipboard) navigator.clipboard.writeText(window.location.href).catch(function () {});
          closePalette();
        }, hint: 'action' }
    ];

    var items = PAGES.map(function (p) { return { title: p.title, hint: p.key ? p.key.toUpperCase() : '', run: function () { window.location.href = p.href; } }; })
      .concat(actions);

    var filtered = items.slice();
    var activeIndex = 0;

    function render() {
      list.innerHTML = '';
      filtered.forEach(function (item, i) {
        var li = document.createElement('li');
        li.setAttribute('role', 'option');
        li.setAttribute('aria-selected', i === activeIndex ? 'true' : 'false');
        li.innerHTML = '<span>' + (item.html || item.title) + '</span><span class="hint">' + (item.hint || '') + '</span>';
        li.addEventListener('click', function () { item.run(); });
        list.appendChild(li);
      });
    }

    function openPalette() {
      document.body.classList.add('cmdk-open');
      input.value = '';
      filtered = items.slice();
      activeIndex = 0;
      render();
      setTimeout(function () { input.focus(); }, 10);
    }
    function closePalette() {
      document.body.classList.remove('cmdk-open');
    }
    window.__openCommandPalette = openPalette;

    /* content search (§17) — fetched once, scored client-side */
    var searchIndex = null;
    fetch('assets/data/search-index.json').then(function (r) { return r.ok ? r.json() : []; }).then(function (d) { searchIndex = d; }).catch(function () { searchIndex = []; });

    function escapeHtml(s) { return s.replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); }
    function highlight(text, terms) {
      var out = escapeHtml(text);
      terms.forEach(function (t) {
        if (!t) return;
        out = out.replace(new RegExp('(' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig'), '<mark>$1</mark>');
      });
      return out;
    }
    function scoreEntry(entry, terms) {
      var score = 0;
      var title = (entry.title || '').toLowerCase();
      var section = (entry.section || '').toLowerCase();
      var body = (entry.body || '').toLowerCase();
      terms.forEach(function (t) {
        if (title.indexOf(t) !== -1) score += 3;
        if (section.indexOf(t) !== -1) score += 2;
        if (body.indexOf(t) !== -1) score += 1;
      });
      if (terms.length > 1 && body.indexOf(terms.join(' ')) !== -1) score += 2;
      return score;
    }

    var debounceTimer;
    input.addEventListener('input', function () {
      clearTimeout(debounceTimer);
      var raw = input.value;
      debounceTimer = setTimeout(function () {
        var q = raw.toLowerCase().trim();
        if (!q) { filtered = items.slice(); activeIndex = 0; render(); return; }
        var pageMatches = items.filter(function (item) { return item.title.toLowerCase().indexOf(q) !== -1; });
        var contentMatches = [];
        if (searchIndex && searchIndex.length) {
          var terms = q.split(/\s+/).filter(Boolean);
          contentMatches = searchIndex
            .map(function (e) { return { entry: e, score: scoreEntry(e, terms) }; })
            .filter(function (r) { return r.score > 0; })
            .sort(function (a, b) { return b.score - a.score; })
            .slice(0, 10)
            .map(function (r) {
              return {
                title: r.entry.title,
                html: highlight(r.entry.title, terms) + '<br><span class="hint" style="display:block;margin-top:2px">' + highlight((r.entry.body || '').slice(0, 90), terms) + '…</span>',
                hint: r.entry.type || '',
                run: function () { window.location.href = r.entry.url; }
              };
            });
        }
        filtered = contentMatches.length ? contentMatches : pageMatches;
        activeIndex = 0;
        render();
      }, 120);
    });

    backdrop.addEventListener('click', function (e) { if (e.target === backdrop) closePalette(); });

    document.addEventListener('keydown', function (e) {
      var open = document.body.classList.contains('cmdk-open');
      var typing = /input|textarea|select/i.test(document.activeElement.tagName) || document.activeElement.isContentEditable;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        open ? closePalette() : openPalette();
        return;
      }
      if (!open && e.key === '/' && !typing) {
        e.preventDefault();
        openPalette();
        return;
      }
      if (!open && !typing) {
        var page = PAGES.find(function (p) { return p.key === e.key; });
        if (page) { window.location.href = page.href; }
        return;
      }
      if (!open) return;

      if (e.key === 'Escape') { closePalette(); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); activeIndex = Math.min(activeIndex + 1, filtered.length - 1); render(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); activeIndex = Math.max(activeIndex - 1, 0); render(); }
      else if (e.key === 'Enter') { e.preventDefault(); if (filtered[activeIndex]) filtered[activeIndex].run(); }
    });

    var trigger = document.getElementById('kbtn');
    if (trigger) trigger.addEventListener('click', openPalette);
  })();

  /* =========================================================================
     5. Split headline reveal
     ========================================================================= */
  (function splitReveal() {
    var targets = document.querySelectorAll('[data-split]');
    targets.forEach(function (el) {
      var html = el.innerHTML;
      var lines = html.split(/<br\s*\/?>/i);
      el.innerHTML = lines.map(function (line) {
        return '<span class="split-line"><span>' + line + '</span></span>';
      }).join('');
    });
    if (!targets.length) return;
    if (reduced) { targets.forEach(function (el) { el.classList.add('revealed'); }); return; }

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.16 });
      targets.forEach(function (el) { io.observe(el); });
    } else {
      targets.forEach(function (el) { el.classList.add('revealed'); });
    }
  })();

  /* =========================================================================
     6. Scroll reveals + counters + skill bars
     ========================================================================= */
  (function revealsAndCounters() {
    var reveals = document.querySelectorAll('[data-reveal]');
    var counters = document.querySelectorAll('[data-counter]:not([data-counter-eager])');
    var skills = document.querySelectorAll('.skill-fill');

    function runCounter(el) {
      var target = parseFloat(el.getAttribute('data-counter'));
      var suffix = el.getAttribute('data-suffix') || '';
      if (reduced || isNaN(target)) { el.textContent = target + suffix; return; }
      var start = 0;
      var duration = 1200;
      var t0 = performance.now();
      function step(now) {
        var p = Math.min((now - t0) / duration, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.floor(start + (target - start) * eased) + suffix;
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    function runSkill(el) {
      var pct = el.getAttribute('data-width') || el.style.getPropertyValue('--w') || '0%';
      el.style.width = pct;
    }

    function reveal(el) {
      el.classList.add('revealed');
      if (el.hasAttribute('data-counter')) runCounter(el);
      if (el.classList.contains('skill-fill')) runSkill(el);
    }

    var all = Array.prototype.slice.call(reveals).concat(Array.prototype.slice.call(counters), Array.prototype.slice.call(skills));

    /* §129: above-the-fold metrics animate on load, not on scroll */
    document.querySelectorAll('[data-counter-eager]').forEach(function (el) {
      el.classList.add('revealed');
      runCounter(el);
    });

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { reveal(entry.target); io.unobserve(entry.target); }
        });
      }, { threshold: 0.16 });
      all.forEach(function (el) { io.observe(el); });
    } else {
      all.forEach(reveal);
    }

    window.addEventListener('load', function () {
      all.forEach(function (el) {
        var rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0 && !el.classList.contains('revealed')) reveal(el);
      });
    });
  })();

  /* =========================================================================
     7. Magnetic buttons
     ========================================================================= */
  (function magnetic() {
    if (!fine || reduced) return;
    var btns = document.querySelectorAll('[data-magnetic], .btn');
    btns.forEach(function (btn) {
      var tx = 0, ty = 0, cx = 0, cy = 0, raf = null;
      btn.addEventListener('pointermove', function (e) {
        var rect = btn.getBoundingClientRect();
        tx = (e.clientX - rect.left - rect.width / 2) * 0.18;
        ty = (e.clientY - rect.top - rect.height / 2) * 0.28;
        if (!raf) raf = requestAnimationFrame(tick);
      }, { passive: true });
      btn.addEventListener('pointerleave', function () { tx = 0; ty = 0; }, { passive: true });
      function tick() {
        cx += (tx - cx) * 0.2;
        cy += (ty - cy) * 0.2;
        btn.style.transform = 'translate(' + cx + 'px,' + cy + 'px)';
        if (Math.abs(cx - tx) > 0.05 || Math.abs(cy - ty) > 0.05) raf = requestAnimationFrame(tick);
        else raf = null;
      }
    });
  })();

  /* =========================================================================
     8. Mobile nav + header shrink
     ========================================================================= */
  (function mobileNav() {
    var burger = document.querySelector('.burger');
    var header = document.querySelector('header.site-header');
    if (burger) {
      burger.addEventListener('click', function () {
        var open = document.body.classList.toggle('nav-open');
        document.body.style.overflow = open ? 'hidden' : '';
        burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      document.querySelectorAll('nav.main-nav a').forEach(function (a) {
        a.addEventListener('click', function () {
          document.body.classList.remove('nav-open');
          document.body.style.overflow = '';
        });
      });
    }
    if (header) {
      function onScroll() {
        header.classList.toggle('scrolled', window.scrollY > 40);
      }
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }
  })();

  /* =========================================================================
     9. Project filters
     ========================================================================= */
  (function filters() {
    var pills = document.querySelectorAll('.filter-pill');
    var cards = document.querySelectorAll('[data-cats]');
    if (!pills.length || !cards.length) return;
    pills.forEach(function (pill) {
      pill.addEventListener('click', function () {
        pills.forEach(function (p) { p.setAttribute('aria-pressed', 'false'); });
        pill.setAttribute('aria-pressed', 'true');
        var cat = pill.getAttribute('data-filter');
        var i = 0;
        cards.forEach(function (card) {
          var cats = (card.getAttribute('data-cats') || '').split(',');
          var show = cat === 'all' || cats.indexOf(cat) !== -1;
          if (show) {
            card.style.display = '';
            card.style.animation = 'none';
            void card.offsetWidth;
            card.style.transitionDelay = (i * 0.05) + 's';
            card.classList.remove('revealed');
            requestAnimationFrame(function () { card.classList.add('revealed'); });
            i++;
          } else {
            card.style.display = 'none';
          }
        });
      });
    });
  })();

  /* =========================================================================
     10. FAQ accordion
     ========================================================================= */
  (function faq() {
    var qs = document.querySelectorAll('.faq-q');
    qs.forEach(function (btn) {
      btn.setAttribute('aria-expanded', 'false');
      var panel = btn.nextElementSibling;
      btn.addEventListener('click', function () {
        var open = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', open ? 'false' : 'true');
        if (panel) panel.style.maxHeight = open ? '0px' : panel.scrollHeight + 'px';
      });
    });
  })();

  /* =========================================================================
     11. Contact form — fetch POST with honeypot + time-trap, mailto fallback (§21)
     ========================================================================= */
  (function contactForm() {
    var form = document.getElementById('contact-form');
    if (!form) return;
    var loadedAt = Date.now();
    var FORM_ENDPOINT = 'REPLACE_FORM_ENDPOINT';

    // pre-fill from ?subject= (used by "discuss this note" links)
    var qs = new URLSearchParams(window.location.search);
    var subjectParam = qs.get('subject');
    if (subjectParam) {
      var msgField = form.querySelector('[name="message"]');
      if (msgField && !msgField.value) msgField.value = 'Re: ' + subjectParam + '\n\n';
    }

    function mailtoFallback() {
      var name = form.querySelector('[name="name"]');
      var message = form.querySelector('[name="message"]');
      var company = form.querySelector('[name="company"]');
      var engagement = form.querySelector('[name="engagement"]');
      var budget = form.querySelector('[name="budget"]');
      var email = 'eng.7montaser@gmail.com';
      var subject = 'Project inquiry — ' + (company && company.value.trim() ? company.value.trim() : 'new lead');
      var bodyLines = [
        'Name: ' + (name ? name.value.trim() : ''),
        'Company: ' + (company ? company.value.trim() : ''),
        'Engagement type: ' + (engagement ? engagement.value : ''),
        'Budget range: ' + (budget ? budget.value : ''),
        '',
        'Message:',
        (message ? message.value.trim() : '')
      ];
      var mailto = 'mailto:' + email + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(bodyLines.join('\n'));
      window.location.href = mailto;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = form.querySelector('[name="name"]');
      var message = form.querySelector('[name="message"]');
      var status = form.querySelector('.form-status');
      var honeypot = form.querySelector('[name="hp_field"]');

      // Honeypot: bots fill hidden fields. Discard silently as if it succeeded.
      if (honeypot && honeypot.value) {
        if (status) { status.dataset.state = 'success'; status.textContent = 'Thanks — I\'ll reply within one business day.'; }
        form.reset();
        return;
      }
      // Time-trap: a human takes more than 3s to fill a real brief.
      if (Date.now() - loadedAt < 3000) {
        if (status) { status.dataset.state = 'success'; status.textContent = 'Thanks — I\'ll reply within one business day.'; }
        form.reset();
        return;
      }

      if (!name || !message || !name.value.trim() || !message.value.trim()) {
        if (status) { status.dataset.state = 'error'; status.textContent = 'Name and message are required.'; }
        return;
      }

      if (status) { status.dataset.state = 'pending'; status.textContent = 'Sending...'; }

      if (!FORM_ENDPOINT || FORM_ENDPOINT.indexOf('REPLACE_') === 0) {
        // No real endpoint configured yet — go straight to mailto.
        mailtoFallback();
        if (status) { status.dataset.state = 'pending'; status.textContent = 'Opening your email client...'; }
        return;
      }

      var fd = new FormData(form);
      fetch(FORM_ENDPOINT, { method: 'POST', body: fd, headers: { Accept: 'application/json' } })
        .then(function (res) {
          if (!res.ok) throw new Error('bad status');
          if (status) {
            status.dataset.state = 'success';
            status.innerHTML = 'Sent. Expect a reply within one business day — meanwhile, see <a href="pricing.html">pricing</a>.';
          }
          form.reset();
        })
        .catch(function () {
          mailtoFallback();
          if (status) { status.dataset.state = 'pending'; status.textContent = 'Endpoint unreachable — opening your email client instead.'; }
        });
    });
  })();

  /* =========================================================================
     12. Theme system — dark / light / system, three-state cycle (§16)
     ========================================================================= */
  (function theme() {
    var root = document.documentElement;
    var STORAGE_KEY = 'mh-theme';
    var order = ['dark', 'light', 'system'];

    function applyThemeAttr(mode) {
      root.setAttribute('data-theme', mode);
      var isLight = mode === 'light' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: light)').matches);
      if (window.__sceneSetTheme) window.__sceneSetTheme(isLight);
      var meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', isLight ? '#f2efe7' : '#0b0f18');
      var btn = document.getElementById('theme-toggle');
      if (btn) btn.textContent = mode === 'dark' ? '🌙' : (mode === 'light' ? '☀' : '⚙');
    }

    var stored = null;
    try { stored = localStorage.getItem(STORAGE_KEY); } catch (e) {}
    var current = order.indexOf(stored) !== -1 ? stored : (root.getAttribute('data-theme') || 'system');
    applyThemeAttr(current);

    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', function () {
        if (current === 'system') applyThemeAttr('system');
      });
    }

    var btn = document.getElementById('theme-toggle');
    if (btn) {
      btn.addEventListener('click', function () {
        var i = (order.indexOf(current) + 1) % order.length;
        current = order[i];
        applyThemeAttr(current);
        try { localStorage.setItem(STORAGE_KEY, current); } catch (e) {}
      });
    }
    window.__cycleTheme = function () { if (btn) btn.click(); };
  })();

  /* =========================================================================
     13. Bilingual EN/AR toggle — reads assets/data/i18n.json (§15)
     ========================================================================= */
  (function i18n() {
    var html = document.documentElement;
    var STORAGE_KEY = 'mh-lang';
    var btn = document.getElementById('lang-toggle');

    var stored = null;
    try { stored = localStorage.getItem(STORAGE_KEY); } catch (e) {}
    var lang = stored || (navigator.language && navigator.language.slice(0, 2) === 'ar' ? 'ar' : 'en');

    var dict = null;
    function setLang(next) {
      lang = next;
      html.setAttribute('lang', lang);
      html.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
      if (btn) btn.textContent = lang === 'ar' ? 'EN' : 'ع';
      if (!dict) return;
      applyDict();
    }

    function applyDict() {
      var d = dict[lang] || {};
      document.querySelectorAll('[data-i18n]').forEach(function (el) {
        var key = el.getAttribute('data-i18n');
        if (d[key] !== undefined) { el.textContent = d[key]; el.removeAttribute('data-i18n-todo'); }
        else if (d[key] === undefined && lang === 'ar') { el.setAttribute('data-i18n-todo', ''); }
      });
      document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
        var key = el.getAttribute('data-i18n-placeholder');
        if (d[key] !== undefined) { el.setAttribute('placeholder', d[key]); }
      });
    }

    fetch('assets/data/i18n.json').then(function (r) { return r.ok ? r.json() : {}; }).then(function (d) {
      dict = d;
      applyDict();
    }).catch(function () {});

    setLang(lang);

    if (btn) {
      btn.addEventListener('click', function () {
        var next = lang === 'ar' ? 'en' : 'ar';
        setLang(next);
        try { localStorage.setItem(STORAGE_KEY, next); } catch (e) {}
      });
    }
  })();

  /* =========================================================================
     14. Console signature (§33)
     ========================================================================= */
  (function consoleSignature() {
    if (!window.console) return;
    console.log('%cMontaser Hussam %c— AI/ML engineer, Gaza, Palestine.',
      'color:#7c5cff;font-weight:600;font-size:14px', 'color:#8892a6;font-size:12px');
    console.log('%cLooking at the source? Good sign. Let\'s talk: montaser778.github.io/contact.html',
      'color:#22d3c5;font-size:12px');
    console.log('%csite v1.0.0 — vanilla HTML/CSS/JS + Three.js, no build step', 'color:#8892a6;font-size:11px');
  })();

  /* =========================================================================
     15. Shortcut overlay — "?" opens a map of shortcuts (§33)
     ========================================================================= */
  (function shortcutOverlay() {
    var overlay = document.createElement('div');
    overlay.id = 'shortcut-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Keyboard shortcuts');
    overlay.innerHTML =
      '<div class="panel"><h3>Keyboard shortcuts</h3><dl>' +
      '<dt>Ctrl/Cmd K</dt><dd>Open command palette</dd>' +
      '<dt>/</dt><dd>Open command palette</dd>' +
      '<dt>H P N A S C</dt><dd>Jump to Home / Projects / Notes / About / Services / Contact</dd>' +
      '<dt>?</dt><dd>Toggle this overlay</dd>' +
      '<dt>Esc</dt><dd>Close any open overlay</dd>' +
      '</dl></div>';
    document.body.appendChild(overlay);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    function close() { document.body.classList.remove('shortcuts-open'); }
    document.addEventListener('keydown', function (e) {
      var typing = /input|textarea|select/i.test(document.activeElement.tagName) || document.activeElement.isContentEditable;
      if (e.key === '?' && !typing) {
        e.preventDefault();
        document.body.classList.toggle('shortcuts-open');
      } else if (e.key === 'Escape') { close(); }
    });
  })();

  /* =========================================================================
     16. Focus trap helper for palette + mobile nav (§33)
     ========================================================================= */
  (function focusTraps() {
    function trap(container, isOpenFn, returnFocusTo) {
      container.addEventListener('keydown', function (e) {
        if (e.key !== 'Tab' || !isOpenFn()) return;
        var focusable = container.querySelectorAll('a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])');
        if (!focusable.length) return;
        var first = focusable[0], last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      });
    }
    var cmdk = document.getElementById('cmdk-backdrop');
    if (cmdk) trap(cmdk, function () { return document.body.classList.contains('cmdk-open'); });
    var nav = document.querySelector('nav.main-nav');
    if (nav) trap(nav, function () { return document.body.classList.contains('nav-open'); });
  })();

  /* =========================================================================
     17. Copy-code buttons (§33)
     ========================================================================= */
  (function copyCode() {
    document.querySelectorAll('.code-window').forEach(function (win) {
      var pre = win.querySelector('pre');
      if (!pre) return;
      var btn = document.createElement('button');
      btn.className = 'code-copy';
      btn.type = 'button';
      btn.textContent = 'Copy';
      btn.setAttribute('aria-label', 'Copy code');
      btn.addEventListener('click', function () {
        var text = pre.textContent;
        if (navigator.clipboard) {
          navigator.clipboard.writeText(text).then(function () {
            btn.textContent = 'Copied'; btn.classList.add('copied');
            setTimeout(function () { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 1500);
          }).catch(function () {});
        }
      });
      win.appendChild(btn);
    });
  })();

  /* =========================================================================
     18. Heading anchors on note pages (§18)
     ========================================================================= */
  (function headingAnchors() {
    var article = document.querySelector('article[data-note]');
    if (!article) return;
    article.querySelectorAll('h2[id], h3[id]').forEach(function (h) {
      var a = document.createElement('a');
      a.href = '#' + h.id;
      a.className = 'heading-anchor';
      a.setAttribute('aria-label', 'Link to this section');
      a.textContent = '#';
      h.appendChild(a);
    });
  })();

  /* =========================================================================
     19. Error boundary — hide a broken 3D layer, never surface a stack (§33)
     ========================================================================= */
  (function errorBoundary() {
    window.addEventListener('error', function () {
      var canvas = document.getElementById('bg-canvas');
      var hero = document.getElementById('hero3d');
      // Only intervene if WebGL truly failed; scene.js already guards its own
      // try/catch, so this is a last-resort net for uncaught runtime errors.
      if (canvas && !canvas.getContext) canvas.style.display = 'none';
    }, true);
  })();

  /* =========================================================================
     20. Service worker registration + offline indicator (§26)
     ========================================================================= */
  (function offlineSupport() {
    if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
      window.addEventListener('load', function () {
        navigator.serviceWorker.register('sw.js').catch(function () {});
      });
    }
    var note = document.createElement('div');
    note.id = 'offline-note';
    note.textContent = 'You are offline — showing the cached version.';
    document.body.appendChild(note);
    function sync() { document.body.classList.toggle('is-offline', !navigator.onLine); }
    window.addEventListener('online', sync);
    window.addEventListener('offline', sync);
    sync();
  })();

  /* =========================================================================
     21. Timezone converter widget (§22) — call from a page with #tz-widget
     ========================================================================= */
  (function timezone() {
    var el = document.getElementById('tz-widget');
    if (!el) return;
    try {
      var visitorTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      var offsetMin = -new Date().getTimezoneOffset();
      var offsetH = offsetMin / 60;
      function fmt(baseUtcHour) {
        var local = ((baseUtcHour + offsetH) % 24 + 24) % 24;
        var h = Math.floor(local);
        var m = Math.round((local - h) * 60);
        return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
      }
      // his hours are 09:00-18:00 UTC+3, i.e. UTC 06:00-15:00
      var startLocal = fmt(6), endLocal = fmt(15);
      el.innerHTML =
        '<div class="tz-row"><span>His hours</span><span>09:00–18:00 UTC+3</span></div>' +
        '<div class="tz-row"><span>Your time zone</span><span>' + visitorTz + '</span></div>' +
        '<div class="tz-row"><span>That is, for you</span><span>' + startLocal + '–' + endLocal + '</span></div>';
    } catch (e) { el.style.display = 'none'; }
  })();

  /* =========================================================================
     22. Availability banner dismissal (§20)
     ========================================================================= */
  (function availabilityBanner() {
    var banner = document.getElementById('availability-banner');
    if (!banner) return;
    var KEY = 'mh-banner-dismissed-v1';
    var dismissed = false;
    try { dismissed = localStorage.getItem(KEY) === '1'; } catch (e) {}
    if (dismissed) { banner.hidden = true; return; }
    var btn = banner.querySelector('.dismiss');
    if (btn) btn.addEventListener('click', function () {
      banner.hidden = true;
      try { localStorage.setItem(KEY, '1'); } catch (e) {}
    });
  })();

  /* =========================================================================
     24. View transitions + prefetch + scroll restoration (§28)
     ========================================================================= */
  (function routePolish() {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    var supportsVT = typeof document.startViewTransition === 'function';
    var links = document.querySelectorAll('a[href$=".html"], nav.main-nav a, .btn[href]');
    var prefetched = {};
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var href = entry.target.getAttribute('href');
          if (!href || prefetched[href] || href.indexOf('http') === 0 || href.indexOf('mailto:') === 0) return;
          prefetched[href] = true;
          var link = document.createElement('link');
          link.rel = 'prefetch'; link.href = href;
          document.head.appendChild(link);
          io.unobserve(entry.target);
        });
      }, { threshold: 0.2 });
      links.forEach(function (a) { io.observe(a); });
    }
    if (!supportsVT || reduced) return;
    links.forEach(function (a) {
      a.addEventListener('click', function (e) {
        var href = a.getAttribute('href');
        if (!href || href.indexOf('http') === 0 || href.indexOf('#') === 0 || a.target === '_blank') return;
        // Let the browser navigate normally; startViewTransition mainly benefits same-document
        // transitions here since this is a static multi-page site — declared via CSS @view-transition.
      });
    });
  })();

  /* =========================================================================
     23. URL state for project filters (§29)
     ========================================================================= */
  (function filterUrlState() {
    var pills = document.querySelectorAll('.filter-pill');
    if (!pills.length) return;
    var params = new URLSearchParams(window.location.search);
    var wanted = params.get('filter');
    if (wanted) {
      var match = Array.prototype.filter.call(pills, function (p) { return p.getAttribute('data-filter') === wanted; })[0];
      if (match) setTimeout(function () { match.click(); }, 0);
    }
    pills.forEach(function (pill) {
      pill.addEventListener('click', function () {
        var cat = pill.getAttribute('data-filter');
        var url = new URL(window.location.href);
        if (cat && cat !== 'all') url.searchParams.set('filter', cat); else url.searchParams.delete('filter');
        history.replaceState(null, '', url);
      });
    });
  })();
})();
