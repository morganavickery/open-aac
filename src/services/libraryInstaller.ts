// src/services/libraryInstaller.ts
import { normalizePictogramToTerm, getImageUrlForId, ArasaacPictogram } from "./arasaac";
import { db } from "./db"; // your dexie instance (see suggested schema below)

/**
 * Download an image URL and return a Blob
 */
export async function fetchImageAsBlob(url: string): Promise<Blob> {
  const res = await fetch(url, { mode: "cors" });
  if (!res.ok) throw new Error(`Failed to fetch image ${res.status}`);
  return await res.blob();
}

/**
 * Install a list of ARASAAC pictograms into local DB.
 * - pictograms: array of ArasaacPictogram (from search or get)
 * - options: {size: 500}
 *
 * Stores:
 * - db.terms (metadata)
 * - db.assets (blob storage) with a generated key
 */
export async function installArasaacPack(pictograms: ArasaacPictogram[], opts?: { size?: 500 | 300 | 2500 }) {
  const size = (opts && opts.size) || 500;
  const installed: { termId: string; localImageKey?: string }[] = [];

  for (const p of pictograms) {
    const term = normalizePictogramToTerm(p);

    // fetch image
    try {
      const imgUrl = getImageUrlForId(p.id, size);
      const blob = await fetchImageAsBlob(imgUrl);

      // store blob in db.assets (or db.images) — store with key like 'arasaac-img:{id}:{size}'
      const assetKey = `arasaac-img:${p.id}:${size}`;
      await db.assets.put({
        key: assetKey,
        blob,
        source: "arasaac",
        sourceId: p.id,
        size
      });

      term.localImageKey = assetKey;
    } catch (err) {
      console.warn("Failed to download image for", p.id, err);
      term.localImageKey = null;
    }

    // store term metadata in db.terms
    await db.terms.put(term);
    installed.push({ termId: term.id, localImageKey: term.localImageKey || undefined });
  }

  // Optionally return summary
  return { installedCount: installed.length, items: installed };
}
