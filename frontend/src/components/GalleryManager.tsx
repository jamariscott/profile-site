import { useEffect, useState, useRef } from "react";
import { EditorSection, ErrorText, FieldLabel, inputClass, primaryBtn, removeBtn, secondaryBtn } from "./ui";
import { apiJson, apiFetch } from "../lib/api";
import { compressAndResizeImage } from "../lib/upload";

interface Photo {
  id: number;
  image_url: string;
  caption: string | null;
}

export default function GalleryManager({ onChange }: { onChange?: () => void } = {}) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [caption, setCaption] = useState("");
  const [pending, setPending] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => {
    apiJson<Photo[]>("/api/me/photos").then(setPhotos).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const base64 = await compressAndResizeImage(file, 1400, 1400);
      setPending(base64);
    } catch (err: any) {
      setError(err?.message || "Couldn't use that image. Try a JPG or PNG.");
    } finally {
      setUploading(false);
      if (e.target) e.target.value = "";
    }
  };

  const addPhoto = async () => {
    if (!pending) { setError("Choose an image first."); return; }
    setError("");
    try {
      const res = await apiFetch("/api/me/photos", {
        method: "POST",
        body: JSON.stringify({ image_url: pending, caption: caption.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "Couldn't add the photo. Try again.");
      setPhotos((p) => [...p, data]);
      onChange?.();
      setPending(""); setCaption("");
    } catch (err: any) {
      setError(err?.message || "Couldn't add the photo. Try again.");
    }
  };

  const delPhoto = async (id: number) => {
    if (!confirm("Remove this photo from your gallery?")) return;
    const res = await apiFetch(`/api/me/photos/${id}`, { method: "DELETE" });
    if (res.ok) {
      setPhotos((p) => p.filter((x) => x.id !== id));
      onChange?.();
    }
  };

  return (
    <div className="space-y-6">
      {photos.length > 0 ? (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {photos.map((ph) => (
            <li key={ph.id}>
              <div className="aspect-square overflow-hidden rounded-card border border-line bg-surface-2">
                <img src={ph.image_url} alt={ph.caption || ""} loading="lazy" className="h-full w-full object-cover" />
              </div>
              <div className="mt-1.5 flex items-center justify-between gap-2">
                <p className="min-w-0 truncate text-sm text-muted">{ph.caption || "No caption"}</p>
                <button type="button" onClick={() => delPhoto(ph.id)} className={removeBtn}>
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted">No photos yet. Add your first one below.</p>
      )}

      <EditorSection title="Add a photo">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          {pending ? (
            <img src={pending} alt="Photo to add" className="h-28 w-28 shrink-0 rounded-card border border-line object-cover" />
          ) : (
            <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-card border border-dashed border-line-strong text-sm text-subtle">
              No photo
            </div>
          )}
          <div className="min-w-0 flex-1 space-y-4">
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className={secondaryBtn}>
              {uploading ? "Preparing…" : pending ? "Choose a different photo" : "Choose a photo"}
            </button>
            <input type="file" ref={fileRef} onChange={handleFile} accept="image/*" className="hidden" />
            <div>
              <FieldLabel htmlFor="photo-caption" hint="(optional)">Caption</FieldLabel>
              <input id="photo-caption" type="text" value={caption} onChange={(e) => setCaption(e.target.value)} className={inputClass} />
            </div>
            {error && <ErrorText>{error}</ErrorText>}
            <button type="button" onClick={addPhoto} disabled={!pending} className={primaryBtn}>
              Add photo
            </button>
          </div>
        </div>
      </EditorSection>
    </div>
  );
}
