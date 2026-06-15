from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import json
import os
from datetime import datetime
import tweepy
import urllib.request
from io import BytesIO
import bcrypt

from database import SessionLocal, engine, Base
from models import Profile, Project, Link, Video, Writing, Admin, Setting

# Idempotent: creates any missing tables (e.g. the settings table) on startup.
# Safe to run every boot — it never drops or alters existing tables. This is how
# this project provisions tables, since the Render start command does not run
# Alembic migrations.
Base.metadata.create_all(bind=engine)

# ---- Site settings (theme) ----
DEFAULT_THEME = "classic"
VALID_THEMES = {"classic", "huffpost", "twilight"}


def get_setting(db: "Session", key: str, default=None):
    row = db.query(Setting).filter(Setting.key == key).first()
    return row.value if row else default


def set_setting(db: "Session", key: str, value: str):
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

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

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

# ===================== ADMIN AUTH (Database-based) =====================
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))


def authenticate_admin(username: str, password: str, db: Session) -> Admin:
    """Verify admin credentials or raise 401. Shared by admin-only endpoints."""
    admin = db.query(Admin).filter(Admin.username == username).first()
    if not admin or not verify_password(password, admin.hashed_password):
        raise HTTPException(401, "Unauthorized")
    return admin

@app.post("/api/admin/login")
async def admin_login(data: dict, db: Session = Depends(get_db)):
    username = data.get("username")
    password = data.get("password")
    
    admin = db.query(Admin).filter(Admin.username == username).first()
    if not admin or not verify_password(password, admin.hashed_password):
        raise HTTPException(401, "Invalid username or password")
    
    return {"message": "Login successful", "username": username}

@app.put("/api/admin/settings/theme")
async def set_theme(data: dict, db: Session = Depends(get_db)):
    """Admin-only: set the global active theme for the whole site."""
    authenticate_admin(data.get("username"), data.get("password"), db)

    theme = data.get("theme")
    if theme not in VALID_THEMES:
        raise HTTPException(400, f"Invalid theme. Must be one of: {', '.join(sorted(VALID_THEMES))}")

    set_setting(db, "active_theme", theme)
    return {"theme": theme}

# ===================== ADMIN ENDPOINTS =====================

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
async def admin_create_writing(data: dict, db: Session = Depends(get_db)):
    username = data.get("username")
    password = data.get("password")

    admin = db.query(Admin).filter(Admin.username == username).first()
    if not admin or not verify_password(password, admin.hashed_password):
        raise HTTPException(401, "Unauthorized")

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
            # Post was saved — don't roll back. Just report the X failure.
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
async def admin_get_writing(username: str, password: str, db: Session = Depends(get_db)):
    admin = db.query(Admin).filter(Admin.username == username).first()
    if not admin or not verify_password(password, admin.hashed_password):
        raise HTTPException(401, "Unauthorized")
    
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
async def admin_publish_to_x(slug: str, data: dict, db: Session = Depends(get_db)):
    username = data.get("username")
    password = data.get("password")

    admin = db.query(Admin).filter(Admin.username == username).first()
    if not admin or not verify_password(password, admin.hashed_password):
        raise HTTPException(401, "Unauthorized")

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
async def admin_delete_writing(slug: str, data: dict, db: Session = Depends(get_db)):
    username = data.get("username")
    password = data.get("password")
    
    admin = db.query(Admin).filter(Admin.username == username).first()
    if not admin or not verify_password(password, admin.hashed_password):
        raise HTTPException(401, "Unauthorized")
    
    post = db.query(Writing).filter(Writing.slug == slug).first()
    if not post:
        raise HTTPException(404, "Post not found")
    
    db.delete(post)
    db.commit()
    
    return {"message": "Post deleted successfully"}