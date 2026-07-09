import { useEffect, useState, useRef } from "react";
import { apiJson, apiFetch } from "../lib/api";
import { fetchOEmbedTitle } from "../lib/oembed";
import TrackEmbed, { resolveEmbed } from "./TrackEmbed";
import { compressAndResizeImage } from "../lib/upload";

interface Track { id: number; url: string; title: string | null; }
interface Release { id: number; title: string; year: string | null; cover_url: string | null; link: string | null; }
interface Show { id: number; date: string | null; venue: string | null; city: string | null; ticket_url: string | null; }

const inputClass = "border border-line bg-surface text-text p-3 rounded-btn";

export default function MusicManager() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [releases, setReleases] = useState<Release[]>([]);
  const [shows, setShows] = useState<Show[]>([]);

  // forms
  const [tUrl, setTUrl] = useState("");
  const [tTitle, setTTitle] = useState("");
  const [tErr, setTErr] = useState("");
  const [tFetchingTitle, setTFetchingTitle] = useState(false);

  const handleTrackUrlBlur = async () => {
    if (!tUrl.trim() || tTitle.trim()) return;
    setTFetchingTitle(true);
    const title = await fetchOEmbedTitle(tUrl);
    setTFetchingTitle(false);
    if (title) setTTitle((current) => (current.trim() ? current : title));
  };

  const [rTitle, setRTitle] = useState("");
  const [rYear, setRYear] = useState("");
  const [rCover, setRCover] = useState("");
  const [rCoverUploading, setRCoverUploading] = useState(false);
  const [rCoverError, setRCoverError] = useState("");
  const rCoverInputRef = useRef<HTMLInputElement>(null);

  const handleRCoverFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRCoverError("");
    setRCoverUploading(true);
    try {
      const base64 = await compressAndResizeImage(file, 300, 300);
      setRCover(base64);
    } catch (err: any) {
      setRCoverError(err?.message || "Failed to process image.");
    } finally {
      setRCoverUploading(false);
      if (e.target) e.target.value = "";
    }
  };
  const [rLink, setRLink] = useState("");

  const [sDate, setSDate] = useState("");
  const [sVenue, setSVenue] = useState("");
  const [sCity, setSCity] = useState("");
  const [sTicket, setSTicket] = useState("");

  const load = () => {
    apiJson<Track[]>("/api/me/tracks").then(setTracks).catch(() => {});
    apiJson<Release[]>("/api/me/releases").then(setReleases).catch(() => {});
    apiJson<Show[]>("/api/me/shows").then(setShows).catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const addTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setTErr("");
    if (!tUrl.trim()) { setTErr("Paste a streaming link."); return; }
    try {
      const res = await apiFetch("/api/me/tracks", { method: "POST", body: JSON.stringify({ url: tUrl, title: tTitle }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "Could not add track");
      setTUrl(""); setTTitle("");
      setTracks((p) => [...p, data]);
    } catch (err: any) { setTErr(err?.message || "Could not add track"); }
  };

  const delTrack = async (id: number) => {
    const res = await apiFetch(`/api/me/tracks/${id}`, { method: "DELETE" });
    if (res.ok) setTracks((p) => p.filter((t) => t.id !== id));
  };

  const addRelease = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rTitle.trim()) return;
    const res = await apiFetch("/api/me/releases", {
      method: "POST",
      body: JSON.stringify({ title: rTitle, year: rYear, cover_url: rCover, link: rLink }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setReleases((p) => [data, ...p]);
      setRTitle(""); setRYear(""); setRCover(""); setRLink("");
    }
  };

  const delRelease = async (id: number) => {
    const res = await apiFetch(`/api/me/releases/${id}`, { method: "DELETE" });
    if (res.ok) setReleases((p) => p.filter((r) => r.id !== id));
  };

  const addShow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sVenue.trim() && !sDate.trim()) return;
    const res = await apiFetch("/api/me/shows", {
      method: "POST",
      body: JSON.stringify({ date: sDate, venue: sVenue, city: sCity, ticket_url: sTicket }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setShows((p) => [...p, data]);
      setSDate(""); setSVenue(""); setSCity(""); setSTicket("");
    }
  };

  const delShow = async (id: number) => {
    const res = await apiFetch(`/api/me/shows/${id}`, { method: "DELETE" });
    if (res.ok) setShows((p) => p.filter((s) => s.id !== id));
  };

  return (
    <div className="space-y-8">
      {/* Tracks */}
      <div>
        <h3 className="text-text font-semibold mb-3">Tracks</h3>
        {tracks.length > 0 && (
          <>
            {tracks.some((t) => resolveEmbed(t.url)?.aspect) && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                {tracks
                  .filter((t) => resolveEmbed(t.url)?.aspect)
                  .map((t) => (
                    <div key={t.id} className="space-y-1">
                      <TrackEmbed url={t.url} title={t.title} />
                      <button onClick={() => delTrack(t.id)} className="text-danger hover:opacity-80 text-xs">Remove</button>
                    </div>
                  ))}
              </div>
            )}
            {tracks.some((t) => !resolveEmbed(t.url)?.aspect) && (
              <div className="space-y-3 mb-4">
                {tracks
                  .filter((t) => !resolveEmbed(t.url)?.aspect)
                  .map((t) => (
                    <div key={t.id} className="space-y-2">
                      <TrackEmbed url={t.url} title={t.title} />
                      <button onClick={() => delTrack(t.id)} className="text-danger hover:opacity-80 text-xs">Remove</button>
                    </div>
                  ))}
              </div>
            )}
          </>
        )}
        <form onSubmit={addTrack} className="space-y-2">
          <input type="url" placeholder="Paste Spotify / SoundCloud / YouTube / Apple Music link" value={tUrl} onChange={(e) => setTUrl(e.target.value)} onBlur={handleTrackUrlBlur} className={`${inputClass} w-full`} />
          <div className="flex gap-2">
            <input type="text" placeholder={tFetchingTitle ? "Fetching title…" : "Title (optional)"} value={tTitle} onChange={(e) => setTTitle(e.target.value)} className={`${inputClass} flex-1`} />
            <button type="submit" className="bg-accent text-accent-contrast px-5 py-2.5 rounded-btn font-medium whitespace-nowrap">Add track</button>
          </div>
          {tErr && <p className="text-danger text-sm">{tErr}</p>}
        </form>
      </div>

      {/* Releases */}
      <div>
        <h3 className="text-text font-semibold mb-3">Releases</h3>
        {releases.length > 0 && (
          <div className="space-y-2 mb-4">
            {releases.map((r) => (
              <div key={r.id} className="flex items-center gap-3 border border-line rounded-btn p-3">
                {r.cover_url && <img src={r.cover_url} alt={r.title} className="w-12 h-12 rounded object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />}
                <div className="flex-1 min-w-0">
                  <span className="text-text text-sm font-medium">{r.title}</span>
                  {r.year && <span className="text-subtle text-xs ml-2">{r.year}</span>}
                </div>
                <button onClick={() => delRelease(r.id)} className="text-danger hover:opacity-80 text-sm shrink-0">Delete</button>
              </div>
            ))}
          </div>
        )}
        <form onSubmit={addRelease} className="space-y-2">
          <div className="flex gap-2">
            <input type="text" placeholder="Release title" value={rTitle} onChange={(e) => setRTitle(e.target.value)} className={`${inputClass} flex-1`} />
            <input type="text" placeholder="Year" value={rYear} onChange={(e) => setRYear(e.target.value)} className={`${inputClass} w-24`} />
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {rCover ? (
              <img
                src={rCover}
                alt="Cover Preview"
                className="w-16 h-16 rounded object-cover border border-line shrink-0"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <div className="w-16 h-16 rounded bg-surface-2 border border-line flex items-center justify-center text-subtle text-xs shrink-0">
                No Cover
              </div>
            )}
            <div className="flex-1 w-full space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Or paste cover URL (optional)"
                  value={rCover}
                  onChange={(e) => setRCover(e.target.value)}
                  className={`${inputClass} flex-1`}
                />
                <button
                  type="button"
                  onClick={() => rCoverInputRef.current?.click()}
                  disabled={rCoverUploading}
                  className="bg-surface-2 border border-line text-text hover:bg-surface-3 hover:border-line-strong px-4 py-2.5 rounded-btn font-medium text-sm whitespace-nowrap transition-all"
                >
                  {rCoverUploading ? "Processing…" : "Upload Cover"}
                </button>
              </div>
              <input
                type="file"
                ref={rCoverInputRef}
                onChange={handleRCoverFileChange}
                accept="image/*"
                className="hidden"
              />
              {rCoverError && <p className="text-danger text-xs">{rCoverError}</p>}
            </div>
          </div>
          <div className="flex gap-2">
            <input type="url" placeholder="Link (optional)" value={rLink} onChange={(e) => setRLink(e.target.value)} className={`${inputClass} flex-1`} />
            <button type="submit" className="bg-accent text-accent-contrast px-5 py-2.5 rounded-btn font-medium whitespace-nowrap">Add release</button>
          </div>
        </form>
      </div>

      {/* Shows */}
      <div>
        <h3 className="text-text font-semibold mb-3">Shows</h3>
        {shows.length > 0 && (
          <div className="space-y-2 mb-4">
            {shows.map((s) => (
              <div key={s.id} className="flex items-center gap-3 border border-line rounded-btn p-3">
                <div className="flex-1 min-w-0 text-sm">
                  <span className="text-text font-medium">{s.date || "TBA"}</span>
                  <span className="text-muted"> — {[s.venue, s.city].filter(Boolean).join(", ")}</span>
                </div>
                <button onClick={() => delShow(s.id)} className="text-danger hover:opacity-80 text-sm shrink-0">Delete</button>
              </div>
            ))}
          </div>
        )}
        <form onSubmit={addShow} className="space-y-2">
          <div className="flex gap-2">
            <input type="text" placeholder="Date (e.g. Aug 14)" value={sDate} onChange={(e) => setSDate(e.target.value)} className={`${inputClass} w-32`} />
            <input type="text" placeholder="Venue" value={sVenue} onChange={(e) => setSVenue(e.target.value)} className={`${inputClass} flex-1`} />
          </div>
          <div className="flex gap-2">
            <input type="text" placeholder="City" value={sCity} onChange={(e) => setSCity(e.target.value)} className={`${inputClass} flex-1`} />
            <input type="url" placeholder="Ticket link (optional)" value={sTicket} onChange={(e) => setSTicket(e.target.value)} className={`${inputClass} flex-1`} />
          </div>
          <button type="submit" className="bg-accent text-accent-contrast px-5 py-2.5 rounded-btn font-medium">Add show</button>
        </form>
      </div>
    </div>
  );
}
