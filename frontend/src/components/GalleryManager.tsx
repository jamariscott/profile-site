import { useEffect, useState, useRef } from "react";
import { apiJson, apiFetch } from "../lib/api";
import { compressAndResizeImage } from "../lib/upload";

interface Photo {
  id: number;
  image_url: string;
  caption: string | null;
}

export default function GalleryManager() {
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
      setError(err?.message || "Failed to process image.");
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
      if (!res.ok) throw new Error(data.detail || "Could not add photo");
      setPhotos((p) => [...p, data]);
      setPending(""); setCaption("");
    } catch (err: any) {
      setError(err?.message || "Could not add photo");
    }
  };

  const delPhoto = async (id: number) => {
    const res = await apiFetch(`/api/me/photos/${id}`, { method: "DELETE" });
    if (res.ok) setPhotos((p) => p.filter((x) => x.id !== id));
  };

  return (
    <div>
      <h3 className="text-text font-semibold mb-3">Gallery</h3>

      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          {photos.map((ph) => (
            <div key={ph.id} className="space-y-1">
              <div className="aspect-square rounded-btn overflow-hidden bg-surface-2 border border-line">
                <img src={ph.image_url} alt={ph.caption || ""} className="w-full h-full object-cover" />
              </div>
              {ph.caption && <p className="text-subtle text-xs truncate">{ph.caption}</p>}
              <button onClick={() => delPhoto(ph.id)} className="text-danger hover:opacity-80 text-xs">Remove</button>
            </div>
          ))}
        </div>
      )}

      <div className="border border-line rounded-btn p-4 space-y-3">
        <div className="flex items-center gap-4">
          {pending ? (
            <img src={pending} alt="Preview" className="w-20 h-20 rounded-btn object-cover border border-line shrink-0" />
          ) : (
            <div className="w-20 h-20 rounded-btn bg-surface-2 border border-line flex items-center justify-center text-subtle text-xs shrink-0">
              No image
            </div>
          )}
          <div className="flex-1 space-y-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="bg-surface-2 border border-line text-text hover:border-line-strong px-4 py-2.5 rounded-btn font-medium text-sm transition-all"
            >
              {uploading ? "Processing…" : pending ? "Choose a different image" : "Choose image"}
            </button>
            <input type="file" ref={fileRef} onChange={handleFile} accept="image/*" className="hidden" />
            <input
              type="text"
              placeholder="Caption (optional)"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="border border-line bg-surface text-text p-2.5 rounded-btn w-full text-sm"
            />
          </div>
        </div>
        {error && <p className="text-danger text-sm">{error}</p>}
        <button
          onClick={addPhoto}
          disabled={!pending}
          className="bg-accent text-accent-contrast px-5 py-2.5 rounded-btn font-medium disabled:opacity-50"
        >
          Add photo
        </button>
      </div>
    </div>
  );
}
