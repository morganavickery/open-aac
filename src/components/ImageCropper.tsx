// src/components/ImageCropper.tsx
import React, { useCallback, useRef, useState } from "react";
import Cropper from "react-easy-crop";

/**
 * ImageCropper
 *
 * Props:
 * - imageSrc: data URL or remote URL to display
 * - onCancel: () => void
 * - onCropped: (dataUrl: string) => void   // returns a square-cropped dataURL (PNG)
 *
 * Uses react-easy-crop for the UI and an internal canvas to produce a square result.
 */

type Props = {
  imageSrc: string;
  onCancel: () => void;
  onCropped: (dataUrl: string) => void;
  maxSize?: number; // output max pixel dimension (default 800)
};

export default function ImageCropper({
  imageSrc,
  onCancel,
  onCropped,
  maxSize = 800,
}: Props) {
  const [zoom, setZoom] = useState<number>(1);
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [cropAreaPixels, setCropAreaPixels] = useState<{
    width: number;
    height: number;
    x: number;
    y: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const onCropComplete = useCallback((_: any, areaPixels: any) => {
    setCropAreaPixels(areaPixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.setAttribute("crossOrigin", "anonymous");
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });

  const getCroppedImg = useCallback(
    async (
      source: string,
      areaPixels: {
        width: number;
        height: number;
        x: number;
        y: number;
      } | null,
    ) => {
      if (!areaPixels) throw new Error("No crop area");

      const image = await createImage(source);
      const canvas = document.createElement("canvas");

      // Make it square: use the smaller of width/height of the selected area to ensure perfect square.
      // But react-easy-crop already respects aspect=1, so width == height; still, we'll enforce square.
      const size = Math.max(
        1,
        Math.round(Math.min(areaPixels.width, areaPixels.height)),
      );

      // Scale output to maxSize if necessary
      const scale = Math.min(1, maxSize / size);
      const outputSize = Math.round(size * scale);
      canvas.width = outputSize;
      canvas.height = outputSize;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not supported");

      // Draw the cropped region into the canvas, adjusting scale.
      // We need to map crop coords from displayed pixels to natural image pixels.
      const naturalWidth = image.naturalWidth;
      const naturalHeight = image.naturalHeight;
      // react-easy-crop reports areaPixels relative to the displayed image size (image bounding box).
      // To map correctly, compute the ratio between natural and displayed. We can derive displayed dims from image element,
      // but we don't have it here easily. However react-easy-crop's areaPixels is already in pixels of the original image when cropSize = true.
      // For robustness: compute ratio based on image width/height vs naturalWidth/naturalHeight using image.width/image.height if present.

      // To avoid complexity, we'll draw using drawImage with source coordinates in natural image space by scaling:
      const ratioX = naturalWidth / image.width || 1;
      const ratioY = naturalHeight / image.height || 1;

      const sx = Math.round(areaPixels.x * ratioX);
      const sy = Math.round(areaPixels.y * ratioY);
      const sWidth = Math.round(size * ratioX);
      const sHeight = Math.round(size * ratioY);

      ctx.drawImage(
        image,
        sx,
        sy,
        sWidth,
        sHeight,
        0,
        0,
        outputSize,
        outputSize,
      );

      const dataUrl = canvas.toDataURL("image/png", 0.9);
      return dataUrl;
    },
    [maxSize],
  );

  async function handleCrop() {
    try {
      setLoading(true);
      const dataUrl = await getCroppedImg(imageSrc, cropAreaPixels);
      onCropped(dataUrl);
    } catch (err) {
      console.error(err);
      alert("Crop failed");
    } finally {
      setLoading(false);
    }
  }

  // Modal simple inline styles (keeps it visible regardless of Tailwind)
  const backdropStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(0,0,0,0.6)",
    zIndex: 10000,
  };
  const boxStyle: React.CSSProperties = {
    width: "min(95vw, 880px)",
    height: "min(80vh, 720px)",
    background: "#fff",
    borderRadius: 8,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  };
  const cropAreaStyle: React.CSSProperties = {
    position: "relative",
    flex: 1,
    background: "#111",
  };

  return (
    <div
      style={backdropStyle}
      role="dialog"
      aria-modal="true"
      aria-label="Image cropper"
    >
      <div style={boxStyle}>
        <div
          style={{
            padding: 10,
            borderBottom: "1px solid #eee",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <strong>Crop image</strong>
          <div style={{ marginLeft: "auto" }}>
            <button
              onClick={onCancel}
              style={{ marginRight: 8, padding: "6px 10px" }}
            >
              Cancel
            </button>
            <button
              onClick={handleCrop}
              style={{
                padding: "6px 10px",
                background: "#111827",
                color: "#fff",
              }}
              disabled={loading}
            >
              {loading ? "Cropping…" : "Crop & Use"}
            </button>
          </div>
        </div>

        <div style={cropAreaStyle}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            cropShape="rect"
            showGrid={false}
            objectFit="contain"
          />

          {/* Controls */}
          <div
            style={{
              padding: 10,
              borderTop: "1px solid #eee",
              display: "flex",
              gap: 8,
              alignItems: "center",
            }}
          >
            <label style={{ fontSize: 13 }}>Zoom</label>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              style={{ flex: 1 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
