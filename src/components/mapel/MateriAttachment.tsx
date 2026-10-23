"use client";

import { useRef, useState } from "react";
import {
  FileText,
  Video,
  Link2,
  FileEdit,
  Presentation,
  File,
  Image as ImageIcon,
  ArrowRight,
  Download,
  Eye,
  type LucideIcon,
} from "lucide-react";
import { api } from "@/lib/api";
import { unduhBerkas, ambilBlobUrl, ambilBlobUntukPreview } from "@/lib/download";
import { usePreview } from "@/components/ui/usePreview";
import type { MateriTipe } from "@/lib/types";

/** Bentuk minimal materi yang dibutuhkan blok lampiran — cocok untuk MateriMurid maupun MateriGuru. */
export interface MateriLampiran {
  id: number;
  tipe: MateriTipe;
  file_url: string | null;
}

export const TIPE_ICON: Record<MateriTipe, LucideIcon> = {
  pdf: FileText,
  video: Video,
  link: Link2,
  teks: FileEdit,
  ppt: Presentation,
  docx: File,
  gambar: ImageIcon,
};

export const TIPE_LABEL: Record<MateriTipe, string> = {
  pdf: "PDF",
  video: "Video",
  link: "Tautan",
  teks: "Teks",
  ppt: "Slide",
  docx: "Dokumen",
  gambar: "Gambar",
};

function namaBerkas(fileUrl: string) {
  const bagian = fileUrl.split("/");
  return decodeURIComponent(bagian[bagian.length - 1]);
}

/**
 * Blok lampiran materi — dipakai baik di feed diskusi maupun tab Materi, di
 * sisi murid MAUPUN guru (lewat `endpointBase`). Berkas diunduh/diputar
 * lewat endpoint ber-otentikasi (Sanctum bearer token) supaya pengecekan
 * akses & (untuk murid) pencatatan absensi-otomatis tetap berjalan, bukan
 * lewat link /storage/... polos yang melewati keduanya.
 */
export function MateriAttachment({
  materi,
  endpointBase = "/murid/materi",
  trackWatch = true,
}: {
  materi: MateriLampiran;
  endpointBase?: string;
  trackWatch?: boolean;
}) {
  const [mengunduh, setMengunduh] = useState(false);
  const [melihat, setMelihat] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [memuatVideo, setMemuatVideo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sudahLaporRef = useRef(false);
  const Icon = TIPE_ICON[materi.tipe];
  const { bukaPreview, previewNode } = usePreview();

  async function unduh() {
    if (!materi.file_url) return;
    setMengunduh(true);
    setError(null);
    try {
      await unduhBerkas(`${endpointBase}/${materi.id}/download`, namaBerkas(materi.file_url));
    } catch {
      setError("Gagal mengunduh berkas.");
    } finally {
      setMengunduh(false);
    }
  }

  async function lihat() {
    if (!materi.file_url) return;
    setMelihat(true);
    setError(null);
    try {
      const { url, mimeType } = await ambilBlobUntukPreview(`${endpointBase}/${materi.id}/download`);
      bukaPreview(url, mimeType, namaBerkas(materi.file_url));
    } catch {
      setError("Gagal membuka berkas.");
    } finally {
      setMelihat(false);
    }
  }

  async function muatVideo() {
    if (videoUrl || memuatVideo) return;
    setMemuatVideo(true);
    setError(null);
    try {
      setVideoUrl(await ambilBlobUrl(`${endpointBase}/${materi.id}/stream`));
    } catch {
      setError("Gagal memuat video.");
    } finally {
      setMemuatVideo(false);
    }
  }

  function onTimeUpdate(e: React.SyntheticEvent<HTMLVideoElement>) {
    if (!trackWatch || sudahLaporRef.current) return;
    const v = e.currentTarget;
    if (v.duration && v.currentTime / v.duration >= 0.98) {
      sudahLaporRef.current = true;
      api.post(`${endpointBase}/${materi.id}/selesai-tonton`).catch(() => {});
    }
  }

  if (materi.tipe === "teks") return null;

  if (materi.tipe === "video") {
    return (
      <div className="mt-3">
        {videoUrl ? (
          <video src={videoUrl} controls className="w-full rounded-xl bg-black" onTimeUpdate={onTimeUpdate} />
        ) : (
          <button
            type="button"
            onClick={muatVideo}
            disabled={memuatVideo}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 py-8 text-sm font-semibold text-slate-600 transition hover:border-teal-300 hover:text-teal-700 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            <Video className="h-5 w-5" strokeWidth={2} />
            {memuatVideo ? "Memuat video..." : "Putar video"}
          </button>
        )}
        {error && <p className="mt-1 text-xs text-rose-500">{error}</p>}
      </div>
    );
  }

  if (materi.tipe === "link") {
    if (!materi.file_url) return <p className="mt-2 text-xs text-slate-400">Tautan belum tersedia.</p>;
    return (
      <a
        href={materi.file_url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-teal-600 hover:underline"
      >
        Buka tautan
        <ArrowRight className="h-3 w-3" strokeWidth={2.5} />
      </a>
    );
  }

  if (!materi.file_url) return <p className="mt-2 text-xs text-slate-400">Berkas belum tersedia.</p>;

  return (
    <div className="mt-3">
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-rose-500 shadow-sm dark:bg-slate-900">
          <Icon className="h-5 w-5" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-slate-700 dark:text-slate-200">{namaBerkas(materi.file_url)}</p>
          <p className="text-[10px] uppercase tracking-wide text-slate-400">{TIPE_LABEL[materi.tipe]}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={lihat}
            disabled={melihat}
            title="Lihat isi berkas sebelum diunduh"
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <Eye className="h-3.5 w-3.5" strokeWidth={2.5} />
            {melihat ? "..." : "Lihat"}
          </button>
          <button
            type="button"
            onClick={unduh}
            disabled={mengunduh}
            className="flex items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-orange-600 disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" strokeWidth={2.5} />
            {mengunduh ? "..." : "Unduh"}
          </button>
        </div>
      </div>
      {error && <p className="mt-1 text-xs text-rose-500">{error}</p>}
      {previewNode}
    </div>
  );
}
