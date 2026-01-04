// src/services/db.ts
import Dexie, { Table } from "dexie";

/**
 * DB schema & helpers for Open AAC
 *
 * Tables:
 * - boards: stores boards and cells (cards)
 * - images: stores image Blobs + metadata
 */

export type Card = {
  id: string;
  label?: string;
  text?: string;
  imageId?: string | null; // canonical pointer to images table
  // transient only: previewDataUrl (must NOT be persisted)
  // previewDataUrl?: string; // never persist this field
  // additional metadata (persisted)
  imageSource?: string;
  imageAuthor?: string;
  imagePageUrl?: string;
  imageLicense?: string;
};

export type Board = {
  id: string;
  title?: string;
  cols?: number;
  cells: Card[];
  createdAt?: number;
  updatedAt?: number;
};

export type ImageRecord = {
  id: string;
  blob: Blob;
  size: number;
  width?: number;
  height?: number;
  createdAt: number;
  lastUsedAt: number;
  source?: string;
  license?: string;
  author?: string;
  pageUrl?: string;
};

class AppDB extends Dexie {
  boards!: Table<Board, string>;
  images!: Table<ImageRecord, string>;

  constructor() {
    super("aac_db");

    // v1: boards only
    this.version(1).stores({
      boards: "id",
    });

    // v2: add images table
    this.version(2).stores({
      boards: "id",
      images: "id, lastUsedAt, createdAt",
    });

    this.boards = this.table("boards");
    this.images = this.table("images");
  }
}

export const db = new AppDB();

/* ----------------- Image helpers ----------------- */

/**
 * saveImageBlob
 * - saves a Blob to images table and returns generated id
 */
export async function saveImageBlob(
  blob: Blob,
  meta?: Partial<ImageRecord>,
): Promise<string> {
  const id =
    (crypto as any).randomUUID?.() ??
    `img-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
  const rec: ImageRecord = {
    id,
    blob,
    size: blob.size || 0,
    createdAt: Date.now(),
    lastUsedAt: Date.now(),
    source: meta?.source,
    license: meta?.license,
    author: meta?.author,
    pageUrl: meta?.pageUrl,
    width: meta?.width,
    height: meta?.height,
  };
  await db.images.put(rec);
  return id;
}

/**
 * getImageBlob
 */
export async function getImageBlob(imageId: string): Promise<Blob | undefined> {
  const rec = await db.images.get(imageId);
  return rec?.blob;
}

/**
 * getImageRecord
 */
export async function getImageRecord(
  imageId: string,
): Promise<ImageRecord | undefined> {
  return await db.images.get(imageId);
}

/**
 * getImageObjectURL
 * - returns a browser object URL for rendering (call URL.revokeObjectURL when done)
 * - updates lastUsedAt for LRU bookkeeping
 */
export async function getImageObjectURL(
  imageId: string,
): Promise<string | undefined> {
  const rec = await db.images.get(imageId);
  if (!rec) return undefined;
  void db.images.update(imageId, { lastUsedAt: Date.now() });
  return URL.createObjectURL(rec.blob);
}

/**
 * touchImage
 * - mark image as recently used
 */
export async function touchImage(imageId: string): Promise<void> {
  await db.images.update(imageId, { lastUsedAt: Date.now() });
}

/**
 * deleteImage
 */
export async function deleteImage(imageId: string): Promise<void> {
  await db.images.delete(imageId);
}

/**
 * getTotalImagesBytes
 */
export async function getTotalImagesBytes(): Promise<number> {
  const recs = await db.images.toArray();
  return recs.reduce((s, r) => s + (r.size || 0), 0);
}

/**
 * cleanupImagesLRU
 * - removes least recently used images until totalBytes <= maxBytes
 * - returns number of removed items
 */
export async function cleanupImagesLRU(maxBytes: number): Promise<number> {
  const total = await getTotalImagesBytes();
  if (total <= maxBytes) return 0;
  // oldest first
  const all = await db.images.orderBy("lastUsedAt").toArray();
  let running = total;
  let removed = 0;
  for (const rec of all) {
    if (running <= maxBytes) break;
    await db.images.delete(rec.id);
    running -= rec.size || 0;
    removed++;
  }
  return removed;
}

/* ----------------- Boards convenience ----------------- */

/**
 * getBoard
 */
export async function getBoard(boardId: string): Promise<Board | undefined> {
  return await db.boards.get(boardId);
}

/**
 * putBoard (caller should sanitize previewDataUrl before calling)
 */
export async function putBoard(board: Board): Promise<void> {
  await db.boards.put(board);
}

export default db;

/**
 * seedIfEmpty
 *
 * Convenience dev helper: if there are no boards in the DB, create one example board.
 * This is safe to run on every startup because it first checks the boards count.
 *
 * Usage: import { seedIfEmpty } from "./services/db"; await seedIfEmpty();
 */
export async function seedIfEmpty(): Promise<void> {
  try {
    const count = await db.boards.count();
    if (count > 0) {
      // already seeded or user data exists — do nothing
      return;
    }

    // create a small example board with a few cards (no images)
    const exampleBoard = {
      id: `board-${Date.now().toString(36)}`,
      title: "Example board",
      cols: 3,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      cells: [
        { id: "c-1", label: "Hello", text: "Hello", imageId: undefined },
        { id: "c-2", label: "Yes", text: "Yes", imageId: undefined },
        { id: "c-3", label: "No", text: "No", imageId: undefined },
        { id: "c-4", label: "More", text: "More", imageId: undefined },
        { id: "c-5", label: "Stop", text: "Stop", imageId: undefined },
        { id: "c-6", label: "Go", text: "Go", imageId: undefined },
      ],
    };

    await db.boards.put(exampleBoard);
    console.log("[db] seedIfEmpty: created example board", exampleBoard.id);
  } catch (err) {
    console.error("[db] seedIfEmpty failed:", err);
  }
}
