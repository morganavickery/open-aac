// src/components/ImagePickerModal.tsx
import React, { useState, useEffect } from "react";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import { fileToDataUrl, urlToDataUrl } from "../utils/image";

export default function ImagePickerModal({
  isOpen,
  onClose,
  onSelect,
  initialQuery,
}: any) {
  const [tab, setTab] = useState<"upload" | "emoji" | "search">("upload");
  const [query, setQuery] = useState(initialQuery || "");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setQuery(initialQuery || "");
  }, [initialQuery]);

  async function search() {
    if (!query) return;
    setLoading(true);
    try {
      const r = await fetch(
        `/api/search-images?q=${encodeURIComponent(query)}`,
      );
      const j = await r.json();
      setResults(j.images || []);
    } catch (e) {
      console.error(e);
      setResults([]);
      alert("Search failed");
    } finally {
      setLoading(false);
    }
  }

  function onUploadFile(f?: File | null) {
    if (!f) return;
    fileToDataUrl(f, 800).then((dataUrl) => {
      onSelect(dataUrl);
      onClose();
    });
  }

  function onSelectThumbnail(item: any) {
    // item.original is the full image URL; try to convert to dataURL
    setLoading(true);
    urlToDataUrl(item.original, 800)
      .then((dataUrl) => {
        onSelect(dataUrl);
        onClose();
      })
      .catch(
        async((err) => {
          // fallback: server proxy
          try {
            const proxyUrl = `/api/fetch-image?url=${encodeURIComponent(item.original)}`;
            const dataUrl2 = await urlToDataUrl(proxyUrl, 800);
            onSelect(dataUrl2);
            onClose();
          } catch (e) {
            alert(
              "Could not fetch image due to CORS. You can open image and upload it manually.",
            );
          }
        }),
      )
      .finally(() => setLoading(false));
  }

  return isOpen ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded p-4 w-full max-w-2xl max-h-[80vh] overflow-auto">
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setTab("upload")}
            className={tab === "upload" ? "font-bold" : ""}
          >
            Upload
          </button>
          <button
            onClick={() => setTab("emoji")}
            className={tab === "emoji" ? "font-bold" : ""}
          >
            Emoji
          </button>
          <button
            onClick={() => setTab("search")}
            className={tab === "search" ? "font-bold" : ""}
          >
            Search
          </button>
          <div className="ml-auto">
            <button onClick={onClose}>Close</button>
          </div>
        </div>

        {tab === "upload" && (
          <div>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => onUploadFile(e.target.files?.[0] || null)}
            />
          </div>
        )}

        {tab === "emoji" && (
          <div>
            <div className="mb-2">Pick an emoji (or paste from keyboard)</div>
            <Picker
              data={data}
              onEmojiSelect={(em: any) => {
                // emoji object: em.native contains the character
                onSelect(
                  `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='512' height='512'><text y='50%' x='50%' dominant-baseline='middle' text-anchor='middle' font-size='320'>${em.native}</text></svg>`)}`,
                );
                onClose();
              }}
            />
          </div>
        )}

        {tab === "search" && (
          <div>
            <div className="flex gap-2 mb-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 p-2 border rounded"
              />
              <button onClick={search} className="px-3 py-1 border rounded">
                Search
              </button>
            </div>

            {loading && <div>Loading…</div>}
            <div className="grid grid-cols-3 gap-2">
              {results.map((r: any, idx: number) => (
                <button
                  key={idx}
                  onClick={() => onSelectThumbnail(r)}
                  className="border p-1"
                >
                  <img
                    src={r.thumbnail || r.original}
                    alt={r.title || "img"}
                    style={{ width: "100%", height: 100, objectFit: "cover" }}
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  ) : null;
}
