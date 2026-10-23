"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, StatCard } from "@/components/ui/Card";
import { PengumumanSlideshow } from "@/components/PengumumanSlideshow";

interface DashboardStats {
  total_guru: number;
  total_murid: number;
  total_kelas: number;
  murid_per_paket: Record<string, number>;
  pendaftaran_pending: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    api.get<{ data: DashboardStats }>("/admin/dashboard").then((res) => setStats(res.data)).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard Admin</h1>
        <p className="text-sm text-slate-500">Ringkasan aktivitas sekolah kesetaraan.</p>
      </div>

      <PengumumanSlideshow />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Total Guru" value={stats?.total_guru ?? "—"} accent="teal" />
        <StatCard label="Total Murid" value={stats?.total_murid ?? "—"} accent="blue" />
        <StatCard label="Total Kelas" value={stats?.total_kelas ?? "—"} accent="teal" />
        <StatCard label="Pendaftaran Pending" value={stats?.pendaftaran_pending ?? "—"} accent="orange" />
        <StatCard
          label="Paket A / B / C"
          value={
            stats
              ? `${stats.murid_per_paket.A ?? 0} / ${stats.murid_per_paket.B ?? 0} / ${stats.murid_per_paket.C ?? 0}`
              : "—"
          }
          accent="blue"
        />
      </div>

      <Card>
        <p className="font-semibold text-slate-800 dark:text-white">Aktivitas Terbaru</p>
        <p className="mt-2 text-sm text-slate-500">
          Widget rekap nilai/absensi/kelulusan bisa ditambahkan di sini (mengikuti pola StatCard di atas),
          menggunakan endpoint <code>/api/admin/dashboard</code> yang diperluas sesuai kebutuhan.
        </p>
      </Card>
    </div>
  );
}
