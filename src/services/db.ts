// src/services/db.ts
import Dexie from "dexie";

export interface Card {
  id: string;
  label: string;
  text?: string;
  image?: string; // data URL (binary) stored for offline use
  imageSource?: string; // e.g., "Pixabay", "Openverse", or "Upload"
  imageAuthor?: string; // author name (if available)
  imagePageUrl?: string; // original page URL (if available)
  imageLicense?: string; // e.g., "Pixabay", "CC0", "Pexels"
}

export interface Board {
  id: string;
  title: string;
  cols?: number;
  cells: Card[];
}

export class AACDB extends Dexie {
  boards!: Dexie.Table<Board, string>;

  constructor() {
    super("aac_db");
    this.version(1).stores({
      boards: "id, title",
    });
  }
}

export const db = new AACDB();

// Optional seeding helper
export async function seedIfEmpty() {
  const count = await db.boards.count();
  if (count === 0) {
    await db.boards.bulkPut([
      {
        id: "default-core-1",
        title: "Core Board (Example)",
        cols: 3,
        cells: [
          { id: "c1", label: "I", text: "I" },
          { id: "c2", label: "want", text: "want" },
          { id: "c3", label: "more", text: "more" },
        ],
      },
    ]);
  }
}
