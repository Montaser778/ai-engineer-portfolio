// Progressively enhances every native <select> into a styled dropdown
// (.csel) that matches the site's dark theme, instead of the browser's
// default popup. The original <select> stays in the DOM (visually
// hidden via .csel-native) so forms keep submitting its value exactly
// as before, and it becomes the single source of truth the widget reads
// from/writes to -- no separate state to keep in sync.
(function () {
  function buildArrow() {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 20 20');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '1.6');
    svg.setAttribute('aria-hidden', 'true');
    var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M5 7l5 5 5-5');
    svg.appendChild(path);
    return svg;
  }

  function enhance(select) {
    if (select.classList.contains('csel-native')) return;
    var wrap = document.createElement('div');
    wrap.className = 'csel';

    var trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'csel-trigger';
    var label = document.createElement('span');
    trigger.appendChild(label);
    trigger.appendChild(buildArrow());

    var menu = document.createElement('div');
    menu.className = 'csel-menu';
    menu.setAttribute('role', 'listbox');

    var options = Array.prototype.slice.call(select.options);
    var optionEls = options.map(function (opt) {
      var el = document.createElement('div');
      el.className = 'csel-option';
      el.setAttribute('role', 'option');
      el.textContent = opt.textContent;
      el.dataset.value = opt.value;
      if (opt.disabled) { el.setAttribute('aria-disabled', 'true'); el.style.opacity = '.45'; el.style.cursor = 'default'; }
      menu.appendChild(el);
      return el;
    });

    function sync() {
      var opt = select.options[select.selectedIndex];
      label.textContent = opt ? opt.textContent : '';
      optionEls.forEach(function (el, i) {
        el.setAttribute('aria-selected', options[i] === opt ? 'true' : 'false');
      });
    }

    function close() {
      wrap.classList.remove('open');
      trigger.setAttribute('aria-expanded', 'false');
    }
    function open() {
      wrap.classList.add('open');
      trigger.setAttribute('aria-expanded', 'true');
    }

    trigger.addEventListener('click', function () {
      wrap.classList.contains('open') ? close() : open();
    });
    document.addEventListener('click', function (e) {
      if (!wrap.contains(e.target)) close();
    });
    wrap.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { close(); trigger.focus(); }
    });

    optionEls.forEach(function (el, i) {
      el.addEventListener('click', function () {
        if (options[i].disabled) return;
        select.selectedIndex = i;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        sync();
        close();
      });
    });

    select.classList.add('csel-native');
    select.setAttribute('tabindex', '-1');
    select.setAttribute('aria-hidden', 'true');
    select.parentNode.insertBefore(wrap, select);
    wrap.appendChild(trigger);
    wrap.appendChild(menu);
    wrap.appendChild(select);
    sync();

    select.addEventListener('change', sync);
  }

  function init() {
    document.querySelectorAll('select').forEach(enhance);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.mhEnhanceSelects = init;
})();
