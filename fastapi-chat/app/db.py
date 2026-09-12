"""Database engine/session setup. DATABASE_URL should point at a Neon
Postgres connection string in production -- Render's own disk is ephemeral,
so SQLite there would lose all data on every redeploy/restart. Falls back to
a local SQLite file only for local development when DATABASE_URL is unset.
"""
import os

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./dev.db")

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db_and_seed_owner():
    """Creates tables if they don't exist, and seeds the one owner account
    from ADMIN_USERNAME/ADMIN_PASSWORD env vars on first run only -- mirrors
    the exam-integrity-system project's pattern of env-vars-seed-once so
    redeploys never overwrite a password already changed via the dashboard.
    """
    from app.auth import hash_password
    from app.models import AdminUser

    Base.metadata.create_all(bind=engine)

    username = os.environ.get("ADMIN_USERNAME")
    password = os.environ.get("ADMIN_PASSWORD")
    if username and password:
        db = SessionLocal()
        try:
            if db.query(AdminUser).count() == 0:
                db.add(AdminUser(username=username, password_hash=hash_password(password), role="owner"))
                db.commit()
        finally:
            db.close()

    from app.seed_content import seed_projects_if_empty

    seed_projects_if_empty()
