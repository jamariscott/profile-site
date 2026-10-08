import { useEffect, useState } from "react";
import { EditorSection, ErrorText, FieldLabel, inputClass, primaryBtn, removeBtn } from "./ui";
import { apiJson, apiFetch } from "../lib/api";
import RichTextEditor from "./RichTextEditor";
import { formatDate } from "../lib/format";

interface Post {
  id: number;
  title: string;
  body: string | null;
  created_at: string | null;
}

export default function PostManager({ onChange }: { onChange?: () => void } = {}) {
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
    if (!title.trim()) { setError("Give your post a title."); return; }
    setSaving(true);
    try {
      const res = await apiFetch("/api/me/posts", {
        method: "POST",
        body: JSON.stringify({ title: title.trim(), body }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "Couldn't publish the post. Try again.");
      setPosts((p) => [data, ...p]);
      onChange?.();
      setTitle(""); setBody("");
    } catch (err: any) {
      setError(err?.message || "Couldn't publish the post. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const delPost = async (id: number) => {
    if (!confirm("Delete this post? This can't be undone.")) return;
    const res = await apiFetch(`/api/me/posts/${id}`, { method: "DELETE" });
    if (res.ok) {
      setPosts((p) => p.filter((x) => x.id !== id));
      onChange?.();
    }
  };

  return (
    <div className="space-y-6">
      {posts.length > 0 ? (
        <ul className="space-y-3">
          {posts.map((p) => (
            <li key={p.id} className="flex items-start justify-between gap-4 rounded-btn border border-line p-4">
              <div className="min-w-0">
                <h3 className="font-semibold">{p.title}</h3>
                {p.created_at && (
                  <time dateTime={p.created_at} className="text-sm text-subtle">
                    Published {formatDate(p.created_at)}
                  </time>
                )}
              </div>
              <button type="button" onClick={() => delPost(p.id)} className={`${removeBtn} shrink-0`}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted">No posts yet. Write your first one below.</p>
      )}

      <EditorSection title="Write a post" hint="Short essays and writing that appear on your page.">
        <form onSubmit={addPost} className="space-y-4">
          <div>
            <FieldLabel htmlFor="post-title">Title</FieldLabel>
            <input id="post-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
          </div>
          <div>
            <FieldLabel>Post</FieldLabel>
            <div className="rounded-btn border-2 border-line-strong bg-surface p-3 focus-within:border-text">
              <RichTextEditor value={body} onChange={setBody} placeholder="Start writing…" />
            </div>
          </div>
          {error && <ErrorText>{error}</ErrorText>}
          <button type="submit" disabled={saving} className={primaryBtn}>
            {saving ? "Publishing…" : "Publish post"}
          </button>
        </form>
      </EditorSection>
    </div>
  );
}
