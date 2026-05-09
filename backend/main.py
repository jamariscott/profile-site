import tweepy
import urllib.request
from io import BytesIOfrom fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import json, os
from datetime import datetime
import bcrypt

from database import SessionLocal
from models import Profile, Project, Link, Video, Writing, Admin

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
        "x_posted": p.x_posted
    } for p in posts]

# ===================== ADMIN AUTH (Database-based) =====================
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

@app.post("/api/admin/login")
async def admin_login(data: dict, db: Session = Depends(get_db)):
    username = data.get("username")
    password = data.get("password")
    
    admin = db.query(Admin).filter(Admin.username == username).first()
    if not admin or not verify_password(password, admin.hashed_password):
        raise HTTPException(401, "Invalid username or password")
    
    return {"message": "Login successful", "username": username}

# ===================== ADMIN ENDPOINTS =====================
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
        x_posted=data.get("postToX", False)
    )
    db.add(post)
    db.commit()
    return {"message": "Post created successfully", "slug": post.slug}

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
    
    # Verify admin credentials
    admin = db.query(Admin).filter(Admin.username == username).first()
    if not admin or not verify_password(password, admin.hashed_password):
        raise HTTPException(401, "Unauthorized")
    
    post = db.query(Writing).filter(Writing.slug == slug).first()
    if not post:
        raise HTTPException(404, "Post not found")
    
    # === REAL X.COM POSTING LOGIC ===
    try:
        client = tweepy.Client(
            consumer_key=os.getenv("X_CONSUMER_KEY"),
            consumer_secret=os.getenv("X_CONSUMER_SECRET"),
            access_token=os.getenv("X_ACCESS_TOKEN"),
            access_token_secret=os.getenv("X_ACCESS_TOKEN_SECRET"),
        )
        
        # Build the tweet
        tweet_text = f"{post.title}\n\n{post.summary or ''}\n\n🔗 Read full post: https://www.timezoftoday.com/writing/{post.slug}"
        
        media_ids: list = []
        if post.sponsor_logo:
            tweet_text += "\n\n💼 Sponsored by:"
            try:
                # Download and attach sponsor logo as image
                with urllib.request.urlopen(post.sponsor_logo, timeout=10) as resp:
                    image_data = resp.read()
                
                auth = tweepy.OAuth1UserHandler(
                    consumer_key=os.getenv("X_CONSUMER_KEY"),
                    consumer_secret=os.getenv("X_CONSUMER_SECRET"),
                    access_token=os.getenv("X_ACCESS_TOKEN"),
                    access_token_secret=os.getenv("X_ACCESS_TOKEN_SECRET")
                )
                api = tweepy.API(auth)
                
                media = api.media_upload(
                    filename="sponsor.jpg",
                    file=BytesIO(image_data)
                )
                media_ids = [media.media_id]
                tweet_text += " [image attached]"
            except Exception:
                # Fallback: just add the URL
                tweet_text += f" {post.sponsor_logo}"
        
        tweet_text += "\n\n#Writing #TimeZofToday"
        
        # Send the tweet
        response = client.create_tweet(
            text=tweet_text.strip(),
            media_ids=media_ids if media_ids else None
        )
        
        tweet_id = response.data["id"]
        
        # Update database
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
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to post to X: {str(e)}"
        )