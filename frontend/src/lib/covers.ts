// Ready-made profile covers from Pexels (free to use; credit shown on the
// profile). Each is cropped by Pexels' image CDN to the 3:1 cover shape.

export interface Cover {
  id: number;
  /** Profession theme id this cover suits, or "any". */
  for: string;
  alt: string;
  photographer: string;
  page: string;
}

const CDN = (id: number) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg`;

/** The full-size cover URL saved to the profile (style.cover_url). */
export const coverUrl = (id: number) => `${CDN(id)}?auto=compress&cs=tinysrgb&fit=crop&w=1800&h=600`;
/** A small thumbnail for the picker. */
export const coverThumb = (id: number) => `${CDN(id)}?auto=compress&cs=tinysrgb&fit=crop&w=420&h=140`;

export const COVERS: Cover[] = [
  { id: 13230484, for: "music", alt: "Concert crowd under colorful stage lights", photographer: "Lisa Fotios", page: "https://www.pexels.com/photo/crowd-of-people-at-a-concert-13230484/" },
  { id: 8197361, for: "music", alt: "Glowing knobs on a studio mixing console", photographer: "RDNE Stock project", page: "https://www.pexels.com/photo/close-up-of-a-console-in-a-music-recording-studio-8197361/" },
  { id: 8114323, for: "photographer", alt: "Developing prints in a red-lit darkroom", photographer: "Annushka Ahuja", page: "https://www.pexels.com/photo/man-developing-pictures-in-a-darkroom-8114323/" },
  { id: 38164076, for: "photographer", alt: "Film negatives on a light table", photographer: "Jakub Zerdzicki", page: "https://www.pexels.com/photo/photographer-reviewing-film-negatives-in-studio-38164076/" },
  { id: 34803969, for: "developer", alt: "Code on a laptop in a dim room", photographer: "Daniil Komov", page: "https://www.pexels.com/photo/focused-coding-session-with-laptop-and-coffee-34803969/" },
  { id: 33433724, for: "developer", alt: "Glowing monitor with code", photographer: "Jakub Zerdzicki", page: "https://www.pexels.com/photo/futuristic-workspace-with-coding-on-monitor-33433724/" },
  { id: 7481393, for: "creator", alt: "Filming a vlog with a ring light", photographer: "MART PRODUCTION", page: "https://www.pexels.com/photo/a-woman-vlogging-with-a-smartphone-7481393/" },
  { id: 6593779, for: "creator", alt: "Recording on a phone with a ring light", photographer: "Anna Shvets", page: "https://www.pexels.com/photo/woman-filming-vlog-on-smartphone-camera-6593779/" },
  { id: 1462226, for: "writer", alt: "Typing on a typewriter under a warm lamp", photographer: "Min An", page: "https://www.pexels.com/photo/person-typing-on-typewriter-1462226/" },
  { id: 7610808, for: "writer", alt: "Vintage desk with a typewriter and books", photographer: "cottonbro studio", page: "https://www.pexels.com/photo/vintage-typewriter-and-telephone-on-the-table-7610808/" },
  { id: 6985120, for: "any", alt: "Deep green and blue gradient", photographer: "Codioful", page: "https://www.pexels.com/photo/green-and-blue-gradient-6985120/" },
  { id: 12564253, for: "any", alt: "Abstract blue shapes on a warm background", photographer: "Steve A Johnson", page: "https://www.pexels.com/photo/close-up-of-blue-shape-12564253/" },
  { id: 29450014, for: "any", alt: "Abstract pink and blue shapes", photographer: "Steve A Johnson", page: "https://www.pexels.com/photo/abstract-pink-and-blue-digital-art-29450014/" },
];

/** The library cover behind a saved cover URL, if it is one (for the credit line). */
export function coverFor(url: string | undefined): Cover | undefined {
  if (!url) return undefined;
  return COVERS.find((c) => url.startsWith(CDN(c.id)));
}
