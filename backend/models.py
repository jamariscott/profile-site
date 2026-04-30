from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean
from sqlalchemy.sql import func
from database import Base

class Profile(Base):
    __tablename__ = "profiles"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    tagline = Column(String, nullable=False)
    bio = Column(Text, nullable=False)
    skills = Column(Text)  # stored as JSON string

class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    status = Column(String, nullable=True)

class Link(Base):
    __tablename__ = "links"
    id = Column(Integer, primary_key=True, index=True)
    label = Column(String, nullable=False)
    href = Column(String, nullable=False)
    note = Column(String, nullable=True)

class Video(Base):
    __tablename__ = "videos"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    youtube_id = Column(String, nullable=False)
    date = Column(DateTime, default=func.now())
    duration = Column(String, nullable=True)

class Writing(Base):
    __tablename__ = "writing"
    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String, unique=True, index=True, nullable=False)
    title = Column(String, nullable=False)
    date = Column(DateTime, default=func.now())
    summary = Column(Text)
    content = Column(Text, nullable=False)
    sponsor_logo = Column(String, nullable=True)   # ← new field for monetization
    x_posted = Column(Boolean, default=False)
    x_tweet_id = Column(String, nullable=True)
    x_posted_at = Column(DateTime, nullable=True)