import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Search, Shuffle } from "lucide-react";
import SiteNav from "../components/SiteNav";
import SiteFooter from "../components/SiteFooter";
import { apiJson } from "../lib/api";
import { THEMES } from "../lib/themes";

interface DiscoverProfile {
  username: string;
  display_name: string;
  headline: string | null;
  avatar_url: string | null;
  theme: string | null;
  style?: { accent?: string };
  genres: string[];
}

const PROFESSIONS = THEMES.filter((t) => t.kind === "profession");
const THEME_META = Object.fromEntries(THEMES.map((t) => [t.id, t]));
// Section headings when browsing everyone, in plain plural form.
const SECTION_NAME: Record<string, string> = {
  music: "Musicians",
  developer: "Engineers",
  photographer: "Photographers",
  creator: "Creators",
  writer: "Writers",
};
const PER_SECTION = 4;

/** Some usernames are email addresses; show only the part before the @. */
function handle(p: DiscoverProfile) {
  return p.username.split("@")[0];
}

/** Some display names fall back to an email address; never show one publicly. */
function publicName(p: DiscoverProfile) {
  return p.display_name.includes("@") ? handle(p) : p.display_name;
}

/** Fuller profiles first: profession, headline, photo. */
function completeness(p: DiscoverProfile) {
  return Number(!!p.theme) * 4 + Number(!!p.headline) * 2 + Number(!!p.avatar_url);
}

/** The member's own profile color: their custom accent, else their profession theme's accent. */
function memberColor(p: DiscoverProfile): string | undefined {
  const accent = p.style?.accent;
  if (accent && /^#[0-9a-f]{6}$/i.test(accent)) return accent;
  return p.theme ? THEME_META[p.theme]?.swatch[2] : undefined;
}

function Avatar({ url, name }: { url: string | null; name: string }) {
  const [broken, setBroken] = useState(false);
  if (url && !broken) {
    return (
      <img
        src={url}
        alt=""
        loading="lazy"
        decoding="async"
        className="h-14 w-14 shrink-0 rounded-full border border-line object-cover"
        onError={() => setBroken(true)}
      />
    );
  }
  return (
    <div
      aria-hidden
      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-highlight font-heading text-xl font-black text-on-highlight"
    >
      {name.replace("@", "").charAt(0).toUpperCase()}
    </div>
  );
}

function ProfileCard({ p }: { p: DiscoverProfile }) {
  const color = memberColor(p);
  const label = p.theme ? THEME_META[p.theme]?.label : undefined;
  return (
    <Link
      to={`/u/${p.username}`}
      className="group flex h-full flex-col overflow-hidden rounded-card border border-line bg-surface transition-colors hover:border-line-strong"
    >
      {/* A strip of the member's own profile color: the platform stays quiet, the people don't. */}
      <span aria-hidden className="h-1.5 w-full" style={{ background: color ?? "rgb(var(--c-line))" }} />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-4">
          <Avatar url={p.avatar_url} name={publicName(p)} />
          <div className="min-w-0">
            <h3 className="line-clamp-2 break-words font-heading text-xl font-extrabold leading-tight tracking-tight [font-stretch:85%] group-hover:underline group-hover:decoration-highlight group-hover:decoration-2 group-hover:underline-offset-4">
              {publicName(p)}
            </h3>
            <span className="block truncate text-sm text-subtle">@{handle(p)}</span>
          </div>
        </div>
        {p.headline && <p className="mt-4 line-clamp-2 text-muted">{p.headline}</p>}
        {(label || p.genres.length > 0) && (
          <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
            {label && (
              <span className="rounded-full bg-highlight px-2.5 py-1 text-xs font-semibold text-on-highlight">{label}</span>
            )}
            {p.genres.slice(0, 2).map((g) => (
              <span key={g} className="rounded-full bg-surface-2 px-2.5 py-1 text-xs text-muted">
                {g}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

function CardSkeleton() {
  return (
    <div aria-hidden className="h-44 animate-pulse rounded-card border border-line bg-surface p-5">
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 rounded-full bg-surface-2" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/3 rounded bg-surface-2" />
          <div className="h-3 w-1/3 rounded bg-surface-2" />
        </div>
      </div>
      <div className="mt-5 h-3 w-full rounded bg-surface-2" />
    </div>
  );
}

const grid = "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4";

export default function Discover() {
  const navigate = useNavigate();
  // Filter and search live in the URL (?profession=music&q=...) so views can be linked and survive Back.
  const [params, setParams] = useSearchParams();
  const filter = params.get("profession") || "";
  const query = params.get("q") || "";
  const update = (next: { profession?: string; q?: string }) => {
    const merged = { profession: filter, q: query, ...next };
    const clean: Record<string, string> = {};
    if (merged.profession) clean.profession = merged.profession;
    if (merged.q) clean.q = merged.q;
    setParams(clean, { replace: true });
  };

  const [profiles, setProfiles] = useState<DiscoverProfile[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    apiJson<DiscoverProfile[]>("/api/discover")
      .then((d) => setProfiles(Array.isArray(d) ? [...d].sort((a, b) => completeness(b) - completeness(a)) : []))
      .catch(() => {
        setProfiles([]);
        setFailed(true);
      });
  }, []);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (profiles ?? []).filter((p) => {
      if (filter && p.theme !== filter) return false;
      if (!q) return true;
      return [publicName(p), p.username, p.headline ?? "", ...p.genres].some((s) => s.toLowerCase().includes(q));
    });
  }, [profiles, filter, query]);

  const surprise = () => {
    const pool = shown.length ? shown : profiles ?? [];
    if (pool.length) navigate(`/u/${pool[Math.floor(Math.random() * pool.length)].username}`);
  };

  const chip = (active: boolean) =>
    `rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
      active ? "border-text bg-text text-bg" : "border-line text-muted hover:border-line-strong hover:text-text"
    }`;

  // Per-profession sections only pay off once there are enough people to fill them.
  const browsingEveryone = !filter && !query.trim() && shown.length > 12;

  return (
    <div className="flex min-h-screen flex-col bg-bg text-text">
      <SiteNav />

      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 pb-20 pt-10 sm:px-6 md:pt-14">
        <h1 className="font-heading text-[clamp(2.5rem,6vw,4.25rem)] font-black leading-[0.95] tracking-tight [font-stretch:80%]">
          Discover people
        </h1>
        <p className="mt-3 max-w-xl text-lg text-muted">Musicians, engineers, photographers, creators and writers on Timez of Today.</p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <label className="flex min-w-0 flex-1 items-center gap-2 rounded-btn border-2 border-text bg-surface px-3 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-text">
            <Search size={18} aria-hidden className="shrink-0 text-muted" />
            <span className="sr-only">Search people</span>
            <input
              type="search"
              value={query}
              onChange={(e) => update({ q: e.target.value })}
              placeholder="Search by name, headline or genre"
              className="min-w-0 flex-1 bg-transparent py-3 text-text placeholder:text-subtle focus:outline-none focus-visible:outline-none"
            />
          </label>
          <button
            type="button"
            onClick={surprise}
            disabled={!profiles?.length}
            className="inline-flex items-center justify-center gap-2 rounded-btn border-2 border-text px-5 py-3 font-semibold transition-colors hover:bg-surface-2 disabled:opacity-50"
          >
            <Shuffle size={18} aria-hidden />
            Surprise me
          </button>
        </div>

        <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Filter by profession">
          <button type="button" onClick={() => update({ profession: "" })} aria-pressed={!filter} className={chip(!filter)}>
            Everyone
          </button>
          {PROFESSIONS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => update({ profession: p.id })}
              aria-pressed={filter === p.id}
              className={chip(filter === p.id)}
            >
              {SECTION_NAME[p.id] ?? p.label}
            </button>
          ))}
        </div>

        <div className="mt-10" aria-live="polite">
          {profiles === null ? (
            <div className={grid} aria-busy="true">
              {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                <CardSkeleton key={i} />
              ))}
              <span className="sr-only">Loading people…</span>
            </div>
          ) : failed ? (
            <p className="text-muted">Couldn't load people right now. Refresh the page to try again.</p>
          ) : shown.length === 0 ? (
            <div className="rounded-card border border-dashed border-line-strong p-8">
              <p className="font-heading text-2xl font-extrabold [font-stretch:85%]">
                {query ? `No one matches “${query}” yet.` : "No one here yet."}
              </p>
              <p className="mt-2 text-muted">Your page could be the first one people find here.</p>
              <Link
                to="/register"
                className="mt-5 inline-flex rounded-btn bg-accent px-5 py-3 font-semibold text-accent-contrast hover:bg-accent-hover"
              >
                Claim your page
              </Link>
            </div>
          ) : browsingEveryone ? (
            <div className="space-y-14">
              {[...PROFESSIONS.map((p) => p.id), ""].map((id) => {
                const members = shown.filter((p) => (id ? p.theme === id : !p.theme || !SECTION_NAME[p.theme]));
                if (members.length === 0) return null;
                const heading = id ? SECTION_NAME[id] : "More people";
                return (
                  <section key={id || "other"} aria-labelledby={`sec-${id || "other"}`}>
                    <div className="mb-5 flex items-baseline justify-between gap-4 border-b border-line pb-3">
                      <h2 id={`sec-${id || "other"}`} className="font-heading text-3xl font-extrabold tracking-tight [font-stretch:80%]">
                        {heading} <span className="text-lg font-semibold text-subtle">{members.length}</span>
                      </h2>
                      {id && members.length > PER_SECTION && (
                        <button
                          type="button"
                          onClick={() => update({ profession: id })}
                          className="text-sm font-semibold underline decoration-highlight decoration-2 underline-offset-4"
                        >
                          See all {heading.toLowerCase()}
                        </button>
                      )}
                    </div>
                    <div className={grid}>
                      {(id ? members.slice(0, PER_SECTION) : members).map((p) => (
                        <ProfileCard key={p.username} p={p} />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          ) : (
            <>
              <p className="mb-5 text-sm text-muted">
                {shown.length} {shown.length === 1 ? "person" : "people"}
              </p>
              <div className={grid}>
                {shown.map((p) => (
                  <ProfileCard key={p.username} p={p} />
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
