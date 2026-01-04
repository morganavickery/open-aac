// src/utils/storageCleanup.ts
import { db } from "../services/db";

/**
 * cleanupImagesLRU
 * - Remove least-recently-used images until totalBytes <= maxBytes
 */
export async function cleanupImagesLRU(maxBytes: number): Promise<number> {
  const recs = await db.images.orderBy("lastUsedAt").toArray();
  let total = recs.reduce((s, r) => s + (r.size || 0), 0);
  if (total <= maxBytes) return 0;
  // oldest first (orderBy lastUsedAt asc)
  const sorted = recs.sort((a, b) => (a.lastUsedAt || 0) - (b.lastUsedAt || 0));
  let removed = 0;
  for (const r of sorted) {
    if (total <= maxBytes) break;
    await db.images.delete(r.id);
    total -= r.size || 0;
    removed++;
  }
  return removed;
}

/**
 * getTotalImagesBytes
 */
export async function getTotalImagesBytes(): Promise<number> {
  const recs = await db.images.toArray();
  return recs.reduce((s, r) => s + (r.size || 0), 0);
}
