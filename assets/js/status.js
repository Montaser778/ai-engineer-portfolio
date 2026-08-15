/* status.js — v6 §48 / §80: live status strip + availability integrity.
   Fetches assets/data/status.json (one file, manually updated) and populates
   #status-strip if present on the page. No-ops entirely if the element is
   absent or the fetch fails — never invents a status. */
(function () {
  try {
    var el = document.getElementById('status-strip');
    if (!el) return;

    fetch('assets/data/status.json', { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('status fetch failed'); return r.json(); })
      .then(function (data) {
        if (!data || !data.capacity) return;
        var tz = '';
        try {
          tz = ' · Local time here: ' + new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Gaza' });
        } catch (e) {}
        el.innerHTML = '<div class="container">' +
          '<span class="status-dot" aria-hidden="true"></span>' +
          '<span><strong>' + esc(data.capacity) + '</strong></span>' +
          (data.nextStart ? '<span>Next start: <strong>' + esc(data.nextStart) + '</strong></span>' : '') +
          (data.focus ? '<span>Focus: ' + esc(data.focus) + '</span>' : '') +
          (data.timezone ? '<span>' + esc(data.timezone) + tz + '</span>' : '') +
          (data.updated ? '<span class="status-updated">Last updated ' + esc(data.updated) + '</span>' : '') +
          '</div>';
        el.hidden = false;
      })
      .catch(function () { /* degrade to nothing: strip stays hidden */ });

    function esc(s) {
      return String(s).replace(/[&<>"]/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
      });
    }
  } catch (e) {
    /* degrade to nothing */
  }
})();
