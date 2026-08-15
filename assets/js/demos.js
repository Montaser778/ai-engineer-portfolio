/* demos.js — six interactive demos for demos.html. IIFE modules, each
   no-ops if its markup is absent. */
(function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* =========================================================================
     1. Voice pipeline
     ========================================================================= */
  (function voiceDemo() {
    var root = document.getElementById('demo-voice');
    if (!root) return;
    var canvas = root.querySelector('canvas');
    var startBtn = root.querySelector('.voice-start');
    var simBtn = root.querySelector('.voice-simulate');
    var stages = root.querySelectorAll('.voice-stage');
    var totalEl = root.querySelector('.voice-total');
    var statusEl = root.querySelector('.voice-status');
    if (!canvas) return;
    var ctx2d = canvas.getContext('2d');

    var audioCtx, analyser, source, dataArray, rafId;
    var silenceStart = null;
    var THRESHOLD = 0.028;
    var SILENCE_MS = 520;
    var running = false;

    function resizeCanvas() {
      var rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * (window.devicePixelRatio || 1);
      canvas.height = 140 * (window.devicePixelRatio || 1);
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas, { passive: true });

    function drawWave(rms) {
      var w = canvas.width, h = canvas.height;
      ctx2d.clearRect(0, 0, w, h);
      ctx2d.strokeStyle = 'rgba(136,146,166,.4)';
      ctx2d.setLineDash([4, 4]);
      var threshY = h / 2 - THRESHOLD * h * 6;
      ctx2d.beginPath();
      ctx2d.moveTo(0, threshY);
      ctx2d.lineTo(w, threshY);
      ctx2d.stroke();
      ctx2d.setLineDash([]);

      ctx2d.strokeStyle = '#22d3c5';
      ctx2d.lineWidth = 2;
      ctx2d.beginPath();
      var n = dataArray ? dataArray.length : 64;
      for (var i = 0; i < n; i++) {
        var v = dataArray ? (dataArray[i] - 128) / 128 : 0;
        var x = (i / n) * w;
        var y = h / 2 + v * h * 0.4;
        i === 0 ? ctx2d.moveTo(x, y) : ctx2d.lineTo(x, y);
      }
      ctx2d.stroke();
      // mirrored
      ctx2d.strokeStyle = 'rgba(34,211,197,.35)';
      ctx2d.beginPath();
      for (var j = 0; j < n; j++) {
        var v2 = dataArray ? (dataArray[j] - 128) / 128 : 0;
        var x2 = (j / n) * w;
        var y2 = h / 2 - v2 * h * 0.4;
        j === 0 ? ctx2d.moveTo(x2, y2) : ctx2d.lineTo(x2, y2);
      }
      ctx2d.stroke();
    }

    function loop() {
      rafId = requestAnimationFrame(loop);
      if (!analyser) return;
      analyser.getByteTimeDomainData(dataArray);
      var sumSq = 0;
      for (var i = 0; i < dataArray.length; i++) {
        var v = (dataArray[i] - 128) / 128;
        sumSq += v * v;
      }
      var rms = Math.sqrt(sumSq / dataArray.length);
      drawWave(rms);

      if (rms < THRESHOLD) {
        if (silenceStart === null) silenceStart = performance.now();
        else if (performance.now() - silenceStart > SILENCE_MS && running) {
          running = false;
          runTimeline();
        }
      } else {
        silenceStart = null;
      }
    }

    function stopMic() {
      if (rafId) cancelAnimationFrame(rafId);
      if (source && source.mediaStream) {
        source.mediaStream.getTracks().forEach(function (t) { t.stop(); });
      }
      if (audioCtx) audioCtx.close().catch(function () {});
    }

    async function startMic() {
      try {
        var stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 1024;
        dataArray = new Uint8Array(analyser.fftSize);
        source = audioCtx.createMediaStreamSource(stream);
        source.mediaStream = stream;
        source.connect(analyser);
        running = true;
        silenceStart = null;
        if (statusEl) statusEl.textContent = 'Listening — speak, then go quiet to end the turn.';
        loop();
      } catch (e) {
        if (statusEl) statusEl.textContent = 'Microphone unavailable or denied. Use "simulate a turn" instead.';
      }
    }

    function runTimeline() {
      if (statusEl) statusEl.textContent = 'Turn complete — measuring pipeline stages.';
      var values = [
        60 + Math.random() * 40,
        140 + Math.random() * 90,
        180 + Math.random() * 160,
        90 + Math.random() * 70
      ];
      var total = 0;
      stages.forEach(function (stage, i) {
        var valEl = stage.querySelector('.stage-ms');
        var fill = stage.querySelector('.stage-fill');
        setTimeout(function () {
          stage.classList.add('active');
          var v = Math.round(values[i]);
          total += v;
          var t0 = performance.now();
          function step(now) {
            var p = Math.min((now - t0) / 500, 1);
            if (valEl) valEl.textContent = Math.floor(v * p) + 'ms';
            if (fill) fill.style.width = (p * 100) + '%';
            if (p < 1) requestAnimationFrame(step);
            else if (i === stages.length - 1 && totalEl) {
              totalEl.textContent = Math.round(total) + 'ms';
              totalEl.classList.toggle('below', total < 800);
            }
          }
          requestAnimationFrame(step);
        }, i * 480);
      });
    }

    if (startBtn) startBtn.addEventListener('click', function () {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        if (statusEl) statusEl.textContent = 'getUserMedia not supported here. Use "simulate a turn".';
        return;
      }
      startMic();
    });
    if (simBtn) simBtn.addEventListener('click', function () {
      running = false;
      runTimeline();
    });
    window.addEventListener('pagehide', stopMic);
  })();

  /* =========================================================================
     2. Answer scoring
     ========================================================================= */
  (function scoringDemo() {
    var root = document.getElementById('demo-scoring');
    if (!root) return;
    var textarea = root.querySelector('textarea');
    var btn = root.querySelector('.score-btn');
    var bars = root.querySelectorAll('.score-bar-fill');
    var verdict = root.querySelector('.score-verdict');
    var canvas = root.querySelector('canvas');
    var ctx2d = canvas ? canvas.getContext('2d') : null;

    var DIMS = ['Relevance', 'Technical depth', 'Structure', 'Evidence', 'Concision'];

    function score(text) {
      var words = text.trim().split(/\s+/).filter(Boolean);
      var len = words.length;
      var sequenceMarkers = (text.match(/\b(first|second|then|next|finally|because|therefore)\b/gi) || []).length;
      var numbers = (text.match(/\d+(\.\d+)?%?/g) || []).length;
      var techTerms = (text.match(/\b(latency|api|model|token|pipeline|inference|throughput|deploy|schema|endpoint|webhook)\b/gi) || []).length;
      var hedges = (text.match(/\b(maybe|perhaps|kind of|sort of|i think|probably)\b/gi) || []).length;

      var relevance = Math.min(5, 2 + Math.min(2, techTerms * 0.4) + (len > 15 ? 1 : 0));
      var depth = Math.min(5, 1 + techTerms * 0.7 + numbers * 0.3);
      var structure = Math.min(5, 1 + sequenceMarkers * 0.8);
      var evidence = Math.min(5, 1 + numbers * 0.9);
      var concision = len === 0 ? 1 : Math.max(1, 5 - Math.floor(len / 60) - hedges);

      return [relevance, depth, structure, evidence, concision].map(function (v) { return Math.round(Math.max(1, Math.min(5, v)) * 10) / 10; });
    }

    function drawRadar(values) {
      if (!ctx2d) return;
      var w = canvas.width = canvas.clientWidth * (window.devicePixelRatio || 1);
      var h = canvas.height = canvas.clientHeight * (window.devicePixelRatio || 1);
      ctx2d.clearRect(0, 0, w, h);
      var cx = w / 2, cy = h / 2, r = Math.min(w, h) * 0.36;
      var n = values.length;
      ctx2d.strokeStyle = 'rgba(136,146,166,.25)';
      for (var ring = 1; ring <= 4; ring++) {
        ctx2d.beginPath();
        for (var i = 0; i <= n; i++) {
          var a = (i / n) * Math.PI * 2 - Math.PI / 2;
          var rr = r * (ring / 4);
          var x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
          i === 0 ? ctx2d.moveTo(x, y) : ctx2d.lineTo(x, y);
        }
        ctx2d.stroke();
      }
      ctx2d.strokeStyle = '#22d3c5';
      ctx2d.fillStyle = 'rgba(34,211,197,.22)';
      ctx2d.beginPath();
      for (var j = 0; j <= n; j++) {
        var idx = j % n;
        var a2 = (idx / n) * Math.PI * 2 - Math.PI / 2;
        var rr2 = r * (values[idx] / 5);
        var x2 = cx + Math.cos(a2) * rr2, y2 = cy + Math.sin(a2) * rr2;
        j === 0 ? ctx2d.moveTo(x2, y2) : ctx2d.lineTo(x2, y2);
      }
      ctx2d.closePath();
      ctx2d.fill();
      ctx2d.stroke();
    }

    function run() {
      var text = textarea ? textarea.value : '';
      var values = score(text);
      bars.forEach(function (bar, i) { bar.style.width = (values[i] / 5 * 100) + '%'; });
      drawRadar(values);
      var minIdx = values.indexOf(Math.min.apply(null, values));
      if (verdict) verdict.textContent = 'Weakest dimension: ' + DIMS[minIdx] + ' (' + values[minIdx] + '/5).';
    }

    if (btn) btn.addEventListener('click', run);
    if (textarea) run();
  })();

  /* =========================================================================
     3. Multi-agent pipeline
     ========================================================================= */
  (function agentDemo() {
    var root = document.getElementById('demo-agents');
    if (!root) return;
    var cards = root.querySelectorAll('.agent-card');
    var log = root.querySelector('.agent-log');
    var runBtn = root.querySelector('.agent-run');
    var synthesis = root.querySelector('.agent-synthesis');

    var messages = {
      research: ['Pulling market signals...', 'Found 3 comparable products.'],
      analysis: ['Scoring opportunity size...', 'Opportunity: medium-high, competitive.'],
      risk: ['Checking regulatory exposure...', 'Flag: payment licensing varies by region.'],
      writer: ['Drafting summary...', 'Summary ready for synthesis.']
    };

    function appendLog(text) {
      if (!log) return;
      var line = document.createElement('div');
      line.textContent = text;
      log.appendChild(line);
      log.scrollTop = log.scrollHeight;
    }

    function run() {
      if (log) log.innerHTML = '';
      if (synthesis) synthesis.textContent = '';
      cards.forEach(function (card, i) {
        var name = card.getAttribute('data-agent');
        var statusEl = card.querySelector('.agent-status');
        if (statusEl) statusEl.textContent = 'queued';
        card.classList.remove('running', 'done');

        setTimeout(function () {
          card.classList.add('running');
          if (statusEl) statusEl.textContent = 'running';
          appendLog('[' + name + '] ' + (messages[name] ? messages[name][0] : 'working...'));
        }, i * 500);

        setTimeout(function () {
          card.classList.remove('running');
          card.classList.add('done');
          if (statusEl) statusEl.textContent = 'done';
          appendLog('[' + name + '] ' + (messages[name] ? messages[name][1] : 'complete.'));
        }, i * 500 + 900);
      });

      var totalTime = cards.length * 500 + 1400;
      setTimeout(function () {
        appendLog('[synthesis] Reconciling analysis vs. risk output...');
        appendLog('[synthesis] Conflict: analysis rates opportunity medium-high; risk flags licensing friction in the same region.');
        setTimeout(function () {
          appendLog('[synthesis] Resolution: proceed, scoped to regions without licensing blockers first.');
          if (synthesis) synthesis.textContent = 'Resolved: opportunity is real but region-gated by licensing — recommend phased rollout.';
        }, 700);
      }, totalTime);
    }

    if (runBtn) runBtn.addEventListener('click', run);
  })();

})();
