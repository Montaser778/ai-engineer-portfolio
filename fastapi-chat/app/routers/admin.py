"""Server-rendered admin dashboard: login, content editing, project CRUD,
pricing, the contact+chat inbox, and (owner-only) user management. No JS
framework -- plain HTML forms, styled via app/templates.py to match the
public site's dark theme.

Note: there is deliberately no "Demos" CRUD here. demos.html isn't a card
grid -- it's bespoke interactive widgets (a cost calculator, an agent
pipeline simulator, a scoring demo), so there's no equivalent list
structure to make dashboard-editable the way projects.html's cards are.
"""
import datetime
import json
import os
import secrets as secrets_mod

from fastapi import APIRouter, Depends, Form, HTTPException, UploadFile
from fastapi.responses import HTMLResponse, RedirectResponse
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.auth import (
    create_session_cookie,
    get_current_admin,
    hash_password,
    is_locked,
    register_failed_login,
    register_successful_login,
    require_owner,
    verify_password,
    SESSION_COOKIE_NAME,
    SESSION_MAX_AGE_SECONDS,
)
from app.db import get_db
from app.email_service import send_email
from app.github_storage import public_url_for, read_file, write_file
from app.models import AdminUser, ChatLog, ContactMessage, PasswordResetToken, PricingTier, Project
from app.templates import admin_nav, auth_page, esc, page

router = APIRouter(prefix="/admin", tags=["admin"])

I18N_PATH = "assets/data/i18n.json"
RESET_TOKEN_MAX_AGE_MINUTES = 30
# Base URL of this backend itself (not the static site) -- used to build the
# reset-password link emailed to the user. Set to wherever this service is
# actually deployed; defaults to the current known Render URL.
BACKEND_BASE_URL = os.environ.get("BACKEND_BASE_URL", "https://ai-engineer-portfolio-va7f.onrender.com")


# ---------------------------------------------------------------- auth ----
@router.get("/login", response_class=HTMLResponse)
def login_form(error: str | None = None):
    body = f"""
    <h1>Log in</h1>
    {'<div class="error">' + esc(error) + '</div>' if error else ''}
    <form method="post" action="/admin/login">
      <label>Username</label>
      <input name="username" required autofocus>
      <label>Password</label>
      <input name="password" type="password" required>
      <button type="submit">Log in</button>
    </form>
    <div class="auth-links">
      <a class="muted-link" href="/admin/forgot-password">Forgot password?</a>
    </div>
    """
    return HTMLResponse(auth_page("Log in", body))


@router.post("/login")
def login_submit(username: str = Form(...), password: str = Form(...), db: Session = Depends(get_db)):
    user = db.query(AdminUser).filter(AdminUser.username == username).first()
    if user is None or is_locked(user):
        return RedirectResponse(
            "/admin/login?error=Invalid+credentials+or+account+temporarily+locked", status_code=303
        )
    if not verify_password(password, user.password_hash):
        register_failed_login(user, db)
        return RedirectResponse("/admin/login?error=Invalid+credentials", status_code=303)
    register_successful_login(user, db)
    resp = RedirectResponse("/admin", status_code=303)
    resp.set_cookie(
        SESSION_COOKIE_NAME,
        create_session_cookie(user.id),
        max_age=SESSION_MAX_AGE_SECONDS,
        httponly=True,
        samesite="lax",
        secure=True,
    )
    return resp


@router.get("/logout")
def logout():
    resp = RedirectResponse("/admin/login", status_code=303)
    resp.delete_cookie(SESSION_COOKIE_NAME)
    return resp


# ------------------------------------------------------ forgot / reset ----
@router.get("/forgot-password", response_class=HTMLResponse)
def forgot_password_form(sent: bool = False):
    if sent:
        body = """
        <h1>Check your email</h1>
        <p style="text-align:center;color:var(--muted);font-size:14px">
          If that email is on an account, a reset link is on its way. It expires in 30 minutes.
        </p>
        <div class="auth-links"><a class="muted-link" href="/admin/login">Back to log in</a></div>
        """
    else:
        body = """
        <h1>Reset password</h1>
        <form method="post" action="/admin/forgot-password">
          <label>Email</label>
          <input name="email" type="email" required autofocus>
          <button type="submit">Send reset link</button>
        </form>
        <div class="auth-links"><a class="muted-link" href="/admin/login">Back to log in</a></div>
        """
    return HTMLResponse(auth_page("Reset password", body))


@router.post("/forgot-password")
async def forgot_password_submit(email: str = Form(...), db: Session = Depends(get_db)):
    user = db.query(AdminUser).filter(AdminUser.email == email).first()
    if user:
        token = secrets_mod.token_urlsafe(32)
        db.add(PasswordResetToken(user_id=user.id, token=token))
        db.commit()
        reset_url = f"{BACKEND_BASE_URL}/admin/reset-password?token={token}"
        await send_email(
            email,
            "Reset your Portfolio Admin password",
            f'<p>Click below to set a new password. This link expires in {RESET_TOKEN_MAX_AGE_MINUTES} minutes.</p>'
            f'<p><a href="{reset_url}">{reset_url}</a></p>'
            f'<p>If you did not request this, you can ignore this email.</p>',
        )
    # Always the same response whether or not the email matched -- never
    # reveal which emails have an account.
    return RedirectResponse("/admin/forgot-password?sent=true", status_code=303)


@router.get("/reset-password", response_class=HTMLResponse)
def reset_password_form(token: str, error: str | None = None):
    body = f"""
    <h1>Set a new password</h1>
    {'<div class="error">' + esc(error) + '</div>' if error else ''}
    <form method="post" action="/admin/reset-password">
      <input type="hidden" name="token" value="{esc(token)}">
      <label>New password</label>
      <input name="password" type="password" required minlength="8" autofocus>
      <button type="submit">Set password</button>
    </form>
    """
    return HTMLResponse(auth_page("Set a new password", body))


@router.post("/reset-password")
def reset_password_submit(token: str = Form(...), password: str = Form(...), db: Session = Depends(get_db)):
    record = db.query(PasswordResetToken).filter(PasswordResetToken.token == token).first()
    valid = (
        record
        and not record.used
        and record.created_at > datetime.datetime.utcnow() - datetime.timedelta(minutes=RESET_TOKEN_MAX_AGE_MINUTES)
    )
    if not valid:
        return RedirectResponse(f"/admin/reset-password?token={token}&error=This+link+has+expired+or+was+already+used.", status_code=303)
    user = db.query(AdminUser).filter(AdminUser.id == record.user_id).first()
    if not user:
        raise HTTPException(status_code=404)
    user.password_hash = hash_password(password)
    user.failed_login_count = 0
    user.locked_until = None
    record.used = True
    db.commit()
    return RedirectResponse("/admin/login", status_code=303)


# -------------------------------------------------------------- profile ----
@router.get("/profile", response_class=HTMLResponse)
def profile_form(admin: AdminUser = Depends(get_current_admin), saved: bool = False):
    body = f"""
    <h1>Profile</h1>
    {'<div class="flash">Saved.</div>' if saved else ''}
    <div class="card">
      <form method="post" action="/admin/profile">
        <label>Username</label>
        <input value="{esc(admin.username)}" disabled>
        <label>Email (used for password reset)</label>
        <input name="email" type="email" value="{esc(admin.email or '')}">
        <div style="margin-top:16px"><button type="submit">Save email</button></div>
      </form>
    </div>
    <h2>Change password</h2>
    <div class="card">
      <form method="post" action="/admin/profile/password">
        <label>Current password</label>
        <input name="current_password" type="password" required>
        <label>New password</label>
        <input name="new_password" type="password" required minlength="8">
        <div style="margin-top:16px"><button type="submit">Change password</button></div>
      </form>
    </div>
    """
    return HTMLResponse(page("Profile", body, admin_nav("profile", admin.role)))


@router.post("/profile")
def profile_save(
    email: str = Form(""),
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    user = db.query(AdminUser).filter(AdminUser.id == admin.id).with_for_update().first()
    user.email = email or None
    db.commit()
    return RedirectResponse("/admin/profile?saved=true", status_code=303)


@router.post("/profile/password")
def profile_change_password(
    current_password: str = Form(...),
    new_password: str = Form(...),
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    if not verify_password(current_password, admin.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect.")
    admin.password_hash = hash_password(new_password)
    db.commit()
    return RedirectResponse("/admin/profile?saved=true", status_code=303)


# ----------------------------------------------------------- dashboard ----
@router.get("", response_class=HTMLResponse)
def dashboard_home(admin: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db)):
    unread = db.query(func.count(ContactMessage.id)).filter(ContactMessage.read.is_(False)).scalar()
    total_projects = db.query(func.count(Project.id)).scalar()
    total_chats = db.query(func.count(func.distinct(ChatLog.session_id))).scalar()
    body = f"""
    <h1>Overview</h1>
    <div class="card">
      <p>Logged in as <strong>{esc(admin.username)}</strong> ({esc(admin.role)})</p>
      <p>{unread} unread contact message(s) · {total_projects} project(s) · {total_chats} chat session(s)</p>
      <p><a class="btn" href="/admin/messages">View inbox</a></p>
    </div>
    """
    return HTMLResponse(page("Overview", body, admin_nav("dashboard", admin.role)))


# ------------------------------------------------------------ projects ----
def _parse_metrics(text: str) -> list[dict]:
    out = []
    for line in text.splitlines():
        parts = [p.strip() for p in line.split("|")]
        if len(parts) >= 3 and parts[0]:
            out.append({"value": parts[0], "suffix": parts[1], "label": parts[2]})
    return out


def _serialize_metrics(metrics: list[dict]) -> str:
    return "\n".join(f"{m.get('value', '')}|{m.get('suffix', '')}|{m.get('label', '')}" for m in metrics)


def _parse_ctas(text: str) -> list[dict]:
    out = []
    for line in text.splitlines():
        parts = [p.strip() for p in line.split("|")]
        if len(parts) >= 2 and parts[0]:
            href = parts[1]
            out.append({"label": parts[0], "href": href, "external": href.startswith("http")})
    return out


def _serialize_ctas(ctas: list[dict]) -> str:
    return "\n".join(f"{c.get('label', '')}|{c.get('href', '')}" for c in ctas)


async def _upload_image_if_present(image: UploadFile | None) -> str:
    if image is None or not image.filename:
        return ""
    data = await image.read()
    if not data:
        return ""
    safe_name = "".join(c for c in image.filename if c.isalnum() or c in "._-") or "upload"
    path = f"assets/images/uploads/{int(datetime.datetime.utcnow().timestamp())}-{safe_name}"
    await write_file(path, data, f"Admin upload: {safe_name}")
    return public_url_for(path)


def _project_form_fields(item: Project | None = None) -> str:
    title = esc(item.title) if item else ""
    description = esc(item.description) if item else ""
    category = esc(item.category) if item else ""
    metrics = esc(_serialize_metrics(item.metrics)) if item else ""
    tags = esc(", ".join(item.tags)) if item else ""
    ctas = esc(_serialize_ctas(item.ctas)) if item else ""
    published_checked = "checked" if (item is None or item.published) else ""
    image_preview = (
        f'<label>Current image</label><img src="{esc(item.image_path)}" style="max-width:200px;border-radius:8px">'
        if item and item.image_path
        else ""
    )
    return f"""
        <label>Title</label><input name="title" value="{title}" required>
        <label>Description</label><textarea name="description" rows="3">{description}</textarea>
        <label>Category (matches a filter pill's data-cats value, e.g. "voice,agents")</label>
        <input name="category" value="{category}">
        <label>Metrics -- one per line, "value|suffix|label" (e.g. "800|ms|Turn latency")</label>
        <textarea name="metrics" rows="3">{metrics}</textarea>
        <label>Tags -- comma-separated (e.g. "Pipecat, WebRTC, FastAPI")</label>
        <input name="tags" value="{tags}">
        <label>Buttons -- one per line, "label|link" (e.g. "Case study|project-muhawir.html")</label>
        <textarea name="ctas" rows="2">{ctas}</textarea>
        {image_preview}
        <label>{"Replace" if item else ""} Image</label><input name="image" type="file" accept="image/*">
        <label><input style="width:auto" type="checkbox" name="published" {published_checked}> Published</label>
    """


@router.get("/projects", response_class=HTMLResponse)
def list_projects(admin: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db)):
    items = db.query(Project).order_by(Project.sort_order, Project.id).all()
    rows = "".join(
        f"""<tr>
          <td>{esc(it.title)}</td><td>{esc(it.category)}</td>
          <td>{'✓' if it.published else '—'}</td>
          <td>
            <a class="btn btn-ghost" href="/admin/projects/{it.id}/edit">Edit</a>
            <form class="inline" method="post" action="/admin/projects/{it.id}/delete" onsubmit="return confirm('Delete this project?')">
              <button class="btn-danger" type="submit">Delete</button>
            </form>
          </td>
        </tr>"""
        for it in items
    )
    body = f"""
    <h1>Projects</h1>
    <div class="card">
      <table><thead><tr><th>Title</th><th>Category</th><th>Published</th><th></th></tr></thead>
      <tbody>{rows or '<tr><td colspan="4">None yet.</td></tr>'}</tbody></table>
    </div>
    <h2>Add new</h2>
    <div class="card">
      <form method="post" action="/admin/projects/new" enctype="multipart/form-data">
        {_project_form_fields()}
        <div style="margin-top:16px"><button type="submit">Add</button></div>
      </form>
    </div>
    """
    return HTMLResponse(page("Projects", body, admin_nav("projects", admin.role)))


@router.post("/projects/new")
async def create_project(
    title: str = Form(...),
    description: str = Form(""),
    category: str = Form(""),
    metrics: str = Form(""),
    tags: str = Form(""),
    ctas: str = Form(""),
    image: UploadFile | None = None,
    published: bool = Form(False),
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    image_path = await _upload_image_if_present(image)
    db.add(
        Project(
            title=title,
            description=description,
            category=category,
            metrics=_parse_metrics(metrics),
            tags=[t.strip() for t in tags.split(",") if t.strip()],
            ctas=_parse_ctas(ctas),
            image_path=image_path,
            published=published,
        )
    )
    db.commit()
    return RedirectResponse("/admin/projects", status_code=303)


@router.get("/projects/{item_id}/edit", response_class=HTMLResponse)
def edit_project_form(item_id: int, admin: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db)):
    item = db.query(Project).filter(Project.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404)
    body = f"""
    <h1>Edit project</h1>
    <div class="card">
      <form method="post" action="/admin/projects/{item.id}/edit" enctype="multipart/form-data">
        {_project_form_fields(item)}
        <div style="margin-top:16px"><button type="submit">Save</button></div>
      </form>
    </div>
    """
    return HTMLResponse(page("Edit project", body, admin_nav("projects", admin.role)))


@router.post("/projects/{item_id}/edit")
async def update_project(
    item_id: int,
    title: str = Form(...),
    description: str = Form(""),
    category: str = Form(""),
    metrics: str = Form(""),
    tags: str = Form(""),
    ctas: str = Form(""),
    image: UploadFile | None = None,
    published: bool = Form(False),
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    item = db.query(Project).filter(Project.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404)
    item.title = title
    item.description = description
    item.category = category
    item.metrics = _parse_metrics(metrics)
    item.tags = [t.strip() for t in tags.split(",") if t.strip()]
    item.ctas = _parse_ctas(ctas)
    item.published = published
    new_image = await _upload_image_if_present(image)
    if new_image:
        item.image_path = new_image
    db.commit()
    return RedirectResponse("/admin/projects", status_code=303)


@router.post("/projects/{item_id}/delete")
def delete_project(item_id: int, admin: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db)):
    db.query(Project).filter(Project.id == item_id).delete()
    db.commit()
    return RedirectResponse("/admin/projects", status_code=303)


# ------------------------------------------------------------- pricing ----
@router.get("/pricing", response_class=HTMLResponse)
def list_pricing(admin: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db)):
    tiers = db.query(PricingTier).order_by(PricingTier.sort_order, PricingTier.id).all()
    rows = "".join(
        f"""<div class="card">
          <form method="post" action="/admin/pricing/{t.id}/edit">
            <label>Name</label><input name="name" value="{esc(t.name)}">
            <label>Price (USD)</label><input name="price_usd" type="number" value="{t.price_usd}">
            <label>Duration / cadence</label><input name="duration" value="{esc(t.duration)}">
            <label>Features (one per line)</label><textarea name="features" rows="4">{esc(chr(10).join(t.features or []))}</textarea>
            <div style="margin-top:12px"><button type="submit">Save</button></div>
          </form>
          <form method="post" action="/admin/pricing/{t.id}/delete" onsubmit="return confirm('Delete this tier?')" style="margin-top:8px">
            <button class="btn-danger" type="submit">Delete</button>
          </form>
        </div>"""
        for t in tiers
    )
    body = f"""
    <h1>Pricing</h1>
    {rows or '<p>No tiers yet.</p>'}
    <h2>Add tier</h2>
    <div class="card">
      <form method="post" action="/admin/pricing/new">
        <label>Name</label><input name="name" required>
        <label>Price (USD)</label><input name="price_usd" type="number" required>
        <label>Duration / cadence</label><input name="duration">
        <label>Features (one per line)</label><textarea name="features" rows="4"></textarea>
        <div style="margin-top:16px"><button type="submit">Add</button></div>
      </form>
    </div>
    """
    return HTMLResponse(page("Pricing", body, admin_nav("pricing", admin.role)))


@router.post("/pricing/new")
def create_pricing(
    name: str = Form(...),
    price_usd: int = Form(...),
    duration: str = Form(""),
    features: str = Form(""),
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    feature_list = [f.strip() for f in features.splitlines() if f.strip()]
    db.add(PricingTier(name=name, price_usd=price_usd, duration=duration, features=feature_list))
    db.commit()
    return RedirectResponse("/admin/pricing", status_code=303)


@router.post("/pricing/{item_id}/edit")
def update_pricing(
    item_id: int,
    name: str = Form(...),
    price_usd: int = Form(...),
    duration: str = Form(""),
    features: str = Form(""),
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    item = db.query(PricingTier).filter(PricingTier.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404)
    item.name, item.price_usd, item.duration = name, price_usd, duration
    item.features = [f.strip() for f in features.splitlines() if f.strip()]
    db.commit()
    return RedirectResponse("/admin/pricing", status_code=303)


@router.post("/pricing/{item_id}/delete")
def delete_pricing(item_id: int, admin: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db)):
    db.query(PricingTier).filter(PricingTier.id == item_id).delete()
    db.commit()
    return RedirectResponse("/admin/pricing", status_code=303)


# -------------------------------------------------------------- content ----
@router.get("/content", response_class=HTMLResponse)
async def content_editor(q: str = "", admin: AdminUser = Depends(get_current_admin)):
    raw, _ = await read_file(I18N_PATH)
    dict_ = json.loads(raw) if raw else {"en": {}, "ar": {}}
    en = dict_.get("en", {})
    keys = sorted(en.keys())
    if q:
        keys = [k for k in keys if q.lower() in k.lower()]
    rows = "".join(
        f"""<div class="card">
          <form method="post" action="/admin/content/save">
            <input type="hidden" name="key" value="{esc(k)}">
            <label>{esc(k)}</label>
            <label style="margin-top:0">English</label><textarea name="en" rows="2">{esc(en.get(k, ''))}</textarea>
            <label>Arabic</label><textarea name="ar" rows="2">{esc(dict_.get('ar', {}).get(k, ''))}</textarea>
            <div style="margin-top:10px"><button type="submit">Save</button></div>
          </form>
        </div>"""
        for k in keys[:200]
    )
    body = f"""
    <h1>Site text</h1>
    <form method="get" action="/admin/content" style="margin-bottom:16px">
      <input name="q" value="{esc(q)}" placeholder="Search keys, e.g. hero.h1">
    </form>
    {rows or '<p>No matching keys.</p>'}
    {'<p class="badge">Showing first 200 matches — refine your search.</p>' if len(keys) > 200 else ''}
    """
    return HTMLResponse(page("Site text", body, admin_nav("content", admin.role)))


@router.post("/content/save")
async def content_save(
    key: str = Form(...),
    en: str = Form(""),
    ar: str = Form(""),
    admin: AdminUser = Depends(get_current_admin),
):
    raw, sha = await read_file(I18N_PATH)
    dict_ = json.loads(raw) if raw else {"en": {}, "ar": {}}
    dict_.setdefault("en", {})[key] = en
    dict_.setdefault("ar", {})[key] = ar
    new_content = json.dumps(dict_, ensure_ascii=False, indent=2).encode("utf-8")
    await write_file(I18N_PATH, new_content, f"Admin: update text key {key}", sha=sha)
    return RedirectResponse("/admin/content", status_code=303)


# ------------------------------------------------------------- messages ----
@router.get("/messages", response_class=HTMLResponse)
def list_messages(admin: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db)):
    contacts = db.query(ContactMessage).order_by(ContactMessage.received_at.desc()).limit(100).all()
    contact_rows = "".join(
        f"""<tr>
          <td>{esc(c.received_at.strftime('%Y-%m-%d %H:%M'))}</td>
          <td>{esc(c.name)} &lt;{esc(c.email)}&gt;</td>
          <td>{esc(c.message[:200])}</td>
          <td>{'<span class="badge unread">unread</span>' if not c.read else '<span class="badge">read</span>'}
            {'<form class="inline" method="post" action="/admin/messages/' + str(c.id) + '/read"><button class="btn-ghost" type="submit">Mark read</button></form>' if not c.read else ''}
          </td>
        </tr>"""
        for c in contacts
    )
    sessions = (
        db.query(ChatLog.session_id, func.max(ChatLog.created_at).label("last"))
        .group_by(ChatLog.session_id)
        .order_by(func.max(ChatLog.created_at).desc())
        .limit(30)
        .all()
    )
    session_rows = "".join(
        f'<tr><td>{esc(s.last.strftime("%Y-%m-%d %H:%M"))}</td><td><a href="/admin/messages/chat/{esc(s.session_id)}">{esc(s.session_id[:12])}…</a></td></tr>'
        for s in sessions
    )
    body = f"""
    <h1>Messages</h1>
    <h2>Contact form</h2>
    <div class="card">
      <table><thead><tr><th>When</th><th>From</th><th>Message</th><th></th></tr></thead>
      <tbody>{contact_rows or '<tr><td colspan="4">None yet.</td></tr>'}</tbody></table>
    </div>
    <h2>Chat sessions</h2>
    <div class="card">
      <table><thead><tr><th>Last activity</th><th>Session</th></tr></thead>
      <tbody>{session_rows or '<tr><td colspan="2">None yet.</td></tr>'}</tbody></table>
    </div>
    """
    return HTMLResponse(page("Messages", body, admin_nav("messages", admin.role)))


@router.post("/messages/{item_id}/read")
def mark_read(item_id: int, admin: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db)):
    msg = db.query(ContactMessage).filter(ContactMessage.id == item_id).first()
    if msg:
        msg.read = True
        db.commit()
    return RedirectResponse("/admin/messages", status_code=303)


@router.get("/messages/chat/{session_id}", response_class=HTMLResponse)
def view_chat_session(session_id: str, admin: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db)):
    turns = db.query(ChatLog).filter(ChatLog.session_id == session_id).order_by(ChatLog.created_at).all()
    rows = "".join(f'<p><strong>{esc(t.role)}:</strong> {esc(t.content)}</p>' for t in turns)
    body = f"""
    <h1>Chat session {esc(session_id[:12])}…</h1>
    <div class="card">{rows or '<p>No messages.</p>'}</div>
    <a class="btn btn-ghost" href="/admin/messages">Back</a>
    """
    return HTMLResponse(page("Chat session", body, admin_nav("messages", admin.role)))


# ---------------------------------------------------------------- users ----
@router.get("/users", response_class=HTMLResponse)
def list_users(admin: AdminUser = Depends(require_owner), db: Session = Depends(get_db)):
    users = db.query(AdminUser).order_by(AdminUser.id).all()
    rows = "".join(
        f"""<tr>
          <td>{esc(u.username)}</td><td>{esc(u.email or '—')}</td><td>{esc(u.role)}</td>
          <td>{'' if u.role == 'owner' else '<form class="inline" method="post" action="/admin/users/' + str(u.id) + '/delete" onsubmit="return confirm(\'Remove this user?\')"><button class="btn-danger" type="submit">Remove</button></form>'}</td>
        </tr>"""
        for u in users
    )
    body = f"""
    <h1>Users</h1>
    <div class="card">
      <table><thead><tr><th>Username</th><th>Email</th><th>Role</th><th></th></tr></thead>
      <tbody>{rows}</tbody></table>
    </div>
    <h2>Add editor</h2>
    <div class="card">
      <form method="post" action="/admin/users/new">
        <label>Username</label><input name="username" required>
        <label>Email (needed for them to reset their own password)</label><input name="email" type="email">
        <label>Password</label><input name="password" type="password" required minlength="8">
        <div style="margin-top:16px"><button type="submit">Add</button></div>
      </form>
    </div>
    """
    return HTMLResponse(page("Users", body, admin_nav("users", admin.role)))


@router.post("/users/new")
def create_user(
    username: str = Form(...),
    password: str = Form(...),
    email: str = Form(""),
    admin: AdminUser = Depends(require_owner),
    db: Session = Depends(get_db),
):
    if db.query(AdminUser).filter(AdminUser.username == username).first():
        raise HTTPException(status_code=400, detail="Username already taken.")
    db.add(AdminUser(username=username, email=email or None, password_hash=hash_password(password), role="editor"))
    db.commit()
    return RedirectResponse("/admin/users", status_code=303)


@router.post("/users/{user_id}/delete")
def delete_user(user_id: int, admin: AdminUser = Depends(require_owner), db: Session = Depends(get_db)):
    target = db.query(AdminUser).filter(AdminUser.id == user_id).first()
    if target and target.role != "owner":
        db.delete(target)
        db.commit()
    return RedirectResponse("/admin/users", status_code=303)
