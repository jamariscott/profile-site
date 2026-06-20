export interface EmbedInfo {
  src: string;
  height: number;
  aspect?: boolean; // 16:9 responsive (YouTube)
}

/** Turn a public streaming URL into an embeddable player URL. */
export function resolveEmbed(raw: string): EmbedInfo | null {
  const url = raw.trim();

  // Spotify: track / album / playlist / artist / episode / show
  const sp = url.match(/open\.spotify\.com\/(track|album|playlist|artist|episode|show)\/([A-Za-z0-9]+)/);
  if (sp) {
    const type = sp[1];
    const id = sp[2];
    const tall = type === "album" || type === "playlist" || type === "artist" || type === "show";
    return { src: `https://open.spotify.com/embed/${type}/${id}`, height: tall ? 352 : 152 };
  }

  // YouTube: youtu.be/ID or youtube.com/watch?v=ID or /embed/ID
  const yt =
    url.match(/youtu\.be\/([A-Za-z0-9_-]{6,})/) ||
    url.match(/youtube\.com\/(?:watch\?v=|embed\/)([A-Za-z0-9_-]{6,})/);
  if (yt) {
    return { src: `https://www.youtube.com/embed/${yt[1]}`, height: 0, aspect: true };
  }

  // SoundCloud
  if (/soundcloud\.com\//.test(url)) {
    const params = new URLSearchParams({
      url,
      color: "#ff5500",
      auto_play: "false",
      show_comments: "false",
    });
    return { src: `https://w.soundcloud.com/player/?${params.toString()}`, height: 166 };
  }

  // Apple Music
  if (/music\.apple\.com\//.test(url)) {
    const src = url.replace("music.apple.com", "embed.music.apple.com");
    const isAlbum = /\/album\//.test(url) && !/[?&]i=/.test(url);
    return { src, height: isAlbum ? 450 : 175 };
  }

  return null;
}

export default function TrackEmbed({ url, title }: { url: string; title?: string | null }) {
  const embed = resolveEmbed(url);

  if (!embed) {
    // Unknown platform — show a clean link instead of a broken player.
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="block bg-surface border border-line rounded-card p-4 text-accent hover:text-accent-hover break-all"
      >
        {title || url}
      </a>
    );
  }

  if (embed.aspect) {
    return (
      <div className="w-full rounded-card overflow-hidden border border-line" style={{ aspectRatio: "16 / 9" }}>
        <iframe
          src={embed.src}
          title={title || "Track"}
          className="w-full h-full"
          frameBorder={0}
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <iframe
      src={embed.src}
      title={title || "Track"}
      className="w-full rounded-card border border-line"
      style={{ height: embed.height }}
      frameBorder={0}
      allow="autoplay; encrypted-media; fullscreen; clipboard-write"
      loading="lazy"
    />
  );
}
