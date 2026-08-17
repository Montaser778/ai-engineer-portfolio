/* testimonials.js — v10 §155-157: social proof, real entries only.
   Fetches assets/data/testimonials.json. If the array is empty or the fetch
   fails, the mount point is removed and the section never exists in the DOM —
   no placeholder, no skeleton, no "coming soon". Every entry requires quote,
   name, role, company and a verifiable link; entries missing any field are
   skipped rather than rendered incomplete. */
(function () {
  var mount = document.getElementById('testimonials-mount');
  if (!mount) return;

  fetch('assets/data/testimonials.json', { cache: 'no-store' })
    .then(function (r) { if (!r.ok) throw new Error('testimonials fetch failed'); return r.json(); })
    .then(function (data) {
      if (!Array.isArray(data)) throw new Error('bad format');
      var valid = data.filter(function (t) {
        return t && t.quote && t.name && t.role && t.company && t.link;
      });
      if (valid.length === 0) { mount.remove(); return; }

      var cards = valid.map(function (t) {
        var stars = Math.max(1, Math.min(5, parseInt(t.rating, 10) || 5));
        return '<div class="testimonial-card" data-tilt>' +
          '<div class="testimonial-stars" aria-label="' + stars + ' out of 5">' + '★'.repeat(stars) + '☆'.repeat(5 - stars) + '</div>' +
          '<p class="testimonial-quote">' + esc(t.quote) + '</p>' +
          '<div class="testimonial-attr">' +
          (t.logo ? '<img class="testimonial-logo" src="' + esc(t.logo) + '" alt="" loading="lazy">' : '') +
          '<div><div class="testimonial-name">' + esc(t.name) + '</div><div class="testimonial-role">' + esc(t.role) + ', ' + esc(t.company) + '</div></div>' +
          '</div>' +
          '<a class="testimonial-verify" href="' + esc(t.link) + '" target="_blank" rel="noopener noreferrer">Verify this review →</a>' +
          '</div>';
      }).join('');

      mount.outerHTML = '<section id="testimonials" data-shape="torus">' +
        '<div class="container">' +
        '<div class="section-head"><div class="label">Proof</div><h2>What clients say</h2></div>' +
        '<div class="testimonial-grid">' + cards + '</div>' +
        '</div></section>';
    })
    .catch(function () { mount.remove(); });

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
})();
