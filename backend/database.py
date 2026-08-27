import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

# Load .env file
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# Local-dev convenience: when no DATABASE_URL is set (i.e. running on a laptop,
# not on Render), fall back to a local SQLite file so the backend runs with zero
# database setup. Production ALWAYS sets DATABASE_URL, so this never affects
# Render — it only kicks in for local testing.
if not DATABASE_URL:
    DATABASE_URL = "sqlite:///./local_dev.db"
    print("[database] No DATABASE_URL set — using local SQLite (local_dev.db) for dev.")

# SQLite needs this flag for FastAPI's threaded request handling; Postgres doesn't.
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, echo=False, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """FastAPI dependency: yields a DB session and always closes it."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()