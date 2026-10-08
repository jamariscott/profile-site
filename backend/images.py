"""Uploaded images are stored in the database as base64 data URIs. Instead of
shipping those strings inline in every API response, public payloads swap them
for a short URL to GET /api/img/..., which decodes the stored value and serves
it as a normal, long-cached image file.

The URL carries a hash of the stored value. That busts browser caches when an
image is replaced, and makes the URL unguessable, so an image is only reachable
by someone who received it in a payload (private profiles stay private)."""
import base64
import binascii
import hashlib
import os
import re

from fastapi import HTTPException, Request

# Raster types only: an SVG served from the API origin could carry script.
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
DATA_URI = re.compile(r"^data:(image/[a-z+.-]+);base64,(.*)$", re.IGNORECASE | re.DOTALL)
# ~2.2 MB decoded. The frontend compresses avatars/covers/photos far below this.
MAX_IMAGE_CHARS = 3_000_000


def parse_data_uri(value):
    """Return (mime, base64 payload) for an allowed data-URI image, else None."""
    if not value or not value.startswith("data:"):
        return None
    m = DATA_URI.match(value)
    if not m or m.group(1).lower() not in ALLOWED_TYPES:
        return None
    return m.group(1).lower(), m.group(2)


def image_token(value: str) -> str:
    return hashlib.sha256(value.encode()).hexdigest()[:20]


def clean_image(value, field: str = "Image"):
    """Validate an incoming image value on write: an allowed data-URI image
    within the size cap, or any other string (e.g. a pasted https URL) as before."""
    value = (value or "").strip() or None
    if value is None:
        return None
    if len(value) > MAX_IMAGE_CHARS:
        raise HTTPException(413, f"{field} is too large. Please use a smaller image.")
    if value.startswith("data:") and not parse_data_uri(value):
        raise HTTPException(400, f"{field} must be a JPEG, PNG, WebP or GIF image.")
    return value


def api_base(request: Request) -> str:
    """Public origin of this API. Render terminates TLS at its proxy, so trust
    X-Forwarded-Proto; PUBLIC_API_URL overrides both if set."""
    override = os.getenv("PUBLIC_API_URL")
    if override:
        return override.rstrip("/")
    proto = request.headers.get("x-forwarded-proto", request.url.scheme).split(",")[0].strip()
    host = request.headers.get("host") or request.url.netloc
    return f"{proto}://{host}"


def image_url(request, kind: str, key, value):
    """Public URL for a stored image value. Non-data values (pasted URLs) and
    the raw value when no request is given (owner-facing endpoints) pass through."""
    if request is None or not parse_data_uri(value):
        return value
    return f"{api_base(request)}/api/img/{kind}/{key}/{image_token(value)}"


def is_served_image_url(value) -> bool:
    """True for a URL produced by image_url(). Used so that a client echoing a
    payload back (e.g. saving a profile) doesn't overwrite the stored image."""
    return bool(value) and "/api/img/" in value and value.startswith(("https://", "http://"))


def decode_image(value, token: str):
    """(bytes, mime) for a stored data-URI image whose hash matches token, else 404."""
    parsed = parse_data_uri(value)
    if not parsed or image_token(value) != token:
        raise HTTPException(404, "Image not found")
    mime, payload = parsed
    try:
        return base64.b64decode(payload, validate=False), mime
    except (binascii.Error, ValueError):
        raise HTTPException(404, "Image not found")
