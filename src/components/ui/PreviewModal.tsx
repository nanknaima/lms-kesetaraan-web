"use client";

import { useEffect } from "react";
import { X, Download } from "lucide-react";

/**
 * Lightbox in-page untuk pratinjau berkas — sengaja BUKAN tab baru, supaya
 * ada tombol "Tutup" yang kita kendalikan sendiri (tab baru berisi blob: URL
 * tunggal tidak punya riwayat, jadi tombol kembali browser selalu nonaktif
 * di sana). PDF & gambar dirender langsung; tipe lain (DOCX/PPTX/CSV dst.)
 * tidak bisa dirender inline oleh browser tanpa layanan konversi eksternal,
 * jadi ditampilkan pesan + arahkan ke tombol Unduh.
 */
export function PreviewModal({
  url,
  filename,
  mimeType,
  onClose,
  onDownload,
}: {
  url: string;
  filename: string;
  mimeType: string;
  onClose: () => void;
  onDownload?: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const bisaPreview = mimeType === "application/pdf" || mimeType.startsWith("image/");

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/80" onClick={onClose}>
      <div
        className="flex items-center justify-between gap-3 bg-slate-900 px-4 py-3 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="min-w-0 truncate text-sm font-semibold text-white">{filename}</p>
        <div className="flex shrink-0 items-center gap-2">
          {onDownload && (
            <button
              onClick={onDownload}
              className="flex items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-orange-600"
            >
              <Download className="h-3.5 w-3.5" strokeWidth={2.5} />
              Unduh
            </button>
          )}
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-white/20"
          >
            <X className="h-3.5 w-3.5" strokeWidth={2.5} />
            Tutup
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-2 sm:p-4" onClick={(e) => e.stopPropagation()}>
        {bisaPreview ? (
          mimeType.startsWith("image/") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt={filename} className="mx-auto max-h-full max-w-full object-contain" />
          ) : (
            <iframe src={url} title={filename} className="h-full w-full rounded-lg bg-white" />
          )
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-white">
            <p className="text-sm">Pratinjau tidak didukung browser untuk tipe berkas ini.</p>
            <p className="text-xs text-slate-400">Silakan unduh untuk membukanya dengan aplikasi yang sesuai.</p>
          </div>
        )}
      </div>
    </div>
  );
}
