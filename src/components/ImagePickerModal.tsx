// src/components/ImagePickerModal.tsx
import React, { useEffect, useState } from "react";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import ImageCropper from "./ImageCropper";
import { dataUrlToBlob } from "../utils/dataUrl";
import { saveImageBlob } from "../services/db";

/**
 * ImagePickerModal
 *
 * - Tabs: upload, emoji, search (Pixabay serverless endpoint expected)
 * - When user chooses/upload/crops an image, convert dataURL -> Blob, persist via saveImageBlob,
 *   and return { imageId, dataUrl, source, author, pageUrl, license } via onSelect.
 *
 * - Important: callers should use imageId as canonical persisted pointer and may optionally use
 *   dataUrl as a transient preview. Do NOT persist dataUrl into IndexedDB boards table.
 */

type PickResult = {
  dataUrl?: string;
  imageId?: string;
  source?: string;
  author?: string;
  pageUrl?: string;
  license?: string;
};

export default function ImagePickerModal({
  isOpen,
  onClose,
  onSelect,
  initialQuery,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (res: PickResult) => void;
  initialQuery?: string;
}) {
  const [tab, setTab] = useState<"upload" | "emoji" | "search">("upload");
  const [query, setQuery] = useState(initialQuery || "");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toCrop, setToCrop] = useState<{
    src: string;
    meta?: Partial<PickResult>;
  } | null>(null);

  useEffect(() => {
    setQuery(initialQuery || "");
  }, [initialQuery]);

  const DEV_PIXABAY_KEY = (import.meta as any).env?.VITE_PIXABAY_KEY || "";

  async function searchPixabay() {
    if (!query) return;
    setLoading(true);
    setError(null);
    setResults([]);
    try {
      const resp = await fetch(
        `/api/search-pixabay?q=${encodeURIComponent(query)}`,
        { cache: "no-store" },
      );
      const ct = resp.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        const j = await resp.json();
        setResults(j.images || []);
        setLoading(false);
        return;
      }

      // Fallback for dev only using VITE_PIXABAY_KEY
      if (DEV_PIXABAY_KEY) {
        const params = new URLSearchParams({
          key: DEV_PIXABAY_KEY,
          q: query,
          image_type: "all",
          safesearch: "true",
          per_page: "30",
        });
        const r = await fetch(`https://pixabay.com/api/?${params.toString()}`);
        const j = await r.json();
        const hits = (j.hits || []).map((h: any) => ({
          id: h.id,
          thumbnail: h.previewURL,
          original: h.largeImageURL || h.webformatURL,
          source: "Pixabay",
          author: h.user || "",
          pageUrl: h.pageURL || "",
          license: "Pixabay",
          type: h.type || "",
          tags: h.tags || "",
        }));
        setResults(hits);
        setLoading(false);
        return;
      }

      const text = await resp.text();
      console.error("Non-JSON search response:", text);
      setError(
        "Search endpoint returned invalid data. Ensure serverless / API key is configured.",
      );
      setLoading(false);
    } catch (err: any) {
      console.error(err);
      setError(String(err?.message || err));
      setLoading(false);
    }
  }

  // User uploaded a local file -> open cropper
  async function onUploadFile(f?: File | null) {
    if (!f) return;
    setLoading(true);
    setError(null);
    try {
      // create a dataURL for cropper (higher res)
      const reader = new FileReader();
      const p = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(f);
      });
      setToCrop({ src: p, meta: { source: "Upload", license: "local" } });
    } catch (err: any) {
      console.error(err);
      setError("Failed to read file");
    } finally {
      setLoading(false);
    }
  }

  // User selected a search thumbnail -> try to fetch through serverless fetch endpoint to avoid CORS,
  // fallback to client fetch -> convert -> crop (may fail due to CORS)
  async function onSelectThumbnail(item: any) {
    setLoading(true);
    setError(null);
    try {
      // Try serverless fetch helper (should return { base64 } or similar)
      const resp = await fetch(
        `/api/fetch-image?url=${encodeURIComponent(item.original)}`,
      );
      const ct = resp.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        const body = await resp.json();
        if (!resp.ok) throw new Error(body?.error || "fetch failed");
        // serverless should return base64 data URL in `base64`
        const base64 = body.base64;
        if (!base64) throw new Error("Server fetch did not return base64");
        setToCrop({
          src: base64,
          meta: {
            source: item.source || "Pixabay",
            author: item.author,
            pageUrl: item.pageUrl,
            license: item.license,
          },
        });
        setLoading(false);
        return;
      }

      // Fallback: client fetch (may be blocked by CORS)
      const r = await fetch(item.original);
      if (!r.ok) throw new Error("Image fetch failed");
      const blob = await r.blob();
      // convert to dataURL
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      setToCrop({
        src: dataUrl,
        meta: {
          source: item.source || "Pixabay",
          author: item.author,
          pageUrl: item.pageUrl,
          license: item.license,
        },
      });
      setLoading(false);
    } catch (err: any) {
      console.error("Failed to fetch/prepare image:", err);
      setError(
        "Could not fetch the image (CORS or network). Try uploading instead.",
      );
      setLoading(false);
    }
  }

  // When cropper returns a cropped dataURL, convert to Blob, persist via saveImageBlob, return imageId
  async function handleCropped(
    resultDataUrl: string,
    meta?: Partial<PickResult>,
  ) {
    setLoading(true);
    setError(null);
    try {
      // Convert dataUrl -> blob (works for data: and remote)
      const blob = await dataUrlToBlob(resultDataUrl);
      // Save blob to Dexie images table
      const imageId = await saveImageBlob(blob, {
        source: meta?.source || "picker",
        author: meta?.author,
        pageUrl: meta?.pageUrl,
        license: meta?.license,
        width: undefined,
        height: undefined,
      });

      // Return both preview dataUrl (instant) and imageId (canonical)
      onSelect({
        dataUrl: resultDataUrl,
        imageId,
        source: meta?.source,
        author: meta?.author,
        pageUrl: meta?.pageUrl,
        license: meta?.license,
      });

      setToCrop(null);
      onClose();
    } catch (err: any) {
      console.error("Failed to save cropped image", err);
      setError("Failed to save image. Try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  const backdropStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(0,0,0,0.5)",
    zIndex: 9999,
  };
  const modalStyle: React.CSSProperties = {
    background: "#fff",
    borderRadius: 8,
    padding: 16,
    width: "min(95vw, 880px)",
    maxHeight: "85vh",
    overflow: "auto",
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
  };

  return (
    <>
      <div
        style={backdropStyle}
        role="dialog"
        aria-modal="true"
        aria-label="Image picker"
      >
        <div style={modalStyle}>
          <div
            style={{
              display: "flex",
              gap: 8,
              marginBottom: 12,
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setTab("upload")}
                style={{
                  padding: "6px 10px",
                  borderRadius: 6,
                  background: tab === "upload" ? "#eef2ff" : "transparent",
                }}
              >
                Upload
              </button>
              <button
                onClick={() => setTab("emoji")}
                style={{
                  padding: "6px 10px",
                  borderRadius: 6,
                  background: tab === "emoji" ? "#eef2ff" : "transparent",
                }}
              >
                Emoji
              </button>
              <button
                onClick={() => setTab("search")}
                style={{
                  padding: "6px 10px",
                  borderRadius: 6,
                  background: tab === "search" ? "#eef2ff" : "transparent",
                }}
              >
                Search
              </button>
            </div>

            <div style={{ marginLeft: "auto" }}>
              <button onClick={onClose} style={{ padding: "6px 10px" }}>
                Close
              </button>
            </div>
          </div>

          {tab === "upload" && (
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => onUploadFile(e.target.files?.[0] || null)}
              />
              <div style={{ marginTop: 8, fontSize: 12, color: "#6b7280" }}>
                Upload an image; you will be prompted to crop it to a square.
              </div>
            </div>
          )}

          {tab === "emoji" && (
            <div>
              <div style={{ marginBottom: 8 }}>
                Pick an emoji (or paste from keyboard)
              </div>
              <Picker
                data={data}
                onEmojiSelect={(em: any) => {
                  // create simple SVG data URL from emoji
                  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='512' height='512'><text y='50%' x='50%' dominant-baseline='middle' text-anchor='middle' font-size='320'>${em.native}</text></svg>`;
                  const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
                  // Persist emoji as blob in images table for consistent handling
                  (async () => {
                    try {
                      const blob = await dataUrlToBlob(dataUrl);
                      const imageId = await saveImageBlob(blob, {
                        source: "emoji",
                        license: "emoji",
                      });
                      onSelect({
                        dataUrl,
                        imageId,
                        source: "emoji",
                        license: "emoji",
                      });
                      onClose();
                    } catch (err) {
                      console.error("emoji save failed", err);
                      setError("Could not save emoji");
                    }
                  })();
                }}
              />
            </div>
          )}

          {tab === "search" && (
            <div>
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search Pixabay..."
                  style={{
                    flex: 1,
                    padding: 10,
                    border: "1px solid #e5e7eb",
                    borderRadius: 6,
                  }}
                />
                <button onClick={searchPixabay} style={{ padding: "8px 12px" }}>
                  Search
                </button>
              </div>

              <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>
                Searching Pixabay (free images). After choosing an image you'll
                be able to crop it to a square.
              </div>

              {error && (
                <div style={{ color: "crimson", marginBottom: 8 }}>{error}</div>
              )}
              {loading && <div style={{ marginBottom: 8 }}>Loading…</div>}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 8,
                }}
              >
                {results.map((r: any, idx: number) => (
                  <button
                    key={r.id || idx}
                    onClick={() => onSelectThumbnail(r)}
                    style={{
                      border: "1px solid #e5e7eb",
                      padding: 6,
                      borderRadius: 6,
                      background: "#fff",
                    }}
                    title={`${r.source || "Pixabay"} • ${r.author || ""}`}
                  >
                    <img
                      src={r.thumbnail || r.original}
                      alt={r.title || "img"}
                      style={{
                        width: "100%",
                        height: 100,
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cropper overlay */}
      {toCrop && (
        <ImageCropper
          imageSrc={toCrop.src}
          onCancel={() => setToCrop(null)}
          onCropped={(dataUrl) => handleCropped(dataUrl, toCrop.meta)}
        />
      )}
    </>
  );
}
