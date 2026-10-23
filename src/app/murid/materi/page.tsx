"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import type { MapelMurid } from "@/lib/types";

/** Warna aksen kartu mapel, dirotasi berdasarkan urutan — tetap dalam palet teal/slate yang sudah ada di app. */
const ACCENTS = [
  { bg: "bg-teal-100 dark:bg-teal-900", text: "text-teal-700 dark:text-teal-300" },
  { bg: "bg-blue-100 dark:bg-blue-900", text: "text-blue-700 dark:text-blue-300" },
  { bg: "bg-amber-100 dark:bg-amber-900", text: "text-amber-700 dark:text-amber-300" },
  { bg: "bg-rose-100 dark:bg-rose-900", text: "text-rose-700 dark:text-rose-300" },
  { bg: "bg-purple-100 dark:bg-purple-900", text: "text-purple-700 dark:text-purple-300" },
  { bg: "bg-emerald-100 dark:bg-emerald-900", text: "text-emerald-700 dark:text-emerald-300" },
];

export default function MuridMateriListPage() {
  const [mapel, setMapel] = useState<MapelMurid[] | null>(null);

  useEffect(() => {
    api
      .get<{ data: MapelMurid[] }>("/murid/mapel")
      .then((r) => setMapel(r.data))
      .catch(() => setMapel([]));
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold text-slate-900 dark:text-white">Mata Pelajaran</h1>
        <p className="text-sm text-slate-500">Materi, kuis, dan diskusi untuk setiap mapel di kelas Anda.</p>
      </div>

      {mapel === null && (
        <div className="grid gap-3 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
          ))}
        </div>
      )}

      {mapel !== null && mapel.length === 0 && (
        <Card className="text-center text-sm text-slate-500">Belum ada mapel yang terdaftar untuk kelas Anda.</Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {mapel?.map((m, i) => {
          const accent = ACCENTS[i % ACCENTS.length];
          return (
            <Link key={m.id} href={`/murid/materi/${m.id}`}>
              <Card className="flex items-center gap-3 transition hover:border-teal-200 hover:shadow-md dark:hover:border-teal-800">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${accent.bg} ${accent.text}`}
                >
                  <BookOpen className="h-6 w-6" strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-800 dark:text-white">{m.nama_mapel}</p>
                  <p className="truncate text-xs text-slate-500">
                    {m.guru?.user?.nama ? `Pengajar: ${m.guru.user.nama}` : "Belum ada pengajar"}
                  </p>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
