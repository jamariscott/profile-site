import { useEffect, useState } from "react";
import { apiJson, apiFetch } from "../lib/api";
import { fetchOEmbedTitle } from "../lib/oembed";
import TrackEmbed from "./TrackEmbed";

interface Clip {
  id: number;
  url: string;
  title: string | null;
}

export default function ClipManager() {
  const [clips, setClips] = useState<Clip[]>([]);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [fetchingTitle, setFetchingTitle] = useState(false);

  const load = () => {
    apiJson<Clip[]>("/api/me/clips").then(setClips).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const handleUrlBlur = async () => {
    if (!url.trim() || title.trim()) return;
    setFetchingTitle(true);
    const t = await fetchOEmbedTitle(url);
    setFetchingTitle(false);
    if (t) setTitle((cur) => (cur.trim() ? cur : t));
  };

  const addClip = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const u = url.trim();
    if (!u) { setError("Paste a video link."); return; }
    try {
      const res = await apiFetch("/api/me/clips", {
        method: "POST",
        body: JSON.stringify({ url: u, title: title.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "Could not add video");
      setClips((p) => [...p, data]);
      setUrl(""); setTitle("");
    } catch (err: any) {
      setError(err?.message || "Could not add video");
    }
  };

  const delClip = async (id: number) => {
    const res = await apiFetch(`/api/me/clips/${id}`, { method: "DELETE" });
    if (res.ok) setClips((p) => p.filter((c) => c.id !== id));
  };

  return (
    <div>
      <h3 className="text-text font-semibold mb-1">Featured videos</h3>
      <p className="text-muted text-xs mb-4">
        Paste a YouTube, TikTok, or other video link — it plays inline on your profile.
      </p>

      {clips.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {clips.map((c) => (
            <div key={c.id} className="space-y-1">
              <TrackEmbed url={c.url} title={c.title} />
              <button onClick={() => delClip(c.id)} className="text-danger hover:opacity-80 text-xs">Remove</button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={addClip} className="space-y-2">
        <input
          type="text"
          placeholder="Paste YouTube / TikTok / video link"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onBlur={handleUrlBlur}
          className="border border-line bg-surface text-text p-3 rounded-btn w-full"
        />
        <div className="flex gap-2">
          <input
            type="text"
            placeholder={fetchingTitle ? "Fetching title…" : "Title (optional)"}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border border-line bg-surface text-text p-3 rounded-btn flex-1"
          />
          <button type="submit" className="bg-accent text-accent-contrast px-5 py-2.5 rounded-btn font-medium whitespace-nowrap">Add video</button>
        </div>
        {error && <p className="text-danger text-sm">{error}</p>}
      </form>
    </div>
  );
}
