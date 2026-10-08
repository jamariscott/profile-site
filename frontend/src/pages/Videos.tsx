import { useEffect, useState } from "react";
import { LayoutGrid, List } from "lucide-react";
import { API_BASE } from "../lib/config";
import { formatDate } from "../lib/format";
import SiteNav from "../components/SiteNav";
import SiteFooter from "../components/SiteFooter";
import LiteYouTube from "../components/LiteYouTube";

interface Video {
  id: number;
  title: string;
  description: string;
  youtube_id: string;
  date: string;
  duration: string;
}

type View = "grid" | "list";
const VIEW_KEY = "tzt_videos_view";

function readView(): View {
  try {
    return localStorage.getItem(VIEW_KEY) === "list" ? "list" : "grid";
  } catch {
    return "grid";
  }
}

function Meta({ video }: { video: Video }) {
  return (
    <div className="flex flex-wrap items-center gap-3 text-sm text-subtle">
      {video.date && <time dateTime={video.date}>{formatDate(video.date)}</time>}
      {video.duration && <span>{video.duration}</span>}
    </div>
  );
}

export default function Videos() {
  const [videos, setVideos] = useState<Video[] | null>(null);
  const [view, setView] = useState<View>(readView);

  useEffect(() => {
    fetch(`${API_BASE}/api/videos`)
      .then((res) => res.json())
      .then((data) => setVideos(Array.isArray(data) ? data : []))
      .catch(() => setVideos([]));
  }, []);

  const choose = (v: View) => {
    setView(v);
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {
      /* preference just won't persist */
    }
  };

  const [featured, ...rest] = videos ?? [];
  const toggle = (v: View, label: string, Icon: typeof List) => (
    <button
      type="button"
      onClick={() => choose(v)}
      aria-pressed={view === v}
      className={`inline-flex items-center gap-2 rounded-btn px-3.5 py-2 text-sm font-semibold transition-colors ${
        view === v ? "bg-text text-bg" : "text-muted hover:text-text"
      }`}
    >
      <Icon size={16} aria-hidden />
      {label}
    </button>
  );

  return (
    <div className="flex min-h-screen flex-col bg-bg text-text">
      <SiteNav />
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 pb-20 pt-10 sm:px-6 md:pt-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-heading text-[clamp(2.5rem,6vw,4.25rem)] font-black leading-[0.95] tracking-tight [font-stretch:80%]">
              Videos
            </h1>
            <p className="mt-3 max-w-xl text-lg text-muted">Watch the latest from Timez of Today.</p>
          </div>
          {videos && videos.length > 1 && (
            <div role="group" aria-label="View" className="flex rounded-btn border border-line bg-surface p-1">
              {toggle("grid", "Grid", LayoutGrid)}
              {toggle("list", "List", List)}
            </div>
          )}
        </div>

        {videos === null ? (
          <div className="mt-10 animate-pulse" aria-busy="true">
            <div className="aspect-video w-full rounded-card bg-surface-2" />
            <span className="sr-only">Loading videos…</span>
          </div>
        ) : !featured ? (
          <p className="mt-10 text-muted">No videos yet. Check back soon.</p>
        ) : view === "grid" ? (
          <>
            {/* The latest video, featured. */}
            <section aria-label="Latest video" className="mt-10 grid gap-6 lg:grid-cols-[1.6fr_1fr] lg:items-center">
              <LiteYouTube id={featured.youtube_id} title={featured.title} />
              <div>
                <Meta video={featured} />
                <h2 className="mt-3 font-heading text-[clamp(1.9rem,3.6vw,3rem)] font-black leading-[1] tracking-tight [font-stretch:80%] [text-wrap:balance]">
                  {featured.title}
                </h2>
                {featured.description && <p className="mt-4 line-clamp-4 text-muted">{featured.description}</p>}
              </div>
            </section>

            {rest.length > 0 && (
              <ul className="mt-14 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((v) => (
                  <li key={v.id}>
                    <LiteYouTube id={v.youtube_id} title={v.title} />
                    <div className="mt-3">
                      <Meta video={v} />
                      <h3 className="mt-1 text-lg font-bold leading-snug">{v.title}</h3>
                      {v.description && <p className="mt-1 line-clamp-2 text-sm text-muted">{v.description}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <ul className="mt-10 divide-y divide-line border-y border-line">
            {videos.map((v) => (
              <li key={v.id} className="grid gap-5 py-6 sm:grid-cols-[18rem_1fr] sm:items-start">
                <LiteYouTube id={v.youtube_id} title={v.title} />
                <div className="min-w-0">
                  <Meta video={v} />
                  <h2 className="mt-1 font-heading text-2xl font-extrabold leading-tight tracking-tight [font-stretch:85%]">{v.title}</h2>
                  {v.description && <p className="mt-2 line-clamp-3 max-w-[65ch] text-muted">{v.description}</p>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
