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
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          <button onClick={() => setFilter("")} className={chip(filter === "")}>All</button>
          {PROFESSIONS.map((p) => (
            <button key={p.id} onClick={() => setFilter(p.id)} className={chip(filter === p.id)}>
              {p.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-muted text-center">Loading…</p>
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
                    {p.avatar_url ? (
                      <img
                        src={p.avatar_url}
                        alt={p.display_name}
                        className="w-14 h-14 rounded-full object-cover border border-line shrink-0"
                        onError={(e) => (e.currentTarget.style.display = "none")}
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-surface-2 border border-line flex items-center justify-center text-muted font-semibold shrink-0">
                        {p.display_name.charAt(0).toUpperCase()}
                      </div>
                    )}
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
