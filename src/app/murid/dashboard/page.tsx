"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardList, Video, PartyPopper, Trophy, Medal, Megaphone, Receipt } from "lucide-react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { PengumumanSlideshow } from "@/components/PengumumanSlideshow";
import { PertemuanOnlineCard } from "@/components/PertemuanOnlineCard";
import { formatTanggalWaktu } from "@/lib/date";
import type { Leaderboard, PertemuanOnline, Tugas } from "@/lib/types";

const TUGAS_STATUS_LABEL: Record<Tugas["status"], string> = {
  belum: "Belum",
  terlambat: "Terlambat",
  dinilai: "Dinilai",
  terlewat: "Lewat",
};

const TUGAS_STATUS_STYLE: Record<Tugas["status"], string> = {
  belum: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  terlambat: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  dinilai: "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
  terlewat: "bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-300",
};

/**
 * Dashboard murid — pusat INFORMASI, bukan daftar link menu (navigasi utama sudah
 * ditangani Sidebar/Bottom Navbar di MuridLayout). Absensi & Nilai Akhir dipindah ke
 * /murid/profil, Mapel & Tugas digabung jadi "Ruang Kelas" di bottom nav, Profil hanya
 * lewat avatar di appbar — supaya tidak duplikat dengan navigasi.
 */
export default function MuridDashboardPage() {
  const [pertemuan, setPertemuan] = useState<PertemuanOnline[]>([]);
  const [tugas, setTugas] = useState<Tugas[]>([]);
  const [leaderboard, setLeaderboard] = useState<Leaderboard | null>(null);

  useEffect(() => {
    function loadPertemuan() {
      api.get<{ data: PertemuanOnline[] }>("/pertemuan-online/upcoming").then((r) => setPertemuan(r.data)).catch(() => {});
    }
    loadPertemuan();
    api.get<{ data: Tugas[] }>("/murid/tugas").then((r) => setTugas(r.data)).catch(() => {});
    api.get<{ data: Leaderboard }>("/murid/leaderboard").then((r) => setLeaderboard(r.data)).catch(() => {});

    // Status aktif/tidaknya tombol "Gabung" bergantung waktu berjalan (window join_aktif
    // di backend) — refresh berkala supaya tombol otomatis aktif begitu waktunya tiba,
    // tanpa murid harus reload manual.
    const interval = setInterval(loadPertemuan, 30000);
    return () => clearInterval(interval);
  }, []);

  const tugasMendatang = tugas.filter((t) => t.status === "belum" || t.status === "terlambat").slice(0, 3);
  const jadwalTerdekat = pertemuan.slice(0, 2);

  return (
    <div className="space-y-4">
      {/* Widget: Pengumuman Sekolah — di paling atas, sejajar dengan pola dashboard admin & guru */}
      <section>
        <div className="mb-2.5 flex items-center gap-2">
          <Megaphone className="h-[18px] w-[18px] text-teal-600 dark:text-teal-400" strokeWidth={2} />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Pengumuman Sekolah</p>
        </div>
        <PengumumanSlideshow />
      </section>

      {/* Widget 1: Jadwal Terdekat */}
      <section>
        <div className="mb-2.5 flex items-center gap-2">
          <Video className="h-[18px] w-[18px] text-teal-600 dark:text-teal-400" strokeWidth={2} />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Jadwal Terdekat</p>
        </div>
        {jadwalTerdekat.length > 0 ? (
          <div className="space-y-2.5">
            {jadwalTerdekat.map((p) => (
              <PertemuanOnlineCard key={p.id} pertemuan={p} isMurid />
            ))}
          </div>
        ) : (
          <Card className="text-center text-sm text-slate-500">Tidak ada jadwal pertemuan online terdekat.</Card>
        )}
      </section>

      {/* Widget 2: Tugas & Kuis Mendatang */}
      <section>
        <div className="mb-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-[18px] w-[18px] text-teal-600 dark:text-teal-400" strokeWidth={2} />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Tugas & Kuis Mendatang</p>
          </div>
          <Link href="/murid/tugas" className="text-xs font-medium text-teal-600 hover:underline">
            Lihat semua
          </Link>
        </div>
        <div className="space-y-2.5">
          {tugasMendatang.map((t) => (
            <Link key={t.id} href={`/murid/tugas/${t.id}`}>
              <Card className="flex items-center justify-between gap-3 transition hover:border-teal-200 hover:shadow-md dark:hover:border-teal-800">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800 dark:text-white">{t.judul}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Deadline: {formatTanggalWaktu(t.deadline)}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${TUGAS_STATUS_STYLE[t.status]}`}
                >
                  {TUGAS_STATUS_LABEL[t.status]}
                </span>
              </Card>
            </Link>
          ))}
          {tugasMendatang.length === 0 && (
            <Card className="flex items-center justify-center gap-1.5 text-center text-sm text-slate-500">
              <PartyPopper className="h-4 w-4 text-teal-600 dark:text-teal-400" strokeWidth={2} />
              Tidak ada tugas mendatang.
            </Card>
          )}
        </div>
      </section>

      {/* Widget 3: Gamifikasi — poin & peringkat kelas, diambil dari akumulasi
          skor kuis (GET /murid/leaderboard). Tautan ke halaman leaderboard
          lengkap supaya murid bisa lihat papan peringkat teman sekelasnya. */}
      <section>
        <Link href="/murid/leaderboard">
          <Card className="bg-gradient-to-br from-teal-600 to-teal-700 text-white transition hover:brightness-110">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15">
                  <Trophy className="h-6 w-6" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-xs text-teal-100">Poin Kamu</p>
                  <p className="text-xl font-bold">{leaderboard ? `${leaderboard.poin_saya} pts` : "..."}</p>
                </div>
              </div>
              <div className="h-10 w-px bg-white/20" />
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-right text-xs text-teal-100">Peringkat Kelas</p>
                  <p className="text-right text-xl font-bold">
                    {leaderboard?.peringkat_saya ? `#${leaderboard.peringkat_saya}` : "-"}
                    {leaderboard && leaderboard.total_murid > 0 ? (
                      <span className="text-xs font-normal text-teal-100"> /{leaderboard.total_murid}</span>
                    ) : null}
                  </p>
                </div>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15">
                  <Medal className="h-6 w-6" strokeWidth={2} />
                </div>
              </div>
            </div>
          </Card>
        </Link>
      </section>

      {/* Widget: Tagihan — belum ada modul pembayaran/SPP di backend, jadi selalu tampil
          sebagai empty state (bukan angka rekaan) sampai fitur billing benar-benar ada. */}
      <section>
        <div className="mb-2.5 flex items-center gap-2">
          <Receipt className="h-[18px] w-[18px] text-teal-600 dark:text-teal-400" strokeWidth={2} />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Tagihan</p>
        </div>
        <Card className="text-center text-sm text-slate-500">Tidak ada tagihan aktif saat ini.</Card>
      </section>
    </div>
  );
}
