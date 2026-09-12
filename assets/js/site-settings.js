/* site-settings.js — hides homepage sections the admin dashboard has
   toggled off (Site text -> Homepage sections), via GET /content/settings.
   No-ops for any element that doesn't exist on the current page, so it's
   safe to include everywhere even though today only index.html has these
   elements. */
(function () {
  var API_BASE = "https://ai-engineer-portfolio-va7f.onrender.com";

  fetch(API_BASE + "/content/settings")
    .then(function (r) { return r.ok ? r.json() : {}; })
    .then(function (settings) {
      if (settings.show_hero_chip === false) {
        var chip = document.querySelector(".hero .chip");
        if (chip) chip.hidden = true;
      }
      if (settings.show_availability_banner === false) {
        var banner = document.getElementById("availability-banner");
        if (banner) banner.hidden = true;
      }
    })
    .catch(function () {});
})();
