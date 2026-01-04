// src/components/CardEditor.tsx (optional)
import React from "react";
import { Card } from "../services/db";

export default function CardEditor({
  card,
  onChange,
  onFile,
}: {
  card: Card;
  onChange: (patch: Partial<Card>) => void;
  onFile: (f?: File | null) => void;
}) {
  return (
    <div className="p-2 bg-white rounded shadow-sm">
      <label className="block text-xs">Label</label>
      <input
        value={card.label || ""}
        onChange={(e) => onChange({ label: e.target.value })}
        className="w-full p-1 border rounded"
      />
      <label className="block text-xs mt-1">Text</label>
      <input
        value={card.text || ""}
        onChange={(e) => onChange({ text: e.target.value })}
        className="w-full p-1 border rounded"
      />
      <div className="mt-2 flex items-center gap-2">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => onFile(e.target.files?.[0] || null)}
        />
        {card.image && (
          <button
            onClick={() => onChange({ image: undefined })}
            className="text-sm border rounded px-2"
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}
