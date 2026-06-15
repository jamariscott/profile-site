from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
import json
import os
import re
from datetime import datetime
import tweepy
import urllib.request
from io import BytesIO

from database import SessionLocal, engine, Base, get_db
from models import Profile, Project, Link, Video, Writing, Admin, Setting, User, Comment
from auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
    require_admin,
    public_user,
)

# Idempotent: creates any missing tables on startup. Safe to run every boot —
# it never drops or alters existing tables. This is how this project provisions
# tables, since the Render start command does not run Alembic migrations.
Base.metadata.create_all(bind=engine)


def migrate_legacy_admins():
    """Copy any rows from the old `admin` table into `users` as role=admin so the
    existing site admin can log in through the unified accounts system. The bcrypt
    hash is carried over unchanged, so the same password keeps working."""
    db = SessionLocal()
    try:
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
    finally:
        db.close()


migrate_legacy_admins()

# ---- Site settings (theme) ----
DEFAULT_THEME = "classic"
VALID_THEMES = {"classic", "huffpost", "twilight"}


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

@app.get("/api/projects")
async def get_projects(db: Session = Depends(get_db)):
    return [p.__dict__ for p in db.query(Project).all()]

@app.get("/api/links")
async def get_links(db: Session = Depends(get_db)):
    return [l.__dict__ for l in db.query(Link).all()]

@app.get("/api/videos")
async def get_videos(db: Session = Depends(get_db)):
    return [v.__dict__ for v in db.query(Video).all()]

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
    """Public: returns global site settings (the active theme). Read on every page load."""
    theme = get_setting(db, "active_theme", DEFAULT_THEME)
    if theme not in VALID_THEMES:
        theme = DEFAULT_THEME
    return {"theme": theme}

# ===================== AUTH =====================
EMAIL_RE = re.compile(r"[^@\s]+@[^@\s]+\.[^@\s]+")


@app.post("/api/auth/register")
async def register(data: dict, db: Session = Depends(get_db)):
    username = (data.get("username") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not username or not email or not password:
        raise HTTPException(400, "username, email, and password are required")
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

# ===================== ADMIN: SETTINGS =====================
@app.put("/api/admin/settings/theme")
async def set_theme(data: dict, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    """Admin-only: set the global active theme for the whole site."""
    theme = data.get("theme")
    if theme not in VALID_THEMES:
        raise HTTPException(400, f"Invalid theme. Must be one of: {', '.join(sorted(VALID_THEMES))}")
    set_setting(db, "active_theme", theme)
    return {"theme": theme}

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
