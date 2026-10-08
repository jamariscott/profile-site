import { useEffect, useState, useRef } from "react";
import { apiJson, apiFetch } from "../lib/api";
import { fetchOEmbedTitle } from "../lib/oembed";
import TrackEmbed, { resolveEmbed } from "./TrackEmbed";
import { compressAndResizeImage } from "../lib/upload";
import { EditorSection, ErrorText, FieldLabel, inputClass, primaryBtn, removeBtn, secondaryBtn } from "./ui";

interface Track { id: number; url: string; title: string | null; }
interface Release { id: number; title: string; year: string | null; cover_url: string | null; link: string | null; }
interface Show { id: number; date: string | null; venue: string | null; city: string | null; ticket_url: string | null; }

async function post<T>(path: string, body: unknown, fallback: string): Promise<T> {
  const res = await apiFetch(path, { method: "POST", body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || fallback);
  return data as T;
}

export default function MusicManager({ onChange }: { onChange?: () => void } = {}) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [releases, setReleases] = useState<Release[]>([]);
  const [shows, setShows] = useState<Show[]>([]);

  // track form
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

  // release form
  const [rTitle, setRTitle] = useState("");
  const [rYear, setRYear] = useState("");
  const [rCover, setRCover] = useState("");
  const [rLink, setRLink] = useState("");
  const [rErr, setRErr] = useState("");
  const [rCoverUploading, setRCoverUploading] = useState(false);
  const rCoverInputRef = useRef<HTMLInputElement>(null);

  const handleRCoverFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRErr("");
    setRCoverUploading(true);
    try {
      setRCover(await compressAndResizeImage(file, 300, 300));
    } catch (err: any) {
      setRErr(err?.message || "Couldn't use that image. Try a JPG or PNG.");
    } finally {
      setRCoverUploading(false);
      if (e.target) e.target.value = "";
    }
  };

  // show form
  const [sDate, setSDate] = useState("");
  const [sVenue, setSVenue] = useState("");
  const [sCity, setSCity] = useState("");
  const [sTicket, setSTicket] = useState("");
  const [sErr, setSErr] = useState("");

  useEffect(() => {
    apiJson<Track[]>("/api/me/tracks").then(setTracks).catch(() => {});
    apiJson<Release[]>("/api/me/releases").then(setReleases).catch(() => {});
    apiJson<Show[]>("/api/me/shows").then(setShows).catch(() => {});
  }, []);

  const addTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setTErr("");
    const url = tUrl.trim();
    if (!url) return setTErr("Paste a link to the track.");
    try {
      const data = await post<Track>("/api/me/tracks", { url, title: tTitle.trim() }, "Couldn't add the track. Check the link and try again.");
      setTUrl("");
      setTTitle("");
      setTracks((p) => [...p, data]);
      onChange?.();
    } catch (err: any) {
      setTErr(err.message);
    }
  };

  const addRelease = async (e: React.FormEvent) => {
    e.preventDefault();
    setRErr("");
    if (!rTitle.trim()) return setRErr("Give the release a title.");
    try {
      const data = await post<Release>(
        "/api/me/releases",
        { title: rTitle.trim(), year: rYear.trim(), cover_url: rCover, link: rLink.trim() },
        "Couldn't add the release. Try again."
      );
      setReleases((p) => [data, ...p]);
      onChange?.();
      setRTitle("");
      setRYear("");
      setRCover("");
      setRLink("");
    } catch (err: any) {
      setRErr(err.message);
    }
  };

  const addShow = async (e: React.FormEvent) => {
    e.preventDefault();
    setSErr("");
    if (!sVenue.trim() && !sDate.trim()) return setSErr("Add at least a date or a venue.");
    try {
      const data = await post<Show>(
        "/api/me/shows",
        { date: sDate.trim(), venue: sVenue.trim(), city: sCity.trim(), ticket_url: sTicket.trim() },
        "Couldn't add the show. Try again."
      );
      setShows((p) => [...p, data]);
      onChange?.();
      setSDate("");
      setSVenue("");
      setSCity("");
      setSTicket("");
    } catch (err: any) {
      setSErr(err.message);
    }
  };

  const remove = async (kind: "tracks" | "releases" | "shows", id: number, what: string) => {
    if (!confirm(`Remove this ${what} from your page?`)) return;
    const res = await apiFetch(`/api/me/${kind}/${id}`, { method: "DELETE" });
    if (!res.ok) return;
    if (kind === "tracks") setTracks((p) => p.filter((x) => x.id !== id));
    if (kind === "releases") setReleases((p) => p.filter((x) => x.id !== id));
    if (kind === "shows") setShows((p) => p.filter((x) => x.id !== id));
    onChange?.();
  };

  const videoTracks = tracks.filter((t) => resolveEmbed(t.url)?.aspect);
  const audioTracks = tracks.filter((t) => !resolveEmbed(t.url)?.aspect);

  return (
    <div className="space-y-8">
      <EditorSection title="Tracks" hint="Spotify, SoundCloud, YouTube, Apple Music and [untitled] links play right on your page.">
        {tracks.length === 0 && <p className="mb-4 text-muted">No tracks yet.</p>}
        {videoTracks.length > 0 && (
          <ul className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {videoTracks.map((t) => (
              <li key={t.id}>
                <TrackEmbed url={t.url} title={t.title} />
                <button type="button" onClick={() => remove("tracks", t.id, "track")} className={`${removeBtn} mt-1`}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
        {audioTracks.length > 0 && (
          <ul className="mb-4 space-y-3">
            {audioTracks.map((t) => (
              <li key={t.id}>
                <TrackEmbed url={t.url} title={t.title} />
                <button type="button" onClick={() => remove("tracks", t.id, "track")} className={`${removeBtn} mt-1`}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
        <form onSubmit={addTrack} className="space-y-4 rounded-card border border-dashed border-line-strong p-4">
          <div>
            <FieldLabel htmlFor="track-url">Track link</FieldLabel>
            <input id="track-url" type="url" inputMode="url" placeholder="https://open.spotify.com/track/…" value={tUrl} onChange={(e) => setTUrl(e.target.value)} onBlur={handleTrackUrlBlur} className={inputClass} />
          </div>
          <div>
            <FieldLabel htmlFor="track-title" hint={tFetchingTitle ? "(getting the title…)" : "(optional)"}>Title</FieldLabel>
            <input id="track-title" type="text" value={tTitle} onChange={(e) => setTTitle(e.target.value)} className={inputClass} />
          </div>
          {tErr && <ErrorText>{tErr}</ErrorText>}
          <button type="submit" className={primaryBtn}>Add track</button>
        </form>
      </EditorSection>

      <EditorSection title="Releases" hint="Albums, EPs and singles. A Spotify, Apple Music or SoundCloud album link plays on your page; other links open in a new tab.">
        {releases.length === 0 ? (
          <p className="mb-4 text-muted">No releases yet.</p>
        ) : (
          <ul className="mb-4 space-y-2">
            {releases.map((r) => (
              <li key={r.id} className="flex items-center gap-3 rounded-btn border border-line p-3">
                {r.cover_url ? (
                  <img src={r.cover_url} alt="" className="h-12 w-12 shrink-0 rounded object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
                ) : (
                  <div aria-hidden className="h-12 w-12 shrink-0 rounded bg-surface-2" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{r.title}</p>
                  {r.year && <p className="text-sm text-subtle">{r.year}</p>}
                </div>
                <button type="button" onClick={() => remove("releases", r.id, "release")} className={`${removeBtn} shrink-0`}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
        <form onSubmit={addRelease} className="space-y-4 rounded-card border border-dashed border-line-strong p-4">
          <div className="grid gap-4 sm:grid-cols-[1fr_7rem]">
            <div>
              <FieldLabel htmlFor="rel-title">Title</FieldLabel>
              <input id="rel-title" type="text" value={rTitle} onChange={(e) => setRTitle(e.target.value)} className={inputClass} />
            </div>
            <div>
              <FieldLabel htmlFor="rel-year" hint="(optional)">Year</FieldLabel>
              <input id="rel-year" type="text" inputMode="numeric" placeholder="2026" value={rYear} onChange={(e) => setRYear(e.target.value)} className={inputClass} />
            </div>
          </div>
          <div>
            <FieldLabel hint="(optional)">Cover art</FieldLabel>
            <div className="flex items-center gap-4">
              {rCover ? (
                <img src={rCover} alt="Cover to add" className="h-16 w-16 shrink-0 rounded object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded border border-dashed border-line-strong text-xs text-subtle">No cover</div>
              )}
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => rCoverInputRef.current?.click()} disabled={rCoverUploading} className={secondaryBtn}>
                  {rCoverUploading ? "Preparing…" : rCover ? "Change cover" : "Upload cover"}
                </button>
                {rCover && (
                  <button type="button" onClick={() => setRCover("")} className="px-2 text-sm font-semibold text-muted hover:text-text">
                    Remove
                  </button>
                )}
              </div>
              <input type="file" ref={rCoverInputRef} onChange={handleRCoverFileChange} accept="image/*" className="hidden" />
            </div>
          </div>
          <div>
            <FieldLabel htmlFor="rel-link" hint="(optional)">Link</FieldLabel>
            <input id="rel-link" type="url" inputMode="url" placeholder="https://open.spotify.com/album/…" value={rLink} onChange={(e) => setRLink(e.target.value)} className={inputClass} />
          </div>
          {rErr && <ErrorText>{rErr}</ErrorText>}
          <button type="submit" className={primaryBtn}>Add release</button>
        </form>
      </EditorSection>

      <EditorSection title="Shows" hint="Upcoming dates. Add a ticket link and your page shows a Get tickets button.">
        {shows.length === 0 ? (
          <p className="mb-4 text-muted">No shows yet.</p>
        ) : (
          <ul className="mb-4 space-y-2">
            {shows.map((s) => (
              <li key={s.id} className="flex items-center gap-3 rounded-btn border border-line p-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{s.date || "Date to be announced"}</p>
                  <p className="truncate text-sm text-muted">{[s.venue, s.city].filter(Boolean).join(", ") || "Venue to be announced"}</p>
                </div>
                <button type="button" onClick={() => remove("shows", s.id, "show")} className={`${removeBtn} shrink-0`}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
        <form onSubmit={addShow} className="space-y-4 rounded-card border border-dashed border-line-strong p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel htmlFor="show-date">Date</FieldLabel>
              <input id="show-date" type="text" placeholder="Aug 14" value={sDate} onChange={(e) => setSDate(e.target.value)} className={inputClass} />
            </div>
            <div>
              <FieldLabel htmlFor="show-venue">Venue</FieldLabel>
              <input id="show-venue" type="text" value={sVenue} onChange={(e) => setSVenue(e.target.value)} className={inputClass} />
            </div>
            <div>
              <FieldLabel htmlFor="show-city" hint="(optional)">City</FieldLabel>
              <input id="show-city" type="text" value={sCity} onChange={(e) => setSCity(e.target.value)} className={inputClass} />
            </div>
            <div>
              <FieldLabel htmlFor="show-ticket" hint="(optional)">Ticket link</FieldLabel>
              <input id="show-ticket" type="url" inputMode="url" placeholder="https://…" value={sTicket} onChange={(e) => setSTicket(e.target.value)} className={inputClass} />
            </div>
          </div>
          {sErr && <ErrorText>{sErr}</ErrorText>}
          <button type="submit" className={primaryBtn}>Add show</button>
        </form>
      </EditorSection>
    </div>
  );
}
