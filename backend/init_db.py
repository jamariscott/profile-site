from database import engine, Base
from models import Profile, Project, Link, Video, Writing, Admin, Setting

print("🛠 Creating all database tables...")

Base.metadata.create_all(bind=engine)

print("✅ All tables created successfully!")
print("Tables created: profiles, projects, links, videos, writing, admin, settings")