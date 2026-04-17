from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Profile, Project, Link, Video, Writing
import content
import json
from writing_loader import load_posts   # ← this loads your markdown files

SQLALCHEMY_DATABASE_URL = "sqlite:///database.db"

engine = create_engine(SQLALCHEMY_DATABASE_URL, echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def seed_database():
    db = SessionLocal()
    try:
        # Clear old data
        db.query(Profile).delete()
        db.query(Project).delete()
        db.query(Link).delete()
        db.query(Video).delete()
        db.query(Writing).delete()

        # Seed Profile, Projects, Links, Videos (unchanged)
        db.add(Profile(
            name=content.PROFILE["name"],
            tagline=content.PROFILE["tagline"],
            bio=content.PROFILE["bio"],
            skills=json.dumps(content.PROFILE["skills"])
        ))

        for p in content.PROJECTS:
            db.add(Project(**p))

        for l in content.LINKS:
            db.add(Link(**l))

        for v in content.videos:
            db.add(Video(**v))

        # === NEW: Seed Writing from your markdown files ===
        posts = load_posts()
        for post in posts:
            db.add(Writing(
                slug=post["slug"],
                title=post["title"],
                date=post["date"],
                content=post["content"],      # full HTML
                excerpt=post.get("summary", "")
            ))

        db.commit()
        print("✅ Database seeded successfully with Writing!")
        print(f"   • Profile")
        print(f"   • {len(content.PROJECTS)} projects")
        print(f"   • {len(content.LINKS)} links")
        print(f"   • {len(content.videos)} videos")
        print(f"   • {len(posts)} writing posts")

    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()