// src/components/ActiveBoard.tsx
import React, { useState, useCallback, useMemo } from "react";
import { Board, Card as CardType } from "../services/db";
import ImagePickerModal from "./ImagePickerModal";
import Card from "./Card";

/**
 * ActiveBoard (stable hooks ordering)
 *
 * - All hooks are declared unconditionally at the top.
 * - previewMap keeps transient previews in memory (not persisted).
 * - onUpdateBoard should persist via persistBoard() which strips previews.
 */

type ImagePickPayload = {
  imageId?: string;
  dataUrl?: string;
  source?: string;
  author?: string;
  license?: string;
  pageUrl?: string;
};

export default function ActiveBoard({
  board,
  editable,
  onUpdateBoard,
  onToggleEditable,
}: {
  board: Board | null;
  editable: boolean;
  onUpdateBoard: (b: Board) => void;
  onToggleEditable: () => void;
}) {
  // --- hooks (always declared) ---
  const [pickerOpenFor, setPickerOpenFor] = useState<string | null>(null);
  const [previewMap, setPreviewMap] = useState<Record<string, string>>({});
  const [infoOpenFor, setInfoOpenFor] = useState<string | null>(null);

  // Memoize derived values (safe)
  const cols = useMemo(() => board?.cols ?? 3, [board?.cols]);
  const gridStyle = useMemo(
    () => ({ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }),
    [cols],
  );

  // stable updater (uses latest board via closure; callers will provide correct index)
  const updateCard = useCallback(
    (index: number, patch: Partial<CardType>) => {
      if (!board) return;
      const newCells = [...board.cells];
      newCells[index] = { ...newCells[index], ...patch };
      onUpdateBoard({ ...board, cells: newCells, updatedAt: Date.now() });
    },
    [board, onUpdateBoard],
  );

  // Handler when ImagePickerModal returns a result for a specific card
  const handleImageSelect = useCallback(
    (cardId: string, payload: ImagePickPayload) => {
      if (!board) return;
      const { imageId, dataUrl, source, author, license, pageUrl } = payload;
      const idx = board.cells.findIndex((c) => c.id === cardId);
      if (idx === -1) return;

      // Persist canonical pointer and metadata
      updateCard(idx, {
        imageId: imageId ?? undefined,
        imageSource: source ?? undefined,
        imageAuthor: author ?? undefined,
        imageLicense: license ?? undefined,
        imagePageUrl: pageUrl ?? undefined,
      });

      // Keep transient preview in-memory for instant UI
      if (dataUrl) {
        setPreviewMap((m) => ({ ...m, [cardId]: dataUrl }));

        // Optionally remove preview after a timeout to conserve memory
        setTimeout(() => {
          setPreviewMap((m) => {
            const copy = { ...m };
            delete copy[cardId];
            return copy;
          });
        }, 60_000);
      }

      setPickerOpenFor(null);
    },
    [board, updateCard],
  );

  // Handler to remove image from a card
  const handleRemoveImage = useCallback(
    (index: number) => {
      updateCard(index, {
        imageId: undefined,
        imageSource: undefined,
        imageAuthor: undefined,
        imageLicense: undefined,
        imagePageUrl: undefined,
      });
    },
    [updateCard],
  );

  // --- Render ---
  if (!board) {
    // still allowed to early-return AFTER hooks
    return <div className="text-sm text-slate-500">No board loaded</div>;
  }

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-xl font-semibold">{board.title}</h2>

        <div className="ml-auto">
          <button
            onClick={onToggleEditable}
            className="px-3 py-1 border rounded"
            aria-pressed={editable}
            title={editable ? "Switch to usable" : "Switch to edit"}
          >
            {editable ? "Switch to usable" : "Switch to edit"}
          </button>
        </div>
      </div>

      <div className="grid gap-4" style={gridStyle as React.CSSProperties}>
        {board.cells.map((c, i) => (
          <div key={c.id} style={{ display: "flex", flexDirection: "column" }}>
            <Card card={c} previewDataUrl={previewMap[c.id]} size={160} />

            {editable ? (
              <div
                style={{
                  marginTop: 8,
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                }}
              >
                <button
                  onClick={() => setPickerOpenFor(c.id)}
                  className="px-2 py-1 border rounded"
                >
                  Choose image
                </button>

                <button
                  onClick={() => handleRemoveImage(i)}
                  className="px-2 py-1 border rounded"
                >
                  Remove
                </button>

                <input
                  value={c.label || ""}
                  onChange={(e) => updateCard(i, { label: e.target.value })}
                  placeholder="Label"
                  style={{
                    flex: 1,
                    padding: 6,
                    borderRadius: 4,
                    border: "1px solid #e5e7eb",
                  }}
                />
              </div>
            ) : (
              <div style={{ marginTop: 8 }}>
                <div style={{ fontWeight: 600 }}>{c.label}</div>
              </div>
            )}

            {/* ImagePickerModal (renders only when user opens it for this card) */}
            {pickerOpenFor === c.id && (
              <ImagePickerModal
                isOpen={true}
                onClose={() => setPickerOpenFor(null)}
                onSelect={(res) =>
                  handleImageSelect(c.id, res as ImagePickPayload)
                }
              />
            )}

            {/* minimal info modal (hook created at top and used here) */}
            {infoOpenFor === c.id && (
              <div role="dialog" aria-modal>
                {/* You can wire a nicer CardInfoModal; this is placeholder to ensure no hooks run conditionally */}
                <div
                  style={{
                    padding: 12,
                    background: "#fff",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <div>
                    <strong>Author:</strong> {c.imageAuthor || "—"}
                  </div>
                  <div>
                    <strong>Source:</strong> {c.imageSource || "—"}
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <button onClick={() => setInfoOpenFor(null)}>Close</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
