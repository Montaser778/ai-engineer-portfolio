"""Tiny HTML-templating helper for the admin dashboard -- no Jinja2
dependency, just an f-string shell styled to match the public site's dark
theme (assets/css/site.css tokens), since this backend serves no static
files of its own and pulling in a templating engine for a handful of pages
would be more machinery than the pages need.
"""
import html


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
<style>
  :root {{
    --ink: #0b0f18; --panel: rgba(16,21,36,.66); --violet: #7c5cff; --teal: #22d3c5;
    --sand: #f2e8d5; --body: #b9c1d1; --muted: #8892a6; --line: rgba(136,146,166,.18);
    --danger: #ff6b6b; --success: #4ade80;
  }}
  * {{ box-sizing: border-box; }}
  body {{ margin: 0; background: var(--ink); color: var(--body); font-family: system-ui, sans-serif; }}
  a {{ color: var(--teal); }}
  header {{ display: flex; align-items: center; justify-content: space-between; padding: 14px 24px; border-bottom: 1px solid var(--line); }}
  header .brand {{ color: var(--sand); font-weight: 600; }}
  nav a {{ margin-inline-start: 16px; color: var(--body); text-decoration: none; font-size: 14px; }}
  nav a:hover, nav a.active {{ color: var(--teal); }}
  main {{ max-width: 960px; margin: 0 auto; padding: 32px 24px; }}
  h1 {{ color: var(--sand); font-size: 1.5rem; }}
  h2 {{ color: var(--sand); font-size: 1.1rem; margin-top: 32px; }}
  .card {{ background: var(--panel); border: 1px solid var(--line); border-radius: 12px; padding: 20px; margin-bottom: 16px; }}
  table {{ width: 100%; border-collapse: collapse; }}
  th, td {{ text-align: left; padding: 10px 8px; border-bottom: 1px solid var(--line); font-size: 14px; vertical-align: top; }}
  th {{ color: var(--muted); font-size: 12px; text-transform: uppercase; }}
  input, textarea, select {{
    width: 100%; background: rgba(255,255,255,.03); border: 1px solid var(--line); border-radius: 8px;
    color: var(--sand); padding: 8px 10px; font-size: 14px; font-family: inherit;
  }}
  label {{ display: block; font-size: 12.5px; color: var(--muted); margin: 10px 0 4px; }}
  button, .btn {{
    background: var(--violet); color: #fff; border: none; border-radius: 8px; padding: 9px 16px;
    cursor: pointer; font-size: 14px; text-decoration: none; display: inline-block;
  }}
  button:hover, .btn:hover {{ filter: brightness(1.1); }}
  .btn-ghost {{ background: none; border: 1px solid var(--line); color: var(--body); }}
  .btn-danger {{ background: var(--danger); }}
  .flash {{ background: rgba(74,222,128,.1); border: 1px solid var(--success); color: var(--success); padding: 10px 14px; border-radius: 8px; margin-bottom: 16px; }}
  .error {{ background: rgba(255,107,107,.1); border: 1px solid var(--danger); color: var(--danger); padding: 10px 14px; border-radius: 8px; margin-bottom: 16px; }}
  .badge {{ font-size: 11px; padding: 2px 8px; border-radius: 999px; border: 1px solid var(--line); color: var(--muted); }}
  .badge.unread {{ color: var(--teal); border-color: var(--teal); }}
  form.inline {{ display: inline; }}
</style>
</head>
<body>
<header>
  <span class="brand">Portfolio Admin</span>
  {nav}
</header>
<main>
{body}
</main>
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
    items = "".join(
        f'<a href="{href}" class="{"active" if key == active else ""}">{label}</a>'
        for key, href, label in links
    )
    return f'<nav>{items}<a href="/admin/logout">Log out</a></nav>'
