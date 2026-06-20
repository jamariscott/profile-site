function oembedUrlFor(url: string): string | null {
  if (/youtu\.be\/|youtube\.com\//.test(url)) {
    return `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
  }
  if (/open\.spotify\.com\//.test(url)) {
    return `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`;
  }
  if (/soundcloud\.com\//.test(url)) {
    return `https://soundcloud.com/oembed?url=${encodeURIComponent(url)}&format=json`;
  }
  return null;
}

/** Best-effort title lookup via the platform's oEmbed endpoint. Resolves to null on any failure (unknown platform, network error, CORS, no title field). */
export async function fetchOEmbedTitle(url: string): Promise<string | null> {
  const endpoint = oembedUrlFor(url.trim());
  if (!endpoint) return null;
  try {
    const res = await fetch(endpoint);
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data?.title === "string" && data.title.trim() ? data.title : null;
  } catch {
    return null;
  }
}
