from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import json
from database import SessionLocal
from models import Profile, Project, Link, Video, Writing
from datetime import datetime

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://www.timezoftoday.com", "https://timezoftoday.com", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

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
    projects = db.query(Project).all()
    return [p.__dict__ for p in projects]

@app.get("/api/links")
async def get_links(db: Session = Depends(get_db)):
    links = db.query(Link).all()
    return [l.__dict__ for l in links]

@app.get("/api/videos")
async def get_videos(db: Session = Depends(get_db)):
    videos = db.query(Video).all()
    return [v.__dict__ for v in videos]

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

# === ADMIN ROUTES ===
@app.post("/api/admin/writing")
async def admin_create_writing(data: dict, db: Session = Depends(get_db)):
    if data.get("password") != "YOUR_ADMIN_PASSWORD_HERE":   # ← change this or use env var
        raise HTTPException(401, "Unauthorized")
    
    post = Writing(
        slug=data["title"].lower().replace(" ", "-"),
        title=data["title"],
        summary=data.get("summary"),
        content=data["content"],
        sponsor_logo=data.get("sponsorLogo"),   # ← new
        x_posted=data.get("postToX", False)
    )
    db.add(post)
    db.commit()
    return {"message": "Post created", "slug": post.slug}

@app.post("/api/admin/publish-to-x/{slug}")
async def admin_publish_to_x(slug: str, data: dict, db: Session = Depends(get_db)):
    if data.get("password") != "YOUR_ADMIN_PASSWORD_HERE":
        raise HTTPException(401, "Unauthorized")
    
    post = db.query(Writing).filter(Writing.slug == slug).first()
    if not post:
        raise HTTPException(404, "Post not found")
    
    # TODO: Add your Tweepy code here later
    # For now we just mark it as posted
    post.x_posted = True
    post.x_posted_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Marked as posted to X"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)