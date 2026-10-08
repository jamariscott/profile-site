import { useEffect, useState } from "react";
import { EditorSection, ErrorText, FieldLabel, inputClass, primaryBtn, removeBtn } from "./ui";
import { apiJson, apiFetch } from "../lib/api";
import { fetchOEmbedTitle } from "../lib/oembed";
import TrackEmbed from "./TrackEmbed";

interface Clip {
  id: number;
  url: string;
  title: string | null;
}

export default function ClipManager({ onChange }: { onChange?: () => void } = {}) {
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
      if (!res.ok) throw new Error(data.detail || "Couldn't add the video. Check the link and try again.");
      setClips((p) => [...p, data]);
      onChange?.();
      setUrl(""); setTitle("");
    } catch (err: any) {
      setError(err?.message || "Couldn't add the video. Check the link and try again.");
    }
  };

  const delClip = async (id: number) => {
    if (!confirm("Remove this video from your page?")) return;
    const res = await apiFetch(`/api/me/clips/${id}`, { method: "DELETE" });
    if (res.ok) {
      setClips((p) => p.filter((c) => c.id !== id));
      onChange?.();
    }
  };

  return (
    <div className="space-y-6">
      {clips.length > 0 ? (
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {clips.map((c) => (
            <li key={c.id}>
              <TrackEmbed url={c.url} title={c.title} />
              <div className="mt-1.5 flex items-center justify-between gap-2">
                <p className="min-w-0 truncate text-sm text-muted">{c.title || c.url}</p>
                <button type="button" onClick={() => delClip(c.id)} className={removeBtn}>
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted">No videos yet. Add your first one below.</p>
      )}

      <EditorSection title="Add a video" hint="Paste a YouTube, TikTok or other video link. It plays right on your page.">
        <form onSubmit={addClip} className="space-y-4">
          <div>
            <FieldLabel htmlFor="clip-url">Video link</FieldLabel>
            <input
              id="clip-url"
              type="url"
              inputMode="url"
              placeholder="https://youtube.com/watch?v=…"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onBlur={handleUrlBlur}
              className={inputClass}
            />
          </div>
          <div>
            <FieldLabel htmlFor="clip-title" hint={fetchingTitle ? "(getting the title…)" : "(optional, filled in for you when possible)"}>
              Title
            </FieldLabel>
            <input id="clip-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
          </div>
          {error && <ErrorText>{error}</ErrorText>}
          <button type="submit" className={primaryBtn}>
            Add video
          </button>
        </form>
      </EditorSection>
    </div>
  );
}
