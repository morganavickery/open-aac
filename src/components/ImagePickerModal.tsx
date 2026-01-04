// src/components/ImagePickerModal.tsx
import React, { useState, useEffect } from "react";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import { fileToDataUrl } from "../utils/image";

type PickResult = {
  dataUrl: string;
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
  onSelect: (result: PickResult) => void;
  initialQuery?: string;
}) {
  const [tab, setTab] = useState<"upload" | "emoji" | "search">("upload");
  const [query, setQuery] = useState(initialQuery || "");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setQuery(initialQuery || "");
  }, [initialQuery]);

  // Developer fallback: direct Pixabay key from Vite env (only for local dev).
  // In production you should use the serverless /api/search-pixabay endpoint.
  const DEV_PIXABAY_KEY = (import.meta as any).env?.VITE_PIXABAY_KEY || "";

  async function searchPixabay() {
    if (!query) return;
    setLoading(true);
    setError(null);
    setResults([]);
    try {
      // Try serverless first
      const resp = await fetch(
        `/api/search-pixabay?q=${encodeURIComponent(query)}`,
        { cache: "no-store" },
      );

      // If server responded non-JSON, fallback or surface a helpful error.
      const contentType = resp.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const j = await resp.json();
        setResults(j.images || []);
        setLoading(false);
        return;
      }

      // Not JSON — likely your dev server isn't running API routes (e.g. using vite dev without vercel dev)
      // Fallback: use direct Pixabay API *if* you provided VITE_PIXABAY_KEY for local dev.
      if (DEV_PIXABAY_KEY) {
        console.warn(
          "Falling back to direct Pixabay API using VITE_PIXABAY_KEY (dev only).",
        );
        const params = new URLSearchParams({
          key: DEV_PIXABAY_KEY,
          q: query,
          image_type: "photo",
          safesearch: "true",
          per_page: "30",
        });
        const pub = await fetch(
          `https://pixabay.com/api/?${params.toString()}`,
        );
        const pubJson = await pub.json();
        const hits = (pubJson.hits || []).map((h: any) => ({
          id: h.id,
          thumbnail: h.previewURL,
          original: h.largeImageURL || h.webformatURL,
          source: "Pixabay",
          author: h.user || "",
          pageUrl: h.pageURL || "",
          license: "Pixabay",
        }));
        setResults(hits);
        setLoading(false);
        return;
      }

      // If we reach here, server responded with something unexpected and there's no dev key.
      const text = await resp.text();
      console.error("Non-JSON search response:", text);
      setError(
        "Search endpoint returned invalid data. If running locally, either run your serverless functions (vercel dev) or set VITE_PIXABAY_KEY in your .env for local dev.",
      );
      setLoading(false);
    } catch (err: any) {
      console.error(err);
      setError(String(err?.message || err));
      setLoading(false);
    }
  }

  async function onUploadFile(f?: File | null) {
    if (!f) return;
    setLoading(true);
    try {
      const dataUrl = await fileToDataUrl(f, 800);
      onSelect({ dataUrl, source: "Upload", license: "local" });
      onClose();
    } catch (err: any) {
      console.error(err);
      setError("Failed to process file");
    } finally {
      setLoading(false);
    }
  }

  function onEmojiSelect(em: any) {
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='512' height='512'><text y='50%' x='50%' dominant-baseline='middle' text-anchor='middle' font-size='320'>${em.native}</text></svg>`;
    const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    onSelect({ dataUrl, source: "emoji", license: "emoji" });
    onClose();
  }

  async function onSelectThumbnail(item: any) {
    setLoading(true);
    setError(null);
    try {
      // Preferred path: call serverless fetch which returns base64 data-URL
      const resp = await fetch(
        `/api/fetch-image?url=${encodeURIComponent(item.original)}`,
      );
      const contentType = resp.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const body = await resp.json();
        if (!resp.ok) throw new Error(body?.error || "fetch failed");
        // body.base64 is the data URL from server
        onSelect({
          dataUrl: body.base64,
          source: item.source || body.source || "Pixabay",
          author: item.author || body.author || "",
          pageUrl: item.pageUrl || body.pageUrl || "",
          license: item.license || body.license || "Pixabay",
        });
        onClose();
        setLoading(false);
        return;
      }

      // If server returns non-json, maybe your serverless functions aren't running.
      // Try client-side fetch->convert (may fail due to CORS).
      try {
        const r = await fetch(item.original);
        if (!r.ok) throw new Error("Image fetch failed");
        const blob = await r.blob();
        const file = new File([blob], "download", { type: blob.type });
        const dataUrl = await fileToDataUrl(file, 800);
        onSelect({
          dataUrl,
          source: item.source || "Pixabay",
          author: item.author || "",
          pageUrl: item.pageUrl || "",
          license: item.license || "Pixabay",
        });
        onClose();
      } catch (clientErr) {
        console.error("Client fetch failed (likely CORS):", clientErr);
        setError(
          "Could not fetch the image due to CORS. Please run vercel dev / enable serverless functions or upload the image manually.",
        );
      } finally {
        setLoading(false);
      }
    } catch (err: any) {
      console.error(err);
      setError(String(err?.message || err));
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  // Inline styles to ensure modal is visible even if Tailwind is not applied or missing
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
  const tabBtn = (active: boolean) => ({
    padding: "6px 10px",
    borderRadius: 6,
    border: "none",
    background: active ? "#eef2ff" : "transparent",
    cursor: "pointer",
  });

  return (
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
              style={tabBtn(tab === "upload")}
              onClick={() => setTab("upload")}
            >
              Upload
            </button>
            <button
              style={tabBtn(tab === "emoji")}
              onClick={() => setTab("emoji")}
            >
              Emoji
            </button>
            <button
              style={tabBtn(tab === "search")}
              onClick={() => setTab("search")}
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
              Upload an image from your device. It will be saved locally for
              offline use.
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
              onEmojiSelect={(em: any) => onEmojiSelect(em)}
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
              Searching Pixabay (free images). Selected images will be fetched
              and stored locally for offline use.
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
  );
}
