// src/utils/image.ts
export async function fileToDataUrl(
  file: File,
  maxDim = 800,
  outputType = "image/jpeg",
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
  if (!ctx) throw new Error("canvas not supported");
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

export async function urlToDataUrl(url: string, maxDim = 800) {
  // attempt to fetch; may hit CORS. If server-side proxy available, use it.
  const resp = await fetch(url);
  if (!resp.ok) throw new Error("fetch failed");
  const blob = await resp.blob();
  const file = new File([blob], "downloaded", { type: blob.type });
  return fileToDataUrl(file, maxDim, "image/jpeg", 0.85);
}
