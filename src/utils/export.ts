// src/utils/export.ts
import { Board } from "../services/db";

export function buildBoardExport(board: Board) {
  const credits = board.cells
    .filter((c) => c.imageSource || c.imageLicense)
    .map((c) => ({
      cardId: c.id,
      source: c.imageSource,
      author: c.imageAuthor,
      license: c.imageLicense,
      pageUrl: c.imagePageUrl,
    }));

  return {
    meta: { exportedAt: new Date().toISOString(), app: "open-aac" },
    board,
    credits,
  };
}
