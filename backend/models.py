from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from database import Base

class Profile(Base):
    __tablename__ = "profiles"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    tagline = Column(String)
    bio = Column(Text)
    skills = Column(Text)   # we'll store as JSON string for simplicity

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
    date = Column(String)
    duration = Column(String)

class Writing(Base):
    __tablename__ = "writing"
    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String, unique=True, nullable=False)
    title = Column(String, nullable=False)
    date = Column(String)
    content = Column(Text)          # full markdown content
    excerpt = Column(Text)