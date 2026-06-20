import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageNav from "../components/PageNav";
import Footer from "../components/Footer";
import HuffPostNav from "../components/HuffPostNav";
import HuffPostFooter from "../components/HuffPostFooter";
import DailyWireNav from "../components/DailyWireNav";
import DailyWireFooter from "../components/DailyWireFooter";
import { API_BASE } from "../lib/config";
import { useAuth, type AuthSession } from "../lib/auth";
import { useLayout } from "../theme/LayoutProvider";

interface WritingPost {
  slug: string;
  title: string;
  date: string;
  summary: string;
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

interface VariantProps {
  session: AuthSession | null;
  hero?: WritingPost;
  rest: WritingPost[];
}

/** Shared hero call-to-action: signup/login for guests, a profile link for members. */
function HeroCtas({ session }: { session: AuthSession | null }) {
  if (session) {
    return (
      <div className="flex flex-col items-center gap-3 mt-8">
        <p className="text-text font-medium">
          Welcome back, {session.user.first_name || session.user.username}.
        </p>
        <Link
          to={`/u/${session.user.username}`}
          className="bg-accent text-accent-contrast px-6 py-3 rounded-btn font-medium hover:bg-accent-hover transition-colors"
        >
          Go to your profile
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-3 mt-8">
      <Link
        to="/register"
        className="bg-accent text-accent-contrast px-6 py-3 rounded-btn font-medium hover:bg-accent-hover transition-colors"
      >
        Create your profile
      </Link>
      <Link
        to="/login"
        className="border border-line text-text px-6 py-3 rounded-btn font-medium hover:bg-surface-2 transition-colors"
      >
        Log in
      </Link>
    </div>
  );
}

/** Today's design: brand hero + a featured article + a 3-column grid feed. */
function ClassicHome({ session, hero, rest }: VariantProps) {
  const heroThumb = hero ? extractThumbnail(hero) : null;

  return (
    <div className="bg-bg min-h-screen flex flex-col">
      <PageNav />

      <section className="border-b border-line">
        <div className="max-w-5xl mx-auto px-6 py-20 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-text tracking-tight">TimezofToday</h1>
          <p className="text-lg text-muted mt-5 max-w-2xl mx-auto leading-relaxed">
            Build a profile for whatever you do — show your work, share your links, and tell your story.
            Plus the latest reads from the community.
          </p>
          <HeroCtas session={session} />
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 py-14 flex-1 w-full">
        <h2 className="text-sm font-medium tracking-widest uppercase text-muted mb-8">Latest</h2>

        {!hero ? (
          <p className="text-muted">No articles yet.</p>
        ) : (
          <>
            <Link to={`/writing/${hero.slug}`} className="block group mb-14">
              {extractThumbnail(hero) && (
                <div className="w-full h-72 md:h-96 rounded-card overflow-hidden mb-5">
                  <img
                    src={heroThumb!}
                    alt={hero.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              )}
              <span className="text-xs text-muted block mb-2">{hero.date}</span>
              <h3 className="text-3xl md:text-4xl font-bold text-text group-hover:text-muted transition-colors leading-tight mb-3">
                {hero.title}
              </h3>
              <p className="text-muted md:text-lg line-clamp-2 max-w-3xl">{hero.summary}</p>
            </Link>

            {rest.length > 0 && (
              <>
                <hr className="border-line mb-10" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {rest.map((post) => {
                    const thumb = extractThumbnail(post);
                    return (
                      <Link key={post.slug} to={`/writing/${post.slug}`} className="block group">
                        {thumb && (
                          <div className="w-full h-40 rounded-xl overflow-hidden mb-3">
                            <img
                              src={thumb}
                              alt={post.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          </div>
                        )}
                        <span className="text-xs text-muted block mb-1">{post.date}</span>
                        <h3 className="font-semibold text-text group-hover:text-muted transition-colors leading-snug mb-1">
                          {post.title}
                        </h3>
                        <p className="text-muted text-sm line-clamp-2">{post.summary}</p>
                      </Link>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}

/** Bold editorial feel: serif headline hero, big featured story beside a dense headline list. */
function HuffPostHome({ session, hero, rest }: VariantProps) {
  const heroThumb = hero ? extractThumbnail(hero) : null;
  const sidebar = rest.slice(0, 5);
  const grid = rest.slice(5);

  return (
    <div className="bg-bg min-h-screen flex flex-col">
      <HuffPostNav />

      <section className="border-b border-line bg-surface">
        <div className="max-w-6xl mx-auto px-6 py-14 text-center">
          <span className="text-xs font-semibold tracking-widest uppercase text-accent">The Daily Read</span>
          <h1 className="font-heading text-5xl md:text-6xl font-bold text-text tracking-tight mt-2">
            TimezofToday
          </h1>
          <p className="text-muted mt-3 max-w-2xl mx-auto leading-relaxed">
            Build a profile for whatever you do — plus the latest reads from the community.
          </p>
          <HeroCtas session={session} />
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 py-12 flex-1 w-full">
        {!hero ? (
          <p className="text-muted">No articles yet.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-10">
              <Link to={`/writing/${hero.slug}`} className="block group">
                {heroThumb && (
                  <div className="w-full h-80 md:h-[28rem] rounded-card overflow-hidden mb-5">
                    <img
                      src={heroThumb}
                      alt={hero.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                )}
                <span className="text-xs text-accent font-semibold uppercase tracking-wide block mb-2">
                  {hero.date}
                </span>
                <h2 className="font-heading text-4xl md:text-5xl font-bold text-text group-hover:text-muted transition-colors leading-tight mb-3">
                  {hero.title}
                </h2>
                <p className="text-muted text-lg line-clamp-3">{hero.summary}</p>
              </Link>

              {sidebar.length > 0 && (
                <div className="space-y-5">
                  <h2 className="text-sm font-semibold tracking-widest uppercase text-muted border-b border-line pb-2">
                    Trending
                  </h2>
                  {sidebar.map((post) => (
                    <Link key={post.slug} to={`/writing/${post.slug}`} className="block group pb-4 border-b border-line">
                      <h3 className="font-heading font-semibold text-text group-hover:text-muted transition-colors leading-snug">
                        {post.title}
                      </h3>
                      <span className="text-xs text-muted block mt-1">{post.date}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {grid.length > 0 && (
              <>
                <hr className="border-line my-12" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {grid.map((post) => {
                    const thumb = extractThumbnail(post);
                    return (
                      <Link key={post.slug} to={`/writing/${post.slug}`} className="block group">
                        {thumb && (
                          <div className="w-full h-32 rounded-xl overflow-hidden mb-2">
                            <img
                              src={thumb}
                              alt={post.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          </div>
                        )}
                        <h3 className="font-heading text-sm font-semibold text-text group-hover:text-muted transition-colors leading-snug">
                          {post.title}
                        </h3>
                      </Link>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}
      </div>

      <HuffPostFooter />
    </div>
  );
}

/** Opinion-led feel: byline-forward hero card, then a vertical feed of byline-first story cards. */
function DailyWireHome({ session, hero, rest }: VariantProps) {
  const heroThumb = hero ? extractThumbnail(hero) : null;

  return (
    <div className="bg-bg min-h-screen flex flex-col">
      <DailyWireNav />

      <section className="border-b border-line">
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-text tracking-tight">TimezofToday</h1>
          <p className="text-lg text-muted mt-5 max-w-xl mx-auto leading-relaxed">
            Build a profile for whatever you do. Opinions, stories, and the latest from the community.
          </p>
          <HeroCtas session={session} />
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-6 py-12 flex-1 w-full">
        {!hero ? (
          <p className="text-muted">No articles yet.</p>
        ) : (
          <div className="space-y-10">
            <Link to={`/writing/${hero.slug}`} className="block group border border-line rounded-card p-6 hover:bg-surface-2 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <span className="h-9 w-9 rounded-full bg-surface-2 border border-line shrink-0" aria-hidden />
                <div>
                  <span className="block text-sm font-semibold text-text">Featured Story</span>
                  <span className="block text-xs text-muted">{hero.date}</span>
                </div>
              </div>
              {heroThumb && (
                <div className="w-full h-64 rounded-card overflow-hidden mb-4">
                  <img
                    src={heroThumb}
                    alt={hero.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              )}
              <h2 className="text-3xl font-bold text-text group-hover:text-muted transition-colors leading-tight mb-2">
                {hero.title}
              </h2>
              <p className="text-muted line-clamp-2">{hero.summary}</p>
            </Link>

            {rest.length > 0 && (
              <div className="space-y-6">
                {rest.map((post) => {
                  const thumb = extractThumbnail(post);
                  return (
                    <Link
                      key={post.slug}
                      to={`/writing/${post.slug}`}
                      className="flex items-start gap-4 group border-b border-line pb-6"
                    >
                      <span className="h-8 w-8 rounded-full bg-surface-2 border border-line shrink-0" aria-hidden />
                      <div className="flex-1 min-w-0">
                        <span className="text-xs text-muted block mb-1">{post.date}</span>
                        <h3 className="font-semibold text-text group-hover:text-muted transition-colors leading-snug mb-1">
                          {post.title}
                        </h3>
                        <p className="text-muted text-sm line-clamp-2">{post.summary}</p>
                      </div>
                      {thumb && (
                        <div className="w-24 h-20 rounded-xl overflow-hidden shrink-0">
                          <img
                            src={thumb}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <DailyWireFooter />
    </div>
  );
}

export default function Home() {
  const session = useAuth();
  const { layout } = useLayout();
  const [articles, setArticles] = useState<WritingPost[]>([]);

  useEffect(() => {
    fetch(`${API_BASE}/api/writing`)
      .then((res) => res.json())
      .then((data) => setArticles(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const [hero, ...rest] = articles;

  if (layout === "huffpost") return <HuffPostHome session={session} hero={hero} rest={rest} />;
  if (layout === "dailywire") return <DailyWireHome session={session} hero={hero} rest={rest} />;
  return <ClassicHome session={session} hero={hero} rest={rest} />;
}
