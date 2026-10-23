"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { School, MessageSquare, BookOpen, ClipboardList, ListChecks, PartyPopper } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { DiskusiFeedTab } from "@/components/mapel/DiskusiFeedTab";
import { MateriTab } from "@/components/mapel/MateriTab";
import { KuisTab } from "@/components/mapel/KuisTab";
import { formatTanggalWaktu } from "@/lib/date";
import type { AbsensiMurid, MapelDetail, Tugas } from "@/lib/types";

const NAV = [
  { key: "informasi", label: "Informasi Kelas", icon: School },
  { key: "diskusi", label: "Diskusi", icon: MessageSquare },
  { key: "materi", label: "Materi", icon: BookOpen },
  { key: "tugas", label: "Tugas", icon: ClipboardList },
  { key: "kuis", label: "Kuis", icon: ListChecks },
] as const;
type TabKey = (typeof NAV)[number]["key"];

const TUGAS_STATUS_LABEL: Record<Tugas["status"], string> = {
  belum: "Belum dikerjakan",
  terlambat: "Dikumpulkan terlambat",
  dinilai: "Sudah dinilai",
  terlewat: "Lewat deadline",
};

const TUGAS_STATUS_STYLE: Record<Tugas["status"], string> = {
  belum: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  terlambat: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  dinilai: "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
  terlewat: "bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-300",
};

export default function MuridMapelDetailPage({ params }: { params: Promise<{ mapelId: string }> }) {
  const { mapelId } = use(params);
  const id = Number(mapelId);
  const { user } = useAuth("murid");

  const [mapel, setMapel] = useState<MapelDetail | null>(null);
  const [tab, setTab] = useState<TabKey>("diskusi");

  useEffect(() => {
    api
      .get<{ data: MapelDetail }>(`/murid/mapel/${id}`)
      .then((r) => setMapel(r.data))
      .catch(() => setMapel(null));
  }, [id]);

  return (
    <div className="flex h-full flex-col gap-4 lg:overflow-hidden">
      {/* Header mapel — banner gradasi teal + ringkasan kelas ala panel SIAKAD.
          shrink-0: banner ini harus diam di tempat, tidak ikut scroll kolom tengah. */}
      <div className="shrink-0 rounded-2xl bg-gradient-to-br from-teal-600 to-teal-700 p-4 text-white shadow-sm">
        {mapel === null ? (
          <div className="h-24 animate-pulse rounded-lg bg-white/10" />
        ) : (
          <>
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-100">Kode {mapel.kode}</p>
            <h1 className="mt-0.5 text-lg font-bold">{mapel.nama_mapel}</h1>

            <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              <StatMini label="Kode Kelas" value={mapel.kode} />
              <StatMini label="Dosen Pengajar" value={mapel.guru?.user?.nama ?? "Belum ditentukan"} />
              <StatMini label="Jumlah Peserta" value={`${mapel.jumlah_peserta} murid`} />
              <StatMini label="Periode Akademik" value={mapel.periode_akademik} />
            </div>
          </>
        )}
      </div>

      {/* Navigasi mobile — pill horizontal yang bisa digulir */}
      <div className="flex shrink-0 gap-2 overflow-x-auto pb-1 lg:hidden">
        {NAV.map((n) => (
          <button
            key={n.key}
            onClick={() => setTab(n.key)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              tab === n.key
                ? "border-teal-300 bg-teal-50 text-teal-700 dark:border-teal-800 dark:bg-teal-950 dark:text-teal-300"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            }`}
          >
            <n.icon className="h-3.5 w-3.5" strokeWidth={2} />
            {n.label}
          </button>
        ))}
      </div>

      {/* Baris utama: di desktop (lg+) tingginya dibatasi ke sisa viewport (flex-1 min-h-0)
          supaya HANYA kolom tengah yang scroll; nav kiri & sidebar kanan diam di tempat.
          Di mobile tetap satu kolom yang scroll natural bersama halaman. */}
      <div className="lg:grid lg:min-h-0 lg:flex-1 lg:grid-cols-[14rem_1fr] lg:items-stretch lg:gap-4">
        {/* Navigasi desktop — sidebar kiri, diam (tidak ikut scroll kolom tengah) */}
        <div className="hidden lg:flex lg:w-56 lg:shrink-0 lg:flex-col lg:gap-1 lg:self-start lg:rounded-2xl lg:border lg:border-slate-200 lg:bg-white lg:p-2 lg:dark:border-slate-700 lg:dark:bg-slate-900">
          {NAV.map((n) => (
            <button
              key={n.key}
              onClick={() => setTab(n.key)}
              className={`flex items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium transition ${
                tab === n.key
                  ? "bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300"
                  : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              <n.icon className="h-4 w-4" strokeWidth={2} />
              {n.label}
            </button>
          ))}
        </div>

        {/* Konten tab (+ sidebar kanan khusus tab Diskusi) */}
        <div
          className={
            tab === "diskusi"
              ? "min-w-0 lg:grid lg:min-h-0 lg:grid-cols-[1fr_18rem] lg:items-stretch lg:gap-4"
              : "min-w-0 lg:h-full lg:min-h-0"
          }
        >
          {/* Kolom tengah — satu-satunya bagian yang boleh scroll di desktop */}
          <div className="min-w-0 lg:h-full lg:min-h-0 lg:overflow-y-auto lg:pr-1">
            {tab === "informasi" && <InformasiKelasTab mapel={mapel} />}
            {tab === "diskusi" && <DiskusiFeedTab mapelId={id} currentUserId={user?.id} />}
            {tab === "materi" && <MateriTab mapelId={id} currentUserId={user?.id} />}
            {tab === "tugas" && <TugasKelasTab mapelId={id} />}
            {tab === "kuis" && <KuisTab mapelId={id} />}
          </div>

          {tab === "diskusi" && (
            <div className="mt-4 space-y-3 lg:mt-0 lg:h-full lg:w-72 lg:shrink-0 lg:self-start">
              <TugasBelumDikumpulkan mapelId={id} />
              <PresensiRingkas mapelId={id} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Sub-kartu statistik putih transparan di dalam banner header. */
function StatMini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/10 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-teal-100/80">{label}</p>
      <p className="mt-0.5 truncate text-sm font-bold text-white">{value}</p>
    </div>
  );
}

/** Tab "Informasi Kelas" — gabungan info mapel & pengajar dari endpoint detail mapel. */
function InformasiKelasTab({ mapel }: { mapel: MapelDetail | null }) {
  if (mapel === null) return <p className="text-sm text-slate-400">Memuat informasi kelas...</p>;

  return (
    <Card className="text-sm">
      <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">Informasi Kelas</h2>
      <dl className="space-y-2 text-slate-700 dark:text-slate-200">
        <InfoRow label="Mata Pelajaran" value={mapel.nama_mapel} />
        <InfoRow label="Kode Kelas" value={mapel.kode} />
        <InfoRow label="Paket" value={`Paket ${mapel.paket}`} />
        <InfoRow label="Pengajar" value={mapel.guru?.user?.nama ?? "Belum ditentukan"} />
        {mapel.guru?.no_hp && <InfoRow label="No. HP Pengajar" value={mapel.guru.no_hp} />}
        <InfoRow label="Jumlah Peserta" value={`${mapel.jumlah_peserta} murid`} />
        <InfoRow label="Periode Akademik" value={mapel.periode_akademik} />
      </dl>
    </Card>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}

/** Tab "Tugas" — daftar tugas milik mapel ini saja. */
function TugasKelasTab({ mapelId }: { mapelId: number }) {
  const [tugas, setTugas] = useState<Tugas[] | null>(null);

  useEffect(() => {
    api
      .get<{ data: Tugas[] }>(`/murid/tugas?mapel_id=${mapelId}`)
      .then((r) => setTugas(r.data))
      .catch(() => setTugas([]));
  }, [mapelId]);

  return (
    <div className="space-y-2.5">
      {tugas === null && <p className="text-sm text-slate-400">Memuat tugas...</p>}
      {tugas !== null && tugas.length === 0 && (
        <Card className="text-center text-sm text-slate-500">Belum ada tugas untuk mapel ini.</Card>
      )}

      {tugas?.map((t) => (
        <Link key={t.id} href={`/murid/tugas/${t.id}`}>
          <Card className="flex items-center justify-between gap-3 transition hover:border-teal-200 hover:shadow-md dark:hover:border-teal-800">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-800 dark:text-white">{t.judul}</p>
              <p className="text-xs text-slate-500">Deadline: {formatTanggalWaktu(t.deadline)}</p>
              {t.nilai !== null && <p className="mt-1 text-xs font-semibold text-teal-600">Nilai: {t.nilai}</p>}
            </div>
            <span
              className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold uppercase ${TUGAS_STATUS_STYLE[t.status]}`}
            >
              {TUGAS_STATUS_LABEL[t.status]}
            </span>
          </Card>
        </Link>
      ))}
    </div>
  );
}

/** Kartu sidebar kanan — ringkasan tugas yang belum dikumpulkan di mapel ini. */
function TugasBelumDikumpulkan({ mapelId }: { mapelId: number }) {
  const [tugas, setTugas] = useState<Tugas[] | null>(null);

  useEffect(() => {
    api
      .get<{ data: Tugas[] }>(`/murid/tugas?mapel_id=${mapelId}`)
      .then((r) => setTugas(r.data))
      .catch(() => setTugas([]));
  }, [mapelId]);

  const belum = (tugas ?? []).filter((t) => t.status === "belum" || t.status === "terlambat").slice(0, 3);

  return (
    <Card className="p-3.5 text-sm">
      <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Tugas Belum Dikumpulkan</h3>
      {tugas === null && <p className="text-xs text-slate-400">Memuat...</p>}
      {tugas !== null && belum.length === 0 && (
        <p className="flex items-center gap-1.5 text-xs text-slate-500">
          <PartyPopper className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" strokeWidth={2} />
          Semua tugas sudah dikumpulkan
        </p>
      )}
      <div className="space-y-1.5">
        {belum.map((t) => (
          <Link
            key={t.id}
            href={`/murid/tugas/${t.id}`}
            className="block rounded-lg px-2 py-1.5 transition hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <p className="truncate text-xs font-semibold text-slate-800 dark:text-white">{t.judul}</p>
            <p className="text-[11px] text-slate-500">Deadline: {formatTanggalWaktu(t.deadline)}</p>
          </Link>
        ))}
      </div>
    </Card>
  );
}

/** Kartu sidebar kanan — ringkasan presensi murid di mapel ini. */
function PresensiRingkas({ mapelId }: { mapelId: number }) {
  const [absensi, setAbsensi] = useState<AbsensiMurid[] | null>(null);

  useEffect(() => {
    api
      .get<{ data: AbsensiMurid[] }>(`/murid/absensi?mapel_id=${mapelId}`)
      .then((r) => setAbsensi(r.data))
      .catch(() => setAbsensi([]));
  }, [mapelId]);

  const total = absensi?.length ?? 0;
  const hitung = (status: AbsensiMurid["status"]) => absensi?.filter((a) => a.status === status).length ?? 0;
  const hadir = hitung("hadir");
  const izin = hitung("izin");
  const sakit = hitung("sakit");
  const alpa = hitung("alpa");

  return (
    <Card className="p-3.5 text-sm">
      <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Presensi</h3>
      {absensi === null && <p className="text-xs text-slate-400">Memuat...</p>}
      {absensi !== null && total === 0 && <p className="text-xs text-slate-500">Belum ada data presensi.</p>}
      {absensi !== null && total > 0 && (
        <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
          <p className="text-sm font-bold text-teal-600 dark:text-teal-400">
            Hadir: {hadir}/{total}
          </p>
          {izin > 0 && <p>Izin: {izin}</p>}
          {sakit > 0 && <p>Sakit: {sakit}</p>}
          {alpa > 0 && <p>Alpa: {alpa}</p>}
        </div>
      )}
    </Card>
  );
}
