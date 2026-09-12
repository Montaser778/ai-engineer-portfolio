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

from fastapi import APIRouter, Cookie, Depends, Form, HTTPException, UploadFile
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
from app.dashboard_i18n import get_translator
from app.db import get_db
from app.email_service import send_email
from app.github_storage import public_url_for, read_file, write_file
from app.translate_service import translate_to_arabic
from app.models import AdminUser, ChatLog, ContactMessage, PageView, PasswordResetToken, PricingTier, Project, SiteSetting
from app.templates import admin_nav, auth_page, esc, page

LANG_COOKIE_NAME = "mh_admin_lang"


def get_lang(mh_admin_lang: str | None = Cookie(default=None)) -> str:
    return mh_admin_lang if mh_admin_lang in ("en", "ar") else "en"

router = APIRouter(prefix="/admin", tags=["admin"])

I18N_PATH = "assets/data/i18n.json"
RESET_TOKEN_MAX_AGE_MINUTES = 30
# Base URL of this backend itself (not the static site) -- used to build the
# reset-password link emailed to the user. Set to wherever this service is
# actually deployed; defaults to the current known Render URL.
BACKEND_BASE_URL = os.environ.get("BACKEND_BASE_URL", "https://ai-engineer-portfolio-va7f.onrender.com")


# ---------------------------------------------------------------- auth ----
@router.get("/set-lang")
def set_lang(lang: str, next: str = "/admin"):
    resp = RedirectResponse(next, status_code=303)
    if lang in ("en", "ar"):
        resp.set_cookie(LANG_COOKIE_NAME, lang, max_age=60 * 60 * 24 * 365, samesite="lax")
    return resp


@router.get("/login", response_class=HTMLResponse)
def login_form(error: str | None = None, lang: str = Depends(get_lang)):
    t = get_translator(lang)
    body = f"""
    <h1>{esc(t('login.title'))}</h1>
    {'<div class="error">' + esc(error) + '</div>' if error else ''}
    <form method="post" action="/admin/login">
      <label>{esc(t('login.username'))}</label>
      <input name="username" required autofocus>
      <label>{esc(t('login.password'))}</label>
      <input name="password" type="password" required>
      <button type="submit">{esc(t('login.submit'))}</button>
    </form>
    <div class="auth-links">
      <a class="muted-link" href="/admin/forgot-password">{esc(t('login.forgot'))}</a>
    </div>
    """
    return HTMLResponse(auth_page(t("login.title"), body, lang, "/admin/login"))


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
def forgot_password_form(sent: bool = False, lang: str = Depends(get_lang)):
    t = get_translator(lang)
    if sent:
        body = f"""
        <h1>{esc(t('forgot.sent_title'))}</h1>
        <p style="text-align:center;color:var(--muted);font-size:14px">{esc(t('forgot.sent_body'))}</p>
        <div class="auth-links"><a class="muted-link" href="/admin/login">{esc(t('login.back'))}</a></div>
        """
    else:
        body = f"""
        <h1>{esc(t('forgot.title'))}</h1>
        <form method="post" action="/admin/forgot-password">
          <label>{esc(t('forgot.email'))}</label>
          <input name="email" type="email" required autofocus>
          <button type="submit">{esc(t('forgot.submit'))}</button>
        </form>
        <div class="auth-links"><a class="muted-link" href="/admin/login">{esc(t('login.back'))}</a></div>
        """
    return HTMLResponse(auth_page(t("forgot.title"), body, lang, "/admin/forgot-password"))


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
def reset_password_form(token: str, error: str | None = None, lang: str = Depends(get_lang)):
    t = get_translator(lang)
    body = f"""
    <h1>{esc(t('reset.title'))}</h1>
    {'<div class="error">' + esc(error) + '</div>' if error else ''}
    <form method="post" action="/admin/reset-password">
      <input type="hidden" name="token" value="{esc(token)}">
      <label>{esc(t('reset.new_password'))}</label>
      <input name="password" type="password" required minlength="8" autofocus>
      <button type="submit">{esc(t('reset.submit'))}</button>
    </form>
    """
    return HTMLResponse(auth_page(t("reset.title"), body, lang, f"/admin/reset-password?token={token}"))


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
def profile_form(admin: AdminUser = Depends(get_current_admin), saved: bool = False, lang: str = Depends(get_lang)):
    t = get_translator(lang)
    body = f"""
    <div class="page-eyebrow">{esc(t('eyebrow.account'))}</div>
    <h1>{esc(t('profile.title'))}</h1>
    {'<div class="flash">' + esc(t('profile.saved')) + '</div>' if saved else ''}
    <div class="card">
      <form method="post" action="/admin/profile">
        <label>{esc(t('profile.username'))}</label>
        <input value="{esc(admin.username)}" disabled>
        <label>{esc(t('profile.email'))}</label>
        <input name="email" type="email" value="{esc(admin.email or '')}">
        <div style="margin-top:16px"><button type="submit">{esc(t('profile.save_email'))}</button></div>
      </form>
    </div>
    <h2>{esc(t('profile.change_password'))}</h2>
    <div class="card">
      <form method="post" action="/admin/profile/password">
        <label>{esc(t('profile.current_password'))}</label>
        <input name="current_password" type="password" required>
        <label>{esc(t('profile.new_password'))}</label>
        <input name="new_password" type="password" required minlength="8">
        <div style="margin-top:16px"><button type="submit">{esc(t('profile.change_password'))}</button></div>
      </form>
    </div>
    """
    return HTMLResponse(page(t("profile.title"), body, admin_nav("profile", admin.role, lang), lang, "/admin/profile"))


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
def dashboard_home(admin: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db), lang: str = Depends(get_lang)):
    t = get_translator(lang)
    unread = db.query(func.count(ContactMessage.id)).filter(ContactMessage.read.is_(False)).scalar()
    total_projects = db.query(func.count(Project.id)).scalar()
    total_chats = db.query(func.count(func.distinct(ChatLog.session_id))).scalar()
    body = f"""
    <div class="page-eyebrow">{esc(t('eyebrow.dashboard'))}</div>
    <h1>{esc(t('overview.title'))}</h1>
    <div class="card">
      <p>{esc(t('overview.logged_in_as'))} <strong>{esc(admin.username)}</strong> ({esc(admin.role)})</p>
      <p>{unread} unread contact message(s) · {total_projects} project(s) · {total_chats} chat session(s)</p>
      <p><a class="btn" href="/admin/messages">{esc(t('overview.view_inbox'))}</a></p>
      <p><a class="btn btn-ghost" href="/admin/analytics">{esc(t('overview.view_analytics'))}</a></p>
    </div>
    """
    return HTMLResponse(page(t("overview.title"), body, admin_nav("dashboard", admin.role, lang), lang, "/admin"))


# ------------------------------------------------------------ analytics ----
@router.get("/analytics", response_class=HTMLResponse)
def analytics(admin: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db), lang: str = Depends(get_lang)):
    t = get_translator(lang)
    now = datetime.datetime.utcnow()
    today_start = datetime.datetime(now.year, now.month, now.day)

    total_views = db.query(func.count(PageView.id)).scalar()
    total_visitors = db.query(func.count(func.distinct(PageView.visitor_id))).scalar()
    views_today = db.query(func.count(PageView.id)).filter(PageView.created_at >= today_start).scalar()
    visitors_today = (
        db.query(func.count(func.distinct(PageView.visitor_id))).filter(PageView.created_at >= today_start).scalar()
    )

    # Last 14 days, oldest first, as (date, view count, unique visitor count).
    daily = []
    max_count = 1
    for i in range(13, -1, -1):
        day_start = today_start - datetime.timedelta(days=i)
        day_end = day_start + datetime.timedelta(days=1)
        count = (
            db.query(func.count(PageView.id))
            .filter(PageView.created_at >= day_start, PageView.created_at < day_end)
            .scalar()
        )
        daily.append((day_start.strftime("%b %d"), count))
        max_count = max(max_count, count)

    bars = "".join(
        f"""<div class="analytics-bar-col" title="{esc(label)}: {count} view(s)">
          <div class="analytics-bar" style="height:{max(4, round(count / max_count * 120))}px"></div>
          <span class="analytics-bar-label">{esc(label[-2:])}</span>
        </div>"""
        for label, count in daily
    )

    top_pages = (
        db.query(PageView.path, func.count(PageView.id).label("n"))
        .group_by(PageView.path)
        .order_by(func.count(PageView.id).desc())
        .limit(10)
        .all()
    )
    top_rows = "".join(f"<tr><td>{esc(p)}</td><td>{n}</td></tr>" for p, n in top_pages)

    body = f"""
    <div class="page-eyebrow">{esc(t('eyebrow.insights'))}</div>
    <h1>{esc(t('analytics.title'))}</h1>
    <div class="analytics-stats">
      <div class="card analytics-stat"><div class="analytics-stat-num">{total_views}</div><div class="analytics-stat-lbl">{esc(t('analytics.total_views'))}</div></div>
      <div class="card analytics-stat"><div class="analytics-stat-num">{total_visitors}</div><div class="analytics-stat-lbl">{esc(t('analytics.unique_visitors'))}</div></div>
      <div class="card analytics-stat"><div class="analytics-stat-num">{views_today}</div><div class="analytics-stat-lbl">{esc(t('analytics.views_today'))}</div></div>
      <div class="card analytics-stat"><div class="analytics-stat-num">{visitors_today}</div><div class="analytics-stat-lbl">{esc(t('analytics.visitors_today'))}</div></div>
    </div>
    <h2>{esc(t('analytics.last_14_days'))}</h2>
    <div class="card"><div class="analytics-bars">{bars}</div></div>
    <h2>{esc(t('analytics.top_pages'))}</h2>
    <div class="card">
      <table><thead><tr><th>{esc(t('analytics.path'))}</th><th>{esc(t('analytics.views'))}</th></tr></thead>
      <tbody>{top_rows or '<tr><td colspan="2">' + esc(t('analytics.no_data')) + '</td></tr>'}</tbody></table>
    </div>
    """
    return HTMLResponse(page(t("analytics.title"), body, admin_nav("analytics", admin.role, lang), lang, "/admin/analytics"))


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


def _project_form_fields(item: Project | None = None, lang: str = "en") -> str:
    t = get_translator(lang)
    title = esc(item.title) if item else ""
    description = esc(item.description) if item else ""
    category = esc(item.category) if item else ""
    metrics = esc(_serialize_metrics(item.metrics)) if item else ""
    tags = esc(", ".join(item.tags)) if item else ""
    ctas = esc(_serialize_ctas(item.ctas)) if item else ""
    published_checked = "checked" if (item is None or item.published) else ""
    image_preview = (
        f'<label>{esc(t("pf.current_image"))}</label><img src="{esc(item.image_path)}" style="max-width:200px;border-radius:8px">'
        if item and item.image_path
        else ""
    )
    image_label = t("pf.replace_image") if item else t("pf.image")
    return f"""
        <label>{esc(t('pf.title'))}</label><input name="title" value="{title}" required>
        <label>{esc(t('pf.description'))}</label><textarea name="description" rows="3">{description}</textarea>
        <label>{esc(t('pf.category'))}</label>
        <input name="category" value="{category}">
        <label>{esc(t('pf.metrics'))}</label>
        <textarea name="metrics" rows="3">{metrics}</textarea>
        <label>{esc(t('pf.tags'))}</label>
        <input name="tags" value="{tags}">
        <label>{esc(t('pf.buttons'))}</label>
        <textarea name="ctas" rows="2">{ctas}</textarea>
        {image_preview}
        <label>{esc(image_label)}</label><input name="image" type="file" accept="image/*">
        <label><input style="width:auto" type="checkbox" name="published" {published_checked}> {esc(t('pf.published'))}</label>
    """


@router.get("/projects", response_class=HTMLResponse)
def list_projects(admin: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db), lang: str = Depends(get_lang)):
    t = get_translator(lang)
    items = db.query(Project).order_by(Project.sort_order, Project.id).all()
    rows = "".join(
        f"""<tr>
          <td>{esc(it.title)}</td><td>{esc(it.category)}</td>
          <td>{'✓' if it.published else '—'}</td>
          <td>
            <a class="btn btn-ghost" href="/admin/projects/{it.id}/edit">{esc(t('common.edit'))}</a>
            <form class="inline" method="post" action="/admin/projects/{it.id}/delete" onsubmit="return confirm('{esc(t('projects.confirm_delete'))}')">
              <button class="btn-danger" type="submit">{esc(t('common.delete'))}</button>
            </form>
          </td>
        </tr>"""
        for it in items
    )
    body = f"""
    <div class="page-eyebrow">{esc(t('eyebrow.content'))}</div>
    <h1>{esc(t('projects.title'))}</h1>
    <div class="card">
      <table><thead><tr><th>{esc(t('projects.col_title'))}</th><th>{esc(t('projects.col_category'))}</th><th>{esc(t('projects.col_published'))}</th><th></th></tr></thead>
      <tbody>{rows or '<tr><td colspan="4">' + esc(t('projects.none_yet')) + '</td></tr>'}</tbody></table>
    </div>
    <h2>{esc(t('projects.add_new'))}</h2>
    <div class="card">
      <form method="post" action="/admin/projects/new" enctype="multipart/form-data">
        {_project_form_fields(lang=lang)}
        <div style="margin-top:16px"><button type="submit">{esc(t('common.add'))}</button></div>
      </form>
    </div>
    """
    return HTMLResponse(page(t("projects.title"), body, admin_nav("projects", admin.role, lang), lang, "/admin/projects"))


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
def edit_project_form(item_id: int, admin: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db), lang: str = Depends(get_lang)):
    t = get_translator(lang)
    item = db.query(Project).filter(Project.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404)
    body = f"""
    <h1>{esc(t('projects.edit_title'))}</h1>
    <div class="card">
      <form method="post" action="/admin/projects/{item.id}/edit" enctype="multipart/form-data">
        {_project_form_fields(item, lang=lang)}
        <div style="margin-top:16px"><button type="submit">{esc(t('common.save'))}</button></div>
      </form>
    </div>
    """
    return HTMLResponse(page(t("projects.edit_title"), body, admin_nav("projects", admin.role, lang), lang, f"/admin/projects/{item_id}/edit"))


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
def list_pricing(admin: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db), lang: str = Depends(get_lang)):
    tt = get_translator(lang)
    tiers = db.query(PricingTier).order_by(PricingTier.sort_order, PricingTier.id).all()
    rows = "".join(
        f"""<div class="card">
          <form method="post" action="/admin/pricing/{tier.id}/edit">
            <label>{esc(tt('pricing.name'))}</label><input name="name" value="{esc(tier.name)}">
            <label>{esc(tt('pricing.price_usd'))}</label><input name="price_usd" type="number" value="{tier.price_usd}">
            <label>{esc(tt('pricing.duration'))}</label><input name="duration" value="{esc(tier.duration)}">
            <label>{esc(tt('pricing.features'))}</label><textarea name="features" rows="4">{esc(chr(10).join(tier.features or []))}</textarea>
            <div style="margin-top:12px"><button type="submit">{esc(tt('common.save'))}</button></div>
          </form>
          <form method="post" action="/admin/pricing/{tier.id}/delete" onsubmit="return confirm('{esc(tt('pricing.confirm_delete'))}')" style="margin-top:8px">
            <button class="btn-danger" type="submit">{esc(tt('common.delete'))}</button>
          </form>
        </div>"""
        for tier in tiers
    )
    body = f"""
    <div class="page-eyebrow">{esc(tt('eyebrow.content'))}</div>
    <h1>{esc(tt('pricing.title'))}</h1>
    {rows or '<p>' + esc(tt('pricing.none_yet')) + '</p>'}
    <h2>{esc(tt('pricing.add_tier'))}</h2>
    <div class="card">
      <form method="post" action="/admin/pricing/new">
        <label>{esc(tt('pricing.name'))}</label><input name="name" required>
        <label>{esc(tt('pricing.price_usd'))}</label><input name="price_usd" type="number" required>
        <label>{esc(tt('pricing.duration'))}</label><input name="duration">
        <label>{esc(tt('pricing.features'))}</label><textarea name="features" rows="4"></textarea>
        <div style="margin-top:16px"><button type="submit">{esc(tt('common.add'))}</button></div>
      </form>
    </div>
    """
    return HTMLResponse(page(tt("pricing.title"), body, admin_nav("pricing", admin.role, lang), lang, "/admin/pricing"))


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
SETTING_LABELS = {
    "show_hero_chip": 'The "Available for new engagements" chip in the homepage hero',
    "show_availability_banner": "The dismissible availability banner under the header",
}


@router.get("/content", response_class=HTMLResponse)
async def content_editor(q: str = "", admin: AdminUser = Depends(get_current_admin), lang: str = Depends(get_lang)):
    t = get_translator(lang)
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
            <label style="margin-top:0">{esc(t('content.english'))}</label><textarea name="en" rows="2" data-en-field>{esc(en.get(k, ''))}</textarea>
            <div style="display:flex;align-items:center;justify-content:space-between;margin-top:10px">
              <label style="margin:0">{esc(t('content.arabic'))}</label>
              <button type="button" class="btn-ghost translate-btn" style="padding:4px 10px;font-size:12px">{esc(t('content.translate'))}</button>
            </div>
            <textarea name="ar" rows="2" data-ar-field>{esc(dict_.get('ar', {}).get(k, ''))}</textarea>
            <div style="margin-top:10px"><button type="submit">{esc(t('common.save'))}</button></div>
          </form>
        </div>"""
        for k in keys[:200]
    )
    body = f"""
    <div class="page-eyebrow">{esc(t('eyebrow.content'))}</div>
    <h1>{esc(t('content.title'))}</h1>
    <form method="get" action="/admin/content" style="margin-bottom:16px">
      <input name="q" value="{esc(q)}" placeholder="{esc(t('content.search_placeholder'))}">
    </form>
    {rows or '<p>' + esc(t('content.none_matching')) + '</p>'}
    {'<p class="badge">' + esc(t('content.showing_first_200')) + '</p>' if len(keys) > 200 else ''}
    <script>
      document.querySelectorAll('.translate-btn').forEach(function (btn) {{
        btn.addEventListener('click', function () {{
          var form = btn.closest('form');
          var enField = form.querySelector('[data-en-field]');
          var arField = form.querySelector('[data-ar-field]');
          if (!enField.value.trim()) return;
          btn.disabled = true;
          btn.textContent = {json.dumps(t('content.translating'))};
          fetch('/admin/translate', {{
            method: 'POST',
            headers: {{ 'Content-Type': 'application/json' }},
            body: JSON.stringify({{ text: enField.value }})
          }})
            .then(function (r) {{ if (!r.ok) throw new Error('bad status'); return r.json(); }})
            .then(function (data) {{ arField.value = data.translation; }})
            .catch(function () {{ alert({json.dumps(t('content.translate_failed'))}); }})
            .finally(function () {{ btn.disabled = false; btn.textContent = {json.dumps(t('content.translate'))}; }});
        }});
      }});
    </script>
    """
    return HTMLResponse(page(t("content.title"), body, admin_nav("content", admin.role, lang), lang, "/admin/content"))


@router.post("/translate")
async def translate_endpoint(payload: dict, admin: AdminUser = Depends(get_current_admin)):
    text = payload.get("text", "")
    translation = await translate_to_arabic(text)
    return {"translation": translation}


@router.post("/settings/toggle")
def toggle_setting(payload: dict, admin: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db)):
    key = payload.get("key")
    value = bool(payload.get("value"))
    if key not in SETTING_LABELS:
        raise HTTPException(status_code=400, detail="Unknown setting.")
    row = db.query(SiteSetting).filter(SiteSetting.key == key).first()
    if row:
        row.value = value
    else:
        db.add(SiteSetting(key=key, value=value))
    db.commit()
    return {"status": "ok"}


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
def list_messages(admin: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db), lang: str = Depends(get_lang)):
    t = get_translator(lang)
    contacts = db.query(ContactMessage).order_by(ContactMessage.received_at.desc()).limit(100).all()
    contact_rows = "".join(
        f"""<tr>
          <td>{esc(c.received_at.strftime('%Y-%m-%d %H:%M'))}</td>
          <td>{esc(c.name)} &lt;{esc(c.email)}&gt;</td>
          <td>{esc(c.message[:200])}</td>
          <td>{'<span class="badge unread">' + esc(t('messages.unread')) + '</span>' if not c.read else '<span class="badge">' + esc(t('messages.read')) + '</span>'}
            {'<form class="inline" method="post" action="/admin/messages/' + str(c.id) + '/read"><button class="btn-ghost" type="submit">' + esc(t('messages.mark_read')) + '</button></form>' if not c.read else ''}
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
    <div class="page-eyebrow">{esc(t('eyebrow.inbox'))}</div>
    <h1>{esc(t('messages.title'))}</h1>
    <h2>{esc(t('messages.contact_form'))}</h2>
    <div class="card">
      <table><thead><tr><th>{esc(t('messages.when'))}</th><th>{esc(t('messages.from'))}</th><th>{esc(t('messages.message'))}</th><th></th></tr></thead>
      <tbody>{contact_rows or '<tr><td colspan="4">' + esc(t('messages.none_yet')) + '</td></tr>'}</tbody></table>
    </div>
    <h2>{esc(t('messages.chat_sessions'))}</h2>
    <div class="card">
      <table><thead><tr><th>{esc(t('messages.last_activity'))}</th><th>{esc(t('messages.session'))}</th></tr></thead>
      <tbody>{session_rows or '<tr><td colspan="2">' + esc(t('messages.none_yet')) + '</td></tr>'}</tbody></table>
    </div>
    """
    return HTMLResponse(page(t("messages.title"), body, admin_nav("messages", admin.role, lang), lang, "/admin/messages"))


@router.post("/messages/{item_id}/read")
def mark_read(item_id: int, admin: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db)):
    msg = db.query(ContactMessage).filter(ContactMessage.id == item_id).first()
    if msg:
        msg.read = True
        db.commit()
    return RedirectResponse("/admin/messages", status_code=303)


@router.get("/messages/chat/{session_id}", response_class=HTMLResponse)
def view_chat_session(session_id: str, admin: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db), lang: str = Depends(get_lang)):
    t = get_translator(lang)
    turns = db.query(ChatLog).filter(ChatLog.session_id == session_id).order_by(ChatLog.created_at).all()
    rows = "".join(f'<p><strong>{esc(turn.role)}:</strong> {esc(turn.content)}</p>' for turn in turns)
    body = f"""
    <h1>{esc(t('messages.chat_session_title'))} {esc(session_id[:12])}…</h1>
    <div class="card">{rows or '<p>' + esc(t('messages.no_messages')) + '</p>'}</div>
    <a class="btn btn-ghost" href="/admin/messages">{esc(t('common.back'))}</a>
    """
    return HTMLResponse(page(t("messages.chat_session_title"), body, admin_nav("messages", admin.role, lang), lang, f"/admin/messages/chat/{session_id}"))


# ---------------------------------------------------------------- users ----
@router.get("/users", response_class=HTMLResponse)
def list_users(admin: AdminUser = Depends(require_owner), db: Session = Depends(get_db), lang: str = Depends(get_lang)):
    t = get_translator(lang)
    users = db.query(AdminUser).order_by(AdminUser.id).all()
    rows = "".join(
        f"""<tr>
          <td>{esc(u.username)}</td><td>{esc(u.email or '—')}</td><td>{esc(u.role)}</td>
          <td>{'' if u.role == 'owner' else '<form class="inline" method="post" action="/admin/users/' + str(u.id) + '/delete" onsubmit="return confirm(\'' + esc(t('users.confirm_remove')) + '\')"><button class="btn-danger" type="submit">' + esc(t('users.remove')) + '</button></form>'}</td>
        </tr>"""
        for u in users
    )
    body = f"""
    <div class="page-eyebrow">{esc(t('eyebrow.access'))}</div>
    <h1>{esc(t('users.title'))}</h1>
    <div class="card">
      <table><thead><tr><th>{esc(t('users.col_username'))}</th><th>{esc(t('users.col_email'))}</th><th>{esc(t('users.col_role'))}</th><th></th></tr></thead>
      <tbody>{rows}</tbody></table>
    </div>
    <h2>{esc(t('users.add_editor'))}</h2>
    <div class="card">
      <form method="post" action="/admin/users/new">
        <label>{esc(t('users.col_username'))}</label><input name="username" required>
        <label>{esc(t('users.email_hint'))}</label><input name="email" type="email">
        <label>{esc(t('users.password'))}</label><input name="password" type="password" required minlength="8">
        <div style="margin-top:16px"><button type="submit">{esc(t('common.add'))}</button></div>
      </form>
    </div>
    """
    return HTMLResponse(page(t("users.title"), body, admin_nav("users", admin.role, lang), lang, "/admin/users"))


# ------------------------------------------------------------- settings ----
@router.get("/settings", response_class=HTMLResponse)
def settings_page(admin: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db), lang: str = Depends(get_lang)):
    t = get_translator(lang)
    current_settings = {s.key: s.value for s in db.query(SiteSetting).all()}
    toggle_rows = "".join(
        f"""<label class="settings-toggle-row">
          <span>{esc(t(f'settings.toggle.{setting_key}'))}</span>
          <span class="settings-switch">
            <input type="checkbox" name="{esc(setting_key)}"
              {"checked" if current_settings.get(setting_key, True) else ""}
              onchange="fetch('/admin/settings/toggle',{{method:'POST',headers:{{'Content-Type':'application/json'}},body:JSON.stringify({{key:'{setting_key}',value:this.checked}})}})">
            <span class="settings-switch-track"></span>
          </span>
        </label>"""
        for setting_key in SETTING_LABELS
    )

    integrations = [
        ("Groq (chat + translation)", bool(os.environ.get("GROQ_API_KEY"))),
        ("GitHub (image uploads + text edits)", bool(os.environ.get("GITHUB_TOKEN"))),
        ("Resend (password-reset email)", bool(os.environ.get("RESEND_API_KEY"))),
        ("Database (Neon Postgres)", not str(db.get_bind().url).startswith("sqlite")),
    ]
    integration_rows = "".join(
        f"""<div class="settings-integration-row">
          <span>{esc(name)}</span>
          <span class="badge {'ok' if ok else 'unread'}">{esc(t('settings.connected') if ok else t('settings.not_configured'))}</span>
        </div>"""
        for name, ok in integrations
    )

    body = f"""
    <div class="page-eyebrow">{esc(t('eyebrow.configuration'))}</div>
    <h1>{esc(t('settings.title'))}</h1>

    <h2>{esc(t('settings.homepage_sections'))}</h2>
    <div class="card">{toggle_rows}</div>

    <h2>{esc(t('settings.integrations'))}</h2>
    <div class="card">{integration_rows}</div>

    <h2>{esc(t('settings.account'))}</h2>
    <div class="card">
      <p style="margin:0 0 14px;color:var(--body);font-size:14px">{esc(t('settings.account_body'))}</p>
      <a class="btn btn-ghost" href="/admin/profile">{esc(t('settings.go_to_profile'))}</a>
    </div>
    """
    return HTMLResponse(page(t("settings.title"), body, admin_nav("settings", admin.role, lang), lang, "/admin/settings"))


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
