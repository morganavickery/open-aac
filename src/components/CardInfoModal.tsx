// src/components/CardInfoModal.tsx
import React from "react";

export default function CardInfoModal({
  isOpen,
  onClose,
  source,
  author,
  license,
  pageUrl,
}: {
  isOpen: boolean;
  onClose: () => void;
  source?: string;
  author?: string;
  license?: string;
  pageUrl?: string;
}) {
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded p-4 w-full max-w-md shadow-lg">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-semibold">Image details</h3>
          <button onClick={onClose} aria-label="Close" className="text-sm px-2">
            Close
          </button>
        </div>

        <div className="mt-3 text-sm space-y-2">
          {source && (
            <div>
              <strong>Source:</strong> {source}
            </div>
          )}
          {author && (
            <div>
              <strong>Author:</strong> {author}
            </div>
          )}
          {license && (
            <div>
              <strong>License:</strong> {license}
            </div>
          )}
          {pageUrl && (
            <div>
              <strong>Original:</strong>{" "}
              <a
                href={pageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 underline"
              >
                Open original
              </a>
            </div>
          )}

          <div className="text-xs text-slate-500 mt-2">
            Images are provided under the license shown above. You are
            responsible for using them in compliance with the license.
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button onClick={onClose} className="px-3 py-1 rounded border">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
