/* conversion.js — v6 §57: contact reachable from every page without the nav.
   Injects a compact CTA band before the footer and a plain-text email line
   inside the footer's Connect column. IIFE, no-ops if the footer markup it
   expects is absent, never duplicates itself, never touches contact.html
   (which already has full contact content) or resume.html print flow. */
(function () {
  try {
    var footer = document.querySelector('footer.site-footer');
    if (!footer) return;
    var isContactPage = /contact\.html$/.test(window.location.pathname);

    var EMAIL = 'eng.7montaser@gmail.com';

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

    /* Plain-text email in the footer Connect column */
    var connectCol = footer.querySelector('.footer-col:last-child');
    if (connectCol && !connectCol.querySelector('.mh-footer-email')) {
      var line = document.createElement('p');
      line.className = 'mh-footer-email';
      line.innerHTML = 'Email: <a href="mailto:' + EMAIL + '">' + EMAIL + '</a>';
      connectCol.appendChild(line);
    }
  } catch (e) {
    /* degrade to nothing */
  }
})();
