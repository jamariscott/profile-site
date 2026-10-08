import { useState } from "react";
import { Play } from "lucide-react";

/**
 * YouTube embed that shows the video's thumbnail until clicked, then loads the
 * real player. Pages with many videos stay fast (each iframe is ~1MB of script).
 */
export default function LiteYouTube({ id, title, className = "" }: { id: string; title: string; className?: string }) {
  const [playing, setPlaying] = useState(false);

  if (playing) {
    return (
      <div className={`aspect-video overflow-hidden rounded-card bg-black ${className}`}>
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="h-full w-full"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      aria-label={`Play video: ${title}`}
      className={`group relative block aspect-video w-full overflow-hidden rounded-card bg-surface-2 ${className}`}
    >
      <img
        src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
        alt=""
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-[1.03]"
      />
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-accent-contrast shadow-lg transition-transform motion-safe:group-hover:scale-110">
          <Play size={26} fill="currentColor" aria-hidden className="ml-1" />
        </span>
      </span>
    </button>
  );
}
