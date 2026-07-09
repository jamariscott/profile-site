import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import SiteNav from "../components/SiteNav";
import { apiJson } from "../lib/api";

interface ProfileResult { username: string; display_name: string; headline: string | null; avatar_url: string | null; }
interface ArticleResult { slug: string; title: string; summary: string | null; date: string | null; }
interface VideoResult { id: number; title: string; youtube_id: string; }

interface SearchResults {
  profiles: ProfileResult[];
  articles: ArticleResult[];
  videos: VideoResult[];
}

const EMPTY: SearchResults = { profiles: [], articles: [], videos: [] };

export default function Search() {
  const [params, setParams] = useSearchParams();
  const initialQ = params.get("q") || "";
  const [input, setInput] = useState(initialQ);
  const [results, setResults] = useState<SearchResults>(EMPTY);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setParams(input.trim() ? { q: input.trim() } : {}, { replace: true });
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input]);

  useEffect(() => {
    const q = params.get("q") || "";
    if (q.trim().length < 2) {
      setResults(EMPTY);
      return;
    }
    setLoading(true);
    apiJson<SearchResults>(`/api/search?q=${encodeURIComponent(q.trim())}`)
      .then(setResults)
      .catch(() => setResults(EMPTY))
      .finally(() => setLoading(false));
  }, [params]);

  const q = params.get("q") || "";
  const hasQuery = q.trim().length >= 2;
  const hasResults = results.profiles.length > 0 || results.articles.length > 0 || results.videos.length > 0;

  const card = "border border-line bg-surface rounded-card p-4 shadow-card hover:shadow-md transition-shadow";

  return (
    <div className="bg-bg min-h-screen">
      <SiteNav />
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-text mb-6">Search</h1>
        <input
          type="text"
          autoFocus
          placeholder="Search users, articles, videos…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="border border-line bg-surface text-text p-4 w-full rounded-btn text-lg mb-10"
        />

        {!hasQuery && <p className="text-muted">Start typing to search the site.</p>}

        {hasQuery && loading && <p className="text-muted">Searching…</p>}

        {hasQuery && !loading && !hasResults && (
          <p className="text-muted">No results for "{q}".</p>
        )}

        {hasQuery && !loading && results.profiles.length > 0 && (
          <div className="mb-10">
            <h2 className="text-sm font-semibold tracking-widest uppercase text-muted mb-3">Profiles</h2>
            <div className="space-y-2">
              {results.profiles.map((p) => (
                <Link key={p.username} to={`/u/${p.username}`} className={`${card} flex items-center gap-3`}>
                  {p.avatar_url ? (
                    <img src={p.avatar_url} alt={p.display_name} className="w-10 h-10 rounded-full object-cover shrink-0" onError={(e) => (e.currentTarget.style.display = "none")} />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-surface-2 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <div className="text-text font-medium truncate">{p.display_name}</div>
                    <div className="text-subtle text-sm truncate">@{p.username}{p.headline ? ` · ${p.headline}` : ""}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {hasQuery && !loading && results.articles.length > 0 && (
          <div className="mb-10">
            <h2 className="text-sm font-semibold tracking-widest uppercase text-muted mb-3">Articles</h2>
            <div className="space-y-2">
              {results.articles.map((a) => (
                <Link key={a.slug} to={`/writing/${a.slug}`} className={`${card} block`}>
                  <div className="text-text font-medium">{a.title}</div>
                  {a.summary && <div className="text-muted text-sm mt-1 line-clamp-2">{a.summary}</div>}
                </Link>
              ))}
            </div>
          </div>
        )}

        {hasQuery && !loading && results.videos.length > 0 && (
          <div className="mb-10">
            <h2 className="text-sm font-semibold tracking-widest uppercase text-muted mb-3">Videos</h2>
            <div className="space-y-2">
              {results.videos.map((v) => (
                <Link key={v.id} to="/videos" className={`${card} block`}>
                  <div className="text-text font-medium">{v.title}</div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
