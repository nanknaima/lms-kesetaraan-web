"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, BookOpen, Plus } from "lucide-react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { PengumumanSlideshow } from "@/components/PengumumanSlideshow";
import { PertemuanOnlineCard } from "@/components/PertemuanOnlineCard";
import { penugasanQueryString } from "@/hooks/usePenugasanAktif";
import type { PertemuanOnline, Tugas } from "@/lib/types";
import type { PenugasanMengajar } from "@/lib/types-guru";

const FITUR_LINKS = [
  { href: "/guru/materi", label: "Materi" },
  { href: "/guru/tugas", label: "Tugas" },
  { href: "/guru/kuis", label: "Kuis" },
  { href: "/guru/absensi", label: "Absensi" },
];

export default function GuruDashboardPage() {
  const [pertemuan, setPertemuan] = useState<PertemuanOnline[]>([]);
  const [tugasPending, setTugasPending] = useState<number>(0);
  const [penugasan, setPenugasan] = useState<PenugasanMengajar[]>([]);
  const [loadingPenugasan, setLoadingPenugasan] = useState(true);

  useEffect(() => {
    function loadPertemuan() {
      api.get<{ data: PertemuanOnline[] }>("/pertemuan-online/upcoming").then((r) => setPertemuan(r.data)).catch(() => {});
    }
    loadPertemuan();
    // Status aktif tombol "Gabung" bergantung waktu berjalan — refresh berkala supaya
    // otomatis update tanpa reload manual (sama seperti dashboard murid).
    const interval = setInterval(loadPertemuan, 30000);

    api
      .get<{ data: { data: Tugas[] } }>("/guru/tugas")
      .then((r) => setTugasPending(r.data.data?.length ?? 0))
      .catch(() => {});
    api
      .get<{ data: PenugasanMengajar[] }>("/guru/penugasan-saya")
      .then((r) => setPenugasan((r.data ?? []).filter((p) => p.status === "disetujui")))
      .catch(() => {})
      .finally(() => setLoadingPenugasan(false));

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard Guru</h1>
        <p className="text-sm text-slate-500">Kelas yang diampu, tugas pending, jadwal, pengumuman.</p>
      </div>

      <PengumumanSlideshow />

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <p className="font-semibold text-slate-800 dark:text-white">Kelas &amp; Mata Pelajaran yang Diampu</p>
          <Link
            href="/guru/kelas-mapel-saya"
            className="inline-flex items-center gap-1 text-sm text-teal-600 hover:underline"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            Ajukan Penugasan Baru
          </Link>
        </div>

        {loadingPenugasan && <p className="text-sm text-slate-400">Memuat...</p>}

        {!loadingPenugasan && penugasan.length === 0 && (
          <p className="text-sm text-slate-500">
            Anda belum mengampu kelas &amp; mapel manapun. Klik &quot;Ajukan Penugasan Baru&quot; untuk memulai, atau
            hubungi admin untuk ditugaskan.
          </p>
        )}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {penugasan.map((p) => {
            const qs = penugasanQueryString({
              kelasId: p.kelas_id,
              mapelId: p.mapel_id,
              namaKelas: p.kelas?.nama_kelas ?? "",
              namaMapel: p.mapel?.nama_mapel ?? "",
            });
            return (
              <div
                key={p.id}
                className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"
              >
                <div className="flex items-start gap-2">
                  <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" strokeWidth={2} />
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">{p.mapel?.nama_mapel}</p>
                    <p className="text-xs text-slate-500">{p.kelas?.nama_kelas}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {FITUR_LINKS.map((f) => (
                    <Link
                      key={f.href}
                      href={`${f.href}?${qs}`}
                      className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-teal-100 hover:text-teal-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-teal-950 dark:hover:text-teal-300"
                    >
                      {f.label}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <p className="font-semibold text-slate-800 dark:text-white">Pertemuan Online Terdekat</p>
              <Link href="/guru/pertemuan-online" className="inline-flex items-center gap-0.5 text-sm text-teal-600 hover:underline">
                Kelola
                <ChevronRight className="h-4 w-4" strokeWidth={2} />
              </Link>
            </div>
            <div className="space-y-3">
              {pertemuan.length === 0 && <p className="text-sm text-slate-500">Belum ada pertemuan terjadwal.</p>}
              {pertemuan.map((p) => (
                <PertemuanOnlineCard key={p.id} pertemuan={p} />
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <p className="text-sm text-slate-500">Tugas Aktif</p>
            <p className="mt-1 text-3xl font-bold text-teal-600">{tugasPending}</p>
            <Link href="/guru/tugas" className="mt-2 inline-flex items-center gap-0.5 text-sm text-teal-600 hover:underline">
              Kelola tugas
              <ChevronRight className="h-4 w-4" strokeWidth={2} />
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
