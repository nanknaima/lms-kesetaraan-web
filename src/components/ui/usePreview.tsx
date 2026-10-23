"use client";

import { useCallback, useRef, useState } from "react";
import { PreviewModal } from "./PreviewModal";

/** Kelola state modal pratinjau berkas (lihat PreviewModal.tsx) — dipakai di MateriAttachment, FileInput, dan halaman submission tugas murid. */
export function usePreview() {
  const [preview, setPreview] = useState<{ url: string; mimeType: string; filename: string } | null>(null);
  const urlRef = useRef<string | null>(null);

  const bukaPreview = useCallback((url: string, mimeType: string, filename: string) => {
    urlRef.current = url;
    setPreview({ url, mimeType, filename });
  }, []);

  const tutupPreview = useCallback(() => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = null;
    setPreview(null);
  }, []);

  const previewNode = preview ? (
    <PreviewModal url={preview.url} mimeType={preview.mimeType} filename={preview.filename} onClose={tutupPreview} />
  ) : null;

  return { bukaPreview, previewNode };
}
