import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE } from '../lib/config';
import PageNav from '../components/PageNav';

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

export default function Writing() {
  const [posts, setPosts] = useState<WritingPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/writing`)
      .then(res => res.json())
      .then(data => {
        setPosts(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="max-w-5xl mx-auto p-8">Loading writing...</div>;

  if (posts.length === 0) return (
    <div className="bg-bg min-h-screen">
      <PageNav />
      <div className="max-w-5xl mx-auto px-6 py-12">
        <h1 className="text-5xl font-bold text-text mb-10">Writing</h1>
        <p className="text-muted">No posts yet.</p>
      </div>
    </div>
  );

  const [hero, ...rest] = posts;
  const heroThumb = extractThumbnail(hero);

  return (
    <div className="bg-bg min-h-screen">
      <PageNav />
      <div className="max-w-5xl mx-auto px-6 py-12">
        <h1 className="text-5xl font-bold text-text mb-10">Writing</h1>

        {/* Hero featured article */}
        <Link to={`/writing/${hero.slug}`} className="block group mb-12">
          {heroThumb && (
            <div className="w-full h-80 rounded-2xl overflow-hidden mb-6">
              <img
                src={heroThumb}
                alt={hero.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          )}
          <div className="flex items-center gap-3 mb-3">
            {hero.sponsor_logo && (
              <span className="text-xs font-semibold tracking-widest uppercase text-subtle border border-line px-2 py-0.5 rounded-full">
                Sponsored
              </span>
            )}
            <span className="text-sm text-muted">{hero.date}</span>
          </div>
          <h2 className="text-4xl font-bold text-text group-hover:text-muted transition-colors leading-tight mb-3">
            {hero.title}
          </h2>
          <p className="text-muted text-lg line-clamp-3">{hero.summary}</p>
        </Link>

        {/* Divider */}
        {rest.length > 0 && <hr className="border-line mb-10" />}

        {/* 2-column card grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {rest.map((post) => {
            const thumb = extractThumbnail(post);
            return (
              <Link key={post.slug} to={`/writing/${post.slug}`} className="block group">
                {thumb && (
                  <div className="w-full h-48 rounded-xl overflow-hidden mb-4">
                    <img
                      src={thumb}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                )}
                <div className="flex items-center gap-2 mb-2">
                  {post.sponsor_logo && (
                    <span className="text-xs font-semibold tracking-widest uppercase text-subtle border border-line px-2 py-0.5 rounded-full">
                      Sponsored
                    </span>
                  )}
                  <span className="text-xs text-muted">{post.date}</span>
                </div>
                <h2 className="text-xl font-bold text-text group-hover:text-muted transition-colors leading-snug mb-2">
                  {post.title}
                </h2>
                <p className="text-muted text-sm line-clamp-3">{post.summary}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
