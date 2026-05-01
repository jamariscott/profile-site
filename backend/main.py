from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import json, os
from datetime import datetime
from database import SessionLocal
from models import Profile, Project, Link, Video, Writing

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://www.timezoftoday.com", "https://timezoftoday.com", "http://localhost:5173", "http://localhost:5174"],
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

# ===================== ADMIN ENDPOINTS =====================
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")

@app.post("/api/admin/writing")
async def admin_create_writing(data: dict, db: Session = Depends(get_db)):
    if data.get("password") != ADMIN_PASSWORD:
        raise HTTPException(401, "Unauthorized")
    
    post = Writing(
        slug=data["title"].lower().replace(" ", "-"),
        title=data["title"],
        summary=data.get("summary"),
        content=data["content"],
        sponsor_logo=data.get("sponsorLogo"),
        x_posted=data.get("postToX", False)
    )
    db.add(post)
    db.commit()
    return {"message": "Post created", "slug": post.slug}

@app.get("/api/admin/writing")
async def admin_get_writing(password: str, db: Session = Depends(get_db)):
    if password != ADMIN_PASSWORD:
        raise HTTPException(401, "Unauthorized")
    posts = db.query(Writing).order_by(Writing.date.desc()).all()
    return [{
        "slug": p.slug,
        "title": p.title,
        "date": p.date.isoformat() if p.date else None,
        "summary": p.summary or "",
        "content": p.content,
        "x_posted": p.x_posted
    } for p in posts]

@app.post("/api/admin/publish-to-x/{slug}")
async def admin_publish_to_x(slug: str, data: dict, db: Session = Depends(get_db)):
    if data.get("password") != ADMIN_PASSWORD:
        raise HTTPException(401, "Unauthorized")
    
    post = db.query(Writing).filter(Writing.slug == slug).first()
    if not post:
        raise HTTPException(404, "Post not found")
    
    post.x_posted = True
    post.x_posted_at = datetime.utcnow()
    db.commit()
    return {"message": "Marked as posted to X"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)