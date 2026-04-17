import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE } from '../lib/config';

interface Video {
  id: number;
  title: string;
  description: string;
  youtube_id: string;
  date: string;
  duration: string;
}

export default function Videos() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/videos`)
      .then(res => res.json())
      .then(data => {
        setVideos(data);
        setLoading(false);
      })
      .catch(err => console.error(err));
  }, []);

  const handleGridClick = () => {
    if (viewMode === 'grid') setCompact(!compact);
    else { setViewMode('grid'); setCompact(false); }
  };

  const handleListClick = () => {
    if (viewMode === 'list') setCompact(!compact);
    else { setViewMode('list'); setCompact(false); }
  };

  if (loading) return <div className="max-w-6xl mx-auto p-8">Loading videos...</div>;

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 bg-white min-h-screen">
      {/* Back to Home Link */}
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-600 mb-8 font-medium"
      >
        ← Home
      </Link>

      <div className="flex justify-between items-center mb-10">
        <h1 className="text-5xl font-bold text-zinc-900">Videos</h1>

        <div className="flex border border-zinc-200 rounded-3xl p-1 bg-white shadow-sm">
          <button onClick={handleGridClick} className={`px-6 py-3 rounded-3xl transition-all ${viewMode === 'grid' ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}>Grid</button>
          <button onClick={handleListClick} className={`px-6 py-3 rounded-3xl transition-all ${viewMode === 'list' ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}>List</button>
        </div>
      </div>

      {/* GRID VIEW */}
      {viewMode === 'grid' && (
        <div className={`grid ${compact ? 'grid-cols-1 md:grid-cols-3 gap-6' : 'grid-cols-1 md:grid-cols-2 gap-8'}`}>
          {videos.map((video) => (
            <div key={video.id} className="bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="aspect-video">
                <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${video.youtube_id}`} title={video.title} allowFullScreen className="w-full h-full" />
              </div>
              <div className={compact ? "p-5" : "p-8"}>
                <div className="flex justify-between text-sm mb-3">
                  <span className="text-zinc-500">{video.date}</span>
                  <span className="text-zinc-400">{video.duration}</span>
                </div>
                <h2 className="text-xl font-semibold text-zinc-900 mb-2">{video.title}</h2>
                <p className="text-zinc-600 text-sm line-clamp-3">{video.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* LIST VIEW */}
      {viewMode === 'list' && (
        <div className={compact ? "space-y-2" : "space-y-6"}>
          {videos.map((video) => (
            <div
              key={video.id}
              className={`flex gap-4 bg-white border border-zinc-200 rounded-3xl hover:shadow-md transition-shadow ${
                compact ? 'p-3' : 'p-6'
              }`}
            >
              {!compact && (
                <div className="w-44 h-28 flex-shrink-0 rounded-2xl overflow-hidden">
                  <img src={`https://img.youtube.com/vi/${video.youtube_id}/hqdefault.jpg`} alt={video.title} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between text-xs text-zinc-500 mb-1">
                  <span>{video.date}</span>
                  <span>{video.duration}</span>
                </div>
                <h2 className={`font-semibold text-zinc-900 ${compact ? 'text-base' : 'text-2xl'} mb-1`}>
                  {video.title}
                </h2>
                <p className={`text-zinc-600 ${compact ? 'text-xs line-clamp-2' : 'line-clamp-3'}`}>
                  {video.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}