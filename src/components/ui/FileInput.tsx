"use client";

import { useRef } from "react";
import { Paperclip, CheckCircle2, Eye } from "lucide-react";
import { usePreview } from "./usePreview";

/**
 * Input file custom — input asli disembunyikan & ditrigger lewat tombol
 * berwarna supaya konsisten dengan desain aplikasi (bukan "Choose File" bawaan
 * browser yang polos), lalu nama file yang terpilih ditampilkan jelas dengan
 * ikon centang. Validasi "wajib diisi" DIBIARKAN ke pemanggil (JS, bukan HTML
 * `required`) karena input aslinya disembunyikan (`display:none`) sehingga
 * browser tidak bisa menampilkan validation UI di atasnya.
 */
export function FileInput({
  file,
  onChange,
  accept,
  label = "Pilih File",
}: {
  file: File | null;
  onChange: (file: File | null) => void;
  accept?: string;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { bukaPreview, previewNode } = usePreview();

  /** File yang baru dipilih (belum diunggah) — buat object URL lokal, tidak perlu fetch ke server. */
  function lihatFileLokal() {
    if (!file) return;
    bukaPreview(URL.createObjectURL(file), file.type, file.name);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex shrink-0 items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-teal-700"
      >
        <Paperclip className="h-4 w-4" strokeWidth={2} />
        {label}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        className="hidden"
      />
      {file ? (
        <span className="flex min-w-0 items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
          <span className="truncate">{file.name}</span>
        </span>
      ) : (
        <span className="text-xs text-slate-400">Belum ada file dipilih</span>
      )}
      {file && (
        <button
          type="button"
          onClick={lihatFileLokal}
          title="Lihat isi file sebelum dikirim"
          className="flex shrink-0 items-center gap-1 rounded-lg border border-slate-300 px-2 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          <Eye className="h-3.5 w-3.5" strokeWidth={2} />
          Lihat
        </button>
      )}
      {previewNode}
    </div>
  );
}
