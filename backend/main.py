 
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from content import PROFILE, PROJECTS, LINKS
from writing_loader import load_posts

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/profile")
def get_profile():
    return PROFILE

@app.get("/api/projects")
def get_projects():
    return PROJECTS

@app.get("/api/links")
def get_links():
    return LINKS

@app.get("/api/writing")
def get_writing():
    return load_posts()
