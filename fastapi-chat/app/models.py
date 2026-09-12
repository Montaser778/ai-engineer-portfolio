import datetime

from sqlalchemy import Boolean, DateTime, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class AdminUser(Base):
    __tablename__ = "admin_users"

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    email: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(20), default="editor")  # "owner" | "editor"
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)
    failed_login_count: Mapped[int] = mapped_column(Integer, default=0)
    locked_until: Mapped[datetime.datetime | None] = mapped_column(DateTime, nullable=True)


class PasswordResetToken(Base):
    """Short-lived, single-use tokens for the forgot-password flow. Storing
    these server-side (rather than only trusting a signed URL) lets a used
    or superseded token be positively invalidated."""
    __tablename__ = "password_reset_tokens"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, index=True)
    token: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)
    used: Mapped[bool] = mapped_column(Boolean, default=False)


class Project(Base):
    """Mirrors the rich hand-authored card markup on projects.html: a
    headline metrics band (each {value, suffix, label}), a row of tech
    tags, and one or more CTA buttons -- not just a plain title/link, so
    switching to dashboard-driven cards doesn't flatten the site's content.
    """
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text, default="")
    category: Mapped[str] = mapped_column(String(50), default="")  # matches data-cats filter values
    image_path: Mapped[str] = mapped_column(String(500), default="")
    metrics: Mapped[list] = mapped_column(JSON, default=list)  # [{"value": "800", "suffix": "ms", "label": "Turn latency"}]
    tags: Mapped[list] = mapped_column(JSON, default=list)  # ["Pipecat", "WebRTC", "FastAPI"]
    ctas: Mapped[list] = mapped_column(JSON, default=list)  # [{"label": "Case study", "href": "...", "external": false}]
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    published: Mapped[bool] = mapped_column(Boolean, default=True)


class PricingTier(Base):
    __tablename__ = "pricing_tiers"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    price_usd: Mapped[int] = mapped_column(Integer)
    duration: Mapped[str] = mapped_column(String(100), default="")
    features: Mapped[list] = mapped_column(JSON, default=list)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)


class ContactMessage(Base):
    __tablename__ = "contact_messages"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200), default="")
    email: Mapped[str] = mapped_column(String(200), default="")
    message: Mapped[str] = mapped_column(Text)
    received_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)
    read: Mapped[bool] = mapped_column(Boolean, default=False)


class ChatLog(Base):
    __tablename__ = "chat_logs"

    id: Mapped[int] = mapped_column(primary_key=True)
    session_id: Mapped[str] = mapped_column(String(64), index=True)
    role: Mapped[str] = mapped_column(String(20))  # "user" | "assistant"
    content: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)


class PageView(Base):
    """One row per page load, fired by assets/js/analytics.js. visitor_id is
    a random id the browser keeps in localStorage (not a fingerprint, not
    cross-site) -- good enough to distinguish "unique visitors" from
    "total views" for a portfolio site without adding a real analytics
    vendor or a cookie-consent banner."""
    __tablename__ = "page_views"

    id: Mapped[int] = mapped_column(primary_key=True)
    path: Mapped[str] = mapped_column(String(300))
    visitor_id: Mapped[str] = mapped_column(String(64), index=True)
    referrer: Mapped[str] = mapped_column(String(300), default="")
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow, index=True)
