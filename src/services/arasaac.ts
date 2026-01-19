// src/services/arasaac.ts
// Lightweight client for ARASAAC public API (client-side, no proxy)
// See ARASAAC API docs for endpoints and terms.
// Notes: this file intentionally avoids sending any secret keys (none required for public endpoints).

export type ArasaacPictogram = {
  id: number;
  keywords: string[];
  keywords_en?: string[]; // sometimes language-specific fields
  concepts?: string[];
  pack?: string | null;
  titulo?: string; // title in Spanish site
  // plus additional fields returned by the API
  [k: string]: any;
};

export type Term = {
  id: string; // your internal id (e.g., `arasaac:1234`)
  source: "arasaac";
  sourceId: number;
  label: string;
  tags: string[];
  defaultImageUrl: string; // remote static URL (resolves to PNG)
  license?: {
    name: string;
    url?: string;
  };
  // optional: local blob key or Dexie ref after we download it
  localImageKey?: string | null;
  // other metadata you want
};

const API_BASE = "https://api.arasaac.org";
const STATIC_BASE = "https://static.arasaac.org/pictograms";

/**
 * Helper: get static image url for given pictogram id and size
 * size options: 300, 500, 2500 (ARASAAC supports those)
 */
export function getImageUrlForId(id: number, size: 500): string {
  return `${STATIC_BASE}/${id}/${id}_${size}.png`;
}

/**
 * Search pictograms by language + query
 * language: 'en' (we're using English only for now)
 * returns an array of minimal ArasaacPictogram objects
 */
export async function searchPictograms(language: string, q: string): Promise<ArasaacPictogram[]> {
  const url = `${API_BASE}/pictograms/${encodeURIComponent(language)}/search/${encodeURIComponent(q)}`;
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`ARASAAC search failed: ${res.status} ${body}`);
  }
  const json = await res.json();
  // ARASAAC returns an array of pictogram objects
  return json as ArasaacPictogram[];
}

/**
 * Get a pictogram by id (language-aware)
 */
export async function getPictogram(language: string, id: number): Promise<ArasaacPictogram> {
  const url = `${API_BASE}/pictograms/${encodeURIComponent(language)}/${id}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`ARASAAC get pictogram failed: ${res.status}`);
  return (await res.json()) as ArasaacPictogram;
}

/**
 * Normalize an ARASAAC pictogram object to our Term shape
 */
export function normalizePictogramToTerm(p: ArasaacPictogram, language = "en"): Term {
  // ARASAAC fields differ across endpoints; we map conservatively
  const title =
    (p && (p.keyword || p.title || p.titulo || (p.keywords && p.keywords[0]) || "")) || "";

  // preferred image is 500px for balance of quality / size
  const defaultImageUrl = getImageUrlForId(p.id, 500);

  const tags: string[] =
    (p.tags && Array.isArray(p.tags) ? p.tags : (p.keywords && Array.isArray(p.keywords) ? p.keywords : [])).map(String);

  return {
    id: `arasaac:${p.id}`,
    source: "arasaac",
    sourceId: p.id,
    label: title || `pictogram:${p.id}`,
    tags,
    defaultImageUrl,
    license: {
      name: "CC BY-NC-SA (ARASAAC)",
      url: "https://arasaac.org/developers" // point to API/terms page
    },
    localImageKey: null
  };
}
