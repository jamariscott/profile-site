import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import Section from "../components/Section";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

type Post = {
  slug: string;
  title: string;
  date: string;
  summary: string;
  content: string;
};

export default function Writing() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorText, setErrorText] = useState<string>("");

  useEffect(() => {
    setStatus("loading");

    fetch(`${API_BASE}/api/writing`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (!Array.isArray(data)) {
          throw new Error(`Expected array from /api/writing, got ${typeof data}`);
        }
        setPosts(data);
        setStatus("ready");
      })
      .catch((err) => {
        console.error("Writing list fetch failed:", err);
        setErrorText(String(err));
        setStatus("error");
      });
  }, []);

  return (
    <Layout>
      <Section title="Writing">
        {status === "loading" && (
          <p className="text-neutral-500">Loading…</p>
        )}

        {status === "error" && (
          <div className="space-y-2">
            <p className="text-neutral-500">
              Couldn’t load writing from the server.
            </p>
            <p className="text-sm text-neutral-500">
              Make sure{" "}
              <span className="font-mono">{API_BASE}/api/writing</span>{" "}
              returns a JSON array.
            </p>
            {errorText && (
              <pre className="mt-4 whitespace-pre-wrap rounded border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">
                {errorText}
              </pre>
            )}
          </div>
        )}

        {status === "ready" && (
          <div className="space-y-10">
            {posts.map((post) => (
              <article key={post.slug} className="group">
                <h2 className="text-xl font-medium">
                  <Link
                    to={`/writing/${post.slug}`}
                    className="hover:underline"
                  >
                    {post.title}
                  </Link>
                </h2>

                <p className="mt-2 text-sm text-gray-500 dark:text-neutral-400">
                  {post.date}
                </p>

                <p className="mt-4 leading-relaxed text-gray-700 dark:text-neutral-300">
                  {post.summary}
                </p>

                <div className="mt-8 h-px w-full bg-neutral-200 dark:bg-neutral-800" />
              </article>
            ))}
          </div>
        )}
      </Section>
    </Layout>
  );
}