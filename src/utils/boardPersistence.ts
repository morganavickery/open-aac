// src/services/boardPersistence.ts
import { db, Board, Card } from "./db";

/**
 * stripTransientPreview
 * - removes previewDataUrl from cells (transient only)
 */
function stripTransientPreview(board: Board): Board {
  // shallow clone to avoid mutating original reference
  const clone: Board = {
    ...board,
    cells: board.cells.map((c: Card) => {
      const copy: any = { ...c };
      if (copy.previewDataUrl) delete copy.previewDataUrl;
      return copy;
    }),
  };
  return clone;
}

/**
 * persistBoard
 * - strips previewDataUrl and persists board to DB
 */
export async function persistBoard(board: Board): Promise<void> {
  const sanitized = stripTransientPreview(board);
  sanitized.updatedAt = Date.now();
  await db.boards.put(sanitized);
}

/**
 * loadBoard
 */
export async function loadBoard(boardId: string): Promise<Board | undefined> {
  return await db.boards.get(boardId);
}

/**
 * createBoard helper
 */
export async function createBoard(init?: Partial<Board>): Promise<Board> {
  const id =
    init?.id ??
    `board-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const board: Board = {
    id,
    title: init?.title ?? "Untitled",
    cols: init?.cols ?? 3,
    cells: init?.cells ?? [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  await db.boards.put(board);
  return board;
}
