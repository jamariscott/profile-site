import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import SiteNav from "../components/SiteNav";
import SearchBar from "../components/SearchBar";
import { fetchSearch, EMPTY_SEARCH_RESULTS, type SearchResults } from "../lib/search";

export default function Search() {
  const [params, setParams] = useSearchParams();
  const [results, setResults] = useState<SearchResults>(EMPTY_SEARCH_RESULTS);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleQueryChange = (value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setParams(value.trim() ? { q: value.trim() } : {}, { replace: true });
    }, 300);
  };

  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  useEffect(() => {
    const q = params.get("q") || "";
    if (q.trim().length < 2) {
      setResults(EMPTY_SEARCH_RESULTS);
      return;
    }
    setLoading(true);
    fetchSearch(q)
      .then(setResults)
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
        <div className="mb-10">
          <SearchBar placeholder="Search users, articles, videos…" onSearch={handleQueryChange} autoFocus />
        </div>

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
