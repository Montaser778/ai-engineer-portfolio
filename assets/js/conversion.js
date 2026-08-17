/* conversion.js — v6 §57: contact reachable from every page without the nav.
   Injects a compact CTA band before the footer. IIFE, no-ops if the footer
   markup it expects is absent, never duplicates itself, never touches
   contact.html (which already has full contact content).
   The plain-text footer email line was retired when the footer moved to the
   v9 §139 four-column layout — the footer-social row already links email. */
(function () {
  try {
    var footer = document.querySelector('footer.site-footer');
    if (!footer) return;
    var isContactPage = /contact\.html$/.test(window.location.pathname);

    /* CTA band, skipped on contact.html itself */
    if (!isContactPage && !document.querySelector('.mh-cta-band')) {
      var band = document.createElement('div');
      band.className = 'mh-cta-band';
      band.innerHTML =
        '<div class="mh-cta-inner">' +
        '<p>Have a voice or agent system to build?</p>' +
        '<a class="btn btn-solid btn-sm" href="contact.html">Send a project brief</a>' +
        '</div>';
      footer.parentNode.insertBefore(band, footer);
    }
  } catch (e) {
    /* degrade to nothing */
  }
})();
