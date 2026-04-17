import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../lib/config';

export default function Admin() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [content, setContent] = useState('');
  const [message, setMessage] = useState('');
  const [posts, setPosts] = useState<any[]>([]);
  const navigate = useNavigate();

  // Fetch all posts
  const fetchPosts = async () => {
    if (!password) return;
    const res = await fetch(`${API_BASE}/api/admin/writing?password=${encodeURIComponent(password)}`);
    if (res.ok) {
      const data = await res.json();
      setPosts(data);
    }
  };

  useEffect(() => {
    if (password) fetchPosts();
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`${API_BASE}/api/admin/writing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, date, content, password })
    });

    const data = await res.json();
    if (res.ok) {
      setMessage(`✅ "${title}" published!`);
      setTitle('');
      setDate('');
      setContent('');
      fetchPosts(); // instant update list
    } else {
      setMessage(`❌ ${data.detail || 'Wrong password'}`);
    }
  };

  const handleDelete = async (slug: string) => {
    if (!confirm(`Delete "${slug}"?`)) return;
    const res = await fetch(`${API_BASE}/api/admin/writing/${slug}?password=${encodeURIComponent(password)}`, {
      method: 'DELETE'
    });
    if (res.ok) {
      setMessage(`🗑️ "${slug}" deleted`);
      fetchPosts(); // instant update
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 bg-white min-h-screen">
      <h1 className="text-4xl font-bold mb-8">Admin Panel</h1>

      {/* Create Form */}
      <form onSubmit={handleSubmit} className="space-y-6 mb-16">
        <div>
          <label className="block text-sm font-medium mb-1">Admin Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-zinc-300 rounded-2xl focus:outline-none focus:border-zinc-400 pr-12"
              required
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-xl text-zinc-400 hover:text-zinc-600">
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-3 border border-zinc-300 rounded-2xl" required />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Date (YYYY-MM-DD)</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-4 py-3 border border-zinc-300 rounded-2xl" required />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Content (Markdown)</label>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={12} className="w-full px-4 py-3 border border-zinc-300 rounded-3xl font-mono text-sm" required />
        </div>

        <button type="submit" className="w-full py-4 bg-zinc-900 text-white rounded-3xl font-medium hover:bg-black transition-colors">
          Publish New Article
        </button>
      </form>

      {message && <div className={`mb-8 p-4 rounded-2xl ${message.startsWith('✅') || message.startsWith('🗑️') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{message}</div>}

      {/* List of Existing Articles */}
      <h2 className="text-2xl font-semibold mb-6">Existing Articles ({posts.length})</h2>
      <div className="space-y-4">
        {posts.map((post) => (
          <div key={post.slug} className="flex justify-between items-center border border-zinc-200 rounded-3xl p-6">
            <div>
              <h3 className="font-semibold">{post.title}</h3>
              <p className="text-sm text-zinc-500">{post.date} • {post.slug}</p>
            </div>
            <button onClick={() => handleDelete(post.slug)} className="text-red-500 hover:text-red-700 px-4 py-2">Delete</button>
          </div>
        ))}
      </div>

      <button onClick={() => navigate('/')} className="mt-12 text-zinc-500 hover:text-zinc-700">
        ← Back to Home
      </button>
    </div>
  );
}