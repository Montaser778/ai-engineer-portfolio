"""Session-cookie auth for the admin dashboard. Two roles: "owner" (full
control, incl. managing the editor account) and "editor" (content only, no
user management). Passwords hashed with bcrypt (a human-chosen, low-entropy
secret, unlike the API-key hashing elsewhere -- a slow salted KDF matters
here). Sessions are itsdangerous-signed cookies, not server-side session
storage, so no extra DB table is needed for them.
"""
import datetime
import os

from fastapi import Cookie, Depends, HTTPException
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import AdminUser

SESSION_SECRET = os.environ.get("SESSION_SECRET")
if not SESSION_SECRET:
    raise RuntimeError(
        "SESSION_SECRET environment variable is not set. Refusing to start with a guessable "
        "default -- that would let anyone who has read this source forge admin session cookies. "
        "Set SESSION_SECRET to a long random value (e.g. `python -c \"import secrets; "
        "print(secrets.token_hex(32))\"`) before starting the service."
    )

SESSION_COOKIE_NAME = "mh_admin_session"
SESSION_MAX_AGE_SECONDS = 60 * 60 * 12  # 12 hours
LOCKOUT_THRESHOLD = 5
LOCKOUT_MINUTES = 15

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
serializer = URLSafeTimedSerializer(SESSION_SECRET, salt="mh-admin-session")


def hash_password(raw: str) -> str:
    return pwd_context.hash(raw)


def verify_password(raw: str, hashed: str) -> bool:
    return pwd_context.verify(raw, hashed)


def create_session_cookie(user_id: int) -> str:
    return serializer.dumps({"uid": user_id})


def _read_session_user_id(token: str | None) -> int | None:
    if not token:
        return None
    try:
        data = serializer.loads(token, max_age=SESSION_MAX_AGE_SECONDS)
    except (BadSignature, SignatureExpired):
        return None
    return data.get("uid")


def is_locked(user: AdminUser) -> bool:
    return user.locked_until is not None and user.locked_until > datetime.datetime.utcnow()


def register_failed_login(user: AdminUser, db: Session) -> None:
    user.failed_login_count += 1
    if user.failed_login_count >= LOCKOUT_THRESHOLD:
        user.locked_until = datetime.datetime.utcnow() + datetime.timedelta(minutes=LOCKOUT_MINUTES)
    db.commit()


def register_successful_login(user: AdminUser, db: Session) -> None:
    user.failed_login_count = 0
    user.locked_until = None
    db.commit()


def get_current_admin(
    mh_admin_session: str | None = Cookie(default=None),
    db: Session = Depends(get_db),
) -> AdminUser:
    user_id = _read_session_user_id(mh_admin_session)
    if user_id is None:
        raise HTTPException(status_code=401, detail="Not logged in.")
    user = db.query(AdminUser).filter(AdminUser.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=401, detail="Not logged in.")
    return user


def require_owner(admin: AdminUser = Depends(get_current_admin)) -> AdminUser:
    if admin.role != "owner":
        raise HTTPException(status_code=403, detail="Owner access required.")
    return admin
