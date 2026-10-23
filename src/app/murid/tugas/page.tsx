"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { api } from "@/lib/api";
import { formatTanggalWaktu } from "@/lib/date";
import type { Tugas } from "@/lib/types";

const STATUS_LABEL: Record<Tugas["status"], string> = {
  belum: "Belum dikerjakan",
  terlambat: "Dikumpulkan terlambat",
  dinilai: "Sudah dinilai",
  terlewat: "Lewat deadline",
};

const STATUS_STYLE: Record<Tugas["status"], string> = {
  belum: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  terlambat: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  dinilai: "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
  terlewat: "bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-300",
};

/** Halaman "Tugas" di sidebar murid — daftar SEMUA tugas dari seluruh mapel yang diikuti (beda dari TugasKelasTab yang difilter per mapel di halaman detail mapel). */
export default function MuridTugasListPage() {
  const [tugas, setTugas] = useState<Tugas[] | null>(null);

  useEffect(() => {
    api
      .get<{ data: Tugas[] }>("/murid/tugas")
      .then((r) => setTugas(r.data))
      .catch(() => setTugas([]));
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold text-slate-900 dark:text-white">Tugas</h1>
        <p className="text-sm text-slate-500">Semua tugas dari mata pelajaran yang Anda ikuti.</p>
      </div>

      <div className="space-y-2.5">
        {tugas === null && <p className="text-sm text-slate-400">Memuat tugas...</p>}
        {tugas !== null && tugas.length === 0 && (
          <Card className="text-center text-sm text-slate-500">Belum ada tugas.</Card>
        )}
        {tugas?.map((t) => (
          <Link key={t.id} href={`/murid/tugas/${t.id}`}>
            <Card className="flex items-center justify-between gap-3 transition hover:border-teal-200 hover:shadow-md dark:hover:border-teal-800">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-800 dark:text-white">{t.judul}</p>
                <p className="text-xs text-slate-500">Deadline: {formatTanggalWaktu(t.deadline)}</p>
                {t.nilai !== null && <p className="mt-1 text-xs font-semibold text-teal-600">Nilai: {t.nilai}</p>}
              </div>
              <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold uppercase ${STATUS_STYLE[t.status]}`}>
                {STATUS_LABEL[t.status]}
              </span>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
