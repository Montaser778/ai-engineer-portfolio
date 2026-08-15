/* hero3d.js — hero workstation model (home page only) + tilt cards (any page).
   IIFE, no-ops if targets are absent. */
(function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* =========================================================================
     Hero workstation
     ========================================================================= */
  (function heroModel() {
    var mount = document.getElementById('hero3d');
    if (!mount || typeof THREE === 'undefined') return;

    var W = mount.clientWidth || 600, H = mount.clientHeight || 460;
    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch (e) { return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(W, H);
    mount.appendChild(renderer.domElement);

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 50);
    camera.position.set(0, 1.6, 7);

    var group = new THREE.Group();
    scene.add(group);

    /* lighting -------------------------------------------------------------- */
    var key = new THREE.DirectionalLight(0x7c5cff, 1.4);
    key.position.set(4, 4, 3);
    scene.add(key);
    var rim = new THREE.DirectionalLight(0x22d3c5, 1.0);
    rim.position.set(-4, 2, -3);
    scene.add(rim);
    var ambient = new THREE.AmbientLight(0x3a4160, 0.9);
    scene.add(ambient);
    var screenLight = new THREE.PointLight(0x22d3c5, 1.2, 6);
    screenLight.position.set(0, 1.4, 1.4);
    scene.add(screenLight);

    /* desk -------------------------------------------------------------------- */
    var desk = new THREE.Mesh(
      new THREE.BoxGeometry(5, 0.18, 2.4),
      new THREE.MeshStandardMaterial({ color: 0x0b0e18, roughness: 0.6, metalness: 0.2 })
    );
    desk.position.y = -0.9;
    group.add(desk);
    var lip = new THREE.Mesh(
      new THREE.BoxGeometry(5, 0.04, 0.05),
      new THREE.MeshStandardMaterial({ color: 0x7c5cff, emissive: 0x7c5cff, emissiveIntensity: 1.2 })
    );
    lip.position.set(0, -0.98, 1.2);
    group.add(lip);

    /* monitor ------------------------------------------------------------------ */
    var monBody = new THREE.Mesh(
      new THREE.BoxGeometry(2.6, 1.6, 0.08),
      new THREE.MeshStandardMaterial({ color: 0x11162a, roughness: 0.5, metalness: 0.3 })
    );
    monBody.position.set(0, 0.6, 0.2);
    group.add(monBody);

    var stand = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 0.6, 12),
      new THREE.MeshStandardMaterial({ color: 0x1a2036 })
    );
    stand.position.set(0, -0.5, 0.2);
    group.add(stand);
    var base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.42, 0.04, 24),
      new THREE.MeshStandardMaterial({ color: 0x1a2036 })
    );
    base.position.set(0, -0.86, 0.2);
    group.add(base);

    /* screen canvas texture ------------------------------------------------------ */
    var canvas = document.createElement('canvas');
    canvas.width = 640; canvas.height = 400;
    var ctx = canvas.getContext('2d');
    var texture = new THREE.CanvasTexture(canvas);
    var screen = new THREE.Mesh(
      new THREE.PlaneGeometry(2.4, 1.4),
      new THREE.MeshBasicMaterial({ map: texture })
    );
    screen.position.set(0, 0.6, 0.245);
    group.add(screen);

    var codeLines = [
      '# p50 612ms  p95 780ms',
      'def measure_turn_latency(t0):',
      '    t_end = time.perf_counter()',
      '    endpoint = t_end - t0',
      '    first_tok = wait_first_token()',
      '    ttfb = first_tok - t_end',
      '    synth = time_to_audio_start()',
      '    return endpoint + ttfb + synth'
    ];
    var typedChars = 0;
    var totalChars = codeLines.join('\n').length;
    var caretOn = true;
    var lastCaretToggle = 0;

    function colourToken(word) {
      if (/^#/.test(word)) return '#8892a6';
      if (['def', 'return', 'import', 'for', 'in', 'if'].indexOf(word) !== -1) return '#7c5cff';
      if (/^["'].*["']$/.test(word)) return '#ffb545';
      if (/^\d/.test(word)) return '#f2e8d5';
      if (/\(/.test(word)) return '#22d3c5';
      return '#b9c1d1';
    }

    function drawScreen(time) {
      ctx.fillStyle = '#070912';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = '15px "JetBrains Mono", monospace';
      ctx.textBaseline = 'top';

      if (!reduced) {
        typedChars += 3.2;
        if (typedChars > totalChars) typedChars = 0;
      } else {
        typedChars = totalChars;
      }

      var remaining = Math.floor(typedChars);
      var y = 24;
      for (var i = 0; i < codeLines.length; i++) {
        var line = codeLines[i];
        var shown = line.slice(0, Math.max(0, Math.min(line.length, remaining)));
        remaining -= line.length;
        var words = shown.split(/(\s+)/);
        var x = 24;
        for (var w = 0; w < words.length; w++) {
          ctx.fillStyle = colourToken(words[w].trim());
          ctx.fillText(words[w], x, y);
          x += ctx.measureText(words[w]).width;
        }
        if (remaining <= 0 && i === Math.min(codeLines.length - 1, Math.floor((typedChars / totalChars) * codeLines.length))) {
          if (time - lastCaretToggle > 500) { caretOn = !caretOn; lastCaretToggle = time; }
          if (caretOn) { ctx.fillStyle = '#22d3c5'; ctx.fillRect(x + 2, y, 8, 16); }
        }
        y += 26;
      }
      texture.needsUpdate = true;
    }

    /* keyboard ---------------------------------------------------------------- */
    var keyGroup = new THREE.Group();
    var keys = [];
    var kMat = new THREE.MeshStandardMaterial({ color: 0x181e33, roughness: 0.7 });
    for (var row = 0; row < 4; row++) {
      for (var col = 0; col < 14; col++) {
        var key = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.03, 0.13), kMat.clone());
        key.position.set((col - 6.5) * 0.16, 0, row * 0.16);
        keyGroup.add(key);
        keys.push(key);
      }
    }
    keyGroup.position.set(0, -1.15, 1.3);
    keyGroup.rotation.x = -0.15;
    group.add(keyGroup);
    var activeKey = -1;

    /* orbiting data nodes ------------------------------------------------------ */
    var nodeCount = 16;
    var nodes = [];
    var nodeGeo = new THREE.IcosahedronGeometry(0.06, 0);
    for (var n = 0; n < nodeCount; n++) {
      var mat = new THREE.MeshStandardMaterial({
        color: n % 2 === 0 ? 0x7c5cff : 0x22d3c5,
        emissive: n % 2 === 0 ? 0x7c5cff : 0x22d3c5,
        emissiveIntensity: 0.5
      });
      var mesh = new THREE.Mesh(nodeGeo, mat);
      var radius = 1.8 + (n % 4) * 0.35;
      var speed = 0.15 + (n % 5) * 0.05;
      var offset = Math.random() * Math.PI * 2;
      var tilt = (n % 3) * 0.6;
      nodes.push({ mesh: mesh, radius: radius, speed: speed, offset: offset, tilt: tilt });
      group.add(mesh);
    }

    var lineGeo = new THREE.BufferGeometry();
    var linePositions = new Float32Array(nodeCount * 2 * 3);
    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    var lineMat = new THREE.LineBasicMaterial({ color: 0x445, transparent: true, opacity: 0.25 });
    var lines = new THREE.LineSegments(lineGeo, lineMat);
    group.add(lines);

    /* scroll-driven camera timeline -------------------------------------------- */
    var keyframes = [
      { at: 0.0, pos: [0, 1.6, 7], rotY: 0, rotX: 0 },
      { at: 0.34, pos: [1.2, 1.2, 5.6], rotY: 0.35, rotX: 0.05 },
      { at: 0.66, pos: [-1.0, 1.0, 5.2], rotY: -0.3, rotX: 0.1 },
      { at: 1.0, pos: [0, 0.8, 4.6], rotY: 0, rotX: 0.15 }
    ];
    function smoothstep(a, b, x) {
      var t = Math.min(Math.max((x - a) / (b - a), 0), 1);
      return t * t * (3 - 2 * t);
    }
    function evalTimeline(p) {
      for (var i = 0; i < keyframes.length - 1; i++) {
        var a = keyframes[i], b = keyframes[i + 1];
        if (p >= a.at && p <= b.at) {
          var t = smoothstep(a.at, b.at, p);
          return {
            pos: [
              a.pos[0] + (b.pos[0] - a.pos[0]) * t,
              a.pos[1] + (b.pos[1] - a.pos[1]) * t,
              a.pos[2] + (b.pos[2] - a.pos[2]) * t
            ],
            rotY: a.rotY + (b.rotY - a.rotY) * t,
            rotX: a.rotX + (b.rotX - a.rotX) * t
          };
        }
      }
      var last = keyframes[keyframes.length - 1];
      return { pos: last.pos, rotY: last.rotY, rotX: last.rotX };
    }

    var scrollProgress = 0;
    function updateScrollProgress() {
      var doc = document.documentElement;
      var max = (doc.scrollHeight - window.innerHeight) || 1;
      scrollProgress = Math.min(Math.max(window.scrollY / max, 0), 1);
    }
    window.addEventListener('scroll', updateScrollProgress, { passive: true });
    updateScrollProgress();

    var pointerX = 0, pointerY = 0;
    window.addEventListener('pointermove', function (e) {
      pointerX = (e.clientX / window.innerWidth) * 2 - 1;
      pointerY = (e.clientY / window.innerHeight) * 2 - 1;
    }, { passive: true });

    var camTarget = { pos: keyframes[0].pos.slice(), rotY: 0, rotX: 0 };

    var resizeTimer2;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer2);
      resizeTimer2 = setTimeout(function () {
        var w = mount.clientWidth || 600, h = mount.clientHeight || 460;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }, 120);
    }, { passive: true });

    function isVisible() {
      var rect = mount.getBoundingClientRect();
      return rect.bottom > 0 && rect.top < window.innerHeight;
    }

    var lastKeyTick = 0;
    function animate(time) {
      requestAnimationFrame(animate);
      if (document.hidden || !isVisible()) return;

      drawScreen(time);

      if (!reduced) {
        var tl = evalTimeline(scrollProgress);
        camTarget.pos = tl.pos; camTarget.rotY = tl.rotY; camTarget.rotX = tl.rotX;

        camera.position.x += (camTarget.pos[0] + pointerX * 0.3 - camera.position.x) * 0.075;
        camera.position.y += (camTarget.pos[1] - pointerY * 0.15 - camera.position.y) * 0.075;
        camera.position.z += (camTarget.pos[2] - camera.position.z) * 0.075;
        group.rotation.y += (camTarget.rotY - group.rotation.y) * 0.075;
        group.rotation.x += (camTarget.rotX - group.rotation.x) * 0.075;

        screenLight.intensity = 1.0 + Math.sin(time * 0.004) * 0.35;

        if (time - lastKeyTick > 130) {
          lastKeyTick = time;
          if (activeKey >= 0) keys[activeKey].material.emissiveIntensity = 0;
          activeKey = Math.floor(Math.random() * keys.length);
          keys[activeKey].material.emissive = new THREE.Color(0x22d3c5);
          keys[activeKey].material.emissiveIntensity = 1;
        }

        var positions = lineGeo.attributes.position.array;
        for (var i = 0; i < nodeCount; i++) {
          var nd = nodes[i];
          var a = time * 0.001 * nd.speed + nd.offset;
          var x = Math.cos(a) * nd.radius;
          var z = Math.sin(a) * nd.radius;
          var y = 0.6 + Math.sin(a * 1.3 + nd.tilt) * 0.5;
          nd.mesh.position.set(x, y, z);
          var pairIndex = (i + 1) % nodeCount;
          positions[i * 6] = x; positions[i * 6 + 1] = y; positions[i * 6 + 2] = z;
          var nd2 = nodes[pairIndex];
          var a2 = time * 0.001 * nd2.speed + nd2.offset;
          positions[i * 6 + 3] = Math.cos(a2) * nd2.radius;
          positions[i * 6 + 4] = 0.6 + Math.sin(a2 * 1.3 + nd2.tilt) * 0.5;
          positions[i * 6 + 5] = Math.sin(a2) * nd2.radius;
        }
        lineGeo.attributes.position.needsUpdate = true;
      } else {
        camera.position.set(0, 1.6, 7);
      }

      camera.lookAt(0, 0.4, 0);
      renderer.render(scene, camera);
    }
    requestAnimationFrame(animate);
  })();

  /* =========================================================================
     Tilt cards
     ========================================================================= */
  (function tiltCards() {
    var coarse = window.matchMedia('(pointer: coarse)').matches;
    if (coarse || reduced) return;
    var cards = document.querySelectorAll('[data-tilt]');
    if (!cards.length) return;

    cards.forEach(function (card) {
      if (!card.querySelector('.tilt-content')) {
        var wrap = document.createElement('div');
        wrap.className = 'tilt-content';
        while (card.firstChild) wrap.appendChild(card.firstChild);
        card.appendChild(wrap);
      }
      var glare = document.createElement('div');
      glare.className = 'glare';
      card.appendChild(glare);

      var targetX = 0, targetY = 0, curX = 0, curY = 0;
      var raf = null;

      card.addEventListener('pointermove', function (e) {
        var rect = card.getBoundingClientRect();
        var px = (e.clientX - rect.left) / rect.width;
        var py = (e.clientY - rect.top) / rect.height;
        targetX = (py - 0.5) * -18;
        targetY = (px - 0.5) * 18;
        glare.style.setProperty('--gx', (px * 100) + '%');
        glare.style.setProperty('--gy', (py * 100) + '%');
        if (!raf) raf = requestAnimationFrame(tick);
      }, { passive: true });

      card.addEventListener('pointerleave', function () {
        targetX = 0; targetY = 0;
      }, { passive: true });

      function tick() {
        curX += (targetX - curX) * 0.14;
        curY += (targetY - curY) * 0.14;
        var maxDeg = 9;
        var rx = Math.max(Math.min(curX, maxDeg), -maxDeg);
        var ry = Math.max(Math.min(curY, maxDeg), -maxDeg);
        card.style.transform = 'perspective(900px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg)';
        if (Math.abs(curX - targetX) > 0.01 || Math.abs(curY - targetY) > 0.01) {
          raf = requestAnimationFrame(tick);
        } else {
          raf = null;
        }
      }
    });
  })();
})();
