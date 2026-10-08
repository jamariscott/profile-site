import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { API_BASE } from "../lib/config";
import { formatDate } from "../lib/format";
import SiteNav from "../components/SiteNav";
import SiteFooter from "../components/SiteFooter";
import ShareButton from "../components/ShareButton";
import Comments from "../components/Comments";

interface WritingPost {
  slug: string;
  title: string;
  date: string;
  summary: string;
  content: string;
  sponsor_logo?: string;
}

export default function WritingPost() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<WritingPost | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "missing">("loading");

  useEffect(() => {
    if (!slug) return;
    setStatus("loading");
    fetch(`${API_BASE}/api/writing/${slug}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (!data?.title) throw new Error();
        setPost(data);
        setStatus("ok");
      })
      .catch(() => setStatus("missing"));
  }, [slug]);

  return (
    <div className="flex min-h-screen flex-col bg-bg text-text">
      <SiteNav />
      <main id="main" className="flex-1 pb-20">
        <div className="mx-auto max-w-3xl px-4 pt-8 sm:px-6">
          <Link to="/writing" className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-text">
            <ArrowLeft size={16} aria-hidden />
            All writing
          </Link>
        </div>

        {status === "loading" && (
          <div className="mx-auto max-w-3xl animate-pulse px-4 pt-10 sm:px-6" aria-busy="true">
            <div className="h-4 w-40 rounded bg-surface-2" />
            <div className="mt-4 h-14 w-full rounded bg-surface-2" />
            <div className="mt-3 h-14 w-2/3 rounded bg-surface-2" />
            <span className="sr-only">Loading story…</span>
          </div>
        )}

        {status === "missing" && (
          <div className="mx-auto max-w-3xl px-4 pt-10 sm:px-6">
            <h1 className="font-heading text-4xl font-black tracking-tight [font-stretch:80%]">This story isn't here</h1>
            <p className="mt-3 text-lg text-muted">It may have been moved or unpublished.</p>
            <Link to="/writing" className="mt-6 inline-flex rounded-btn bg-accent px-5 py-3 font-semibold text-accent-contrast hover:bg-accent-hover">
              See all writing
            </Link>
          </div>
        )}

        {status === "ok" && post && (
          <article>
            <header className="mx-auto max-w-3xl px-4 pt-8 sm:px-6">
              <div className="flex flex-wrap items-center gap-3 text-sm text-subtle">
                <time dateTime={post.date}>{formatDate(post.date)}</time>
                {post.sponsor_logo && (
                  <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-medium text-muted">Sponsored content</span>
                )}
              </div>
              <h1 className="mt-4 font-heading text-[clamp(2.4rem,6vw,4.5rem)] font-black leading-[0.95] tracking-tight [font-stretch:78%] [text-wrap:balance]">
                {post.title}
              </h1>
              {post.summary && <p className="mt-5 text-xl leading-relaxed text-muted">{post.summary}</p>}
              <div className="mt-6 flex items-center gap-3 border-y border-line py-3">
                <ShareButton path={`/writing/${post.slug}`} displayName={post.title} label="Share this story" />
              </div>
            </header>

            {post.sponsor_logo && (
              <div className="mx-auto mt-10 max-w-5xl px-4 sm:px-6">
                <img src={post.sponsor_logo} alt="" className="max-h-[560px] w-full rounded-card object-cover" />
              </div>
            )}

            <div
              className="prose prose-lg mx-auto mt-10 max-w-[68ch] px-4 sm:px-0
                prose-headings:font-heading prose-headings:tracking-tight prose-p:leading-relaxed
                prose-a:decoration-highlight prose-a:decoration-2 prose-a:underline-offset-4
                prose-img:my-8 prose-img:w-full prose-img:rounded-card
                prose-blockquote:border-l-4 prose-blockquote:font-normal prose-blockquote:not-italic
                prose-code:rounded prose-code:bg-surface-2 prose-code:px-1"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {post.sponsor_logo && (
              <div className="mx-auto mt-16 max-w-3xl px-4 sm:px-6">
                <div className="flex items-center gap-6 border-t border-line pt-8">
                  <img src={post.sponsor_logo} alt="Sponsor logo" className="h-12 w-auto rounded-lg object-contain" />
                  <p className="text-sm leading-relaxed text-subtle">
                    This story was created in partnership with a sponsor. Sponsored content is produced independently of
                    editorial staff.
                  </p>
                </div>
              </div>
            )}

            <Comments slug={post.slug} />
          </article>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
