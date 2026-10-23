"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Megaphone } from "lucide-react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import type { Pengumuman } from "@/lib/types";

const AUTOPLAY_MS = 5000;

/**
 * Slide show pengumuman sekolah — tampil di dashboard Admin/Guru/Murid.
 * Auto-play 5 detik, dot indicator, swipeable (drag horizontal), badge "BARU".
 * Sumber data: GET /api/pengumuman/slideshow (sudah difilter status publish,
 * periode tayang, dan target paket/kelas di backend — lihat PengumumanController::slideshow()).
 */
export function PengumumanSlideshow() {
  const [items, setItems] = useState<Pengumuman[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    api
      .get<{ data: Pengumuman[] }>("/pengumuman/slideshow")
      .then((res) => setItems(res.data))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const next = useCallback(() => {
    setIndex((i) => (items.length ? (i + 1) % items.length : 0));
  }, [items.length]);

  useEffect(() => {
    if (items.length < 2) return;
    const timer = setInterval(next, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [items.length, next]);

  if (loading) {
    return <div className="h-48 w-full animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />;
  }
  if (items.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center gap-2 py-8 text-center">
        <Megaphone className="h-6 w-6 text-slate-300 dark:text-slate-600" strokeWidth={2} />
        <p className="text-sm text-slate-500">Belum ada pengumuman terbaru.</p>
      </Card>
    );
  }

  const current = items[index];

  return (
    <div
      className="group relative h-48 w-full overflow-hidden rounded-2xl bg-gradient-to-br from-teal-600 to-blue-600 shadow-md sm:h-64"
      onTouchStart={(e) => ((e.currentTarget as HTMLElement).dataset.startX = String(e.touches[0].clientX))}
      onTouchEnd={(e) => {
        const startX = Number((e.currentTarget as HTMLElement).dataset.startX ?? 0);
        const delta = e.changedTouches[0].clientX - startX;
        if (delta > 50) setIndex((i) => (i - 1 + items.length) % items.length);
        if (delta < -50) next();
      }}
    >
      <button
        type="button"
        onClick={() => router.push(`/pengumuman/${current.id}`)}
        className="block h-full w-full cursor-pointer text-left"
      >
        {current.gambar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={current.gambar_url} alt={current.judul} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center px-6 text-center text-white">
            <span className="text-lg font-semibold">{current.judul}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-2 text-white">
          <div>
            {current.pinned && (
              <span className="mb-1 mr-2 inline-block rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold uppercase">
                Disematkan
              </span>
            )}
            {current.badge_baru && (
              <span className="mb-1 inline-block rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold uppercase">
                Baru
              </span>
            )}
            <p className="line-clamp-2 text-sm font-semibold sm:text-base">{current.judul}</p>
          </div>
        </div>
      </button>

      {items.length > 1 && (
        <>
          <button
            aria-label="Sebelumnya"
            onClick={() => setIndex((i) => (i - 1 + items.length) % items.length)}
            className="absolute left-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-black/30 p-1.5 text-white opacity-0 transition group-hover:opacity-100 sm:block"
          >
            ‹
          </button>
          <button
            aria-label="Berikutnya"
            onClick={next}
            className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-black/30 p-1.5 text-white opacity-0 transition group-hover:opacity-100 sm:block"
          >
            ›
          </button>
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
            {items.map((item, i) => (
              <button
                key={item.id}
                aria-label={`Slide ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-5 bg-white" : "w-1.5 bg-white/50"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
