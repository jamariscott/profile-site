import { useEffect, useState } from "react";
import { apiJson, apiFetch } from "../lib/api";
import RichTextEditor from "./RichTextEditor";

interface Post {
  id: number;
  title: string;
  body: string | null;
  created_at: string | null;
}

export default function PostManager() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => {
    apiJson<Post[]>("/api/me/posts").then(setPosts).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const addPost = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!title.trim()) { setError("A title is required."); return; }
    setSaving(true);
    try {
      const res = await apiFetch("/api/me/posts", {
        method: "POST",
        body: JSON.stringify({ title: title.trim(), body }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "Could not add post");
      setPosts((p) => [data, ...p]);
      setTitle(""); setBody("");
    } catch (err: any) {
      setError(err?.message || "Could not add post");
    } finally {
      setSaving(false);
    }
  };

  const delPost = async (id: number) => {
    if (!confirm("Delete this post?")) return;
    const res = await apiFetch(`/api/me/posts/${id}`, { method: "DELETE" });
    if (res.ok) setPosts((p) => p.filter((x) => x.id !== id));
  };

  return (
    <div>
      <h3 className="text-text font-semibold mb-1">Posts</h3>
      <p className="text-muted text-xs mb-4">Short essays and writing that show on your public profile.</p>

      {posts.length > 0 && (
        <div className="space-y-3 mb-6">
          {posts.map((p) => (
            <div key={p.id} className="border border-line rounded-btn p-4 flex justify-between items-start gap-4">
              <div className="min-w-0">
                <h4 className="text-text font-semibold">{p.title}</h4>
                {p.created_at && (
                  <span className="text-subtle text-xs">
                    {new Date(p.created_at).toLocaleDateString()}
                  </span>
                )}
              </div>
              <button onClick={() => delPost(p.id)} className="text-danger hover:opacity-80 text-sm shrink-0">Delete</button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={addPost} className="space-y-3">
        <input
          type="text"
          placeholder="Post title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border border-line bg-surface text-text p-3 rounded-btn w-full"
        />
        <div className="border border-line rounded-btn p-3 bg-surface">
          <RichTextEditor value={body} onChange={setBody} placeholder="Write your post…" />
        </div>
        {error && <p className="text-danger text-sm">{error}</p>}
        <button type="submit" disabled={saving || !title.trim()} className="bg-accent text-accent-contrast px-6 py-2.5 rounded-btn font-medium disabled:opacity-50">
          {saving ? "Publishing…" : "Publish post"}
        </button>
      </form>
    </div>
  );
}
