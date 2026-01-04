// src/utils/dataUrl.ts
/**
 * Convert data URL or remote URL to Blob
 * - If dataUrl starts with data:, decode and return Blob
 * - If not, fetch the resource and return the blob (CORS may block)
 */
export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  if (dataUrl.startsWith("data:")) {
    const parts = dataUrl.split(",");
    const meta = parts[0];
    const isBase64 = meta.indexOf(";base64") >= 0;
    const mimeMatch = meta.match(/data:(.*?)(;|$)/);
    const mime = mimeMatch ? mimeMatch[1] : "application/octet-stream";
    if (isBase64) {
      const bstr = atob(parts[1]);
      let n = bstr.length;
      const u8 = new Uint8Array(n);
      while (n--) {
        u8[n] = bstr.charCodeAt(n);
      }
      return new Blob([u8], { type: mime });
    } else {
      const decoded = decodeURIComponent(parts[1]);
      return new Blob([decoded], { type: mime });
    }
  } else {
    // remote URL -> fetch blob
    const res = await fetch(dataUrl);
    if (!res.ok) throw new Error("Failed to fetch image");
    return await res.blob();
  }
}
