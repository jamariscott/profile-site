import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import SiteNav from "../components/SiteNav";
import SiteFooter from "../components/SiteFooter";
import Reveal from "../components/Reveal";
import { apiJson } from "../lib/api";
import { THEMES } from "../lib/themes";

interface DiscoverProfile {
  username: string;
  display_name: string;
  headline: string | null;
  avatar_url: string | null;
  theme: string | null;
  genres: string[];
}

// Profession filters — the profession-kind themes, plus an "All" option.
const PROFESSIONS = THEMES.filter((t) => t.kind === "profession");
const THEME_LABEL: Record<string, string> = Object.fromEntries(THEMES.map((t) => [t.id, t.label]));

/** Avatar image that falls back to the initial if the URL is missing or broken. */
function Avatar({ url, name }: { url: string | null; name: string }) {
  const [broken, setBroken] = useState(false);
  if (url && !broken) {
    return (
      <img
        src={url}
        alt=""
        loading="lazy"
        decoding="async"
        className="w-14 h-14 rounded-full object-cover border border-line shrink-0"
        onError={() => setBroken(true)}
      />
    );
  }
  return (
    <div className="w-14 h-14 rounded-full bg-surface-2 border border-line flex items-center justify-center text-muted font-semibold shrink-0" aria-hidden>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="h-full bg-surface border border-line rounded-card p-6 shadow-card animate-pulse" aria-hidden>
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-surface-2 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/3 rounded bg-surface-2" />
          <div className="h-3 w-1/3 rounded bg-surface-2" />
        </div>
      </div>
      <div className="h-3 w-full rounded bg-surface-2 mt-5" />
      <div className="h-5 w-20 rounded-full bg-surface-2 mt-4" />
    </div>
  );
}

export default function Discover() {
  const [filter, setFilter] = useState<string>("");
  const [profiles, setProfiles] = useState<DiscoverProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const qs = filter ? `?profession=${encodeURIComponent(filter)}` : "";
    apiJson<DiscoverProfile[]>(`/api/discover${qs}`)
      .then(setProfiles)
      .catch(() => setProfiles([]))
      .finally(() => setLoading(false));
  }, [filter]);

  const chip = (active: boolean) =>
    `px-4 py-1.5 rounded-full border text-sm transition-colors ${
      active ? "border-accent bg-surface-2 text-text" : "border-line text-muted hover:text-text hover:bg-surface-2"
    }`;

  return (
    <div className="bg-bg min-h-screen flex flex-col">
      <SiteNav />

      <section className="border-b border-line">
        <div className="max-w-5xl mx-auto px-6 py-16 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-text tracking-tight">Discover</h1>
          <p className="text-lg text-muted mt-4 max-w-xl mx-auto leading-relaxed">
            Browse people on Timez of Today — filter by what they do.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 py-10 flex-1 w-full">
        <div className="flex flex-wrap justify-center gap-2 mb-10" role="group" aria-label="Filter by profession">
          <button onClick={() => setFilter("")} aria-pressed={filter === ""} className={chip(filter === "")}>All</button>
          {PROFESSIONS.map((p) => (
            <button key={p.id} onClick={() => setFilter(p.id)} aria-pressed={filter === p.id} className={chip(filter === p.id)}>
              {p.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" aria-busy="true">
            {[0, 1, 2, 3, 4, 5].map((i) => <CardSkeleton key={i} />)}
            <span className="sr-only">Loading profiles…</span>
          </div>
        ) : profiles.length === 0 ? (
          <p className="text-muted text-center">
            {filter ? "No profiles here yet — be the first." : "No public profiles yet."}
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {profiles.map((p, i) => (
              <Reveal key={p.username} delay={(i % 3) * 0.05}>
                <Link
                  to={`/u/${p.username}`}
                  className="block h-full bg-surface border border-line rounded-card p-6 shadow-card hover:border-line-strong hover:shadow-md transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <Avatar url={p.avatar_url} name={p.display_name} />
                    <div className="min-w-0">
                      <h3 className="text-text font-semibold leading-tight truncate group-hover:text-accent transition-colors">
                        {p.display_name}
                      </h3>
                      <span className="text-subtle text-sm block truncate">@{p.username}</span>
                    </div>
                  </div>

                  {p.headline && <p className="text-muted text-sm mt-4 line-clamp-2">{p.headline}</p>}

                  <div className="flex flex-wrap items-center gap-2 mt-4">
                    {p.theme && THEME_LABEL[p.theme] && (
                      <span className="text-xs px-2.5 py-1 rounded-full bg-accent/10 text-accent font-medium">
                        {THEME_LABEL[p.theme]}
                      </span>
                    )}
                    {p.genres.slice(0, 2).map((g) => (
                      <span key={g} className="text-xs px-2.5 py-1 rounded-full bg-surface-2 text-muted">{g}</span>
                    ))}
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        )}
      </div>

      <SiteFooter />
    </div>
  );
}
