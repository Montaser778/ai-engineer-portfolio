/* hero3d.js — hero workstation model (home page only) + tilt cards (any page).
   v10 §145-149 adds a second scene mode, the interior room, selected by
   <div id="hero3d" data-scene="room">. IIFE, no-ops if targets are absent. */
(function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var reducedData = (navigator.connection && navigator.connection.saveData) ||
    window.matchMedia('(prefers-reduced-data: reduce)').matches;

  /* shared code-screen CanvasTexture — used by both the workstation monitor
     and the room's main monitor. Do not fork this logic between the two. */
  function makeCodeScreen() {
    var canvas = document.createElement('canvas');
    canvas.width = 640; canvas.height = 400;
    var ctx = canvas.getContext('2d');
    var texture = new THREE.CanvasTexture(canvas);
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

    function update(time) {
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

    return { texture: texture, update: update };
  }

  function smoothstep(a, b, x) {
    var t = Math.min(Math.max((x - a) / (b - a), 0), 1);
    return t * t * (3 - 2 * t);
  }

  /* =========================================================================
     Hero workstation
     ========================================================================= */
  (function heroModel() {
    var mount = document.getElementById('hero3d');
    if (!mount || typeof THREE === 'undefined') return;
    if (mount.dataset.scene === 'room') { buildRoomScene(mount); return; }

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
    var codeScreen = makeCodeScreen();
    var texture = codeScreen.texture;
    var screen = new THREE.Mesh(
      new THREE.PlaneGeometry(2.4, 1.4),
      new THREE.MeshBasicMaterial({ map: texture })
    );
    screen.position.set(0, 0.6, 0.245);
    group.add(screen);
    function drawScreen(time) { codeScreen.update(time); }

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
     v10 §145-149: interior room scene — dark room lit by two monitors, a
     warm desk lamp and cold light through a window. All primitives, no
     external assets. Falls back silently if it can't build.
     ========================================================================= */
  function buildRoomScene(mount) {
    if (reducedData) return;
    if (window.innerWidth < 760) return; // §148: no room below 760px — the workstation or a static panel covers this breakpoint

    var isContact = mount.dataset.view === 'contact';
    var W = mount.clientWidth || 600, H = mount.clientHeight || 460;
    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch (e) { return; }
    var dpr = Math.min(window.devicePixelRatio || 1, W < 1024 ? 1 : 1.5);
    renderer.setPixelRatio(dpr);
    renderer.setSize(W, H);
    mount.appendChild(renderer.domElement);

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 60);
    var baseCam = isContact ? [3.4, 1.6, 4.2] : [0.2, 1.5, 5.4];
    camera.position.set(baseCam[0], baseCam[1], baseCam[2]);

    var room = new THREE.Group();
    scene.add(room);

    /* -- lighting: the room is dark; screens and the lamp do the work -- */
    var ambient = new THREE.AmbientLight(0x18203a, 0.35);
    scene.add(ambient);
    var screenLight = new THREE.PointLight(0x6fe8dc, 2.2, 5.5);
    screenLight.position.set(0, 1.5, 1.7);
    scene.add(screenLight);
    var lampLight = new THREE.PointLight(0xffb545, 1.6, 2.6, 2);
    lampLight.position.set(1.5, 0.4, 0.9);
    scene.add(lampLight);
    var rim = new THREE.DirectionalLight(0x3a6bcf, 0.45);
    rim.position.set(-3, 2, -2);
    scene.add(rim);
    var accent = new THREE.PointLight(0x7c5cff, 0.5, 4);
    accent.position.set(-1.2, -0.6, -1);
    scene.add(accent);

    /* -- shared matte material for static geometry (§148: share one instance) -- */
    var matteMat = new THREE.MeshStandardMaterial({ color: 0x0d1120, roughness: 0.92, metalness: 0.02 });

    var floor = new THREE.Mesh(new THREE.PlaneGeometry(10, 8), matteMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.1;
    room.add(floor);

    var backWall = new THREE.Mesh(new THREE.PlaneGeometry(10, 5), matteMat);
    backWall.position.set(0, 1.4, -2);
    room.add(backWall);

    var leftWall = new THREE.Mesh(new THREE.PlaneGeometry(8, 5), matteMat);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-4, 1.4, 0);
    room.add(leftWall);

    /* -- window with night sky + drifting stars -- */
    var windowGroup = new THREE.Group();
    windowGroup.position.set(-2.6, 1.9, -1.98);
    var glass = new THREE.Mesh(
      new THREE.PlaneGeometry(1.5, 1.9),
      new THREE.MeshBasicMaterial({ color: 0x050914 })
    );
    windowGroup.add(glass);
    var frameMat = new THREE.MeshStandardMaterial({ color: 0x05070d, roughness: 0.6 });
    [[0, 0.98, 1.58, 0.06], [0, -0.98, 1.58, 0.06], [0.75, 0, 0.06, 1.9], [-0.75, 0, 0.06, 1.9]].forEach(function (f) {
      var bar = new THREE.Mesh(new THREE.BoxGeometry(f[2], f[3], 0.05), frameMat);
      bar.position.set(f[0], f[1], 0.02);
      windowGroup.add(bar);
    });
    room.add(windowGroup);

    var starCount = 20;
    var starGeo = new THREE.BufferGeometry();
    var starPos = new Float32Array(starCount * 3);
    for (var s = 0; s < starCount; s++) {
      starPos[s * 3] = (Math.random() - 0.5) * 1.3;
      starPos[s * 3 + 1] = (Math.random() - 0.5) * 1.7;
      starPos[s * 3 + 2] = 0.03;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    var stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xdfe6ff, size: 0.02, transparent: true, opacity: 0.85 }));
    windowGroup.add(stars);

    /* -- curtain: sine-displaced plane for vertical folds -- */
    var curtainGeo = new THREE.PlaneGeometry(0.8, 2.1, 12, 1);
    var cpos = curtainGeo.attributes.position;
    for (var ci = 0; ci < cpos.count; ci++) {
      cpos.setX(ci, cpos.getX(ci) + Math.sin(ci * 1.4) * 0.045);
    }
    curtainGeo.computeVertexNormals();
    var curtain = new THREE.Mesh(curtainGeo, new THREE.MeshStandardMaterial({
      color: 0x4a0f1c, emissive: 0x2a0810, emissiveIntensity: 0.25, roughness: 0.85, side: THREE.DoubleSide
    }));
    curtain.position.set(-3.55, 1.85, -1.9);
    room.add(curtain);

    /* -- desk -- */
    var deskMat = new THREE.MeshStandardMaterial({ color: 0x0b0e18, roughness: 0.55, metalness: 0.2 });
    var deskTop = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.08, 1.3), deskMat);
    deskTop.position.set(-0.4, -0.5, -1.1);
    room.add(deskTop);
    [[-1.85, -1.55], [1.05, -1.55]].forEach(function (lp) {
      var leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.94, 0.06), deskMat);
      leg.position.set(lp[0], -0.98, lp[1]);
      room.add(leg);
    });

    /* -- main monitor: reuses the exact shared code-screen texture -- */
    var codeScreen = makeCodeScreen();
    var monBody = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.95, 0.06), new THREE.MeshStandardMaterial({ color: 0x11162a, roughness: 0.5 }));
    monBody.position.set(-0.9, -0.02, -1.55);
    room.add(monBody);
    var monScreen = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.85), new THREE.MeshBasicMaterial({ map: codeScreen.texture }));
    monScreen.position.set(-0.9, -0.02, -1.52);
    room.add(monScreen);
    var monStand = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.35, 10), deskMat);
    monStand.position.set(-0.9, -0.65, -1.55);
    room.add(monStand);

    /* -- second, smaller angled monitor with a waveform texture -- */
    var waveCanvas = document.createElement('canvas');
    waveCanvas.width = 320; waveCanvas.height = 200;
    var waveCtx = waveCanvas.getContext('2d');
    var waveTexture = new THREE.CanvasTexture(waveCanvas);
    function drawWave(time) {
      waveCtx.fillStyle = '#070912';
      waveCtx.fillRect(0, 0, waveCanvas.width, waveCanvas.height);
      waveCtx.strokeStyle = '#7c5cff';
      waveCtx.lineWidth = 2;
      waveCtx.beginPath();
      for (var x = 0; x <= waveCanvas.width; x += 4) {
        var t = reduced ? 0 : time * 0.002;
        var y = 100 + Math.sin(x * 0.05 + t) * 26 * Math.sin(x * 0.01 + t * 0.6);
        if (x === 0) waveCtx.moveTo(x, y); else waveCtx.lineTo(x, y);
      }
      waveCtx.stroke();
      waveTexture.needsUpdate = true;
    }
    drawWave(0);
    var mon2Body = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.5, 0.05), new THREE.MeshStandardMaterial({ color: 0x11162a, roughness: 0.5 }));
    mon2Body.position.set(0.55, -0.18, -1.5);
    mon2Body.rotation.y = -0.45;
    room.add(mon2Body);
    var mon2Screen = new THREE.Mesh(new THREE.PlaneGeometry(0.68, 0.43), new THREE.MeshBasicMaterial({ map: waveTexture }));
    mon2Screen.position.set(0.575, -0.18, -1.475);
    mon2Screen.rotation.y = -0.45;
    room.add(mon2Screen);

    /* -- desk chair, rotates slowly as if just vacated -- */
    var chair = new THREE.Group();
    var chairMat = new THREE.MeshStandardMaterial({ color: 0x171c30, roughness: 0.7 });
    var seat = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.08, 0.55), chairMat);
    seat.position.y = 0;
    chair.add(seat);
    var back = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.65, 0.07), chairMat);
    back.position.set(0, 0.4, -0.26);
    chair.add(back);
    var column = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 10), chairMat);
    column.position.y = -0.3;
    chair.add(column);
    for (var sp = 0; sp < 5; sp++) {
      var spoke = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.03, 0.04), chairMat);
      spoke.position.set(0, -0.54, 0);
      spoke.rotation.y = (sp / 5) * Math.PI * 2;
      chair.add(spoke);
    }
    chair.position.set(-0.4, -0.62, -0.3);
    room.add(chair);

    /* -- radiator under the window -- */
    var radiatorGroup = new THREE.Group();
    var radMat = new THREE.MeshStandardMaterial({ color: 0x232a44, roughness: 0.5, metalness: 0.3 });
    for (var r = 0; r < 8; r++) {
      var slat = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.5, 0.14), radMat);
      slat.position.set(-3.3 + r * 0.11, 0, 0);
      radiatorGroup.add(slat);
    }
    radiatorGroup.position.set(0, -0.75, -1.9);
    room.add(radiatorGroup);

    /* -- desk lamp: base, arm, shade + point light already added above -- */
    var lampMat = new THREE.MeshStandardMaterial({ color: 0x1a1f34, roughness: 0.5, metalness: 0.4 });
    var lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.03, 16), lampMat);
    lampBase.position.set(1.5, -0.46, 0.9);
    room.add(lampBase);
    var lampArm = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.65, 8), lampMat);
    lampArm.position.set(1.5, -0.16, 0.9);
    lampArm.rotation.z = 0.25;
    room.add(lampArm);
    var lampShade = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.22, 16, 1, true), new THREE.MeshStandardMaterial({ color: 0xffdca8, emissive: 0xffb545, emissiveIntensity: 0.4, side: THREE.DoubleSide }));
    lampShade.position.set(1.62, 0.32, 0.9);
    lampShade.rotation.x = Math.PI;
    room.add(lampShade);
    lampLight.position.copy(lampShade.position);

    /* -- dust motes drifting in the lamp light cone (§147, §148: first to drop) -- */
    var moteCount = reduced ? 0 : 60;
    var motes = null;
    if (moteCount > 0) {
      var moteGeo = new THREE.BufferGeometry();
      var motePos = new Float32Array(moteCount * 3);
      var moteSpeeds = [];
      for (var m = 0; m < moteCount; m++) {
        motePos[m * 3] = 1.3 + Math.random() * 0.6;
        motePos[m * 3 + 1] = -0.5 + Math.random() * 1.1;
        motePos[m * 3 + 2] = 0.6 + Math.random() * 0.6;
        moteSpeeds.push(0.0002 + Math.random() * 0.0004);
      }
      moteGeo.setAttribute('position', new THREE.BufferAttribute(motePos, 3));
      var moteMat = new THREE.PointsMaterial({ color: 0xffdca8, size: 0.012, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false });
      motes = new THREE.Points(moteGeo, moteMat);
      room.add(motes);
    }

    /* -- scroll-driven camera timeline: reuses the same keyframe/smoothstep
       system as the workstation, within a narrow ~12deg arc -- */
    var keyframes = isContact ? [
      { at: 0, pos: [3.4, 1.6, 4.2], rotY: 0, rotX: 0 },
      { at: 1, pos: [3.0, 1.5, 4.0], rotY: 0.05, rotX: 0.02 }
    ] : [
      { at: 0, pos: [0.2, 1.5, 5.4], rotY: 0, rotX: 0 },
      { at: 0.5, pos: [-0.4, 1.3, 5.1], rotY: 0.06, rotX: 0.015 },
      { at: 1, pos: [0.4, 1.2, 4.9], rotY: -0.05, rotX: 0.03 }
    ];
    function evalTimeline(p) {
      for (var i = 0; i < keyframes.length - 1; i++) {
        var a = keyframes[i], b = keyframes[i + 1];
        if (p >= a.at && p <= b.at) {
          var t = smoothstep(a.at, b.at, p);
          return {
            pos: [a.pos[0] + (b.pos[0] - a.pos[0]) * t, a.pos[1] + (b.pos[1] - a.pos[1]) * t, a.pos[2] + (b.pos[2] - a.pos[2]) * t],
            rotY: a.rotY + (b.rotY - a.rotY) * t, rotX: a.rotX + (b.rotX - a.rotX) * t
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

    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
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

    /* -- §148: staged degradation if the frame budget is blown -- */
    var slowFrames = 0, lastFrameTime = performance.now();
    var stage = 0; // 0 = full, 1 = motes dropped, 2 = pixel ratio reduced

    function degrade() {
      if (stage === 0 && motes) {
        room.remove(motes);
        motes = null;
        stage = 1;
      } else if (stage <= 1) {
        renderer.setPixelRatio(Math.max(1, dpr * 0.75));
        stage = 2;
      }
    }

    function animate(time) {
      requestAnimationFrame(animate);
      if (document.hidden || !isVisible()) { lastFrameTime = time; return; }

      var frameMs = time - lastFrameTime;
      lastFrameTime = time;
      if (frameMs > 33) {
        slowFrames++;
        if (slowFrames > 60) { degrade(); slowFrames = 0; }
      } else {
        slowFrames = 0;
      }

      codeScreen.update(time);
      drawWave(time);
      screenLight.intensity = 2.0 + Math.sin(time * 0.0035) * 0.4;

      if (!reduced) {
        var tl = evalTimeline(scrollProgress);
        camTarget.pos = tl.pos; camTarget.rotY = tl.rotY; camTarget.rotX = tl.rotX;
        camera.position.x += (camTarget.pos[0] + pointerX * 0.15 - camera.position.x) * 0.06;
        camera.position.y += (camTarget.pos[1] - pointerY * 0.08 - camera.position.y) * 0.06;
        camera.position.z += (camTarget.pos[2] - camera.position.z) * 0.06;
        room.rotation.y += (camTarget.rotY - room.rotation.y) * 0.06;
        room.rotation.x += (camTarget.rotX - room.rotation.x) * 0.06;

        chair.rotation.y += (Math.PI / 90) * (frameMs / 1000); // ~2deg/sec

        if (motes) {
          var mp = motes.geometry.attributes.position.array;
          for (var mi = 0; mi < moteCount; mi++) {
            mp[mi * 3 + 1] += moteSpeeds[mi] * frameMs;
            if (mp[mi * 3 + 1] > 0.6) mp[mi * 3 + 1] = -0.5;
          }
          motes.geometry.attributes.position.needsUpdate = true;
        }
      }

      camera.lookAt(isContact ? -0.4 : -0.4, 0, -1.2);
      renderer.render(scene, camera);
    }
    requestAnimationFrame(animate);
  }

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
