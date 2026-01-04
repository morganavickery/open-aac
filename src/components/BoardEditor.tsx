// src/components/BoardEditor.tsx
import React, { useEffect, useState } from "react";
import { db, Board } from "../services/db";
import BoardList from "./BoardList";
import ActiveBoard from "./ActiveBoard";
import { v4 as uuidv4 } from "uuid";

function makeEmptyCard(idx: number) {
  return { id: uuidv4(), label: `Card ${idx + 1}`, text: "", image: undefined };
}

export default function BoardEditor() {
  const [board, setBoard] = useState<Board | null>(null);
  const [editable, setEditable] = useState(false);

  useEffect(() => {
    (async () => {
      const first = await db.boards.orderBy("title").first();
      if (first) setBoard(first);
    })();
  }, []);

  function newBoard() {
    const id = `board-${Date.now()}`;
    const b: Board = {
      id,
      title: "Untitled board",
      cols: 3,
      cells: [makeEmptyCard(0), makeEmptyCard(1), makeEmptyCard(2)],
    };
    setBoard(b);
    setEditable(true);
  }

  function loadBoard(b: Board) {
    setBoard(b);
    setEditable(false);
  }

  async function saveBoard() {
    if (!board) return;
    await db.boards.put(board);
    alert("Saved");
  }

  async function importBoard(b: Board) {
    const existing = await db.boards.get(b.id);
    if (existing) b.id = `${b.id}-${Date.now()}`;
    await db.boards.put(b);
    setBoard(b);
    setEditable(false);
    alert("Imported");
  }

  return (
    <div className="flex gap-6">
      <div className="w-72">
        <BoardList onSelect={loadBoard} />
        <div className="mt-2">
          <button onClick={newBoard} className="w-full p-2 rounded border">
            New board
          </button>
        </div>
      </div>

      <div className="flex-1">
        <ActiveBoard
          board={board}
          editable={editable}
          onUpdateBoard={(b) => setBoard(b)}
          onToggleEditable={() => setEditable((e) => !e)}
          onSave={saveBoard}
        />
      </div>
    </div>
  );
}
