/* neural-bg.js — dense neural-network canvas background for the hero section.
   Pure 2D canvas, no dependency on three.js. Sits behind .hero content via
   #neural-bg (position:absolute, z-index:0, see site.css). No-ops if the
   canvas or context is unavailable, and respects reduced-motion/data. */
(function () {
  var canvas = document.getElementById('neural-bg');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  if (!ctx) return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var reducedData = (navigator.connection && navigator.connection.saveData) ||
    window.matchMedia('(prefers-reduced-data: reduce)').matches;

  var host = canvas.parentElement;
  var W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
  var nodes = [];
  var pulses = [];
  var LINK_DIST = 150;
  var COLORS = ['#7c5cff', '#22d3c5', '#5b8cff'];

  function resize() {
    W = host.clientWidth; H = host.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed();
  }

  function seed() {
    var area = W * H;
    var count = reducedData ? 40 : Math.min(140, Math.max(50, Math.round(area / 9000)));
    nodes = [];
    for (var i = 0; i < count; i++) {
      nodes.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.12,
        vy: (Math.random() - 0.5) * 0.12,
        r: Math.random() * 1.6 + 0.6,
        depth: Math.random(),
        color: COLORS[i % COLORS.length]
      });
    }
    pulses = [];
  }

  function maybeSpawnPulse(links) {
    if (reduced || links.length === 0) return;
    if (Math.random() > 0.02) return;
    var l = links[Math.floor(Math.random() * links.length)];
    pulses.push({ a: l.a, b: l.b, t: 0, speed: 0.006 + Math.random() * 0.008, color: l.a.color });
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    if (!reduced) {
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        n.x += n.vx; n.y += n.vy;
        if (n.x < -20) n.x = W + 20; if (n.x > W + 20) n.x = -20;
        if (n.y < -20) n.y = H + 20; if (n.y > H + 20) n.y = -20;
      }
    }

    var links = [];
    for (var a = 0; a < nodes.length; a++) {
      for (var b = a + 1; b < nodes.length; b++) {
        var na = nodes[a], nb = nodes[b];
        var dx = na.x - nb.x, dy = na.y - nb.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < LINK_DIST) links.push({ a: na, b: nb, dist: dist });
      }
    }

    ctx.lineWidth = 1;
    for (var li = 0; li < links.length; li++) {
      var link = links[li];
      var alpha = (1 - link.dist / LINK_DIST) * 0.35 * (0.4 + link.a.depth * 0.6);
      ctx.strokeStyle = 'rgba(124, 92, 255, ' + alpha.toFixed(3) + ')';
      ctx.beginPath();
      ctx.moveTo(link.a.x, link.a.y);
      ctx.lineTo(link.b.x, link.b.y);
      ctx.stroke();
    }

    maybeSpawnPulse(links);
    for (var p = pulses.length - 1; p >= 0; p--) {
      var pu = pulses[p];
      pu.t += pu.speed;
      if (pu.t >= 1) { pulses.splice(p, 1); continue; }
      var px = pu.a.x + (pu.b.x - pu.a.x) * pu.t;
      var py = pu.a.y + (pu.b.y - pu.a.y) * pu.t;
      var glow = ctx.createRadialGradient(px, py, 0, px, py, 5);
      glow.addColorStop(0, pu.color);
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    for (var ni = 0; ni < nodes.length; ni++) {
      var node = nodes[ni];
      var glowR = node.r * 4;
      var grad = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, glowR);
      grad.addColorStop(0, node.color);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = 0.35 + node.depth * 0.35;
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(node.x, node.y, glowR, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 0.85;
      ctx.fillStyle = node.color;
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function isVisible() {
    var rect = host.getBoundingClientRect();
    return rect.bottom > 0 && rect.top < window.innerHeight;
  }

  function animate() {
    requestAnimationFrame(animate);
    if (document.hidden || !isVisible()) return;
    draw();
  }

  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 150);
  }, { passive: true });

  resize();
  if (reduced) { draw(); } else { requestAnimationFrame(animate); }
})();
