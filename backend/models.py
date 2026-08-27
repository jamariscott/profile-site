from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey
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
    # Owner. NULL/admin-owned projects are the public-facing set shown to
    # logged-out visitors; logged-in users see the projects they own.
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)

class Link(Base):
    __tablename__ = "links"
    id = Column(Integer, primary_key=True, index=True)
    label = Column(String, nullable=False)
    href = Column(String, nullable=False)
    note = Column(String)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)

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

# Generic site settings (key/value). Used for the active site theme today,
# and reusable for other global config later.
class Setting(Base):
    __tablename__ = "settings"
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, index=True, nullable=False)
    value = Column(String, nullable=False)

# Member/admin accounts. Anyone can register (role defaults to "member");
# the existing site admin is migrated in as role="admin".
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    # email is unique when present; nullable so the migrated legacy admin (which
    # had no email) can exist until it sets one.
    email = Column(String, unique=True, index=True, nullable=True)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False, default="member")  # "member" | "admin"
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    # ---- public profile ----
    headline = Column(String, nullable=True)        # short tagline under the name
    bio = Column(Text, nullable=True)
    avatar_url = Column(String, nullable=True)
    profile_public = Column(Boolean, nullable=False, default=True)
    profile_theme = Column(String, nullable=True)   # theme id for this profile's page
    profile_layout = Column(Text, nullable=True)    # JSON: ordered section visibility
    genres = Column(String, nullable=True)          # comma-separated genre tags (music)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, default=func.now())

# ---- Music profession modules (per-user) ----
class Track(Base):
    __tablename__ = "tracks"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    url = Column(String, nullable=False)   # streaming link (Spotify/SoundCloud/YouTube/Apple)
    title = Column(String, nullable=True)
    sort = Column(Integer, nullable=True, default=0)


class Release(Base):
    __tablename__ = "releases"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    year = Column(String, nullable=True)
    cover_url = Column(String, nullable=True)
    link = Column(String, nullable=True)
    sort = Column(Integer, nullable=True, default=0)


class Show(Base):
    __tablename__ = "shows"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    date = Column(String, nullable=True)   # free-form date string for v1
    venue = Column(String, nullable=True)
    city = Column(String, nullable=True)
    ticket_url = Column(String, nullable=True)
    sort = Column(Integer, nullable=True, default=0)


# ---- Photographer profession module (per-user) ----
class Photo(Base):
    __tablename__ = "photos"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    image_url = Column(Text, nullable=False)   # uploaded (base64 data URL) or pasted URL
    caption = Column(String, nullable=True)
    sort = Column(Integer, nullable=True, default=0)


# ---- Content-creator profession module (per-user): featured video clips ----
class Clip(Base):
    __tablename__ = "clips"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    url = Column(String, nullable=False)   # YouTube / TikTok / etc. link
    title = Column(String, nullable=True)
    sort = Column(Integer, nullable=True, default=0)


# ---- Writer profession module (per-user): short posts / essays ----
class Post(Base):
    __tablename__ = "posts"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    body = Column(Text, nullable=True)         # rich-text HTML
    created_at = Column(DateTime, default=func.now())
    sort = Column(Integer, nullable=True, default=0)


# Comments on Writing posts. Admin-moderated: created as "pending", shown
# publicly only once "approved".
class Comment(Base):
    __tablename__ = "comments"
    id = Column(Integer, primary_key=True, index=True)
    writing_slug = Column(String, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    body = Column(Text, nullable=False)
    status = Column(String, nullable=False, default="pending", index=True)  # "pending" | "approved"
    created_at = Column(DateTime, default=func.now())