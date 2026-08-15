/* polish.js — v5 §36: film grain, vignette and mesh glow overlay.
   Additive, self-contained IIFE. No-ops entirely if reduced motion is set
   or if the layer cannot be created. Never touches existing DOM/CSS. */
(function () {
  try {
    if (document.getElementById('mh-polish-layer')) return; // idempotent

    var reduceMotion = false;
    try {
      reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (e) {}

    var layer = document.createElement('div');
    layer.id = 'mh-polish-layer';
    layer.setAttribute('aria-hidden', 'true');

    var grain = document.createElement('div');
    grain.className = 'mh-grain';
    var svg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";
    grain.style.backgroundImage = "url(\"" + svg + "\")";

    var mesh = document.createElement('div');
    mesh.className = 'mh-mesh';

    var vignette = document.createElement('div');
    vignette.className = 'mh-vignette';

    layer.appendChild(mesh);
    layer.appendChild(grain);
    layer.appendChild(vignette);

    if (reduceMotion) {
      layer.classList.add('mh-static');
    }

    if (document.body) {
      document.body.appendChild(layer);
    } else {
      document.addEventListener('DOMContentLoaded', function () {
        document.body.appendChild(layer);
      });
    }
  } catch (e) {
    /* degrade to nothing */
  }
})();
