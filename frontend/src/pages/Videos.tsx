import { useEffect, useState } from 'react';
import { API_BASE } from '../App';   // reuses the same API_BASE you already have

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

  useEffect(() => {
    fetch(`${API_BASE}/api/videos`)
      .then(res => res.json())
      .then(data => {
        setVideos(data);
        setLoading(false);
      })
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-4xl font-bold mb-8">Videos</h1>
      
      {loading ? (
        <p>Loading videos...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {videos.map(video => (
            <div key={video.id} className="bg-zinc-900 rounded-xl overflow-hidden">
              <iframe
                width="100%"
                height="315"
                src={`https://www.youtube.com/embed/${video.youtube_id}`}
                title={video.title}
                allowFullScreen
                className="w-full"
              />
              <div className="p-6">
                <div className="flex justify-between text-sm text-zinc-400 mb-2">
                  <span>{video.date}</span>
                  <span>{video.duration}</span>
                </div>
                <h2 className="text-2xl font-semibold mb-3">{video.title}</h2>
                <p className="text-zinc-300">{video.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}