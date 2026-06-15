"""Authentication: password hashing + JWT tokens + FastAPI dependencies.

Tokens are HS256 JWTs carrying the user id, username, and role. Set JWT_SECRET
in the environment (Render dashboard) for production; the dev fallback is only
for local use and invalidates tokens whenever it changes.
"""
import os
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import User

JWT_SECRET = os.getenv("JWT_SECRET", "dev-insecure-secret-change-in-prod")
JWT_ALGORITHM = "HS256"
TOKEN_TTL_HOURS = 24 * 7  # 7 days


# ---- passwords ----
def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


# ---- tokens ----
def create_access_token(user: User) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user.id),
        "username": user.username,
        "role": user.role,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(hours=TOKEN_TTL_HOURS)).timestamp()),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def _decode(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.PyJWTError:
        raise HTTPException(401, "Invalid or expired token")


def _user_from_header(authorization: str, db: Session) -> User:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(401, "Missing bearer token")
    token = authorization.split(" ", 1)[1].strip()
    payload = _decode(token)
    try:
        user_id = int(payload.get("sub", 0))
    except (TypeError, ValueError):
        raise HTTPException(401, "Invalid token subject")
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(401, "User not found or inactive")
    return user


# ---- dependencies ----
def get_current_user(authorization: str = Header(None), db: Session = Depends(get_db)) -> User:
    return _user_from_header(authorization, db)


def get_optional_user(authorization: str = Header(None), db: Session = Depends(get_db)):
    """Returns the user if a valid token is present, else None (no error)."""
    if not authorization:
        return None
    try:
        return _user_from_header(authorization, db)
    except HTTPException:
        return None


def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != "admin":
        raise HTTPException(403, "Admin access required")
    return user


def public_user(user: User) -> dict:
    """Shape a User for API responses (never includes the password hash)."""
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "role": user.role,
    }
