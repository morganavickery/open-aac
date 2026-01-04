// src/utils/image.ts
/**
 * image helpers - fileToDataUrl and urlToDataUrl
 *
 * - fileToDataUrl: converts a File to a resized/compressed data URL
 * - urlToDataUrl: given a URL (possibly proxied), fetches, converts to data URL
 *
 * Both functions limit max dimension (maxDim) to keep DB size reasonable.
 */

export async function fileToDataUrl(
  file: File,
  maxDim = 800,
  outputType: string = "image/jpeg",
  quality = 0.85,
): Promise<string> {
  const img = await loadImageFromFile(file);
  const [w, h] = [img.width, img.height];
  const scale = Math.min(1, maxDim / Math.max(w, h));
  const cw = Math.round(w * scale);
  const ch = Math.round(h * scale);
  const canvas = document.createElement("canvas");
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(img, 0, 0, cw, ch);
  return canvas.toDataURL(outputType, quality);
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = String(reader.result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * urlToDataUrl:
 *  - try to fetch the URL in the browser (may hit CORS)
 *  - if it works, convert blob -> File -> fileToDataUrl
 *  - otherwise, the caller should try a server proxy (e.g. /api/fetch-image?url=...)
 */
export async function urlToDataUrl(url: string, maxDim = 800): Promise<string> {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error("fetch failed");
  const blob = await resp.blob();
  const file = new File([blob], "downloaded", { type: blob.type });
  return fileToDataUrl(
    file,
    maxDim,
    blob.type.includes("png") ? "image/png" : "image/jpeg",
    0.85,
  );
}
