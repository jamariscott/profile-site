import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch, apiJson } from "../lib/api";
import { useAuth } from "../lib/auth";
import { formatDate } from "../lib/format";
import { inputClass } from "./AuthFields";

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
      if (!res.ok) throw new Error(data.detail || "Couldn't post your comment. Try again.");
      setBody("");
      setNotice("Comment sent. It will appear once it's approved.");
    } catch (err: any) {
      setError(err?.message || "Couldn't post your comment. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section aria-labelledby="comments-heading" className="mx-auto mt-16 max-w-3xl border-t border-line px-4 pt-10 sm:px-6">
      <h2 id="comments-heading" className="font-heading text-3xl font-extrabold tracking-tight [font-stretch:85%]">
        Comments{comments.length > 0 && <span className="ml-2 text-lg font-semibold text-subtle">{comments.length}</span>}
      </h2>

      {comments.length === 0 ? (
        <p className="mb-8 mt-3 text-muted">No comments yet. Start the conversation.</p>
      ) : (
        <ul className="mb-10 mt-6 divide-y divide-line">
          {comments.map((c) => (
            <li key={c.id} className="py-5">
              <div className="mb-1 flex items-baseline gap-3">
                <span className="font-semibold text-text">{c.author}</span>
                {c.created_at && (
                  <time dateTime={c.created_at} className="text-sm text-subtle">
                    {formatDate(c.created_at)}
                  </time>
                )}
              </div>
              <p className="whitespace-pre-wrap text-text">{c.body}</p>
            </li>
          ))}
        </ul>
      )}

      {session ? (
        <form onSubmit={submit} className="mt-6">
          <label htmlFor="comment-body" className="mb-1.5 block text-sm font-semibold text-text">
            Add a comment
          </label>
          <textarea
            id="comment-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            className={`${inputClass} mb-3`}
          />
          {error && <p role="alert" className="mb-2 text-sm font-medium text-danger">{error}</p>}
          {notice && <p role="status" className="mb-2 text-sm font-medium text-success">{notice}</p>}
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-btn bg-accent px-6 py-3 font-semibold text-accent-contrast transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Posting…" : "Post comment"}
            </button>
            <p className="text-sm text-subtle">Comments are reviewed before they appear.</p>
          </div>
        </form>
      ) : (
        <p className="mt-6 text-muted">
          <Link
            to={`/login?next=${encodeURIComponent(`/writing/${slug}`)}`}
            className="font-semibold text-text underline decoration-highlight decoration-2 underline-offset-4"
          >
            Log in
          </Link>{" "}
          to join the conversation.
        </p>
      )}
    </section>
  );
}
