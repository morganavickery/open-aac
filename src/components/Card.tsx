// src/components/Card.tsx
import React, { useEffect, useState } from "react";
import { getImageObjectURL, touchImage } from "../services/db";

/**
 * Card renderer
 *
 * Props:
 * - card: card object from board.cells
 * - size: pixel square size for the card
 *
 * Behavior:
 * - If card.previewDataUrl (transient) exists, show it immediately.
 * - If card.imageId exists, call getImageObjectURL(imageId) to get object URL,
 *   set it to <img src=...> and revoke on cleanup.
 * - Call touchImage(imageId) to update lastUsedAt for LRU bookkeeping.
 * - All previewDataUrl usage must remain transient — do not persist into the DB.
 */

export default function Card({
  card,
  size = 140,
}: {
  card: any;
  size?: number;
}) {
  const [objectUrl, setObjectUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    let mounted = true;
    let createdUrl: string | undefined;

    async function load() {
      // If there's an in-memory preview, show it immediately
      if ((card as any).previewDataUrl) {
        setObjectUrl((card as any).previewDataUrl);
      }

      if (card.imageId) {
        try {
          const url = await getImageObjectURL(card.imageId);
          if (!mounted) {
            if (url) URL.revokeObjectURL(url);
            return;
          }
          createdUrl = url;
          setObjectUrl(url || undefined);
          // touch image for LRU bookkeeping (don't await)
          void touchImage(card.imageId);
        } catch (err) {
          console.error("Failed to load image object URL", err);
        }
      }
    }

    load();

    return () => {
      mounted = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [card.imageId, (card as any).previewDataUrl]);

  const containerStyle: React.CSSProperties = {
    width: size,
    height: size,
    border: "1px solid #e5e7eb",
    padding: 6,
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#fff",
    overflow: "hidden",
  };

  const imgStyle: React.CSSProperties = {
    maxWidth: "100%",
    maxHeight: "100%",
    objectFit: "contain",
    display: "block",
  };

  return (
    <div style={containerStyle} aria-hidden>
      {objectUrl ? (
        <img src={objectUrl} alt={card.label || ""} style={imgStyle} />
      ) : (
        <div style={{ textAlign: "center", padding: 6, color: "#6b7280" }}>
          {card.label || "Empty"}
        </div>
      )}
    </div>
  );
}
