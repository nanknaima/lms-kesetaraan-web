"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import type { NilaiAkhirMurid } from "@/lib/types";

const STATUS_LABEL: Record<NilaiAkhirMurid["status_kelulusan"], string> = {
  lulus: "Lulus",
  tidak_lulus: "Tidak Lulus",
  pending: "Menunggu",
};

const STATUS_STYLE: Record<NilaiAkhirMurid["status_kelulusan"], string> = {
  lulus: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  tidak_lulus: "bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-300",
  pending: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
};

export default function MuridNilaiAkhirPage() {
  const [nilai, setNilai] = useState<NilaiAkhirMurid[] | null>(null);

  useEffect(() => {
    api
      .get<{ data: NilaiAkhirMurid[] }>("/murid/nilai-akhir")
      .then((r) => setNilai(r.data))
      .catch(() => setNilai([]));
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold text-slate-900 dark:text-white">Nilai Akhir</h1>
        <p className="text-sm text-slate-500">Nilai akhir per mata pelajaran yang sudah dirilis guru.</p>
      </div>

      <div className="space-y-3">
        {nilai === null && <p className="text-sm text-slate-400">Memuat...</p>}

        {nilai !== null && nilai.length === 0 && (
          <Card className="text-center text-sm text-slate-500">Belum ada nilai akhir yang dirilis.</Card>
        )}

        {nilai?.map((n) => (
          <Card key={n.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-800 dark:text-white">
                  {n.mapel?.nama_mapel ?? "-"}
                </p>
                <p className="mt-1 text-2xl font-bold text-teal-600 dark:text-teal-400">{n.nilai_akhir}</p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${STATUS_STYLE[n.status_kelulusan]}`}
              >
                {STATUS_LABEL[n.status_kelulusan]}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-4 gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{n.nilai_tugas}</p>
                <p className="text-[10px] text-slate-500">Tugas</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{n.nilai_kuis}</p>
                <p className="text-[10px] text-slate-500">Kuis</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{n.nilai_absensi}</p>
                <p className="text-[10px] text-slate-500">Absensi</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{n.nilai_ujian}</p>
                <p className="text-[10px] text-slate-500">Ujian</p>
              </div>
            </div>

            {n.catatan_guru && (
              <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                Catatan guru: {n.catatan_guru}
              </p>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
