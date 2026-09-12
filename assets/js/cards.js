/* cards.js — renders the "Featured" project cards on projects.html from
   the dashboard-managed backend (fastapi-chat's /content/projects) instead
   of hand-written HTML, so adding/editing/removing a project via the admin
   dashboard shows up on the live site with no redeploy. Reuses the exact
   .card/.metrics-band/.chip-row/.btn-row markup the hand-written cards
   used, so all existing CSS/animations apply unchanged; re-registers the
   new cards with site.js's reveal/counter/filter logic via the
   window.mhObserveNew / window.mhRefreshFilterCards hooks it exposes,
   since that logic snapshots the DOM once at load and would otherwise
   never see cards added after the fact.

   Note: card text comes straight from the database, not assets/data/
   i18n.json, so it does not yet translate when the site's EN/AR toggle is
   used -- a known limitation until the dashboard grows a per-language
   field. */
(function () {
  var API_BASE = "https://ai-engineer-portfolio-va7f.onrender.com";
  var container = document.getElementById("featured-projects");
  if (!container) return;

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function cardHtml(p) {
    var metrics = (p.metrics || [])
      .map(function (m) {
        return (
          '<div class="m-cell"><div class="m-num" data-counter="' + escapeHtml(m.value) + '" data-suffix="' +
          escapeHtml(m.suffix) + '">0</div><div class="m-lbl">' + escapeHtml(m.label) + "</div></div>"
        );
      })
      .join("");
    var tags = (p.tags || []).map(function (t) { return '<span class="tag">' + escapeHtml(t) + "</span>"; }).join("");
    var ctas = (p.ctas || [])
      .map(function (c) {
        var extra = c.external ? ' target="_blank" rel="noopener"' : "";
        return '<a class="btn btn-ghost btn-sm" href="' + escapeHtml(c.href) + '"' + extra + ">" + escapeHtml(c.label) + "</a>";
      })
      .join("");
    var image = p.image
      ? '<img src="' + escapeHtml(p.image) + '" alt="" style="width:100%;border-radius:10px;margin-bottom:14px">'
      : "";
    return (
      '<div class="card" data-reveal data-cats="' + escapeHtml(p.category) + '" data-tilt>' +
      image +
      "<h3>" + escapeHtml(p.title) + "</h3>" +
      "<p>" + escapeHtml(p.description) + "</p>" +
      (metrics ? '<div class="metrics-band" style="margin:16px 0">' + metrics + "</div>" : "") +
      (tags ? '<div class="chip-row">' + tags + "</div>" : "") +
      (ctas ? '<div class="btn-row">' + ctas + "</div>" : "") +
      "</div>"
    );
  }

  fetch(API_BASE + "/content/projects")
    .then(function (r) { return r.ok ? r.json() : []; })
    .then(function (projects) {
      if (!projects.length) return; // keep container empty rather than showing a broken state
      container.innerHTML = projects.map(cardHtml).join("");
      if (window.mhObserveNew) window.mhObserveNew(container.querySelectorAll("[data-reveal]"));
      if (window.mhRefreshFilterCards) window.mhRefreshFilterCards();
    })
    .catch(function () {
      /* Silent -- the "Also built" static links below still work, and a
         portfolio with a temporarily-unreachable API shouldn't look broken. */
    });
})();
