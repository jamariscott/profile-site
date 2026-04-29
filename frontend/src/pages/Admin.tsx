import { useState } from 'react';
import { API_BASE } from '../lib/config';

interface WritingPost {
  slug: string;
  title: string;
  date: string;
  summary: string;
  content: string;
  x_posted: boolean;
  x_tweet_id?: string;
}

export default function Admin() {
  const [posts, setPosts] = useState<WritingPost[]>([]);
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [newPost, setNewPost] = useState({
    title: '',
    summary: '',
    content: '',
    postToX: false,
    sponsorLogo: ''
  });

  const loadPosts = () => {
    fetch(`${API_BASE}/api/admin/writing?password=${password}`)
      .then(res => res.json())
      .then(data => setPosts(data));
  };

  const createPost = () => {
    fetch(`${API_BASE}/api/admin/writing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newPost, password })
    }).then(() => {
      alert('✅ Article created!');
      setNewPost({ title: '', summary: '', content: '', postToX: false, sponsorLogo: '' });
      loadPosts();
    });
  };

  const publishToX = (slug: string) => {
    if (!confirm('Publish this post to X.com now?')) return;
    fetch(`${API_BASE}/api/admin/publish-to-x/${slug}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    }).then(() => loadPosts());
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-4xl font-bold mb-8">Admin Panel</h1>

      {!isLoggedIn ? (
        <div>
          <input 
            type="password" 
            placeholder="Enter admin password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            className="border p-3 w-full rounded-2xl mb-4" 
          />
          <button 
            onClick={() => { setIsLoggedIn(true); loadPosts(); }} 
            className="bg-black text-white px-6 py-3 rounded-2xl"
          >
            Login
          </button>
        </div>
      ) : (
        <>
          <div className="border border-zinc-200 rounded-3xl p-6 mb-10">
            <h2 className="text-2xl font-semibold mb-4">Create New Article</h2>
            <input type="text" placeholder="Title" value={newPost.title} onChange={e => setNewPost({...newPost, title: e.target.value})} className="border p-3 w-full rounded-2xl mb-3" />
            <input type="text" placeholder="Summary" value={newPost.summary} onChange={e => setNewPost({...newPost, summary: e.target.value})} className="border p-3 w-full rounded-2xl mb-3" />
            <textarea placeholder="Content" value={newPost.content} onChange={e => setNewPost({...newPost, content: e.target.value})} className="border p-3 w-full rounded-2xl h-40 mb-4" />

            <label className="flex items-center gap-2 text-sm mb-4">
              <input type="checkbox" checked={newPost.postToX} onChange={e => setNewPost({...newPost, postToX: e.target.checked})} />
              Also post to X.com
            </label>

            <input 
              type="text" 
              placeholder="Sponsor logo URL (optional)" 
              value={newPost.sponsorLogo} 
              onChange={e => setNewPost({...newPost, sponsorLogo: e.target.value})} 
              className="border p-3 w-full rounded-2xl"
            />

            <button onClick={createPost} className="mt-6 bg-black text-white px-8 py-4 rounded-2xl">Create Article</button>
          </div>

          <h2 className="text-2xl font-semibold mb-4">Existing Articles</h2>
          <div className="space-y-4">
            {posts.map(post => (
              <div key={post.slug} className="border border-zinc-200 rounded-3xl p-6 flex justify-between items-center">
                <div>
                  <h3 className="font-semibold">{post.title}</h3>
                  <p className="text-sm text-zinc-500">{post.date}</p>
                </div>
                <div className="flex items-center gap-4">
                  {post.x_posted ? (
                    <span className="text-green-600 text-sm">✅ Posted to X</span>
                  ) : (
                    <button onClick={() => publishToX(post.slug)} className="text-blue-600 hover:text-blue-700 text-sm">
                      Publish to X now
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}