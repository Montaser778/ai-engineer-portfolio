/* make-the-case.js — v9 §127: live email template + copy-to-clipboard.
   No-ops entirely if the page's target elements are absent. */
(function () {
  var box = document.getElementById('case-email-output');
  if (!box) return;

  var fields = {
    manager: document.getElementById('case-manager'),
    project: document.getElementById('case-project'),
    problem: document.getElementById('case-problem'),
    duration: document.getElementById('case-duration'),
    tier: document.getElementById('case-tier'),
    alt: document.getElementById('case-alt')
  };
  var copyBtn = document.getElementById('case-copy');

  function val(el, fallback) {
    var v = el && el.value ? el.value.trim() : '';
    return v || fallback;
  }

  function render() {
    var manager = val(fields.manager, '[manager]');
    var project = val(fields.project, '[project]');
    var problem = val(fields.problem, '[specific problem]');
    var duration = val(fields.duration, '[duration]');
    var tier = fields.tier ? fields.tier.value : 'Sprint tier, from $1,800';
    var alt = val(fields.alt, '[in-house cost / agency cost / continued delay]');

    var text =
      'Subject: External specialist for the ' + project + ' voice feature\n\n' +
      'Hi ' + manager + ',\n\n' +
      "We've been blocked on " + problem + ' for ' + duration + ". I've found an engineer who has shipped this exact system end to end — real-time voice with sub-800ms turn latency, deployed and operating in production. " +
      'He works on fixed-scope contracts starting at the ' + tier + ', 50% upfront, and we own the code on completion. ' +
      'The alternative is ' + alt + ".\n\n" +
      "I'd like to book a 30-minute scoping call. His work is at https://montaser778.github.io/";

    box.textContent = text;
  }

  Object.keys(fields).forEach(function (k) {
    var el = fields[k];
    if (el) el.addEventListener('input', render);
  });
  render();

  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      if (!navigator.clipboard) return;
      navigator.clipboard.writeText(box.textContent).then(function () {
        var original = copyBtn.textContent;
        copyBtn.textContent = 'Copied';
        copyBtn.classList.add('copied');
        setTimeout(function () { copyBtn.textContent = original; copyBtn.classList.remove('copied'); }, 1500);
      }).catch(function () {});
    });
  }
})();
