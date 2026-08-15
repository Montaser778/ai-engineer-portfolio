/* scene.js — fixed full-viewport particle background, Three.js r128.
   IIFE, no-ops if #bg-canvas is absent or WebGL fails. */
(function () {
  var canvas = document.getElementById('bg-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var W = window.innerWidth, H = window.innerHeight;
  var isMobile = W < 760, isTablet = W < 1200;
  var reducedData = (window.matchMedia && window.matchMedia('(prefers-reduced-data: reduce)').matches) ||
    (navigator.connection && navigator.connection.saveData);
  var COUNT = isMobile ? 4000 : (isTablet ? 9000 : 14000);
  if (reducedData) COUNT = Math.round(COUNT / 2);
  var DPR_CAP = isMobile ? 1.5 : 2;

  var renderer, scene, camera, points, material;
  var geometryReady = false;

  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: false, alpha: true });
  } catch (e) {
    canvas.style.display = 'none';
    return;
  }
  if (!renderer) { canvas.style.display = 'none'; return; }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, DPR_CAP));
  renderer.setSize(W, H);

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 100);
  camera.position.set(0, 0, 9);

  /* ---------- shape generators : (index, count, out[3]) ------------------ */
  function goldenSphere(i, n, out) {
    var golden = Math.PI * (3 - Math.sqrt(5));
    var y = 1 - (i / (n - 1)) * 2;
    var r = Math.sqrt(1 - y * y);
    var theta = golden * i;
    var wob = 1 + 0.12 * Math.sin(i * 0.37);
    out[0] = Math.cos(theta) * r * 3.2 * wob;
    out[1] = y * 3.2 * wob;
    out[2] = Math.sin(theta) * r * 3.2 * wob;
  }
  function knot(i, n, out) {
    var t = (i / n) * Math.PI * 2 * 6;
    var p = 2, q = 3, R = 2.4;
    var r = R + Math.cos(q * t / p) * 0.9;
    out[0] = r * Math.cos(t) + (Math.random() - 0.5) * 0.3;
    out[1] = r * Math.sin(t) + (Math.random() - 0.5) * 0.3;
    out[2] = Math.sin(q * t / p) * 1.6 + (Math.random() - 0.5) * 0.3;
  }
  function field(i, n, out) {
    var side = Math.ceil(Math.sqrt(n));
    var xi = i % side, zi = Math.floor(i / side);
    var x = (xi / side - 0.5) * 7;
    var z = (zi / side - 0.5) * 7;
    var y = Math.sin(x * 1.2) * Math.cos(z * 1.2) * 1.4;
    out[0] = x; out[1] = y; out[2] = z;
  }
  function helix(i, n, out) {
    var arm = i % 3;
    var t = (i / n) * Math.PI * 10;
    var r = 2.2;
    out[0] = Math.cos(t + arm * (Math.PI * 2 / 3)) * r;
    out[1] = (i / n - 0.5) * 7;
    out[2] = Math.sin(t + arm * (Math.PI * 2 / 3)) * r;
  }
  function grid(i, n, out) {
    var side = Math.ceil(Math.cbrt(n));
    var xi = i % side;
    var yi = Math.floor(i / side) % side;
    var zi = Math.floor(i / (side * side));
    out[0] = (xi / side - 0.5) * 6.4;
    out[1] = (yi / side - 0.5) * 6.4;
    out[2] = (zi / side - 0.5) * 6.4;
  }
  function torus(i, n, out) {
    var u = Math.random() * Math.PI * 2;
    var v = Math.random() * Math.PI * 2;
    var R = 2.4, r = 0.9;
    out[0] = (R + r * Math.cos(v)) * Math.cos(u);
    out[1] = (R + r * Math.cos(v)) * Math.sin(u);
    out[2] = r * Math.sin(v);
  }
  var SHAPES = { sphere: goldenSphere, knot: knot, field: field, helix: helix, grid: grid, torus: torus };

  /* ---------- buffers ------------------------------------------------------ */
  var aFrom = new Float32Array(COUNT * 3);
  var aTo = new Float32Array(COUNT * 3);
  var aSeed = new Float32Array(COUNT);
  var tmp = [0, 0, 0];
  var currentShapeName = document.body.getAttribute('data-shape') || 'sphere';

  function fillShape(name, arr) {
    var gen = SHAPES[name] || goldenSphere;
    for (var i = 0; i < COUNT; i++) {
      gen(i, COUNT, tmp);
      arr[i * 3] = tmp[0]; arr[i * 3 + 1] = tmp[1]; arr[i * 3 + 2] = tmp[2];
    }
  }
  fillShape(currentShapeName, aFrom);
  aTo.set(aFrom);
  for (var s = 0; s < COUNT; s++) aSeed[s] = Math.random();

  var geometry = new THREE.BufferGeometry();
  geometry.setAttribute('aFrom', new THREE.BufferAttribute(aFrom, 3));
  geometry.setAttribute('aTo', new THREE.BufferAttribute(aTo, 3));
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(aSeed, 1));
  geometry.setAttribute('position', new THREE.BufferAttribute(aFrom.slice(), 3));

  var vertexShader = [
    'attribute vec3 aFrom;',
    'attribute vec3 aTo;',
    'attribute float aSeed;',
    'uniform float uMix;',
    'uniform float uTime;',
    'uniform float uEnergy;',
    'uniform float uReduced;',
    'uniform vec3 uMouse;',
    'varying float vDist;',
    'varying float vSeed;',
    'float hash(vec3 p) {',
    '  p = fract(p * 0.3183099 + 0.1);',
    '  p *= 17.0;',
    '  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));',
    '}',
    'float noise(vec3 x) {',
    '  vec3 i = floor(x); vec3 f = fract(x);',
    '  f = f * f * (3.0 - 2.0 * f);',
    '  float n000 = hash(i + vec3(0,0,0));',
    '  float n100 = hash(i + vec3(1,0,0));',
    '  float n010 = hash(i + vec3(0,1,0));',
    '  float n110 = hash(i + vec3(1,1,0));',
    '  float n001 = hash(i + vec3(0,0,1));',
    '  float n101 = hash(i + vec3(1,0,1));',
    '  float n011 = hash(i + vec3(0,1,1));',
    '  float n111 = hash(i + vec3(1,1,1));',
    '  return mix(mix(mix(n000,n100,f.x),mix(n010,n110,f.x),f.y),',
    '             mix(mix(n001,n101,f.x),mix(n011,n111,f.x),f.y), f.z);',
    '}',
    'void main() {',
    '  vSeed = aSeed;',
    '  float stagger = clamp((uMix - aSeed * 0.4) / 0.6, 0.0, 1.0);',
    '  float e = smoothstep(0.0, 1.0, stagger);',
    '  vec3 pos = mix(aFrom, aTo, e);',
    '  if (uReduced < 0.5) {',
    '    float n = noise(pos * 0.5 + uTime * 0.06 + aSeed * 10.0);',
    '    pos += (n - 0.5) * (0.5 + uEnergy * 2.0);',
    '  }',
    '  float d = distance(pos, uMouse);',
    '  float push = smoothstep(1.6, 0.0, d);',
    '  vec3 dir = normalize(pos - uMouse + 0.0001);',
    '  pos += dir * push * 0.6;',
    '  vDist = push;',
    '  vec4 mv = modelViewMatrix * vec4(pos, 1.0);',
    '  gl_PointSize = (1.1 + push * 1.6) * (34.0 / -mv.z);',
    '  gl_Position = projectionMatrix * mv;',
    '}'
  ].join('\n');

  var fragmentShader = [
    'uniform float uTheme;',
    'varying float vDist;',
    'varying float vSeed;',
    'void main() {',
    '  vec2 c = gl_PointCoord - vec2(0.5);',
    '  float d = length(c);',
    '  if (d > 0.5) discard;',
    '  float alpha = smoothstep(0.5, 0.0, d);',
    '  vec3 violetD = vec3(0.486, 0.361, 1.0);',
    '  vec3 tealD = vec3(0.133, 0.827, 0.773);',
    '  vec3 amberD = vec3(1.0, 0.71, 0.27);',
    '  vec3 violetL = vec3(0.357, 0.243, 0.961);',
    '  vec3 tealL = vec3(0.051, 0.584, 0.533);',
    '  vec3 amberL = vec3(0.85, 0.54, 0.05);',
    '  vec3 violet = mix(violetD, violetL, uTheme);',
    '  vec3 teal = mix(tealD, tealL, uTheme);',
    '  vec3 amber = mix(amberD, amberL, uTheme);',
    '  vec3 base = mix(violet, teal, vSeed);',
    '  vec3 col = mix(base, amber, vDist);',
    '  float alphaMul = mix(0.24, 0.16, uTheme);',
    '  gl_FragColor = vec4(col, alpha * (alphaMul + vDist * 0.5));',
    '}'
  ].join('\n');

  var lineFragmentShader = [
    'uniform float uTheme;',
    'varying float vDist;',
    'varying float vSeed;',
    'void main() {',
    '  vec3 violetD = vec3(0.486, 0.361, 1.0);',
    '  vec3 tealD = vec3(0.133, 0.827, 0.773);',
    '  vec3 violetL = vec3(0.357, 0.243, 0.961);',
    '  vec3 tealL = vec3(0.051, 0.584, 0.533);',
    '  vec3 violet = mix(violetD, violetL, uTheme);',
    '  vec3 teal = mix(tealD, tealL, uTheme);',
    '  vec3 col = mix(violet, teal, vSeed);',
    '  float lineAlpha = mix(0.055, 0.035, uTheme);',
    '  gl_FragColor = vec4(col, lineAlpha + vDist * 0.22);',
    '}'
  ].join('\n');

  var sharedUniforms = {
    uMix: { value: 1 },
    uTime: { value: 0 },
    uEnergy: { value: 0 },
    uReduced: { value: reduced ? 1 : 0 },
    uMouse: { value: new THREE.Vector3(999, 999, 999) },
    uTheme: { value: document.documentElement.getAttribute('data-theme') === 'light' ? 1 : 0 }
  };

  window.__sceneSetTheme = function (isLight) {
    sharedUniforms.uTheme.value = isLight ? 1 : 0;
  };

  material = new THREE.ShaderMaterial({
    uniforms: sharedUniforms,
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending
  });

  points = new THREE.Points(geometry, material);
  scene.add(points);
  geometryReady = true;

  /* faint constellation lines tracing the shape's parametric path — reads as a
     deliberate network motif rather than noise, and stays low-alpha so body
     text keeps contrast over it. */
  var lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute('aFrom', geometry.attributes.aFrom);
  lineGeometry.setAttribute('aTo', geometry.attributes.aTo);
  lineGeometry.setAttribute('aSeed', geometry.attributes.aSeed);
  lineGeometry.setAttribute('position', geometry.attributes.position);
  var lineStep = Math.max(1, Math.floor(COUNT / 2600));
  var lineIdx = [];
  for (var li = 0; li < COUNT - lineStep; li += lineStep) { lineIdx.push(li, li + lineStep); }
  var IndexArrayType = COUNT > 65535 ? Uint32Array : Uint16Array;
  lineGeometry.setIndex(new THREE.BufferAttribute(new IndexArrayType(lineIdx), 1));

  var lineMaterial = new THREE.ShaderMaterial({
    uniforms: sharedUniforms,
    vertexShader: vertexShader,
    fragmentShader: lineFragmentShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending
  });
  var lines = new THREE.LineSegments(lineGeometry, lineMaterial);
  scene.add(lines);

  /* ---------- shape switching ---------------------------------------------- */
  function morphTo(name) {
    if (!geometryReady || SHAPES[name] === undefined && name !== currentShapeName) {}
    var mix = material.uniforms.uMix.value;
    var fromAttr = geometry.attributes.aFrom.array;
    var toAttr = geometry.attributes.aTo.array;
    var seedAttr = geometry.attributes.aSeed.array;
    for (var i = 0; i < COUNT; i++) {
      var stagger = Math.min(Math.max((mix - seedAttr[i] * 0.4) / 0.6, 0), 1);
      var e = stagger * stagger * (3 - 2 * stagger);
      for (var k = 0; k < 3; k++) {
        var idx = i * 3 + k;
        fromAttr[idx] = fromAttr[idx] + (toAttr[idx] - fromAttr[idx]) * e;
      }
    }
    fillShape(name, toAttr);
    geometry.attributes.aFrom.needsUpdate = true;
    geometry.attributes.aTo.needsUpdate = true;
    material.uniforms.uMix.value = 0;
    currentShapeName = name;
  }

  morphTo(currentShapeName);

  var sections = document.querySelectorAll('section[data-shape]');
  if ('IntersectionObserver' in window && sections.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var shape = entry.target.getAttribute('data-shape');
          if (shape && shape !== currentShapeName) morphTo(shape);
        }
      });
    }, { threshold: 0.3 });
    sections.forEach(function (sec) { io.observe(sec); });
  }

  /* ---------- pointer / scroll ---------------------------------------------- */
  var mouse = new THREE.Vector2(999, 999);
  var raycaster = new THREE.Raycaster();
  var zPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  var hitPoint = new THREE.Vector3(999, 999, 999);

  window.addEventListener('pointermove', function (e) {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  }, { passive: true });

  var lastScrollY = window.scrollY;
  var scrollVelocity = 0;
  var scrollProgress = 0;
  window.addEventListener('scroll', function () {
    var y = window.scrollY;
    scrollVelocity = Math.min(Math.abs(y - lastScrollY) / 40, 1);
    lastScrollY = y;
    var doc = document.documentElement;
    var max = (doc.scrollHeight - window.innerHeight) || 1;
    scrollProgress = Math.min(Math.max(y / max, 0), 1);
  }, { passive: true });

  /* ---------- resize (debounced) --------------------------------------------- */
  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      W = window.innerWidth; H = window.innerHeight;
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
      renderer.setSize(W, H);
    }, 120);
  }, { passive: true });

  /* ---------- perf guard: frame delta watchdog -------------------------------- */
  var lastFrame = performance.now();
  var slowFrames = 0;
  var droppedRatio = false;

  var clock = new THREE.Clock();

  function isVisible() {
    var rect = canvas.getBoundingClientRect();
    return rect.bottom > 0 && rect.top < window.innerHeight;
  }

  function animate(now) {
    requestAnimationFrame(animate);
    if (document.hidden || !isVisible()) return;

    var delta = now - lastFrame;
    lastFrame = now;
    if (delta > 33) {
      slowFrames++;
      if (slowFrames > 60 && !droppedRatio) {
        renderer.setPixelRatio(1);
        droppedRatio = true;
      }
    } else {
      slowFrames = 0;
    }

    var t = clock.getElapsedTime();
    material.uniforms.uTime.value = t;
    if (material.uniforms.uMix.value < 1) {
      material.uniforms.uMix.value = Math.min(material.uniforms.uMix.value + 0.012, 1);
    }
    scrollVelocity *= 0.9;
    material.uniforms.uEnergy.value = scrollVelocity;

    raycaster.setFromCamera(mouse, camera);
    var didHit = raycaster.ray.intersectPlane(zPlane, hitPoint);
    material.uniforms.uMouse.value.copy(didHit ? hitPoint : new THREE.Vector3(999, 999, 999));

    camera.position.y = -scrollProgress * 1.4;
    camera.position.z = 9 - scrollProgress * 1.2;

    renderer.render(scene, camera);
  }
  requestAnimationFrame(animate);
})();
