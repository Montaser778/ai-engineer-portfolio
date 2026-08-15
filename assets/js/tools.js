/* tools.js — architecture explorer, cost estimator, live GitHub fetch.
   IIFE modules, each no-ops if its markup is absent. Loaded on demos.html only. */
(function () {

  /* =========================================================================
     Architecture explorer
     ========================================================================= */
  (function archExplorer() {
    var root = document.getElementById('demo-arch');
    if (!root) return;
    var nodes = root.querySelectorAll('.arch-node');
    var panel = root.querySelector('.arch-panel');

    var DATA = {
      transport: { title: 'Transport (WebRTC)', body: 'Carries audio between browser and edge with sub-150ms typical RTT.', why: 'Why this way: WebSockets add framing and jitter-buffer overhead that WebRTC handles natively for real-time audio.' },
      endpointing: { title: 'Endpointing', body: 'Detects when the user has finished speaking using RMS + silence duration.', why: 'Why this way: a fixed silence window is simple to reason about and tune per-language, versus a learned VAD that is harder to debug in production.' },
      asr: { title: 'Speech-to-text', body: 'Streams partial transcripts as audio arrives.', why: 'Why this way: streaming ASR starts the LLM call earlier than waiting for a final transcript, cutting perceived latency.' },
      llm: { title: 'LLM reasoning', body: 'Generates a response conditioned on transcript and conversation state.', why: 'Why this way: first-token latency dominates perceived speed, so the prompt is kept short and the model call starts on partial context when confidence is high.' },
      tts: { title: 'Speech synthesis', body: 'Converts the response to audio, streamed sentence by sentence.', why: 'Why this way: sentence-level streaming lets playback start before the full response is generated.' },
      scoring: { title: 'Scoring / evaluation', body: 'Scores the exchange after the turn ends, out of the conversation loop.', why: 'Why this way: scoring inside the loop adds latency the user feels; moving it out keeps the conversation fast and the evaluation honest.' }
    };

    nodes.forEach(function (node) {
      node.addEventListener('click', function () {
        nodes.forEach(function (n) { n.setAttribute('aria-pressed', 'false'); });
        node.setAttribute('aria-pressed', 'true');
        var key = node.getAttribute('data-node');
        var d = DATA[key];
        if (panel && d) {
          panel.innerHTML = '<h4>' + d.title + '</h4><p>' + d.body + '</p><p class="mono" style="color:var(--teal);font-size:13px">' + d.why + '</p>';
        }
      });
    });
  })();

  /* =========================================================================
     Cost estimator
     ========================================================================= */
  (function costEstimator() {
    var root = document.getElementById('demo-cost');
    if (!root) return;
    var users = root.querySelector('[name="cost-users"]');
    var minutes = root.querySelector('[name="cost-minutes"]');
    var lang = root.querySelector('[name="cost-lang"]');
    var voiceQ = root.querySelector('[name="cost-voice"]');
    var usersOut = root.querySelector('.cost-users-out');
    var minutesOut = root.querySelector('.cost-minutes-out');
    var monthlyOut = root.querySelector('.cost-monthly');
    var perUserOut = root.querySelector('.cost-peruser');
    var latencyOut = root.querySelector('.cost-latency');
    var bars = root.querySelectorAll('.cost-bar-fill');

    function compute() {
      var u = parseInt(users.value, 10);
      var m = parseFloat(minutes.value);
      var isAr = lang.value === 'ar';
      var quality = voiceQ.value;

      var asrCost = u * m * 0.006;
      var llmCost = u * m * 0.012;
      var ttsRate = quality === 'premium' ? 0.02 : 0.008;
      var ttsCost = u * m * ttsRate;
      var infraCost = u * 0.15;

      var total = asrCost + llmCost + ttsCost + infraCost;
      var perUser = u > 0 ? total / u : 0;

      var baseLatency = 620;
      if (isAr) baseLatency += 90;
      if (quality === 'premium') baseLatency += 60;

      if (usersOut) usersOut.textContent = u.toLocaleString();
      if (minutesOut) minutesOut.textContent = m.toString();
      if (monthlyOut) monthlyOut.textContent = '$' + total.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      if (perUserOut) perUserOut.textContent = '$' + perUser.toFixed(3);
      if (latencyOut) latencyOut.textContent = Math.round(baseLatency) + 'ms';

      var parts = [asrCost, llmCost, ttsCost, infraCost];
      var max = Math.max.apply(null, parts) || 1;
      bars.forEach(function (bar, i) {
        bar.style.width = (parts[i] / max * 100) + '%';
        var label = bar.parentElement.querySelector('.cost-bar-val');
        if (label) label.textContent = '$' + parts[i].toFixed(0);
      });
    }

    [users, minutes, lang, voiceQ].forEach(function (el) {
      if (el) el.addEventListener('input', compute);
    });
    compute();
  })();

  /* =========================================================================
     Live GitHub
     ========================================================================= */
  (function githubDemo() {
    var root = document.getElementById('gh');
    if (!root) return;
    var user = root.getAttribute('data-user') || 'montaser778';
    var list = root.querySelector('.gh-list');
    var status = root.querySelector('.gh-status');

    function timeAgo(dateStr) {
      var diff = Date.now() - new Date(dateStr).getTime();
      var days = Math.floor(diff / 86400000);
      if (days < 1) return 'today';
      if (days === 1) return '1 day ago';
      if (days < 30) return days + ' days ago';
      var months = Math.floor(days / 30);
      return months + (months === 1 ? ' month ago' : ' months ago');
    }

    if (status) status.textContent = 'Loading recent repositories...';

    fetch('https://api.github.com/users/' + user + '/repos?sort=updated&per_page=6')
      .then(function (res) {
        if (!res.ok) throw new Error('GitHub API error ' + res.status);
        return res.json();
      })
      .then(function (repos) {
        if (!Array.isArray(repos) || !repos.length) throw new Error('empty');
        if (status) status.textContent = '';
        if (list) {
          list.innerHTML = '';
          repos.forEach(function (repo) {
            var item = document.createElement('a');
            item.href = repo.html_url;
            item.target = '_blank';
            item.rel = 'noopener';
            item.className = 'card gh-item';
            item.innerHTML =
              '<h4>' + repo.name + '</h4>' +
              '<p>' + (repo.description || 'No description provided.') + '</p>' +
              '<div class="tag">' + (repo.language || 'n/a') + '</div> ' +
              '<div class="tag">★ ' + repo.stargazers_count + '</div> ' +
              '<div class="tag">' + timeAgo(repo.pushed_at) + '</div>';
            list.appendChild(item);
          });
        }
      })
      .catch(function () {
        if (status) status.textContent = 'Could not load live repository data right now (rate limit or network). Visit the GitHub profile directly to see current work.';
      });
  })();

  /* =========================================================================
     Live product embed — lazy-mounted iframe, only when URL placeholder replaced
     ========================================================================= */
  (function liveEmbed() {
    var root = document.getElementById('liveUrl');
    if (!root) return;
    var url = root.getAttribute('data-url') || '';
    if (!url || url.indexOf('REPLACE') !== -1) {
      root.innerHTML = '<p class="form-note">Live embed will appear here once the deployed URL placeholder is replaced.</p>';
      return;
    }
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var iframe = document.createElement('iframe');
            iframe.src = url;
            iframe.loading = 'lazy';
            iframe.style.width = '100%';
            iframe.style.height = '560px';
            iframe.style.border = '1px solid var(--line)';
            iframe.style.borderRadius = 'var(--radius-card)';
            root.appendChild(iframe);
            io.disconnect();
          }
        });
      }, { threshold: 0.1 });
      io.observe(root);
    }
  })();
})();
