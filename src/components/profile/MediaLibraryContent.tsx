"use client";

import { useEffect, useState } from "react";
import { Cloud, FileText } from "lucide-react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { formatTanggalWaktu } from "@/lib/date";

const KUOTA_BYTES = 100 * 1024 * 1024; // 100MB, sama seperti versi mobile.

interface MediaItem {
  judul: string | null;
  mapel: string | null;
  file_url: string;
  file_name: string;
  size_bytes: number;
  waktu: string | null;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * "Media Library" — daftar file yang tersimpan di storage backend milik
 * pengguna login (murid: file submission tugas; guru: file materi & lampiran
 * tugas), diambil dari GET /media-library (endpoint sama untuk murid & guru,
 * lihat backend MediaLibraryController). Dipakai bareng oleh /murid/media-library
 * dan /guru/media-library, meniru mobile/lib/features/murid/media_library_screen.dart.
 * Tombol "Hubungkan ke Google Drive" sengaja TIDAK benar-benar terkoneksi —
 * proyek ini belum punya kredensial OAuth Google, sama seperti versi mobile.
 */
export function MediaLibraryContent() {
  const [items, setItems] = useState<MediaItem[] | null>(null);
  const [usedBytes, setUsedBytes] = useState(0);
  const [showGdriveNotice, setShowGdriveNotice] = useState(false);

  useEffect(() => {
    api
      .get<{ data: MediaItem[]; used_bytes: number }>("/media-library")
      .then((r) => {
        setItems(r.data);
        setUsedBytes(r.used_bytes);
      })
      .catch(() => setItems([]));
  }, []);

  const persen = Math.min(100, (usedBytes / KUOTA_BYTES) * 100);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold text-slate-900 dark:text-white">Media Library</h1>
        <p className="text-sm text-slate-500">File yang tersimpan dari aktivitas Anda di LMS.</p>
      </div>

      <Card>
        <div className="flex items-center justify-between text-sm">
          <p className="font-semibold text-slate-700 dark:text-slate-200">Memori Terpakai</p>
          <p className="text-xs text-slate-500">
            {formatSize(usedBytes)} / {formatSize(KUOTA_BYTES)}
          </p>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className={`h-full rounded-full ${persen > 90 ? "bg-rose-500" : "bg-teal-600"}`}
            style={{ width: `${persen}%` }}
          />
        </div>
      </Card>

      <button
        onClick={() => setShowGdriveNotice(true)}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-teal-600 py-2.5 text-sm font-semibold text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950"
      >
        <Cloud className="h-4 w-4" strokeWidth={2} />
        Hubungkan ke Google Drive
      </button>
      {showGdriveNotice && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-950 dark:text-amber-300">
          Integrasi Google Drive belum tersedia — proyek ini belum punya kredensial OAuth Google Cloud.
        </p>
      )}

      <div>
        <h2 className="mb-2 text-sm font-bold text-slate-700 dark:text-slate-200">File Terunggah</h2>
        <div className="space-y-2">
          {items === null && <p className="text-sm text-slate-400">Memuat...</p>}
          {items !== null && items.length === 0 && (
            <Card className="text-center text-sm text-slate-500">Belum ada file yang diunggah.</Card>
          )}
          {items?.map((item, i) => (
            <Card key={i} className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300">
                <FileText className="h-5 w-5" strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-800 dark:text-white">{item.file_name}</p>
                <p className="truncate text-xs text-slate-500">
                  {item.judul ?? "-"}
                  {item.mapel ? ` · ${item.mapel}` : ""}
                </p>
                <p className="text-[11px] text-slate-400">
                  {formatSize(item.size_bytes)}
                  {item.waktu ? ` · ${formatTanggalWaktu(item.waktu)}` : ""}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
