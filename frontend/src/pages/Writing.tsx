import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE } from "../lib/config";
import { formatDate } from "../lib/format";
import SiteNav from "../components/SiteNav";
import SiteFooter from "../components/SiteFooter";

interface WritingPost {
  slug: string;
  title: string;
  date: string;
  summary: string;
  x_posted: boolean;
  sponsor_logo?: string;
  content?: string;
}

function extractThumbnail(post: WritingPost): string | null {
  if (post.sponsor_logo) return post.sponsor_logo;
  if (post.content) {
    const match = post.content.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (match) return match[1];
  }
  return null;
}

function Meta({ post }: { post: WritingPost }) {
  return (
    <div className="flex flex-wrap items-center gap-3 text-sm text-subtle">
      <time dateTime={post.date}>{formatDate(post.date)}</time>
      {post.sponsor_logo && <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-medium text-muted">Sponsored</span>}
    </div>
  );
}

export default function Writing() {
  const [posts, setPosts] = useState<WritingPost[] | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/writing`)
      .then((res) => res.json())
      .then((data) => setPosts(Array.isArray(data) ? data : []))
      .catch(() => setPosts([]));
  }, []);

  const [featured, ...rest] = posts ?? [];
  const featuredThumb = featured ? extractThumbnail(featured) : null;

  return (
    <div className="flex min-h-screen flex-col bg-bg text-text">
      <SiteNav />
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 pb-20 pt-10 sm:px-6 md:pt-14">
        <h1 className="font-heading text-[clamp(2.5rem,6vw,4.25rem)] font-black leading-[0.95] tracking-tight [font-stretch:80%]">
          Writing
        </h1>
        <p className="mt-3 max-w-xl text-lg text-muted">Stories, guides and news from Timez of Today.</p>

        {posts === null ? (
          <div className="mt-10 grid animate-pulse gap-8 lg:grid-cols-[1.4fr_1fr]" aria-busy="true">
            <div className="aspect-[16/10] rounded-card bg-surface-2" />
            <div className="space-y-4">
              <div className="h-4 w-32 rounded bg-surface-2" />
              <div className="h-12 w-full rounded bg-surface-2" />
              <div className="h-5 w-3/4 rounded bg-surface-2" />
            </div>
            <span className="sr-only">Loading writing…</span>
          </div>
        ) : !featured ? (
          <p className="mt-10 text-muted">Nothing published yet. Check back soon.</p>
        ) : (
          <>
            {/* The latest story, featured. */}
            <Link
              to={`/writing/${featured.slug}`}
              className={`group mt-10 grid items-center gap-8 ${featuredThumb ? "lg:grid-cols-[1.4fr_1fr]" : ""}`}
            >
              {featuredThumb && (
                <div className="aspect-[16/10] overflow-hidden rounded-card bg-surface-2">
                  <img
                    src={featuredThumb}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-[1.03]"
                  />
                </div>
              )}
              <div>
                <Meta post={featured} />
                <h2 className="mt-3 font-heading text-[clamp(2rem,4.2vw,3.5rem)] font-black leading-[0.98] tracking-tight [font-stretch:78%] [text-wrap:balance] group-hover:underline group-hover:decoration-highlight group-hover:decoration-4 group-hover:underline-offset-8">
                  {featured.title}
                </h2>
                {featured.summary && <p className="mt-4 line-clamp-3 max-w-[60ch] text-lg text-muted">{featured.summary}</p>}
                <span className="mt-5 inline-block font-semibold underline decoration-highlight decoration-2 underline-offset-4">Read the story</span>
              </div>
            </Link>

            {/* Everything else, newest first. */}
            {rest.length > 0 && (
              <ul className="mt-16 divide-y divide-line border-y border-line">
                {rest.map((post) => {
                  const thumb = extractThumbnail(post);
                  return (
                    <li key={post.slug}>
                      <Link to={`/writing/${post.slug}`} className="group grid gap-4 py-6 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-8">
                        <div className="min-w-0">
                          <Meta post={post} />
                          <h3 className="mt-2 font-heading text-2xl font-extrabold leading-tight tracking-tight [font-stretch:85%] group-hover:underline group-hover:decoration-highlight group-hover:decoration-2 group-hover:underline-offset-4">
                            {post.title}
                          </h3>
                          {post.summary && <p className="mt-2 line-clamp-2 max-w-[65ch] text-muted">{post.summary}</p>}
                        </div>
                        {thumb && (
                          <div className="aspect-[4/3] w-full overflow-hidden rounded-card bg-surface-2 sm:w-44">
                            <img src={thumb} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                          </div>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
