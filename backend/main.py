from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func, text, or_
import json
import os
import re
from datetime import datetime
import tweepy
import urllib.request
from io import BytesIO

from database import SessionLocal, engine, Base, get_db
from models import Profile, Project, Link, Video, Writing, Admin, Setting, User, Comment, Track, Release, Show, Photo, Clip, Post
from auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
    get_optional_user,
    require_admin,
    public_user,
)

def migrate_legacy_admins(db):
    """Copy any rows from the old `admin` table into `users` as role=admin so the
    existing site admin can log in through the unified accounts system. The bcrypt
    hash is carried over unchanged, so the same password keeps working."""
    for a in db.query(Admin).all():
        exists = db.query(User).filter(func.lower(User.username) == a.username.lower()).first()
        if not exists:
            db.add(User(
                username=a.username,
                email=None,
                hashed_password=a.hashed_password,
                role="admin",
            ))
    db.commit()


def ensure_columns():
    """Add columns introduced after a table was first created. create_all only
    creates missing TABLES, not missing COLUMNS, and Render doesn't run Alembic,
    so we add new columns idempotently here (Postgres ADD COLUMN IF NOT EXISTS).

    Only runs on Postgres (production). On a local SQLite dev database this is a
    no-op: create_all() just made every table with all current columns, and
    SQLite doesn't support ADD COLUMN IF NOT EXISTS anyway."""
    if engine.dialect.name != "postgresql":
        return
    stmts = [
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS headline VARCHAR",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_public BOOLEAN DEFAULT TRUE",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_theme VARCHAR",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_layout TEXT",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS genres VARCHAR",
        "ALTER TABLE projects ADD COLUMN IF NOT EXISTS user_id INTEGER",
        "ALTER TABLE links ADD COLUMN IF NOT EXISTS user_id INTEGER",
    ]
    with engine.begin() as conn:
        for s in stmts:
            conn.execute(text(s))


def init_database():
    """Create missing tables/columns and migrate data on startup.

    Wrapped in try/except so a transient database problem (e.g. a stale
    DATABASE_URL password) logs a warning instead of crashing the whole service
    on boot. The app still starts, and self-heals on the next boot once the
    database is reachable again. Idempotent: never drops or alters existing data.
    (Render's start command doesn't run Alembic, so this provisions schema.)"""
    try:
        Base.metadata.create_all(bind=engine)
        ensure_columns()
        db = SessionLocal()
        try:
            migrate_legacy_admins(db)
            # Claim ownerless projects for the first admin so they remain the
            # public-facing set shown to logged-out visitors.
            admin = db.query(User).filter(User.role == "admin").order_by(User.id).first()
            if admin:
                # Claim ownerless projects and links for the admin (the public set).
                for p in db.query(Project).filter(Project.user_id.is_(None)).all():
                    p.user_id = admin.id
                for l in db.query(Link).filter(Link.user_id.is_(None)).all():
                    l.user_id = admin.id
                # Seed the admin's public profile from the old global Profile record.
                if not admin.bio:
                    legacy = db.query(Profile).first()
                    if legacy:
                        admin.bio = legacy.bio
                        admin.headline = legacy.tagline
                db.commit()
        finally:
            db.close()
        print("✅ Database initialized")
    except Exception as e:
        print(f"⚠️  Database init skipped (will retry on next boot): {e}")


init_database()

# ---- Per-profile theme (artists customizing their own public profile) ----
VALID_THEMES = {"classic", "huffpost", "twilight", "music", "developer", "photographer", "creator", "writer"}

# ---- Site settings (homepage layout) ----
DEFAULT_LAYOUT = "classic"
VALID_LAYOUTS = {"classic", "huffpost", "dailywire"}


def get_setting(db: Session, key: str, default=None):
    row = db.query(Setting).filter(Setting.key == key).first()
    return row.value if row else default


def set_setting(db: Session, key: str, value: str):
    row = db.query(Setting).filter(Setting.key == key).first()
    if row:
        row.value = value
    else:
        db.add(Setting(key=key, value=value))
    db.commit()


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://www.timezoftoday.com",
        "https://timezoftoday.com",
        "http://localhost:5173",
        "http://localhost:5174",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===================== PUBLIC ENDPOINTS =====================
@app.get("/api/profile")
async def get_profile(db: Session = Depends(get_db)):
    profile = db.query(Profile).first()
    if profile:
        return {
            "name": profile.name,
            "tagline": profile.tagline,
            "bio": profile.bio,
            "skills": json.loads(profile.skills) if profile.skills else []
        }
    return {}

def project_dict(p: Project) -> dict:
    return {"id": p.id, "title": p.title, "description": p.description, "status": p.status}


def link_dict(l: Link) -> dict:
    return {"id": l.id, "label": l.label, "href": l.href, "note": l.note}


def track_dict(t: Track) -> dict:
    return {"id": t.id, "url": t.url, "title": t.title}


def release_dict(r: Release) -> dict:
    return {"id": r.id, "title": r.title, "year": r.year, "cover_url": r.cover_url, "link": r.link}


def show_dict(s: Show) -> dict:
    return {"id": s.id, "date": s.date, "venue": s.venue, "city": s.city, "ticket_url": s.ticket_url}


def photo_dict(p: Photo) -> dict:
    return {"id": p.id, "image_url": p.image_url, "caption": p.caption}


def clip_dict(c: Clip) -> dict:
    return {"id": c.id, "url": c.url, "title": c.title}


def post_dict(p: Post) -> dict:
    return {
        "id": p.id,
        "title": p.title,
        "body": p.body,
        "created_at": p.created_at.isoformat() if p.created_at else None,
    }


def genres_list(user: User) -> list:
    return [g.strip() for g in (user.genres or "").split(",") if g.strip()]


# Default profile section layout (toggle + reorder a known set).
DEFAULT_LAYOUT = [
    {"type": "about", "visible": True},
    {"type": "projects", "visible": True},
    {"type": "links", "visible": True},
]


def get_layout(user: User) -> list:
    if user.profile_layout:
        try:
            parsed = json.loads(user.profile_layout)
            if isinstance(parsed, list):
                return parsed
        except Exception:
            pass
    return DEFAULT_LAYOUT


def display_name(user: User) -> str:
    full = f"{(user.first_name or '').strip()} {(user.last_name or '').strip()}".strip()
    return full or user.username


def profile_payload(user: User, db: Session) -> dict:
    projects = db.query(Project).filter(Project.user_id == user.id).order_by(Project.id.desc()).all()
    links = db.query(Link).filter(Link.user_id == user.id).order_by(Link.id.asc()).all()
    tracks = db.query(Track).filter(Track.user_id == user.id).order_by(Track.sort.asc(), Track.id.asc()).all()
    releases = db.query(Release).filter(Release.user_id == user.id).order_by(Release.sort.asc(), Release.id.desc()).all()
    shows = db.query(Show).filter(Show.user_id == user.id).order_by(Show.sort.asc(), Show.id.asc()).all()
    photos = db.query(Photo).filter(Photo.user_id == user.id).order_by(Photo.sort.asc(), Photo.id.asc()).all()
    clips = db.query(Clip).filter(Clip.user_id == user.id).order_by(Clip.sort.asc(), Clip.id.asc()).all()
    posts = db.query(Post).filter(Post.user_id == user.id).order_by(Post.sort.asc(), Post.id.desc()).all()
    return {
        "username": user.username,
        "display_name": display_name(user),
        "headline": user.headline,
        "bio": user.bio,
        "avatar_url": user.avatar_url,
        "theme": user.profile_theme,
        "is_public": user.profile_public,
        "layout": get_layout(user),
        "genres": genres_list(user),
        "projects": [project_dict(p) for p in projects],
        "links": [link_dict(l) for l in links],
        "tracks": [track_dict(t) for t in tracks],
        "releases": [release_dict(r) for r in releases],
        "shows": [show_dict(s) for s in shows],
        "photos": [photo_dict(p) for p in photos],
        "clips": [clip_dict(c) for c in clips],
        "posts": [post_dict(p) for p in posts],
    }


@app.get("/api/projects")
async def get_projects(user: User = Depends(get_optional_user), db: Session = Depends(get_db)):
    """Per-user: a logged-in user sees their own projects; logged-out visitors see
    the owner's (first admin's) projects as the public set."""
    if user:
        owner_id = user.id
    else:
        admin = db.query(User).filter(User.role == "admin").order_by(User.id).first()
        owner_id = admin.id if admin else None
    if owner_id is None:
        return []
    rows = db.query(Project).filter(Project.user_id == owner_id).all()
    return [project_dict(p) for p in rows]

@app.get("/api/links")
async def get_links(db: Session = Depends(get_db)):
    """Public: the owner's (first admin's) links, the public-facing set."""
    admin = db.query(User).filter(User.role == "admin").order_by(User.id).first()
    rows = db.query(Link).filter(Link.user_id == admin.id).all() if admin else []
    return [link_dict(l) for l in rows]

@app.get("/api/videos")
async def get_videos(db: Session = Depends(get_db)):
    return [v.__dict__ for v in db.query(Video).all()]

@app.get("/api/search")
async def search(q: str = "", db: Session = Depends(get_db)):
    query = q.strip()
    if len(query) < 2:
        return {"profiles": [], "articles": [], "videos": []}
    like = f"%{query}%"

    users = db.query(User).filter(
        User.profile_public == True,
        or_(User.username.ilike(like), User.headline.ilike(like), User.bio.ilike(like),
            User.first_name.ilike(like), User.last_name.ilike(like)),
    ).limit(20).all()

    posts = db.query(Writing).filter(
        or_(Writing.title.ilike(like), Writing.summary.ilike(like), Writing.content.ilike(like))
    ).order_by(Writing.date.desc()).limit(20).all()

    videos = db.query(Video).filter(
        or_(Video.title.ilike(like), Video.description.ilike(like))
    ).limit(20).all()

    return {
        "profiles": [{"username": u.username, "display_name": display_name(u), "headline": u.headline, "avatar_url": u.avatar_url} for u in users],
        "articles": [{"slug": p.slug, "title": p.title, "summary": p.summary, "date": p.date.isoformat() if p.date else None} for p in posts],
        "videos": [{"id": v.id, "title": v.title, "youtube_id": v.youtube_id} for v in videos],
    }

@app.get("/api/writing")
async def get_writing(db: Session = Depends(get_db)):
    posts = db.query(Writing).order_by(Writing.date.desc()).all()
    return [{
        "slug": p.slug,
        "title": p.title,
        "date": p.date.isoformat() if p.date else None,
        "summary": p.summary or "",
        "content": p.content,
        "sponsor_logo": p.sponsor_logo,
        "x_posted": p.x_posted
    } for p in posts]

@app.get("/api/writing/{slug}")
async def get_writing_post(slug: str, db: Session = Depends(get_db)):
    post = db.query(Writing).filter(Writing.slug == slug).first()
    if not post:
        raise HTTPException(404, "Post not found")
    return {
        "slug": post.slug,
        "title": post.title,
        "date": post.date.isoformat() if post.date else None,
        "summary": post.summary or "",
        "content": post.content,
        "sponsor_logo": post.sponsor_logo,
    }

@app.get("/api/settings")
async def get_settings(db: Session = Depends(get_db)):
    """Public: returns global site settings (the active homepage layout). Read on every page load."""
    layout = get_setting(db, "active_layout", DEFAULT_LAYOUT)
    if layout not in VALID_LAYOUTS:
        layout = DEFAULT_LAYOUT
    return {"layout": layout}

# ===================== AUTH =====================
EMAIL_RE = re.compile(r"[^@\s]+@[^@\s]+\.[^@\s]+")


@app.post("/api/auth/register")
async def register(data: dict, db: Session = Depends(get_db)):
    username = (data.get("username") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    first_name = (data.get("first_name") or "").strip()
    last_name = (data.get("last_name") or "").strip()
    phone = (data.get("phone") or "").strip() or None

    if not username or not email or not password:
        raise HTTPException(400, "username, email, and password are required")
    if not first_name or not last_name:
        raise HTTPException(400, "First and last name are required")
    if len(username) < 3:
        raise HTTPException(400, "Username must be at least 3 characters")
    if len(password) < 8:
        raise HTTPException(400, "Password must be at least 8 characters")
    if not EMAIL_RE.match(email):
        raise HTTPException(400, "Invalid email address")

    if db.query(User).filter(func.lower(User.username) == username.lower()).first():
        raise HTTPException(409, "Username is already taken")
    if db.query(User).filter(func.lower(User.email) == email).first():
        raise HTTPException(409, "Email is already registered")

    user = User(
        username=username,
        email=email,
        hashed_password=hash_password(password),
        role="member",
        first_name=first_name,
        last_name=last_name,
        phone=phone,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"token": create_access_token(user), "user": public_user(user)}


@app.post("/api/auth/login")
async def login(data: dict, db: Session = Depends(get_db)):
    identifier = (data.get("username") or data.get("email") or data.get("identifier") or "").strip()
    password = data.get("password") or ""
    if not identifier or not password:
        raise HTTPException(400, "username/email and password are required")

    ident = identifier.lower()
    user = db.query(User).filter(
        (func.lower(User.username) == ident) | (func.lower(User.email) == ident)
    ).first()
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(401, "Invalid credentials")
    if not user.is_active:
        raise HTTPException(403, "Account is disabled")
    return {"token": create_access_token(user), "user": public_user(user)}


@app.get("/api/auth/me")
async def whoami(user: User = Depends(get_current_user)):
    return {"user": public_user(user)}


@app.post("/api/auth/change-password")
async def change_password(data: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    current = data.get("current_password") or ""
    new = data.get("new_password") or ""
    if not verify_password(current, user.hashed_password):
        raise HTTPException(400, "Current password is incorrect")
    if len(new) < 8:
        raise HTTPException(400, "New password must be at least 8 characters")
    user.hashed_password = hash_password(new)
    db.commit()
    return {"message": "Password updated successfully"}


@app.get("/api/me/comments")
async def my_comments(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.query(Comment).filter(Comment.user_id == user.id).order_by(Comment.created_at.desc()).all()
    return [{
        "id": c.id,
        "body": c.body,
        "writing_slug": c.writing_slug,
        "status": c.status,
        "created_at": c.created_at.isoformat() if c.created_at else None,
    } for c in rows]


# ---- member's own projects ----
@app.get("/api/me/projects")
async def list_my_projects(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.query(Project).filter(Project.user_id == user.id).order_by(Project.id.desc()).all()
    return [project_dict(p) for p in rows]


@app.post("/api/me/projects")
async def create_my_project(data: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    title = (data.get("title") or "").strip()
    if not title:
        raise HTTPException(400, "Title is required")
    p = Project(
        title=title,
        description=(data.get("description") or "").strip() or None,
        status=(data.get("status") or "").strip() or None,
        user_id=user.id,
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    return project_dict(p)


@app.put("/api/me/projects/{project_id}")
async def update_my_project(project_id: int, data: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    p = db.query(Project).filter(Project.id == project_id, Project.user_id == user.id).first()
    if not p:
        raise HTTPException(404, "Project not found")
    if "title" in data and (data.get("title") or "").strip():
        p.title = data["title"].strip()
    if "description" in data:
        p.description = (data.get("description") or "").strip() or None
    if "status" in data:
        p.status = (data.get("status") or "").strip() or None
    db.commit()
    return project_dict(p)


@app.delete("/api/me/projects/{project_id}")
async def delete_my_project(project_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    p = db.query(Project).filter(Project.id == project_id, Project.user_id == user.id).first()
    if not p:
        raise HTTPException(404, "Project not found")
    db.delete(p)
    db.commit()
    return {"message": "Project deleted"}


# ---- member's own links ----
@app.get("/api/me/links")
async def list_my_links(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return [link_dict(l) for l in db.query(Link).filter(Link.user_id == user.id).order_by(Link.id.asc()).all()]


@app.post("/api/me/links")
async def create_my_link(data: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    label = (data.get("label") or "").strip()
    href = (data.get("href") or "").strip()
    if not label or not href:
        raise HTTPException(400, "Label and URL are required")
    l = Link(label=label, href=href, note=(data.get("note") or "").strip() or None, user_id=user.id)
    db.add(l)
    db.commit()
    db.refresh(l)
    return link_dict(l)


@app.put("/api/me/links/{link_id}")
async def update_my_link(link_id: int, data: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    l = db.query(Link).filter(Link.id == link_id, Link.user_id == user.id).first()
    if not l:
        raise HTTPException(404, "Link not found")
    if "label" in data and (data.get("label") or "").strip():
        l.label = data["label"].strip()
    if "href" in data and (data.get("href") or "").strip():
        l.href = data["href"].strip()
    if "note" in data:
        l.note = (data.get("note") or "").strip() or None
    db.commit()
    return link_dict(l)


@app.delete("/api/me/links/{link_id}")
async def delete_my_link(link_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    l = db.query(Link).filter(Link.id == link_id, Link.user_id == user.id).first()
    if not l:
        raise HTTPException(404, "Link not found")
    db.delete(l)
    db.commit()
    return {"message": "Link deleted"}


# ---- music: tracks ----
@app.get("/api/me/tracks")
async def list_my_tracks(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.query(Track).filter(Track.user_id == user.id).order_by(Track.sort.asc(), Track.id.asc()).all()
    return [track_dict(t) for t in rows]


@app.post("/api/me/tracks")
async def create_my_track(data: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    url = (data.get("url") or "").strip()
    if not url:
        raise HTTPException(400, "A streaming URL is required")
    t = Track(url=url, title=(data.get("title") or "").strip() or None, user_id=user.id)
    db.add(t)
    db.commit()
    db.refresh(t)
    return track_dict(t)


@app.delete("/api/me/tracks/{track_id}")
async def delete_my_track(track_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    t = db.query(Track).filter(Track.id == track_id, Track.user_id == user.id).first()
    if not t:
        raise HTTPException(404, "Track not found")
    db.delete(t)
    db.commit()
    return {"message": "Track deleted"}


# ---- music: releases ----
@app.get("/api/me/releases")
async def list_my_releases(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.query(Release).filter(Release.user_id == user.id).order_by(Release.id.desc()).all()
    return [release_dict(r) for r in rows]


@app.post("/api/me/releases")
async def create_my_release(data: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    title = (data.get("title") or "").strip()
    if not title:
        raise HTTPException(400, "Release title is required")
    r = Release(
        title=title,
        year=(data.get("year") or "").strip() or None,
        cover_url=(data.get("cover_url") or "").strip() or None,
        link=(data.get("link") or "").strip() or None,
        user_id=user.id,
    )
    db.add(r)
    db.commit()
    db.refresh(r)
    return release_dict(r)


@app.delete("/api/me/releases/{release_id}")
async def delete_my_release(release_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    r = db.query(Release).filter(Release.id == release_id, Release.user_id == user.id).first()
    if not r:
        raise HTTPException(404, "Release not found")
    db.delete(r)
    db.commit()
    return {"message": "Release deleted"}


# ---- music: shows ----
@app.get("/api/me/shows")
async def list_my_shows(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.query(Show).filter(Show.user_id == user.id).order_by(Show.id.asc()).all()
    return [show_dict(s) for s in rows]


@app.post("/api/me/shows")
async def create_my_show(data: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    s = Show(
        date=(data.get("date") or "").strip() or None,
        venue=(data.get("venue") or "").strip() or None,
        city=(data.get("city") or "").strip() or None,
        ticket_url=(data.get("ticket_url") or "").strip() or None,
        user_id=user.id,
    )
    if not s.venue and not s.date:
        raise HTTPException(400, "A show needs at least a date or venue")
    db.add(s)
    db.commit()
    db.refresh(s)
    return show_dict(s)


@app.delete("/api/me/shows/{show_id}")
async def delete_my_show(show_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    s = db.query(Show).filter(Show.id == show_id, Show.user_id == user.id).first()
    if not s:
        raise HTTPException(404, "Show not found")
    db.delete(s)
    db.commit()
    return {"message": "Show deleted"}


# ---- photographer: photos (gallery) ----
@app.get("/api/me/photos")
async def list_my_photos(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.query(Photo).filter(Photo.user_id == user.id).order_by(Photo.sort.asc(), Photo.id.asc()).all()
    return [photo_dict(p) for p in rows]


@app.post("/api/me/photos")
async def create_my_photo(data: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    image_url = (data.get("image_url") or "").strip()
    if not image_url:
        raise HTTPException(400, "An image is required")
    p = Photo(image_url=image_url, caption=(data.get("caption") or "").strip() or None, user_id=user.id)
    db.add(p)
    db.commit()
    db.refresh(p)
    return photo_dict(p)


@app.delete("/api/me/photos/{photo_id}")
async def delete_my_photo(photo_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    p = db.query(Photo).filter(Photo.id == photo_id, Photo.user_id == user.id).first()
    if not p:
        raise HTTPException(404, "Photo not found")
    db.delete(p)
    db.commit()
    return {"message": "Photo deleted"}


# ---- content creator: clips (featured videos) ----
@app.get("/api/me/clips")
async def list_my_clips(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.query(Clip).filter(Clip.user_id == user.id).order_by(Clip.sort.asc(), Clip.id.asc()).all()
    return [clip_dict(c) for c in rows]


@app.post("/api/me/clips")
async def create_my_clip(data: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    url = (data.get("url") or "").strip()
    if not url:
        raise HTTPException(400, "A video URL is required")
    c = Clip(url=url, title=(data.get("title") or "").strip() or None, user_id=user.id)
    db.add(c)
    db.commit()
    db.refresh(c)
    return clip_dict(c)


@app.delete("/api/me/clips/{clip_id}")
async def delete_my_clip(clip_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    c = db.query(Clip).filter(Clip.id == clip_id, Clip.user_id == user.id).first()
    if not c:
        raise HTTPException(404, "Clip not found")
    db.delete(c)
    db.commit()
    return {"message": "Clip deleted"}


# ---- writer: posts ----
@app.get("/api/me/posts")
async def list_my_posts(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.query(Post).filter(Post.user_id == user.id).order_by(Post.sort.asc(), Post.id.desc()).all()
    return [post_dict(p) for p in rows]


@app.post("/api/me/posts")
async def create_my_post(data: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    title = (data.get("title") or "").strip()
    if not title:
        raise HTTPException(400, "A post title is required")
    p = Post(title=title, body=(data.get("body") or "").strip() or None, user_id=user.id)
    db.add(p)
    db.commit()
    db.refresh(p)
    return post_dict(p)


@app.delete("/api/me/posts/{post_id}")
async def delete_my_post(post_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    p = db.query(Post).filter(Post.id == post_id, Post.user_id == user.id).first()
    if not p:
        raise HTTPException(404, "Post not found")
    db.delete(p)
    db.commit()
    return {"message": "Post deleted"}


# ---- profiles ----
@app.get("/api/me/profile")
async def get_my_profile(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return profile_payload(user, db)


@app.put("/api/me/profile")
async def update_my_profile(data: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if "headline" in data:
        user.headline = (data.get("headline") or "").strip() or None
    if "bio" in data:
        user.bio = (data.get("bio") or "").strip() or None
    if "avatar_url" in data:
        user.avatar_url = (data.get("avatar_url") or "").strip() or None
    if "is_public" in data:
        user.profile_public = bool(data.get("is_public"))
    if "theme" in data:
        theme = data.get("theme")
        user.profile_theme = theme if theme in VALID_THEMES else None
    if "layout" in data and isinstance(data.get("layout"), list):
        user.profile_layout = json.dumps(data["layout"])
    if "genres" in data:
        g = data.get("genres")
        if isinstance(g, list):
            user.genres = ", ".join([str(x).strip() for x in g if str(x).strip()]) or None
        else:
            user.genres = (g or "").strip() or None
    db.commit()
    return profile_payload(user, db)


@app.get("/api/profiles/{username}")
async def get_public_profile(username: str, viewer: User = Depends(get_optional_user), db: Session = Depends(get_db)):
    """Public profile page data. Private profiles are visible only to their owner."""
    user = db.query(User).filter(func.lower(User.username) == username.lower()).first()
    if not user:
        raise HTTPException(404, "Profile not found")
    is_owner = viewer is not None and viewer.id == user.id
    if not user.profile_public and not is_owner:
        raise HTTPException(403, "This profile is private")
    return profile_payload(user, db)

# ===================== COMMENTS =====================
@app.get("/api/writing/{slug}/comments")
async def list_comments(slug: str, db: Session = Depends(get_db)):
    """Public: approved comments for a post."""
    rows = (
        db.query(Comment, User)
        .join(User, Comment.user_id == User.id)
        .filter(Comment.writing_slug == slug, Comment.status == "approved")
        .order_by(Comment.created_at.asc())
        .all()
    )
    return [{
        "id": c.id,
        "body": c.body,
        "author": u.username,
        "created_at": c.created_at.isoformat() if c.created_at else None,
    } for c, u in rows]


@app.post("/api/writing/{slug}/comments")
async def create_comment(slug: str, data: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Members only. Created as 'pending' until an admin approves it."""
    body = (data.get("body") or "").strip()
    if not body:
        raise HTTPException(400, "Comment body is required")
    if len(body) > 5000:
        raise HTTPException(400, "Comment is too long (5000 char max)")
    if not db.query(Writing).filter(Writing.slug == slug).first():
        raise HTTPException(404, "Post not found")

    comment = Comment(writing_slug=slug, user_id=user.id, body=body, status="pending")
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return {"message": "Comment submitted and awaiting approval.", "id": comment.id, "status": comment.status}

# ===================== ADMIN: COMMENT MODERATION =====================
@app.get("/api/admin/comments")
async def admin_list_comments(status: str = "pending", admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    q = db.query(Comment, User).join(User, Comment.user_id == User.id)
    if status in ("pending", "approved"):
        q = q.filter(Comment.status == status)
    rows = q.order_by(Comment.created_at.desc()).all()
    return [{
        "id": c.id,
        "body": c.body,
        "author": u.username,
        "writing_slug": c.writing_slug,
        "status": c.status,
        "created_at": c.created_at.isoformat() if c.created_at else None,
    } for c, u in rows]


@app.put("/api/admin/comments/{comment_id}/approve")
async def admin_approve_comment(comment_id: int, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    c = db.query(Comment).filter(Comment.id == comment_id).first()
    if not c:
        raise HTTPException(404, "Comment not found")
    c.status = "approved"
    db.commit()
    return {"id": c.id, "status": c.status}


@app.delete("/api/admin/comments/{comment_id}")
async def admin_delete_comment(comment_id: int, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    c = db.query(Comment).filter(Comment.id == comment_id).first()
    if not c:
        raise HTTPException(404, "Comment not found")
    db.delete(c)
    db.commit()
    return {"message": "Comment deleted"}

# ===================== ADMIN: USERS =====================
@app.get("/api/admin/users")
async def admin_list_users(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    users = db.query(User).order_by(User.username).all()
    return [public_user(u) for u in users]


@app.put("/api/admin/users/{user_id}/role")
async def admin_set_role(user_id: int, data: dict, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    role = data.get("role")
    if role not in ("member", "admin"):
        raise HTTPException(400, "Role must be 'member' or 'admin'")
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(404, "User not found")
    target.role = role
    db.commit()
    return public_user(target)


@app.post("/api/admin/users/{user_id}/reset-password")
async def admin_reset_password(user_id: int, data: dict, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    new_password = data.get("new_password", "")
    if len(new_password) < 6:
        raise HTTPException(400, "Password must be at least 6 characters")
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(404, "User not found")
    target.hashed_password = hash_password(new_password)
    db.commit()
    return {"message": "Password reset"}

# ===================== ADMIN: SETTINGS =====================
@app.put("/api/admin/settings/layout")
async def set_layout(data: dict, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    """Admin-only: set the global homepage layout for the whole site."""
    layout = data.get("layout")
    if layout not in VALID_LAYOUTS:
        raise HTTPException(400, f"Invalid layout. Must be one of: {', '.join(sorted(VALID_LAYOUTS))}")
    set_setting(db, "active_layout", layout)
    return {"layout": layout}

# ===================== ADMIN: WRITING =====================
def post_to_x(post: Writing) -> dict:
    """Post a Writing entry to X. Returns tweet data on success, raises on failure."""
    client = tweepy.Client(
        consumer_key=os.getenv("X_CONSUMER_KEY"),
        consumer_secret=os.getenv("X_CONSUMER_SECRET"),
        access_token=os.getenv("X_ACCESS_TOKEN"),
        access_token_secret=os.getenv("X_ACCESS_TOKEN_SECRET"),
    )

    tweet_text = f"{post.title}\n\n{post.summary or ''}\n\n🔗 Read full post: https://www.timezoftoday.com/writing/{post.slug}"

    media_ids: list = []
    if post.sponsor_logo:
        tweet_text += "\n\n💼 Sponsored by:"
        try:
            with urllib.request.urlopen(post.sponsor_logo, timeout=10) as resp:
                image_data = resp.read()

            auth = tweepy.OAuth1UserHandler(
                consumer_key=os.getenv("X_CONSUMER_KEY"),
                consumer_secret=os.getenv("X_CONSUMER_SECRET"),
                access_token=os.getenv("X_ACCESS_TOKEN"),
                access_token_secret=os.getenv("X_ACCESS_TOKEN_SECRET")
            )
            api = tweepy.API(auth)
            media = api.media_upload(filename="sponsor.jpg", file=BytesIO(image_data))
            media_ids = [media.media_id]
            tweet_text += " [image attached]"
        except Exception:
            tweet_text += f" {post.sponsor_logo}"

    tweet_text += "\n\n#Writing #TimeZofToday"

    response = client.create_tweet(
        text=tweet_text.strip(),
        media_ids=media_ids if media_ids else None
    )
    return response.data


@app.post("/api/admin/writing")
async def admin_create_writing(data: dict, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    post = Writing(
        slug=data["title"].lower().replace(" ", "-").replace("?", "").replace("!", ""),
        title=data["title"],
        summary=data.get("summary"),
        content=data["content"],
        sponsor_logo=data.get("sponsorLogo"),
    )
    db.add(post)
    db.commit()
    db.refresh(post)

    x_result = None
    if data.get("postToX"):
        try:
            tweet_data = post_to_x(post)
            post.x_posted = True
            post.x_tweet_id = str(tweet_data["id"])
            post.x_posted_at = datetime.utcnow()
            db.commit()
            x_result = {"tweet_id": tweet_data["id"], "tweet_url": f"https://x.com/i/web/status/{tweet_data['id']}"}
        except Exception as e:
            return {
                "message": "Post created, but failed to post to X.",
                "slug": post.slug,
                "x_error": str(e)
            }

    return {
        "message": "Post created successfully" + (" and posted to X!" if x_result else ""),
        "slug": post.slug,
        **({"x": x_result} if x_result else {})
    }

@app.get("/api/admin/writing")
async def admin_get_writing(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    posts = db.query(Writing).order_by(Writing.date.desc()).all()
    return [{
        "slug": p.slug,
        "title": p.title,
        "date": p.date.isoformat() if p.date else None,
        "summary": p.summary or "",
        "content": p.content,
        "sponsor_logo": p.sponsor_logo,
        "x_posted": p.x_posted
    } for p in posts]

@app.post("/api/admin/publish-to-x/{slug}")
async def admin_publish_to_x(slug: str, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    post = db.query(Writing).filter(Writing.slug == slug).first()
    if not post:
        raise HTTPException(404, "Post not found")

    try:
        tweet_data = post_to_x(post)
        tweet_id = tweet_data["id"]

        post.x_posted = True
        post.x_tweet_id = str(tweet_id)
        post.x_posted_at = datetime.utcnow()
        db.commit()

        return {
            "success": True,
            "message": "✅ Successfully posted to X!",
            "tweet_id": tweet_id,
            "tweet_url": f"https://x.com/i/web/status/{tweet_id}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to post to X: {str(e)}")

@app.delete("/api/admin/writing/{slug}")
async def admin_delete_writing(slug: str, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    post = db.query(Writing).filter(Writing.slug == slug).first()
    if not post:
        raise HTTPException(404, "Post not found")
    db.delete(post)
    db.commit()
    return {"message": "Post deleted successfully"}
