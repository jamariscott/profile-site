# TimezofToday — Profile Platform: Vision & Roadmap

*Working brief — shared between Jamari (owner) and King (developer). Last updated June 2026.*

---

## The big idea

We're not building a website. We're building a **profile-platform engine** — one system that powers many kinds of profiles — and dressing it in different "skins" depending on who's using it.

The key insight: **a skin is a profession.** A musician's profile needs tracks and audio. An engineer's needs projects and skills. A photographer's needs a gallery. Underneath, they're all the same machine — same accounts, same login, same database, same profile pages. The profession just decides *what shows up* on a profile and *how it looks*.

So the "music site" Jamari described isn't a separate website to build from scratch. It's the **first specialized profession** on the platform. Once the engine exists, adding a new profession is mostly configuration, not a rebuild.

---

## How people experience it

Everything lives under the one domain you already own — **timezoftoday.com** — using simple paths, so there are **no extra domains or subdomains to buy** (subdomains would be free too, but paths are simpler and keep one seamless login):

- **timezoftoday.com** — the front door. Browse professions, discover profiles, sign up.
- **timezoftoday.com/music** — the music-skinned experience (music theme + music modules).
- **timezoftoday.com/u/king** — a person's public profile page, shareable with anyone.

A person signs up **once**. With one account they can create a profile under whichever profession fits — and, if they wear multiple hats, more than one (a music profile *and* an engineer profile). Profiles are **public by default** — the whole point is that someone can share their link and the world can see it.

---

## The profile model (the heart of it)

Every profile is built from two layers:

1. **A shared base** every profile has — name, photo, short bio, links.
2. **Modules** stacked on top — the profession-specific pieces. Projects, tracks, galleries, articles, menus, and so on.

A **profession** is simply a *preset bundle of modules plus a theme*. "Music" = the tracks module + genres + a music theme. "General" = projects + writing + a clean theme. Because profiles are assembled from modules, a person can even mix them, and new professions become "pick these modules, pick a theme" — no re-engineering.

---

## What's already built (the foundation)

A surprising amount of the engine already exists from the work done so far:

- **Accounts & login** with secure tokens, plus admin/member roles.
- **Theming system** — three switchable themes driven by design tokens. *This is literally the first half of "skins."*
- **Per-user content** — each user already owns their own projects (the first "module").
- **Account dashboard** — where users manage their own content and password.
- **Member registration** now collects name and phone, and **comments** with admin moderation are live.

In other words, the jump from "Jamari's personal site" to "the platform" is well underway — the last few features quietly built the spine.

---

## Roadmap

**Phase 0 — Foundation (done).**
Accounts, roles, theming, per-user projects, comments. ✅

**Phase 1 — Public profiles.**
Turn per-user content public-by-default and build the shareable public profile page at `timezoftoday.com/u/username` (name, photo, bio, links, projects). Add the missing base profile fields (bio, avatar, headline).

**Phase 2 — Modules framework.**
Generalize "projects" into a reusable *module* concept so new content types (tracks, galleries, etc.) plug in cleanly. Profile editing lives on the account dashboard.

**Phase 3 — Professions & path routing.**
Introduce professions as preset module-bundles + themes, and route by path (`/music`, `/engineer`). Users pick a profession when creating a profile.

**Phase 4 — Music skin (first profession).**
Build the music modules — tracks with audio embeds (Spotify / SoundCloud / Apple Music links), genres, discography — and a music theme. This is "the music site," delivered as a skin.

**Phase 5 — Front door & discovery.**
The `timezoftoday.com` landing page: browse and search profiles by profession.

**Phase 6 — Messaging (parked, needs email provider).**
Email + in-app messaging, email verification, and password reset. Requires the client to set up an email provider (Resend or SendGrid). Deferred until then.

---

## Decisions to confirm with Jamari

- **Multiple profiles per person?** We're assuming one account can hold several profession-profiles (music *and* engineer). Confirm that's the intent vs. one profile per person.
- **Public by default** — confirm profiles should be publicly viewable (with a private toggle as a possible later option).
- **Profile URL scheme** — `/u/username` as one global handle, vs. a profile per profession. (Leaning: one shared username, profession chosen per profile.)
- **Which professions launch first** beyond music?

---

## Housekeeping carried over (not blocking)

- Set `JWT_SECRET` in Render and change the default admin password.
- Retire the duplicate `profile-site` Render service (the client can do this).
- **Move the database off Render's free Postgres** before real traffic — the free tier is temporary and risks data loss. A durable host (paid Render, Neon, or Supabase) is important for a real platform.

---

*Bottom line: build the engine once, add professions as skins. The music site is profession #1, not a second project.*
