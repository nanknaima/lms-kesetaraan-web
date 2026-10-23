"use client";

/**
 * Banner konteks "penugasan aktif" (kelas+mapel) yang ditampilkan di semua
 * halaman fitur guru (Materi/Tugas/Kuis/Absensi/Pertemuan Online/Nilai
 * Akhir/Diskusi). Klik "Ganti" membuka dropdown daftar penugasan yang
 * disetujui (GET /guru/penugasan-saya, data yang sama dengan kartu di
 * Dashboard) — memilih salah satu langsung mengganti query string halaman
 * ini lewat router.replace (tanpa reload penuh & tanpa ke Dashboard), dan
 * karena usePenugasanAktif membaca query string, semua halaman langsung
 * refetch data sesuai konteks baru.
 */
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, Check, ChevronDown } from "lucide-react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { penugasanQueryString, type PenugasanAktif } from "@/hooks/usePenugasanAktif";
import type { PenugasanMengajar } from "@/lib/types-guru";

export function PenugasanAktifBanner({ aktif }: { aktif: PenugasanAktif }) {
  const router = useRouter();
  const pathname = usePathname();
  const [terbuka, setTerbuka] = useState(false);
  const [daftar, setDaftar] = useState<PenugasanMengajar[] | null>(null);
  const wadah = useRef<HTMLDivElement>(null);

  // Ambil daftar hanya saat dropdown pertama kali dibuka (bukan tiap halaman dimuat).
  useEffect(() => {
    if (!terbuka || daftar !== null) return;
    api
      .get<{ data: PenugasanMengajar[] }>("/guru/penugasan-saya")
      .then((r) => setDaftar((r.data ?? []).filter((p) => p.status === "disetujui")))
      .catch(() => setDaftar([]));
  }, [terbuka, daftar]);

  // Tutup dropdown kalau klik di luar.
  useEffect(() => {
    if (!terbuka) return;
    const onClick = (e: MouseEvent) => {
      if (wadah.current && !wadah.current.contains(e.target as Node)) setTerbuka(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [terbuka]);

  function pilih(p: PenugasanMengajar) {
    const qs = penugasanQueryString({
      kelasId: p.kelas_id,
      mapelId: p.mapel_id,
      namaKelas: p.kelas?.nama_kelas ?? "",
      namaMapel: p.mapel?.nama_mapel ?? "",
    });
    setTerbuka(false);
    router.replace(`${pathname}?${qs}`);
  }

  return (
    <div ref={wadah} className="relative">
      <div className="flex items-center justify-between rounded-lg bg-teal-50 px-4 py-2.5 text-sm dark:bg-teal-950">
        <span className="flex items-center gap-2 text-teal-800 dark:text-teal-200">
          <BookOpen className="h-4 w-4 shrink-0" strokeWidth={2} />
          <strong>{aktif.namaMapel}</strong> — {aktif.namaKelas}
        </span>
        <button
          type="button"
          onClick={() => setTerbuka((v) => !v)}
          className="flex shrink-0 items-center gap-1 text-teal-700 hover:underline dark:text-teal-300"
        >
          Ganti
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${terbuka ? "rotate-180" : ""}`} strokeWidth={2} />
        </button>
      </div>

      {terbuka && (
        <div className="absolute right-0 z-20 mt-1 max-h-72 w-full max-w-md overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
          {daftar === null && <p className="px-4 py-3 text-xs text-slate-400">Memuat...</p>}
          {daftar !== null && daftar.length === 0 && (
            <p className="px-4 py-3 text-xs text-slate-500">Belum ada kelas &amp; mapel yang disetujui.</p>
          )}
          {daftar?.map((p) => {
            const aktifSekarang = p.kelas_id === aktif.kelasId && p.mapel_id === aktif.mapelId;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => pilih(p)}
                className={`flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800 ${
                  aktifSekarang ? "bg-teal-50 dark:bg-teal-950" : ""
                }`}
              >
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-slate-800 dark:text-white">
                    {p.mapel?.nama_mapel ?? `Mapel #${p.mapel_id}`}
                  </span>
                  <span className="block truncate text-xs text-slate-500">
                    {p.kelas?.nama_kelas ?? `Kelas #${p.kelas_id}`}
                  </span>
                </span>
                {aktifSekarang && <Check className="h-4 w-4 shrink-0 text-teal-600" strokeWidth={2} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function TanpaPenugasanAktif() {
  return (
    <Card className="text-center text-sm text-slate-500">
      Pilih kelas &amp; mapel dulu dari{" "}
      <Link href="/guru/dashboard" className="text-teal-600 hover:underline">
        Dashboard
      </Link>{" "}
      sebelum mengelola halaman ini.
    </Card>
  );
}
