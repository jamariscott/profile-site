import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search as SearchIcon } from "lucide-react";
import SiteNav from "../components/SiteNav";
import SiteFooter from "../components/SiteFooter";
import { fetchSearch, EMPTY_SEARCH_RESULTS, type SearchResults } from "../lib/search";

const handleOf = (username: string) => username.split("@")[0];

export default function Search() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") || "";
  const [text, setText] = useState(q);
  const [results, setResults] = useState<SearchResults>(EMPTY_SEARCH_RESULTS);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Typing updates the URL (debounced) so results can be linked and survive Back.
  const onType = (value: string) => {
    setText(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setParams(value.trim() ? { q: value.trim() } : {}, { replace: true }), 300);
  };
  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  useEffect(() => {
    if (q.trim().length < 2) {
      setResults(EMPTY_SEARCH_RESULTS);
      return;
    }
    setLoading(true);
    fetchSearch(q)
      .then(setResults)
      .finally(() => setLoading(false));
  }, [q]);

  const hasQuery = q.trim().length >= 2;
  const total = results.profiles.length + results.articles.length + results.videos.length;
  const row = "flex items-center gap-4 rounded-card border border-line bg-surface p-4 transition-colors hover:border-line-strong";

  return (
    <div className="flex min-h-screen flex-col bg-bg text-text">
      <SiteNav />
      <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 pb-20 pt-10 sm:px-6 md:pt-14">
        <h1 className="font-heading text-[clamp(2.5rem,6vw,4rem)] font-black leading-[0.95] tracking-tight [font-stretch:80%]">Search</h1>

        <form role="search" onSubmit={(e) => e.preventDefault()} className="mt-6">
          <label className="flex items-center gap-2 rounded-btn border-2 border-text bg-surface px-3 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-text">
            <SearchIcon size={20} aria-hidden className="shrink-0 text-muted" />
            <span className="sr-only">Search people, writing and videos</span>
            <input
              type="search"
              value={text}
              onChange={(e) => onType(e.target.value)}
              placeholder="Search people, writing and videos"
              autoFocus
              className="min-w-0 flex-1 bg-transparent py-3.5 text-lg text-text placeholder:text-subtle focus:outline-none focus-visible:outline-none"
            />
          </label>
        </form>

        <div className="mt-10" aria-live="polite">
          {!hasQuery && <p className="text-muted">Type at least 2 letters to search.</p>}
          {hasQuery && loading && <p className="text-muted">Searching…</p>}
          {hasQuery && !loading && total === 0 && (
            <div>
              <p className="font-heading text-2xl font-extrabold [font-stretch:85%]">Nothing matches “{q}”.</p>
              <p className="mt-2 text-muted">
                Try a shorter word, or{" "}
                <Link to="/discover" className="font-semibold text-text underline decoration-highlight decoration-2 underline-offset-4">
                  browse everyone on Discover
                </Link>
                .
              </p>
            </div>
          )}

          {hasQuery && !loading && results.profiles.length > 0 && (
            <section aria-labelledby="r-people" className="mb-10">
              <h2 id="r-people" className="mb-3 font-heading text-xl font-bold">People</h2>
              <ul className="space-y-2">
                {results.profiles.map((p) => {
                  const name = p.display_name.includes("@") ? handleOf(p.username) : p.display_name;
                  return (
                    <li key={p.username}>
                      <Link to={`/u/${p.username}`} className={row}>
                        {p.avatar_url ? (
                          <img src={p.avatar_url} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
                        ) : (
                          <div aria-hidden className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-highlight font-bold text-on-highlight">
                            {name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{name}</p>
                          <p className="truncate text-sm text-muted">
                            @{handleOf(p.username)}
                            {p.headline ? `, ${p.headline}` : ""}
                          </p>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {hasQuery && !loading && results.articles.length > 0 && (
            <section aria-labelledby="r-writing" className="mb-10">
              <h2 id="r-writing" className="mb-3 font-heading text-xl font-bold">Writing</h2>
              <ul className="space-y-2">
                {results.articles.map((a) => (
                  <li key={a.slug}>
                    <Link to={`/writing/${a.slug}`} className={`${row} block`}>
                      <p className="font-semibold">{a.title}</p>
                      {a.summary && <p className="mt-1 line-clamp-2 text-sm text-muted">{a.summary}</p>}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {hasQuery && !loading && results.videos.length > 0 && (
            <section aria-labelledby="r-videos" className="mb-10">
              <h2 id="r-videos" className="mb-3 font-heading text-xl font-bold">Videos</h2>
              <ul className="space-y-2">
                {results.videos.map((v) => (
                  <li key={v.id}>
                    <Link to="/videos" className={row}>
                      <img src={`https://i.ytimg.com/vi/${v.youtube_id}/default.jpg`} alt="" className="h-12 w-16 shrink-0 rounded object-cover" />
                      <p className="font-semibold">{v.title}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
