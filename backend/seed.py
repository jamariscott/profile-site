from sqlalchemy.orm import Session
from database import SessionLocal
from models import Profile, Project, Link, Video, Writing
from writing_loader import load_posts
import json
from datetime import datetime

def safe_parse_date(date_value):
    """Safely convert date from frontmatter (can be str or datetime)"""
    if isinstance(date_value, datetime):
        return date_value
    if isinstance(date_value, str):
        # Handle ISO format with possible 'Z'
        date_str = date_value.replace("Z", "+00:00")
        return datetime.fromisoformat(date_str)
    return datetime.now()  # fallback

def seed_database():
    db: Session = SessionLocal()

    try:
        # Clear existing data
        db.query(Writing).delete()
        db.query(Video).delete()
        db.query(Link).delete()
        db.query(Project).delete()
        db.query(Profile).delete()

        # Profile
        profile = Profile(
            name="Jamari Robinson",
            tagline="Building software, systems, and independent tools",
            bio="I work on software projects spanning web applications, games, and experimental systems. My focus is on clarity, autonomy, and building things that stand on their own rather than chasing trends.",
            skills=json.dumps(["React + TypeScript", "Python / FastAPI", "Game Development", "Systems Thinking", "Product Design"])
        )
        db.add(profile)

        # Projects
        db.add(Project(title="Profile Site", description="A minimal React + FastAPI site designed as a reusable springboard for future projects.", status="In progress"))

        # Links
        db.add(Link(label="GitHub", href="https://github.com/your-username", note="Code and experiments"))
        db.add(Link(label="Writing", href="#", note="Essays and notes"))
        db.add(Link(label="Experiments", href="#", note="Prototypes and systems"))

        # Videos
        db.add(Video(
            title="Never Gonna Give You Up",
            description="A classic example video for testing embeds.",
            youtube_id="dQw4w9WgXcQ",
            date=datetime(2026, 4, 1),
            duration="3:33"
        ))
        db.add(Video(
            title="How Great Leaders Inspire Action",
            description="Simon Sinek's famous TED Talk on leadership and the Golden Circle.",
            youtube_id="qp0HIF3SfI4",
            date=datetime(2026, 4, 10),
            duration="18:04"
        ))

        # Writing posts (with new X tracking)
        posts = load_posts()
        for post in posts:
            db.add(Writing(
                slug=post["slug"],
                title=post["title"],
                date=safe_parse_date(post["date"]),
                summary=post.get("summary", ""),
                content=post["content"],
                x_posted=False,
                x_tweet_id=None,
                x_posted_at=None
            ))

        db.commit()
        print("✅ Database seeded successfully with Writing!")
        print(f"   • Profile")
        print(f"   • {db.query(Project).count()} projects")
        print(f"   • {db.query(Link).count()} links")
        print(f"   • {db.query(Video).count()} videos")
        print(f"   • {db.query(Writing).count()} writing posts")

    except Exception as e:
        db.rollback()
        print(f"❌ Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()