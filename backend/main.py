import os
from dotenv import load_dotenv

load_dotenv()   # ← This loads your .env file
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from writing_loader import load_posts   # ← new import
from sqlalchemy.orm import Session
import json

from database import SessionLocal
from models import Profile, Project, Link, Video, Writing

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://timezoftoday.com",
        "https://www.timezoftoday.com",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database dependency
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

# === WRITING FROM DATABASE ===
@app.get("/api/writing")
async def get_writing(db: Session = Depends(get_db)):
    writings = db.query(Writing).order_by(Writing.date.desc()).all()
    return [
        {
            "slug": w.slug,
            "title": w.title,
            "date": w.date,
            "summary": w.excerpt,
            "content": w.content
        }
        for w in writings
    ]

@app.get("/api/writing/{slug}")
async def get_writing_post(slug: str, db: Session = Depends(get_db)):
    post = db.query(Writing).filter(Writing.slug == slug).first()
    if post:
        return {
            "slug": post.slug,
            "title": post.title,
            "date": post.date,
            "summary": post.excerpt,
            "content": post.content
        }
    # Helpful debug message if post is not found
    return {"error": f"Post with slug '{slug}' not found"}
from fastapi import HTTPException, Depends
from pydantic import BaseModel
import os

# ====================== ADMIN PANEL ======================
from pydantic import BaseModel

class WritingCreate(BaseModel):
    title: str
    date: str
    content: str
    password: str

@app.post("/api/admin/writing")
async def admin_create_writing(post: WritingCreate):
    # Check password
    if post.password != os.getenv("ADMIN_PASSWORD"):
        raise HTTPException(status_code=401, detail="Incorrect admin password")

    # Save to database
    db = SessionLocal()
    try:
        new_post = Writing(
            slug=post.title.lower().replace(" ", "-").replace("'", ""),
            title=post.title,
            date=post.date,
            content=post.content,           # you can convert markdown to html here later
            excerpt=post.content[:200] + "..." if len(post.content) > 200 else post.content
        )
        db.add(new_post)
        db.commit()
        db.refresh(new_post)
        
        return {"message": "Article published successfully!", "slug": new_post.slug}
    finally:
        db.close()

# Optional: List all posts for admin
@app.get("/api/admin/writing")
async def admin_list_writing(password: str):
    if password != os.getenv("ADMIN_PASSWORD"):
        raise HTTPException(status_code=401, detail="Incorrect admin password")
    db = SessionLocal()
    posts = db.query(Writing).all()
    db.close()
    return posts
@app.get("/api/admin/debug")
async def debug_password():
    loaded_password = os.getenv("ADMIN_PASSWORD")
    return {
        "message": "Debug info",
        "password_is_set": loaded_password is not None,
        "password_length": len(loaded_password) if loaded_password else 0,
        "hint": loaded_password[:3] + "..." if loaded_password else None
    }
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)