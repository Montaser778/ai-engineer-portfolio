/* search.js — standalone search page, accepts ?q= deep links (§17).
   IIFE, no-ops if #search-input is absent. */
(function () {
  var input = document.getElementById('search-input');
  var results = document.getElementById('search-results');
  if (!input || !results) return;

  var index = [];
  fetch('assets/data/search-index.json').then(function (r) { return r.ok ? r.json() : []; }).then(function (d) {
    index = d || [];
    var params = new URLSearchParams(window.location.search);
    var q = params.get('q');
    if (q) { input.value = q; run(q); }
  }).catch(function () {});

  function escapeHtml(s) { return s.replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); }
  function highlight(text, terms) {
    var out = escapeHtml(text);
    terms.forEach(function (t) {
      if (!t) return;
      out = out.replace(new RegExp('(' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig'), '<mark>$1</mark>');
    });
    return out;
  }
  function score(entry, terms) {
    var s = 0;
    var title = (entry.title || '').toLowerCase();
    var section = (entry.section || '').toLowerCase();
    var body = (entry.body || '').toLowerCase();
    terms.forEach(function (t) {
      if (title.indexOf(t) !== -1) s += 3;
      if (section.indexOf(t) !== -1) s += 2;
      if (body.indexOf(t) !== -1) s += 1;
    });
    if (terms.length > 1 && body.indexOf(terms.join(' ')) !== -1) s += 2;
    return s;
  }

  function run(raw) {
    var q = (raw || '').toLowerCase().trim();
    var url = new URL(window.location.href);
    if (q) url.searchParams.set('q', q); else url.searchParams.delete('q');
    history.replaceState(null, '', url);

    if (!q) { results.innerHTML = '<p class="search-empty">Type to search every page and note.</p>'; return; }
    var terms = q.split(/\s+/).filter(Boolean);
    var ranked = index
      .map(function (e) { return { entry: e, score: score(e, terms) }; })
      .filter(function (r) { return r.score > 0; })
      .sort(function (a, b) { return b.score - a.score; })
      .slice(0, 12);

    if (!ranked.length) { results.innerHTML = '<p class="search-empty">No matches for "' + escapeHtml(q) + '".</p>'; return; }
    results.innerHTML = '<ul class="search-results">' + ranked.map(function (r) {
      var e = r.entry;
      var snippet = (e.body || '').slice(0, 140);
      return '<li><a href="' + e.url + '"><strong>' + highlight(e.title, terms) + '</strong> <span class="tag">' + e.type + '</span>' +
        '<p style="color:var(--muted);font-size:13.5px;margin:6px 0 0">' + highlight(snippet, terms) + '…</p></a></li>';
    }).join('') + '</ul>';
  }

  var debounce;
  input.addEventListener('input', function () {
    clearTimeout(debounce);
    var v = input.value;
    debounce = setTimeout(function () { run(v); }, 120);
  });
})();
