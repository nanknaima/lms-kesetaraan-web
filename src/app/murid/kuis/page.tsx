"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { api } from "@/lib/api";
import { formatTanggalWaktu } from "@/lib/date";
import type { KuisMurid } from "@/lib/types";

/** Halaman "Kuis" di sidebar murid — daftar semua kuis dari seluruh mapel yang diikuti (pola sama dengan /murid/tugas). */
export default function MuridKuisListPage() {
  const [kuis, setKuis] = useState<KuisMurid[] | null>(null);

  useEffect(() => {
    api
      .get<{ data: KuisMurid[] }>("/murid/kuis")
      .then((r) => setKuis(r.data))
      .catch(() => setKuis([]));
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold text-slate-900 dark:text-white">Kuis</h1>
        <p className="text-sm text-slate-500">Semua kuis yang masih berlangsung/tersedia dari mata pelajaran yang Anda ikuti.</p>
      </div>

      <div className="space-y-2.5">
        {kuis === null && <p className="text-sm text-slate-400">Memuat kuis...</p>}
        {kuis !== null && kuis.length === 0 && (
          <Card className="text-center text-sm text-slate-500">Belum ada kuis yang tersedia.</Card>
        )}
        {kuis?.map((k) => {
          const belumMulai = new Date(k.mulai) > new Date();
          return (
            <Link key={k.id} href={`/murid/kuis/${k.id}`}>
              <Card className="flex items-center gap-3 transition hover:border-teal-200 hover:shadow-md dark:hover:border-teal-800">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                  <ClipboardList className="h-5 w-5" strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800 dark:text-white">{k.judul}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {k.total_soal} soal · Durasi {k.durasi_menit} menit
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    {formatTanggalWaktu(k.mulai)} – {formatTanggalWaktu(k.selesai)}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                    belumMulai ? "bg-amber-100 text-amber-700" : "bg-teal-100 text-teal-700"
                  }`}
                >
                  {belumMulai ? "Belum mulai" : "Berlangsung"}
                </span>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
