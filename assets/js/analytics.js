/* analytics.js — first-party visitor counter, no cookies/consent banner
   needed: a random id in localStorage (not a fingerprint, never shared
   with a third party) distinguishes "unique visitors" from "total views"
   in the dashboard's Analytics page. Fires once per page load and never
   blocks or errors visibly if the backend is slow/unreachable. */
(function () {
  var API_BASE = "https://ai-engineer-portfolio-va7f.onrender.com";

  var visitorId = null;
  try {
    visitorId = localStorage.getItem("mh-visitor-id");
    if (!visitorId) {
      visitorId = (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2));
      localStorage.setItem("mh-visitor-id", visitorId);
    }
  } catch (e) {}
  if (!visitorId) return;

  fetch(API_BASE + "/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      path: location.pathname,
      visitor_id: visitorId,
      referrer: document.referrer.slice(0, 300),
    }),
    keepalive: true,
  }).catch(function () {});
})();
