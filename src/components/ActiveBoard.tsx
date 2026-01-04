// src/components/ActiveBoard.tsx
import React, { useState } from "react";
import { Board, Card } from "../services/db";
import ImagePickerModal from "./ImagePickerModal"; // make this file per the earlier spec
import CardInfoModal from "./CardInfoModal"; // import at top

export default function ActiveBoard({
  board,
  editable,
  onUpdateBoard,
  onToggleEditable,
  onSave,
}: {
  board: Board | null;
  editable: boolean;
  onUpdateBoard: (b: Board) => void;
  onToggleEditable: () => void;
  onSave: () => void;
}) {
  if (!board)
    return <div className="text-sm text-slate-500">No board loaded</div>;

  const cols = board.cols || 3;
  const gridStyle = { gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` };

  function updateCard(index: number, patch: Partial<Card>) {
    const cells = [...board.cells];
    cells[index] = { ...cells[index], ...patch };
    onUpdateBoard({ ...board, cells });
  }

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-xl font-semibold">{board.title}</h2>
        <div className="ml-auto">
          <button
            onClick={onToggleEditable}
            className="px-3 py-1 border rounded mr-2"
          >
            {editable ? "Switch to usable" : "Switch to edit"}
          </button>
          <button
            onClick={onSave}
            className="px-3 py-1 rounded bg-indigo-600 text-white"
          >
            Save
          </button>
        </div>
      </div>

      <div className="grid gap-4" style={gridStyle as React.CSSProperties}>
        {board.cells.map((c, i) => (
          <CardView
            key={c.id}
            card={c}
            editable={editable}
            onChange={(patch) => updateCard(i, patch)}
          />
        ))}
      </div>
    </div>
  );
}

// inside src/components/ActiveBoard.tsx (CardView)

function CardView({
  card,
  editable,
  onChange,
  onFileInput,
}: {
  card: Card;
  editable: boolean;
  onChange: (patch: Partial<Card>) => void;
  onFileInput?: (file?: File | null) => void;
}) {
  const [infoOpen, setInfoOpen] = React.useState(false);

  return (
    <>
      <CardInfoModal
        isOpen={infoOpen}
        onClose={() => setInfoOpen(false)}
        source={card.imageSource}
        author={card.imageAuthor}
        license={card.imageLicense}
        pageUrl={card.imagePageUrl}
      />

      <div
        className="relative bg-white rounded shadow-sm border border-slate-200 flex flex-col overflow-hidden"
        style={{ minHeight: 160, height: 160 }}
      >
        {/* small info button - unobtrusive top-right */}
        <button
          onClick={() => setInfoOpen(true)}
          aria-label="Image info"
          className="absolute top-2 right-2 text-xs rounded bg-white/80 p-0.5"
          title="Image details"
        >
          ⓘ
        </button>

        {/* existing image area and label... */}
      </div>
    </>
  );
}
