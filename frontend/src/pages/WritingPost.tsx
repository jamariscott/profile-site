import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Layout from "../components/Layout";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

type Post = {
  slug: string;
  title: string;
  date: string;
  summary?: string;
  content: string;
};

export default function WritingPost() {
  const { slug } = useParams();
  const [post, setPost] = useState<Post | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "notfound" | "error">("loading");

  useEffect(() => {
    setStatus("loading");

    fetch(`${API_BASE}/api/writing`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((posts: Post[]) => {
        const match = posts.find((p) => p.slug === slug);
        if (!match) {
          setPost(null);
          setStatus("notfound");
          return;
        }
        setPost(match);
        setStatus("ready");
      })
      .catch((err) => {
        console.error("Writing post fetch failed:", err);
        setStatus("error");
      });
  }, [slug]);

  return (
    <Layout>
      {status === "loading" && <p className="text-neutral-500">Loading…</p>}

      {status === "error" && (
        <div className="space-y-2">
          <p className="text-neutral-500">Couldn’t load the post from the server.</p>
          <p className="text-sm text-neutral-500">
            Make sure{" "}
            <span className="font-mono">{API_BASE}/api/writing</span>{" "}
            loads JSON.
          </p>
          <Link to="/writing" className="text-sm underline">
            Back to Writing
          </Link>
        </div>
      )}

      {status === "notfound" && (
        <div className="space-y-2">
          <p className="text-neutral-500">Post not found.</p>
          <Link to="/writing" className="text-sm underline">
            Back to Writing
          </Link>
        </div>
      )}

      {status === "ready" && post && (
        <article className="max-w-2xl space-y-6">
          <header>
            <h1 className="text-3xl font-semibold tracking-tight">{post.title}</h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-neutral-400">{post.date}</p>
          </header>

          <div
            className="prose prose-lg prose-neutral max-w-none leading-relaxed dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </article>
      )}
    </Layout>
  );
}