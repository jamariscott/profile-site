import { apiJson } from "./api";

export interface ProfileResult { username: string; display_name: string; headline: string | null; avatar_url: string | null; }
export interface ArticleResult { slug: string; title: string; summary: string | null; date: string | null; }
export interface VideoResult { id: number; title: string; youtube_id: string; }

export interface SearchResults {
  profiles: ProfileResult[];
  articles: ArticleResult[];
  videos: VideoResult[];
}

export const EMPTY_SEARCH_RESULTS: SearchResults = { profiles: [], articles: [], videos: [] };

/** Hits the real site search endpoint; resolves to empty results on any failure or a too-short query. */
export async function fetchSearch(q: string): Promise<SearchResults> {
  const query = q.trim();
  if (query.length < 2) return EMPTY_SEARCH_RESULTS;
  try {
    return await apiJson<SearchResults>(`/api/search?q=${encodeURIComponent(query)}`);
  } catch {
    return EMPTY_SEARCH_RESULTS;
  }
}
