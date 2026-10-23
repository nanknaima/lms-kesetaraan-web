"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { api, getAccessToken } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { PenugasanAktifBanner, TanpaPenugasanAktif } from "@/components/PenugasanAktifBanner";
import { usePenugasanAktif } from "@/hooks/usePenugasanAktif";
import { hariIniStr, bulanIniStr } from "@/lib/date";
import type { AbsensiGuruRow, KelasGuru, MuridRingkasKelas, RekapAbsensiResponse, StatusAbsensi } from "@/lib/types-guru";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://https://lms-kesetaraan-api.vercel.app/api/api";

const STATUS_OPTIONS: StatusAbsensi[] = ["hadir", "izin", "sakit", "alpa"];

const STATUS_LABEL: Record<StatusAbsensi, string> = {
  hadir: "Hadir",
  izin: "Izin",
  sakit: "Sakit",
  alpa: "Alpa",
};

interface RowState {
  murid_id: number;
  nama: string;
  nis: string | null;
  status: StatusAbsensi | "";
  keterangan: string;
  otomatis: boolean;
}

export default function GuruAbsensiPage() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-400">Memuat...</p>}>
      <GuruAbsensiPageInner />
    </Suspense>
  );
}

function GuruAbsensiPageInner() {
  const { aktif, ready } = usePenugasanAktif();
  const [tanggal, setTanggal] = useState(hariIniStr());
  const [roster, setRoster] = useState<MuridRingkasKelas[]>([]);
  const [rows, setRows] = useState<RowState[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [bulan, setBulan] = useState(bulanIniStr());
  const [rekap, setRekap] = useState<RekapAbsensiResponse | null>(null);
  const [downloading, setDownloading] = useState<"xlsx" | "pdf" | null>(null);

  useEffect(() => {
    if (!aktif) return;
    api
      .get<{ data: KelasGuru[] }>("/guru/kelas")
      .then((r) => {
        const kelasIni = (r.data ?? []).find((k) => k.id === aktif.kelasId);
        setRoster(kelasIni?.murid ?? []);
      })
      .catch(() => setRoster([]));
  }, [aktif]);

  useEffect(() => {
    if (!aktif || roster.length === 0) return;
    api
      .get<{ data: AbsensiGuruRow[] }>(`/guru/absensi?tanggal=${tanggal}&mapel_id=${aktif.mapelId}`)
      .then((r) => {
        const existing = new Map((r.data ?? []).map((a) => [a.murid_id, a]));
        setRows(
          roster.map((m) => {
            const found = existing.get(m.user_id);
            return {
              murid_id: m.user_id,
              nama: m.user.nama,
              nis: m.user.nis,
              status: found?.status ?? "",
              keterangan: found?.keterangan ?? "",
              otomatis: found?.otomatis ?? false,
            };
          }),
        );
      })
      .catch(() => {
        setRows(
          roster.map((m) => ({
            murid_id: m.user_id,
            nama: m.user.nama,
            nis: m.user.nis,
            status: "",
            keterangan: "",
            otomatis: false,
          })),
        );
      });
  }, [roster, tanggal, aktif]);

  function updateRow(muridId: number, patch: Partial<RowState>) {
    setRows((prev) => prev.map((r) => (r.murid_id === muridId ? { ...r, ...patch } : r)));
  }

  async function simpan() {
    if (!aktif) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const isian = rows.filter((r) => r.status !== "");
      if (isian.length === 0) {
        setError("Isi status kehadiran minimal satu murid sebelum menyimpan.");
        setSaving(false);
        return;
      }
      await api.post("/guru/absensi", {
        mapel_id: aktif.mapelId,
        tanggal,
        data: isian.map((r) => ({
          murid_id: r.murid_id,
          status: r.status,
          keterangan: r.keterangan || undefined,
        })),
      });
      setMessage("Absensi berhasil disimpan.");
    } catch {
      setError("Gagal menyimpan absensi. Silakan coba lagi.");
    } finally {
      setSaving(false);
    }
  }

  function loadRekap() {
    if (!aktif) return;
    api
      .get<{ data: RekapAbsensiResponse }>(`/guru/absensi/rekap?bulan=${bulan}&mapel_id=${aktif.mapelId}`)
      .then((r) => setRekap(r.data))
      .catch(() => setRekap({}));
  }

  useEffect(loadRekap, [bulan, aktif]);

  const rekapRows = useMemo(() => {
    if (!rekap) return [];
    return Object.values(rekap).map((items) => {
      const murid = items[0]?.murid;
      const hitung = (status: StatusAbsensi) => items.find((i) => i.status === status)?.total ?? 0;
      return {
        murid_id: items[0]?.murid_id,
        murid,
        hadir: hitung("hadir"),
        izin: hitung("izin"),
        sakit: hitung("sakit"),
        alpa: hitung("alpa"),
      };
    });
  }, [rekap]);

  async function unduh(format: "xlsx" | "pdf") {
    if (!aktif) return;
    setDownloading(format);
    try {
      const res = await fetch(`${API_BASE_URL}/guru/export/absensi?format=${format}&bulan=${bulan}&mapel_id=${aktif.mapelId}`, {
        headers: { Authorization: `Bearer ${getAccessToken()}` },
      });
      if (!res.ok) throw new Error("Gagal mengunduh.");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `absensi-${bulan}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      alert("Gagal mengunduh rekap absensi.");
    } finally {
      setDownloading(null);
    }
  }

  if (ready && !aktif) return <TanpaPenugasanAktif />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Absensi</h1>
        <p className="text-sm text-slate-500">Catat kehadiran murid per tanggal dan lihat rekap bulanan.</p>
      </div>

      {aktif && <PenugasanAktifBanner aktif={aktif} />}

      <Card>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            Tanggal
            <input
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </label>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500 dark:border-slate-800">
              <th className="py-2">Murid</th>
              <th className="py-2">Status</th>
              <th className="py-2">Keterangan</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.murid_id} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                <td className="py-2 font-medium text-slate-800 dark:text-white">
                  {r.nama} <span className="text-xs text-slate-400">({r.nis ?? "-"})</span>
                  {r.otomatis && (
                    <span
                      title="Terisi otomatis dari aktivitas murid (unduh materi, nonton video, atau join pertemuan online)"
                      className="ml-1.5 rounded-full bg-sky-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-sky-700 dark:bg-sky-950 dark:text-sky-300"
                    >
                      🤖 Otomatis
                    </span>
                  )}
                </td>
                <td className="py-2">
                  <select
                    value={r.status}
                    onChange={(e) => updateRow(r.murid_id, { status: e.target.value as StatusAbsensi | "" })}
                    className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  >
                    <option value="">- Pilih -</option>
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABEL[s]}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="py-2">
                  <input
                    placeholder="Keterangan (opsional)"
                    value={r.keterangan}
                    onChange={(e) => updateRow(r.murid_id, { keterangan: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={3} className="py-6 text-center text-slate-400">
                  Belum ada murid di kelas ini.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
        {message && <p className="mt-3 text-sm text-emerald-600">{message}</p>}

        <button
          onClick={simpan}
          disabled={saving || rows.length === 0}
          className="mt-4 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
        >
          {saving ? "Menyimpan..." : "Simpan Absensi"}
        </button>
      </Card>

      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-slate-800 dark:text-white">Rekap Bulanan</p>
            <input
              type="month"
              value={bulan}
              onChange={(e) => setBulan(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => unduh("xlsx")}
              disabled={downloading !== null}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {downloading === "xlsx" ? "Menyiapkan..." : "Unduh Excel"}
            </button>
            <button
              onClick={() => unduh("pdf")}
              disabled={downloading !== null}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {downloading === "pdf" ? "Menyiapkan..." : "Unduh PDF"}
            </button>
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500 dark:border-slate-800">
              <th className="py-2">Murid</th>
              <th className="py-2">Hadir</th>
              <th className="py-2">Izin</th>
              <th className="py-2">Sakit</th>
              <th className="py-2">Alpa</th>
            </tr>
          </thead>
          <tbody>
            {rekapRows.map((r) => (
              <tr key={r.murid_id} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                <td className="py-2 font-medium text-slate-800 dark:text-white">
                  {r.murid?.nama ?? "-"} <span className="text-xs text-slate-400">({r.murid?.nis ?? "-"})</span>
                </td>
                <td className="py-2 text-emerald-600 dark:text-emerald-400">{r.hadir}</td>
                <td className="py-2 text-sky-600 dark:text-sky-400">{r.izin}</td>
                <td className="py-2 text-amber-600 dark:text-amber-400">{r.sakit}</td>
                <td className="py-2 text-rose-600 dark:text-rose-400">{r.alpa}</td>
              </tr>
            ))}
            {rekapRows.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-slate-400">
                  Belum ada data absensi bulan ini.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
