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
  body { margin: 0; background: var(--ink); color: var(--body); font-family: var(--font-body); }
  a { color: var(--teal); }
  h1, h2, .brand { font-family: var(--font-display); }
  header {
    display: flex; align-items: center; justify-content: space-between; padding: 16px 24px;
    border-bottom: 1px solid var(--line);
    background: linear-gradient(90deg, rgba(124,92,255,.08), rgba(34,211,197,.05));
  }
  header .brand { color: var(--sand); font-weight: 600; display: flex; align-items: center; gap: 8px; }
  header .brand svg { width: 22px; height: 22px; }
  nav a { margin-inline-start: 16px; color: var(--body); text-decoration: none; font-size: 14px; font-family: var(--font-mono); }
  nav a:hover, nav a.active { color: var(--teal); }
  main { max-width: 960px; margin: 0 auto; padding: 32px 24px; }
  h1 { color: var(--sand); font-size: 1.6rem; }
  h2 { color: var(--sand); font-size: 1.1rem; margin-top: 32px; font-family: var(--font-mono); font-weight: 500; }
  .card { background: var(--panel); border: 1px solid var(--line); border-radius: 14px; padding: 20px; margin-bottom: 16px; }
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
  .muted-link { color: var(--muted); font-size: 13px; text-decoration: none; }
  .muted-link:hover { color: var(--teal); }
"""

FONT_LINK = (
    '<link rel="preconnect" href="https://fonts.googleapis.com">'
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
    '<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600&family=IBM+Plex+Sans:wght@400;500'
    '&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">'
)


def esc(value) -> str:
    return html.escape(str(value), quote=True)


def page(title: str, body: str, nav: str = "") -> str:
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>{esc(title)} — Admin</title>
{FONT_LINK}
<style>{BASE_STYLE}</style>
</head>
<body>
<header>
  <span class="brand">{LOGO_SVG}Portfolio Admin</span>
  {nav}
</header>
<main>
{body}
</main>
</body>
</html>"""


def auth_page(title: str, body: str) -> str:
    """A full-bleed gradient page for login/forgot-password/reset -- mirrors
    the public site's hero background treatment instead of the plain flat
    dashboard chrome, since these are the pages a visitor (or the owner,
    logged out) actually judges the "brand" of first."""
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>{esc(title)} — Admin</title>
{FONT_LINK}
<style>
{BASE_STYLE}
  body {{
    min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px;
    background:
      radial-gradient(ellipse 70% 55% at 50% 20%, rgba(124,92,255,.18), transparent 62%),
      radial-gradient(ellipse 80% 60% at 50% 85%, rgba(34,211,197,.12), transparent 65%),
      var(--ink);
  }}
  .auth-shell {{ width: 100%; max-width: 380px; }}
  .auth-brand {{ display: flex; align-items: center; gap: 10px; justify-content: center; margin-bottom: 28px; color: var(--sand); font-family: var(--font-display); font-weight: 600; font-size: 1.1rem; }}
  .auth-brand svg {{ width: 28px; height: 28px; }}
  .auth-card {{
    background: var(--panel); border: 1px solid var(--line); border-radius: 16px; padding: 28px;
    box-shadow: 0 20px 60px rgba(0,0,0,.45); backdrop-filter: blur(12px);
  }}
  .auth-card h1 {{ font-size: 1.3rem; margin: 0 0 20px; text-align: center; }}
  .auth-links {{ text-align: center; margin-top: 16px; display: flex; flex-direction: column; gap: 8px; }}
  .auth-card button {{ width: 100%; margin-top: 6px; }}
</style>
</head>
<body>
<div class="auth-shell">
  <div class="auth-brand">{LOGO_SVG}Montaser Hussam</div>
  <div class="auth-card">
{body}
  </div>
</div>
</body>
</html>"""


def admin_nav(active: str, role: str) -> str:
    links = [
        ("dashboard", "/admin", "Overview"),
        ("content", "/admin/content", "Site text"),
        ("projects", "/admin/projects", "Projects"),
        ("pricing", "/admin/pricing", "Pricing"),
        ("messages", "/admin/messages", "Messages"),
    ]
    if role == "owner":
        links.append(("users", "/admin/users", "Users"))
    links.append(("profile", "/admin/profile", "Profile"))
    items = "".join(
        f'<a href="{href}" class="{"active" if key == active else ""}">{label}</a>'
        for key, href, label in links
    )
    return f'<nav>{items}<a href="/admin/logout">Log out</a></nav>'
