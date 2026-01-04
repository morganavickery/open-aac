// src/components/CardEditor.tsx
import React from "react";
import { Card } from "../services/db";

export default function CardEditor({
  card,
  onChange,
}: {
  card: Card;
  onChange: (patch: Partial<Card>) => void;
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
      <div className="mt-2 text-xs text-slate-500">
        Use the "Choose image" button on the card to add or replace an image.
      </div>
    </div>
  );
}
