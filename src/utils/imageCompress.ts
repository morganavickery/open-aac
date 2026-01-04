// src/utils/imageCompress.ts
/**
 * Compress/resize an image (File, Blob, or dataURL) to a Blob.
 * - Tries WebP, falls back to JPEG/PNG
 */
export async function compressImageToBlob(
  fileOrDataUrl: File | Blob | string,
  maxSide = 1024,
  quality = 0.82,
): Promise<Blob> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = (e) => reject(e);
    if (typeof fileOrDataUrl === "string") {
      image.src = fileOrDataUrl;
    } else {
      const reader = new FileReader();
      reader.onload = () => (image.src = String(reader.result));
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(fileOrDataUrl as Blob);
    }
  });

  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const ratio = Math.max(w, h) / maxSide;
  const outW = ratio > 1 ? Math.round(w / ratio) : w;
  const outH = ratio > 1 ? Math.round(h / ratio) : h;

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, outW, outH);
  ctx.drawImage(img, 0, 0, outW, outH);

  const tryToBlob = (type: string) =>
    new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), type as any, quality);
    });

  try {
    const webp = await tryToBlob("image/webp");
    if (webp && webp.size > 0) return webp;
  } catch (e) {
    // ignore
  }

  const jpeg = await tryToBlob("image/jpeg");
  if (jpeg) return jpeg;
  const png = await tryToBlob("image/png");
  if (png) return png;

  throw new Error("Could not create image blob");
}
