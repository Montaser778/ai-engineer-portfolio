"""Tiny HTML-templating helper for the admin dashboard -- no Jinja2
dependency, just an f-string shell styled to match the public site's dark
theme (assets/css/site.css tokens: same fonts, same violet/teal accents,
same logo mark), since this backend serves no static files of its own and
pulling in a templating engine for a handful of pages would be more
machinery than the pages need.
"""
import html

LOGO_SVG = (
    '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">'
    '<circle cx="12" cy="12" r="3" fill="#7c5cff"/><circle cx="4" cy="6" r="2" fill="#22d3c5"/>'
    '<circle cx="20" cy="6" r="2" fill="#22d3c5"/><circle cx="4" cy="18" r="2" fill="#22d3c5"/>'
    '<circle cx="20" cy="18" r="2" fill="#22d3c5"/>'
    '<path d="M12 12L4 6M12 12L20 6M12 12L4 18M12 12L20 18" stroke="#8892a6" stroke-width="1"/></svg>'
)

BASE_STYLE = """
  :root {
    --ink: #0b0f18; --panel: rgba(16,21,36,.66); --violet: #7c5cff; --teal: #22d3c5;
    --sand: #f2e8d5; --body: #b9c1d1; --muted: #8892a6; --line: rgba(136,146,166,.18);
    --danger: #ff6b6b; --success: #4ade80;
    --font-display: "Space Grotesk", system-ui, sans-serif;
    --font-body: "IBM Plex Sans", system-ui, sans-serif;
    --font-mono: "JetBrains Mono", ui-monospace, monospace;
  }
  * { box-sizing: border-box; }
  html { background: var(--ink); }
  body {
    margin: 0; color: var(--body); font-family: var(--font-body); min-height: 100vh;
    background: var(--ink);
    position: relative;
  }
  .neural-bg-host {
    position: fixed; inset: 0; width: 100vw; height: 100vh; z-index: 0; pointer-events: none; overflow: hidden;
  }
  #neural-bg {
    position: absolute; inset: 0; width: 100%; height: 100%;
    mask-image: radial-gradient(ellipse at center, #000 45%, transparent 90%);
    -webkit-mask-image: radial-gradient(ellipse at center, #000 45%, transparent 90%);
  }
  header, main { position: relative; z-index: 1; }
  a { color: var(--teal); }
  h1, h2, .brand { font-family: var(--font-display); }
  header {
    display: flex; align-items: center; justify-content: space-between; padding: 16px 24px;
    border-bottom: 1px solid var(--line);
    background: color-mix(in srgb, var(--ink) 75%, transparent);
    backdrop-filter: blur(14px);
    position: sticky; top: 0; z-index: 100;
  }
  header .brand { color: var(--sand); font-weight: 600; display: flex; align-items: center; gap: 8px; letter-spacing: .01em; }
  header .brand svg { width: 22px; height: 22px; }
  nav { display: flex; align-items: center; flex-wrap: wrap; }
  nav a { margin-inline-start: 16px; color: var(--body); text-decoration: none; font-size: 13.5px; font-family: var(--font-mono); transition: color .15s ease; }
  nav a:hover, nav a.active { color: var(--teal); }
  .lang-toggle-link {
    font-family: var(--font-mono); font-size: 12px; color: var(--muted); text-decoration: none;
    border: 1px solid var(--line); border-radius: 6px; padding: 5px 9px; margin-inline-start: 16px;
  }
  .lang-toggle-link:hover { color: var(--teal); border-color: var(--teal); }
  main { max-width: 960px; margin: 0 auto; padding: 40px 24px 64px; }
  h1 { color: var(--sand); font-size: 1.7rem; margin-bottom: 6px; }
  .page-eyebrow { font-family: var(--font-mono); font-size: 11.5px; letter-spacing: .12em; text-transform: uppercase; color: var(--teal); margin-bottom: 10px; }
  h2 { color: var(--sand); font-size: 1.05rem; margin-top: 36px; margin-bottom: 12px; font-family: var(--font-mono); font-weight: 500; }
  .card {
    background: var(--panel); border: 1px solid var(--line); border-radius: 14px; padding: 22px;
    margin-bottom: 16px; backdrop-filter: blur(8px); box-shadow: 0 8px 24px rgba(0,0,0,.18);
  }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: 10px 8px; border-bottom: 1px solid var(--line); font-size: 14px; vertical-align: top; }
  th { color: var(--muted); font-size: 12px; text-transform: uppercase; font-family: var(--font-mono); }
  input, textarea, select {
    width: 100%; background: rgba(255,255,255,.03); border: 1px solid var(--line); border-radius: 8px;
    color: var(--sand); padding: 9px 12px; font-size: 14px; font-family: inherit; transition: border-color .2s ease;
  }
  input:focus, textarea:focus, select:focus { outline: none; border-color: var(--teal); }
  label { display: block; font-size: 12.5px; color: var(--muted); margin: 10px 0 4px; font-family: var(--font-mono); }
  button, .btn {
    background: linear-gradient(135deg, var(--violet), #6a4fe0); color: #fff; border: none; border-radius: 8px;
    padding: 10px 18px; cursor: pointer; font-size: 14px; text-decoration: none; display: inline-block;
    transition: filter .15s ease, transform .1s ease;
  }
  button:hover, .btn:hover { filter: brightness(1.12); }
  button:active, .btn:active { transform: scale(.98); }
  .btn-ghost { background: none; border: 1px solid var(--line); color: var(--body); }
  .btn-danger { background: var(--danger); }
  .flash { background: rgba(74,222,128,.1); border: 1px solid var(--success); color: var(--success); padding: 10px 14px; border-radius: 8px; margin-bottom: 16px; }
  .error { background: rgba(255,107,107,.1); border: 1px solid var(--danger); color: var(--danger); padding: 10px 14px; border-radius: 8px; margin-bottom: 16px; }
  .badge { font-size: 11px; padding: 2px 8px; border-radius: 999px; border: 1px solid var(--line); color: var(--muted); font-family: var(--font-mono); }
  .badge.unread { color: var(--teal); border-color: var(--teal); }
  form.inline { display: inline; }
  .analytics-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 8px; }
  .analytics-stat { text-align: center; margin-bottom: 0; }
  .analytics-stat-num { font-family: var(--font-display); font-size: 1.8rem; color: var(--sand); font-weight: 600; }
  .analytics-stat-lbl { font-family: var(--font-mono); font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: .06em; margin-top: 4px; }
  .analytics-bars { display: flex; align-items: flex-end; gap: 8px; height: 140px; }
  .analytics-bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 100%; gap: 6px; }
  .analytics-bar { width: 100%; max-width: 28px; background: linear-gradient(180deg, var(--violet), var(--teal)); border-radius: 4px 4px 0 0; transition: filter .15s ease; }
  .analytics-bar-col:hover .analytics-bar { filter: brightness(1.25); }
  .analytics-bar-label { font-family: var(--font-mono); font-size: 10px; color: var(--muted); }
  .settings-toggle-row {
    display: flex; align-items: center; justify-content: space-between; gap: 16px;
    padding: 12px 0; border-bottom: 1px solid var(--line); font-size: 14px; color: var(--body);
  }
  .settings-toggle-row:last-child { border-bottom: none; }
  .settings-switch { position: relative; width: 42px; height: 24px; flex-shrink: 0; }
  .settings-switch input { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; margin: 0; cursor: pointer; z-index: 1; }
  .settings-switch-track {
    position: absolute; inset: 0; background: var(--line); border-radius: 999px; transition: background .2s ease;
  }
  .settings-switch-track::after {
    content: ""; position: absolute; top: 3px; left: 3px; width: 18px; height: 18px; border-radius: 50%;
    background: var(--sand); transition: transform .2s cubic-bezier(.16,1,.3,1);
  }
  .settings-switch input:checked ~ .settings-switch-track { background: linear-gradient(135deg, var(--violet), var(--teal)); }
  .settings-switch input:checked ~ .settings-switch-track::after { transform: translateX(18px); }
  .settings-integration-row {
    display: flex; align-items: center; justify-content: space-between; gap: 16px;
    padding: 10px 0; border-bottom: 1px solid var(--line); font-size: 14px; color: var(--body);
  }
  .settings-integration-row:last-child { border-bottom: none; }
  .badge.ok { color: var(--success); border-color: var(--success); }
  @media (max-width: 640px) { .analytics-stats { grid-template-columns: repeat(2, 1fr); } }
  .muted-link { color: var(--muted); font-size: 13px; text-decoration: none; }
  .muted-link:hover { color: var(--teal); }
"""

FONT_LINK = (
    '<link rel="preconnect" href="https://fonts.googleapis.com">'
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
    '<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600&family=IBM+Plex+Sans:wght@400;500'
    '&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">'
)

# Same animated neural-network canvas as the public site's hero, loaded
# straight from the live site rather than duplicated here -- one script,
# one place it can go stale. Harmless if the site is ever briefly
# unreachable: neural-bg.js no-ops without errors if anything's missing.
NEURAL_BG = '<div class="neural-bg-host"><canvas id="neural-bg" aria-hidden="true"></canvas></div>'
NEURAL_BG_SCRIPT = '<script src="https://eng7montaser.tech/assets/js/neural-bg.js"></script>'


def esc(value) -> str:
    return html.escape(str(value), quote=True)


FAVICON_LINK = '<link rel="icon" href="/favicon.svg" type="image/svg+xml">'

# Auto-logout an idle dashboard session after this many minutes of no
# clicks/keys/scrolls -- separate from (and shorter than) the 12h absolute
# session-cookie expiry in auth.py, which still caps things either way.
IDLE_LOGOUT_MINUTES = 30

IDLE_LOGOUT_SCRIPT = f"""<script>
(function () {{
  var timeoutId;
  function reset() {{
    clearTimeout(timeoutId);
    timeoutId = setTimeout(function () {{ window.location.href = '/admin/logout'; }}, {IDLE_LOGOUT_MINUTES} * 60 * 1000);
  }}
  ['click', 'keydown', 'scroll', 'mousemove'].forEach(function (evt) {{
    document.addEventListener(evt, reset, {{ passive: true }});
  }});
  reset();
}})();
</script>"""


def _lang_toggle_link(lang: str, next_path: str) -> str:
    other = "ar" if lang == "en" else "en"
    label = "ع" if lang == "en" else "EN"
    return f'<a class="lang-toggle-link" href="/admin/set-lang?lang={other}&next={esc(next_path)}">{label}</a>'


def page(title: str, body: str, nav: str = "", lang: str = "en", path: str = "/admin") -> str:
    dir_ = "rtl" if lang == "ar" else "ltr"
    from app.dashboard_i18n import get_translator

    t = get_translator(lang)
    return f"""<!doctype html>
<html lang="{lang}" dir="{dir_}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>{esc(title)} — Admin</title>
{FAVICON_LINK}
{FONT_LINK}
<style>{BASE_STYLE}</style>
</head>
<body>
{NEURAL_BG}
<header>
  <span class="brand">{LOGO_SVG}{esc(t('brand'))}</span>
  {nav}
  {_lang_toggle_link(lang, path)}
</header>
<main>
{body}
</main>
{NEURAL_BG_SCRIPT}
{IDLE_LOGOUT_SCRIPT}
</body>
</html>"""


def auth_page(title: str, body: str, lang: str = "en", path: str = "/admin/login") -> str:
    """A full-bleed gradient page for login/forgot-password/reset -- mirrors
    the public site's hero background treatment instead of the plain flat
    dashboard chrome, since these are the pages a visitor (or the owner,
    logged out) actually judges the "brand" of first."""
    dir_ = "rtl" if lang == "ar" else "ltr"
    return f"""<!doctype html>
<html lang="{lang}" dir="{dir_}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>{esc(title)} — Admin</title>
{FAVICON_LINK}
{FONT_LINK}
<style>
{BASE_STYLE}
  body {{ min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }}
  .auth-shell {{ width: 100%; max-width: 380px; position: relative; z-index: 1; }}
  .auth-lang-toggle {{ position: fixed; top: 20px; inset-inline-end: 20px; z-index: 2; }}
  .auth-brand {{ display: flex; align-items: center; gap: 10px; justify-content: center; margin-bottom: 28px; color: var(--sand); font-family: var(--font-display); font-weight: 600; font-size: 1.1rem; }}
  .auth-brand svg {{ width: 28px; height: 28px; }}
  .auth-card {{
    background: var(--panel); border: 1px solid var(--line); border-radius: 16px; padding: 28px;
    box-shadow: 0 20px 60px rgba(0,0,0,.45); backdrop-filter: blur(12px);
  }}
  .auth-card h1 {{ font-size: 1.3rem; margin: 0 0 24px; text-align: center; }}
  .auth-card form {{ display: flex; flex-direction: column; }}
  .auth-card label {{ margin-top: 16px; }}
  .auth-card label:first-of-type {{ margin-top: 0; }}
  .auth-card input {{ padding: 11px 14px; }}
  .auth-links {{ text-align: center; margin-top: 22px; display: flex; flex-direction: column; gap: 8px; }}
  .auth-card button {{ width: 100%; margin-top: 24px; }}
  .lang-toggle-link {{
    font-family: var(--font-mono); font-size: 12px; color: var(--muted); text-decoration: none;
    border: 1px solid var(--line); border-radius: 6px; padding: 5px 9px;
  }}
  .lang-toggle-link:hover {{ color: var(--teal); border-color: var(--teal); }}
</style>
</head>
<body>
{NEURAL_BG}
<div class="auth-lang-toggle">{_lang_toggle_link(lang, path)}</div>
<div class="auth-shell">
  <div class="auth-brand">{LOGO_SVG}Montaser Hussam</div>
  <div class="auth-card">
{body}
  </div>
</div>
{NEURAL_BG_SCRIPT}
</body>
</html>"""


def admin_nav(active: str, role: str, lang: str = "en") -> str:
    from app.dashboard_i18n import get_translator

    t = get_translator(lang)
    links = [
        ("dashboard", "/admin", t("nav.overview")),
        ("analytics", "/admin/analytics", t("nav.analytics")),
        ("content", "/admin/content", t("nav.content")),
        ("projects", "/admin/projects", t("nav.projects")),
        ("pricing", "/admin/pricing", t("nav.pricing")),
        ("messages", "/admin/messages", t("nav.messages")),
        ("settings", "/admin/settings", t("nav.settings")),
    ]
    if role == "owner":
        links.append(("users", "/admin/users", t("nav.users")))
    links.append(("profile", "/admin/profile", t("nav.profile")))
    items = "".join(
        f'<a href="{href}" class="{"active" if key == active else ""}">{esc(label)}</a>'
        for key, href, label in links
    )
    return f'<nav>{items}<a href="/admin/logout">{esc(t("nav.logout"))}</a></nav>'
