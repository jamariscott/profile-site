import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch, apiJson } from "../lib/api";
import { useAuth } from "../lib/auth";

interface CommentItem {
  id: number;
  body: string;
  author: string;
  created_at: string | null;
}

export default function Comments({ slug }: { slug: string }) {
  const session = useAuth();
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const load = () => {
    apiJson<CommentItem[]>(`/api/writing/${slug}/comments`)
      .then(setComments)
      .catch(() => {});
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    setSubmitting(true);
    setError("");
    setNotice("");
    try {
      const res = await apiFetch(`/api/writing/${slug}/comments`, {
        method: "POST",
        body: JSON.stringify({ body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to post comment");
      setBody("");
      setNotice("Thanks! Your comment is awaiting approval.");
    } catch (err: any) {
      setError(err?.message || "Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="max-w-3xl mx-auto px-6 mt-16">
      <h2 className="text-2xl font-bold text-text mb-6">Comments</h2>

      {comments.length === 0 ? (
        <p className="text-muted text-sm mb-8">No comments yet. Be the first.</p>
      ) : (
        <div className="space-y-5 mb-8">
          {comments.map((c) => (
            <div key={c.id} className="border-b border-line pb-5">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-text font-medium text-sm">{c.author}</span>
                {c.created_at && (
                  <span className="text-subtle text-xs">
                    {new Date(c.created_at).toLocaleDateString()}
                  </span>
                )}
              </div>
              <p className="text-text text-sm whitespace-pre-wrap">{c.body}</p>
            </div>
          ))}
        </div>
      )}

      {session ? (
        <form onSubmit={submit}>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Add a comment…"
            rows={4}
            className="border border-line bg-surface text-text p-3 w-full rounded-btn mb-3"
          />
          {error && <p className="text-danger text-sm mb-2">{error}</p>}
          {notice && <p className="text-success text-sm mb-2">{notice}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="bg-accent text-accent-contrast px-6 py-2.5 rounded-btn font-medium disabled:opacity-50"
          >
            {submitting ? "Posting…" : "Post comment"}
          </button>
          <p className="text-subtle text-xs mt-2">Comments are reviewed before they appear.</p>
        </form>
      ) : (
        <p className="text-muted text-sm">
          <Link to="/login" className="text-accent hover:text-accent-hover font-medium">
            Log in
          </Link>{" "}
          to join the conversation.
        </p>
      )}
    </section>
  );
}
