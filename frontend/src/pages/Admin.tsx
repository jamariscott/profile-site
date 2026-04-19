import { useState, useEffect } from "react";
import { API_BASE } from "../lib/config";

interface WritingPost {
  id: number;
  slug: string;
  title: string;
  date: string;
  summary: string;
  x_posted: boolean;
  x_tweet_id?: string;
}

export default function Admin() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [posts, setPosts] = useState<WritingPost[]>([]);
  const [newPost, setNewPost] = useState({
    title: "",
    slug: "",
    summary: "",
    content: "",
    postToX: false,           // ← new checkbox
  });
  const [message, setMessage] = useState("");

  const fetchPosts = async () => {
    const res = await fetch(`${API_BASE}/api/admin/writing`, {
      headers: { Authorization: `Bearer ${password}` },
    });
    if (res.ok) {
      const data = await res.json();
      setPosts(data);
    }
  };

  const createPost = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`${API_BASE}/api/admin/writing`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${password}`,
      },
      body: JSON.stringify({
        title: newPost.title,
        slug: newPost.slug || newPost.title.toLowerCase().replace(/\s+/g, "-"),
        summary: newPost.summary,
        content: newPost.content,
        postToX: newPost.postToX,        // ← send checkbox value
      }),
    });

    if (res.ok) {
      setMessage("✅ Post created!");
      setNewPost({ title: "", slug: "", summary: "", content: "", postToX: false });
      fetchPosts();
    } else {
      setMessage("❌ Failed to create post");
    }
  };

  const publishToX = async (id: number) => {
    const res = await fetch(`${API_BASE}/api/admin/writing/${id}/publish-to-x`, {
      method: "POST",
      headers: { Authorization: `Bearer ${password}` },
    });

    if (res.ok) {
      setMessage("✅ Posted to X.com!");
      fetchPosts();
    } else {
      setMessage("❌ Failed to post to X");
    }
  };

  useEffect(() => {
    if (password) fetchPosts();
  }, [password]);

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-4xl font-bold mb-8">Admin Panel</h1>

      {/* Password */}
      <div className="mb-8">
        <label className="block text-sm mb-2">Admin Password</label>
        <div className="flex gap-2">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="flex-1 border border-zinc-300 rounded-2xl px-4 py-3"
            placeholder="Enter password"
          />
          <button
            onClick={() => setShowPassword(!showPassword)}
            className="px-6 bg-zinc-100 rounded-2xl hover:bg-zinc-200"
          >
            {showPassword ? "🙈" : "👁️"}
          </button>
        </div>
      </div>

      {message && <p className="mb-6 text-green-600">{message}</p>}

      {/* Create new post */}
      <form onSubmit={createPost} className="border border-zinc-200 rounded-3xl p-6 mb-12">
        <h2 className="text-2xl font-semibold mb-4">New Article</h2>
        <input
          type="text"
          placeholder="Title"
          value={newPost.title}
          onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
          className="w-full border border-zinc-200 rounded-2xl px-4 py-3 mb-4"
          required
        />
        <input
          type="text"
          placeholder="Slug (optional)"
          value={newPost.slug}
          onChange={(e) => setNewPost({ ...newPost, slug: e.target.value })}
          className="w-full border border-zinc-200 rounded-2xl px-4 py-3 mb-4"
        />
        <textarea
          placeholder="Summary"
          value={newPost.summary}
          onChange={(e) => setNewPost({ ...newPost, summary: e.target.value })}
          className="w-full border border-zinc-200 rounded-2xl px-4 py-3 mb-4 h-20"
        />
        <textarea
          placeholder="Full content (Markdown supported)"
          value={newPost.content}
          onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
          className="w-full border border-zinc-200 rounded-2xl px-4 py-3 mb-6 h-64"
          required
        />

        {/* NEW: Post to X checkbox */}
        <label className="flex items-center gap-2 mb-6 cursor-pointer">
          <input
            type="checkbox"
            checked={newPost.postToX}
            onChange={(e) => setNewPost({ ...newPost, postToX: e.target.checked })}
          />
          <span className="text-zinc-700">Also post to X.com immediately</span>
        </label>

        <button
          type="submit"
          className="bg-black text-white px-8 py-4 rounded-2xl font-medium hover:bg-zinc-800"
        >
          Create Article
        </button>
      </form>

      {/* List of posts */}
      <h2 className="text-2xl font-semibold mb-4">All Articles ({posts.length})</h2>
      <div className="space-y-4">
        {posts.map((post) => (
          <div key={post.id} className="border border-zinc-200 rounded-3xl p-6 flex justify-between items-center">
            <div>
              <h3 className="font-semibold">{post.title}</h3>
              <p className="text-sm text-zinc-500">{post.date}</p>
            </div>
            <div className="flex items-center gap-4">
              {post.x_posted ? (
                <span className="text-green-600 text-sm font-medium">✅ Posted to X</span>
              ) : (
                <button
                  onClick={() => publishToX(post.id)}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Publish to X now
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}