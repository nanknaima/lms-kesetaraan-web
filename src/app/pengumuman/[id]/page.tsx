"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, X, ZoomIn } from "lucide-react";
import { api } from "@/lib/api";
import type { Pengumuman } from "@/lib/types";

/** Halaman detail pengumuman — shared untuk semua role, diakses via klik slide. */
export default function PengumumanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [item, setItem] = useState<Pengumuman | null>(null);
  const [lightboxTerbuka, setLightboxTerbuka] = useState(false);
  const router = useRouter();

  useEffect(() => {
    api.get<{ data: Pengumuman }>(`/pengumuman/${id}`).then((r) => setItem(r.data));
  }, [id]);

  // Tutup lightbox dengan tombol Escape, selain klik di luar gambar / tombol X.
  useEffect(() => {
    if (!lightboxTerbuka) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxTerbuka(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxTerbuka]);

  if (!item) return <div className="p-6 text-sm text-slate-500">Memuat...</div>;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <button onClick={() => router.back()} className="mb-4 inline-flex items-center gap-1 text-sm text-teal-600 hover:underline">
        <ArrowLeft className="h-4 w-4" strokeWidth={2} />
        Kembali
      </button>
      {item.gambar_url && (
        <button
          type="button"
          onClick={() => setLightboxTerbuka(true)}
          className="group relative mb-4 block w-full cursor-zoom-in overflow-hidden rounded-2xl"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.gambar_url} alt={item.judul} className="w-full rounded-2xl object-cover" />
          <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/20">
            <ZoomIn className="h-8 w-8 text-white opacity-0 transition group-hover:opacity-100" strokeWidth={2} />
          </span>
        </button>
      )}
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{item.judul}</h1>
      <div className="mt-4 whitespace-pre-line text-slate-700 dark:text-slate-300">{item.konten}</div>

      {lightboxTerbuka && item.gambar_url && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightboxTerbuka(false)}
        >
          <button
            onClick={() => setLightboxTerbuka(false)}
            aria-label="Tutup"
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.gambar_url}
            alt={item.judul}
            className="max-h-full max-w-full cursor-default rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
