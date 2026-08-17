/* rail.js — v9 §125: sticky in-page section rail.
   No-ops entirely if #section-rail is absent. Anchor links are generated from
   each <main> section's h2 at load — no manual list to maintain. */
(function () {
  var rail = document.getElementById('section-rail');
  if (!rail) return;
  var main = document.getElementById('main');
  if (!main) return;

  var pageHead = main.querySelector('.page-head');
  var sections = [];
  main.querySelectorAll(':scope > section').forEach(function (sec) {
    if (sec === pageHead) return;
    var h2 = sec.querySelector('h2');
    if (!h2) return;
    if (!sec.id) {
      sec.id = (h2.textContent || 'section')
        .toLowerCase().trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .slice(0, 40) || 'section-' + sections.length;
    }
    sections.push({ id: sec.id, label: h2.textContent.trim(), el: sec });
  });
  if (sections.length < 2) return;

  var linksHtml = sections.map(function (s) {
    return '<a href="#' + s.id + '" data-rail-link="' + s.id + '">' + s.label + '</a>';
  }).join('');
  rail.innerHTML =
    '<div class="rail-links">' + linksHtml + '</div>' +
    '<a class="btn btn-solid btn-sm rail-cta" href="contact.html">Send a project brief</a>';
  rail.hidden = false;

  var links = rail.querySelectorAll('[data-rail-link]');

  /* show the rail only once the reader has passed the intro */
  if (pageHead && 'IntersectionObserver' in window) {
    var introIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        rail.classList.toggle('is-visible', !entry.isIntersecting && entry.boundingClientRect.top < 0);
      });
    }, { threshold: 0 });
    introIO.observe(pageHead);
  } else {
    rail.classList.add('is-visible');
  }

  /* highlight the active section as it enters the viewport */
  if ('IntersectionObserver' in window) {
    var activeIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (l) { l.removeAttribute('aria-current'); });
        var match = rail.querySelector('[data-rail-link="' + entry.target.id + '"]');
        if (match) {
          match.setAttribute('aria-current', 'true');
          match.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
        }
      });
    }, { rootMargin: '-40% 0px -50% 0px', threshold: 0 });
    sections.forEach(function (s) { activeIO.observe(s.el); });
  }
})();
