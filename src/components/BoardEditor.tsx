// src/components/BoardEditor.tsx
import React, { useEffect, useRef, useState } from "react";
import ActiveBoard from "./ActiveBoard";
import { db, Board } from "../services/db";

/**
 * BoardEditor (updated)
 *
 * - Loads and selects boards from Dexie
 * - Autosaves via useAutoSaveBoard (debounced)
 * - Shows a single autosave indicator in the toolbar:
 *    • pulsing dot = saving
 *    • green check = saved recently
 *    • red X = error
 *    • gray dot = idle
 *
 * Replace your existing BoardEditor.tsx with this file.
 */

/* ------------------------- helpers ------------------------- */

function createEmptyBoard(): Board {
  const id = `board-${Date.now()}`;
  const cells = Array.from({ length: 9 }).map((_, i) => ({
    id: `${id}-c${i + 1}`,
    label: "",
    text: "",
  }));
  return {
    id,
    title: "Untitled Board",
    cols: 3,
    cells,
  };
}

/**
 * useAutoSaveBoard
 * - Debounces board writes to IndexedDB
 * - Maintains a status and lastSaved timestamp for UI
 */
function useAutoSaveBoard(board: Board | null, delay = 1200) {
  type Status = "idle" | "saving" | "saved" | "error";
  const [status, setStatus] = useState<Status>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!board) {
      setStatus("idle");
      return;
    }

    // clear any earlier timer
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    setStatus("saving");

    timerRef.current = window.setTimeout(async () => {
      try {
        await db.boards.put(board);
        setLastSavedAt(Date.now());
        setStatus("saved");
        // show "saved" state briefly then go back to idle
        window.setTimeout(() => setStatus("idle"), 1400);
      } catch (err) {
        console.error("Autosave failed", err);
        setStatus("error");
      }
    }, delay);

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [board, delay]);

  // manual flush
  const flush = async () => {
    if (!board) return;
    setStatus("saving");
    try {
      await db.boards.put(board);
      setLastSavedAt(Date.now());
      setStatus("saved");
      window.setTimeout(() => setStatus("idle"), 1400);
    } catch (err) {
      console.error("Save failed", err);
      setStatus("error");
    }
  };

  return { status, lastSavedAt, flush };
}

/* ---------------------- SaveStatusIndicator ---------------------- */

function SaveStatusIndicator({
  status,
  lastSavedAt,
}: {
  status: "idle" | "saving" | "saved" | "error";
  lastSavedAt: number | null;
}) {
  // small inline visuals and hover tooltip
  const tooltip =
    status === "saving"
      ? "Saving…"
      : status === "saved"
        ? lastSavedAt
          ? `Saved • ${new Date(lastSavedAt).toLocaleTimeString()}`
          : "Saved"
        : status === "error"
          ? "Error saving"
          : "Idle";

  const commonButtonStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 8px",
    borderRadius: 8,
    border: "1px solid transparent",
    background: "transparent",
    cursor: "default",
  };

  const dotStyle: React.CSSProperties = {
    width: 12,
    height: 12,
    borderRadius: 12,
    display: "inline-block",
    boxShadow: "0 0 0 rgba(0,0,0,0.15)",
  };

  // pulsing animation via inline keyframes (inserted once)
  useEffect(() => {
    if (document.getElementById("open-aac-save-indicator-styles")) return;
    const style = document.createElement("style");
    style.id = "open-aac-save-indicator-styles";
    style.innerHTML = `
      @keyframes openaac-pulse {
        0% { transform: scale(1); opacity: 1; }
        70% { transform: scale(1.6); opacity: 0.5; }
        100% { transform: scale(1); opacity: 1; }
      }
      .openaac-pulse {
        animation: openaac-pulse 1.2s infinite;
      }
      .openaac-check {
        transition: transform .12s ease;
      }
      .openaac-error {
        transform: none;
      }
    `;
    document.head.appendChild(style);
  }, []);

  return (
    <div title={tooltip} aria-live="polite" style={commonButtonStyle}>
      {status === "saving" && (
        <span
          style={{
            position: "relative",
            display: "inline-flex",
            alignItems: "center",
          }}
        >
          <span
            style={{ ...dotStyle, background: "#60a5fa" /* indigo-400 */ }}
          />
          <span
            className="openaac-pulse"
            style={{
              ...dotStyle,
              background: "#bfdbfe",
              position: "absolute",
              left: 0,
              top: 0,
            }}
          />
        </span>
      )}

      {status === "saved" && (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <svg
            className="openaac-check"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
          >
            <circle
              cx="12"
              cy="12"
              r="11"
              stroke="#16a34a"
              strokeWidth="1.5"
              fill="#22c55e"
            />
            <path
              d="M7 12.5l2.5 2.5L17.5 7"
              stroke="#064e3b"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </span>
      )}

      {status === "error" && (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle
            cx="12"
            cy="12"
            r="11"
            stroke="#ef4444"
            strokeWidth="1.5"
            fill="#fecaca"
          />
          <path
            d="M9 9l6 6M15 9l-6 6"
            stroke="#991b1b"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}

      {status === "idle" && (
        <span style={{ ...dotStyle, background: "#9ca3af" /* slate-400 */ }} />
      )}

      <span style={{ fontSize: 12, color: "#374151", marginLeft: 6 }}>
        {status === "saving"
          ? "Saving…"
          : status === "saved"
            ? "Saved"
            : status === "error"
              ? "Save error"
              : "Idle"}
      </span>
    </div>
  );
}

/* ------------------------- Main component ------------------------- */

export default function BoardEditor() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeBoard, setActiveBoard] = useState<Board | null>(null);
  const [editable, setEditable] = useState<boolean>(true);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    async function load() {
      const all = await db.boards.toArray();
      setBoards(all);
      if (all.length > 0) {
        setActiveId(all[0].id);
        setActiveBoard(all[0]);
      } else {
        const b = createEmptyBoard();
        await db.boards.put(b);
        setBoards([b]);
        setActiveId(b.id);
        setActiveBoard(b);
      }
    }
    load();
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!activeId) return;
    let cancelled = false;
    (async () => {
      const b = await db.boards.get(activeId);
      if (!cancelled) {
        if (b) {
          setActiveBoard(b);
        } else {
          setActiveBoard(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeId]);

  const {
    status: saveStatus,
    lastSavedAt,
    flush: manualSave,
  } = useAutoSaveBoard(activeBoard, 1200);

  useEffect(() => {
    if (!activeBoard) return;
    setBoards((prev) => {
      const found = prev.find((p) => p.id === activeBoard.id);
      if (!found) {
        return [...prev, activeBoard];
      }
      return prev.map((p) => (p.id === activeBoard.id ? activeBoard : p));
    });
  }, [activeBoard]);

  async function handleCreateNew() {
    const b = createEmptyBoard();
    await db.boards.put(b);
    const all = await db.boards.toArray();
    setBoards(all);
    setActiveId(b.id);
    setActiveBoard(b);
    setEditable(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this board? This cannot be undone.")) return;
    await db.boards.delete(id);
    const all = await db.boards.toArray();
    setBoards(all);
    if (all.length > 0) {
      setActiveId(all[0].id);
      setActiveBoard(all[0]);
    } else {
      const b = createEmptyBoard();
      await db.boards.put(b);
      setBoards([b]);
      setActiveId(b.id);
      setActiveBoard(b);
    }
  }

  function handleSelectBoard(id: string) {
    setActiveId(id);
  }

  function onUpdateBoard(b: Board) {
    setActiveBoard(b);
  }

  async function handleSaveClick() {
    await manualSave();
    const all = await db.boards.toArray();
    setBoards(all);
  }

  return (
    <div className="p-4">
      {/* Toolbar */}
      <div
        className="flex items-center gap-4 mb-4"
        style={{ alignItems: "center" }}
      >
        <div>
          <strong>Boards</strong>
          <div style={{ marginTop: 8 }}>
            <select
              value={activeId || ""}
              onChange={(e) => handleSelectBoard(e.target.value)}
              style={{ padding: 6, minWidth: 220 }}
            >
              {boards.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title || b.id}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            gap: 8,
            alignItems: "center",
          }}
        >
          <button
            onClick={handleCreateNew}
            className="px-3 py-1 border rounded"
          >
            New board
          </button>
          {activeBoard && (
            <button
              onClick={() => {
                const newTitle =
                  prompt("Rename board", activeBoard.title || "") ||
                  activeBoard.title;
                if (newTitle !== null && newTitle !== activeBoard.title) {
                  const updated = { ...activeBoard, title: newTitle };
                  setActiveBoard(updated);
                  db.boards
                    .put(updated)
                    .then(() =>
                      db.boards.toArray().then((all) => setBoards(all)),
                    );
                }
              }}
              className="px-3 py-1 border rounded"
            >
              Rename
            </button>
          )}
          {activeBoard && (
            <button
              onClick={() => handleDelete(activeBoard.id)}
              className="px-3 py-1 border rounded text-red-600"
            >
              Delete
            </button>
          )}

          {/* Manual Save (kept but unobtrusive) */}
          <button
            onClick={handleSaveClick}
            className="px-3 py-1 rounded bg-indigo-600 text-white"
          >
            Save
          </button>

          {/* Save status indicator (single source of truth for autosave state) */}
          <div style={{ marginLeft: 8 }}>
            <SaveStatusIndicator
              status={saveStatus}
              lastSavedAt={lastSavedAt}
            />
          </div>
        </div>
      </div>

      <div>
        <ActiveBoard
          board={activeBoard}
          editable={editable}
          onUpdateBoard={onUpdateBoard}
          onToggleEditable={() => setEditable((s) => !s)}
          onSave={async () => {
            if (!activeBoard) return;
            await db.boards.put(activeBoard);
            const all = await db.boards.toArray();
            setBoards(all);
          }}
        />
      </div>
    </div>
  );
}
