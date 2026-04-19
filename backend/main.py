from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import json, os
from datetime import datetime
from database import SessionLocal
from models import Profile, Project, Link, Video, Writing

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://timezoftoday.com", "https://www.timezoftoday.com", "http://localhost:5173", "http://127.0.0.1:5173"],
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

# ====================== PUBLIC ENDPOINTS ======================
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
        "summary": getattr(p, 'summary', ""),           # ← safe
        "content": p.content
    } for p in posts]

# ====================== ADMIN ENDPOINTS ======================
def verify_admin(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Unauthorized")
    token = authorization.split("Bearer ")[1]
    if token != os.getenv("ADMIN_PASSWORD"):
        raise HTTPException(401, "Incorrect password")
    return token

@app.get("/api/admin/writing")
async def admin_get_writing(db: Session = Depends(get_db), _: str = Depends(verify_admin)):
    posts = db.query(Writing).order_by(Writing.date.desc()).all()
    return [{
        "id": p.id,
        "slug": p.slug,
        "title": p.title,
        "date": p.date.isoformat() if p.date else None,
        "summary": getattr(p, 'summary', ""),
        "x_posted": getattr(p, 'x_posted', False),
        "x_tweet_id": getattr(p, 'x_tweet_id', None)
    } for p in posts]

@app.post("/api/admin/writing")
async def admin_create_writing(data: dict, db: Session = Depends(get_db), _: str = Depends(verify_admin)):
    post = Writing(
        slug=data["slug"],
        title=data["title"],
        summary=data.get("summary", ""),
        content=data["content"],
        x_posted=data.get("postToX", False),
        x_tweet_id=None,
        x_posted_at=datetime.now() if data.get("postToX") else None
    )
    db.add(post)
    db.commit()
    db.refresh(post)

    # Save .md backup
    os.makedirs("writing", exist_ok=True)
    md_path = f"writing/{post.slug}.md"
    frontmatter = f"""---
title: "{post.title}"
date: {post.date.date().isoformat() if post.date else datetime.now().date().isoformat()}
summary: "{post.summary}"
---

{post.content}
"""
    with open(md_path, "w", encoding="utf-8") as f:
        f.write(frontmatter)

    return {"message": "Post created and saved as .md", "slug": post.slug}