// src/components/ActiveBoard.tsx
import React, { useState } from "react";
import { Board, Card } from "../services/db";
import ImagePickerModal from "./ImagePickerModal";
import CardInfoModal from "./CardInfoModal";

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

function CardView({
  card,
  editable,
  onChange,
}: {
  card: Card;
  editable: boolean;
  onChange: (patch: Partial<Card>) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);

  return (
    <>
      <ImagePickerModal
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(res) => {
          // res: { dataUrl, source, author, pageUrl, license }
          onChange({
            image: res.dataUrl,
            imageSource: res.source,
            imageAuthor: res.author,
            imagePageUrl: res.pageUrl,
            imageLicense: res.license,
          });
          setPickerOpen(false);
        }}
      />

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

        <div className="flex-1 flex items-center justify-center p-2 overflow-hidden">
          {card.image ? (
            <img
              src={card.image}
              alt={card.label || "card image"}
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
                display: "block",
              }}
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              aria-hidden
            />
          )}
        </div>

        <div
          className="p-2 border-t border-slate-100 bg-white"
          style={{ boxSizing: "border-box" }}
        >
          {editable ? (
            <div
              className="flex flex-col gap-2"
              style={{ maxHeight: 120, overflow: "auto" }}
            >
              <label className="block text-xs text-slate-600">Label</label>
              <input
                value={card.label || ""}
                onChange={(e) => onChange({ label: e.target.value })}
                className="w-full p-1 border rounded text-sm"
                aria-label="Card label"
              />

              <label className="block text-xs text-slate-600">
                TTS text (optional)
              </label>
              <input
                value={card.text || ""}
                onChange={(e) => onChange({ text: e.target.value })}
                className="w-full p-1 border rounded text-sm"
                aria-label="Card text"
              />

              <div className="mt-1 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  className="px-2 py-1 border rounded text-sm"
                  aria-haspopup="dialog"
                >
                  Choose image
                </button>

                {card.image && (
                  <button
                    onClick={() =>
                      onChange({
                        image: undefined,
                        imageSource: undefined,
                        imageAuthor: undefined,
                        imagePageUrl: undefined,
                        imageLicense: undefined,
                      })
                    }
                    className="text-sm px-2 py-1 rounded border ml-auto"
                    aria-label="Remove image"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="font-medium text-sm truncate" title={card.label}>
                {card.label}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
