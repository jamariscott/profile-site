from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean
from sqlalchemy.sql import func
from database import Base

class Profile(Base):
    __tablename__ = "profiles"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    tagline = Column(String)
    bio = Column(Text)
    skills = Column(Text)   # JSON string

class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    status = Column(String)

class Link(Base):
    __tablename__ = "links"
    id = Column(Integer, primary_key=True, index=True)
    label = Column(String, nullable=False)
    href = Column(String, nullable=False)
    note = Column(String)

class Video(Base):
    __tablename__ = "videos"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    youtube_id = Column(String, nullable=False)
    date = Column(DateTime)
    duration = Column(String)

class Writing(Base):
    __tablename__ = "writing"
    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String, unique=True, index=True, nullable=False)
    title = Column(String, nullable=False)
    date = Column(DateTime, default=func.now())
    summary = Column(Text)
    content = Column(Text, nullable=False)
    sponsor_logo = Column(String, nullable=True)
    x_posted = Column(Boolean, default=False)
    x_tweet_id = Column(String, nullable=True)
    x_posted_at = Column(DateTime, nullable=True)

# NEW: Admin table for database-based passwords
class Admin(Base):
    __tablename__ = "admin"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)