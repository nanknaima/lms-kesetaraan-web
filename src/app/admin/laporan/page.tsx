"use client";

import { useEffect, useState } from "react";
import { UserSquare2, GraduationCap, Award, Eye, X, type LucideIcon } from "lucide-react";
import { api, getAccessToken, API_BASE_URL } from "@/lib/api";
import { Card } from "@/components/ui/Card";

type Jenis = "guru" | "murid" | "kelulusan";
type Format = "xlsx" | "pdf";

const LAPORAN: { jenis: Jenis; judul: string; deskripsi: string; icon: LucideIcon; catatan?: string }[] = [
  { jenis: "guru", judul: "Laporan Guru", deskripsi: "Rekap data seluruh akun guru dan mata pelajaran yang diampu.", icon: UserSquare2 },
  { jenis: "murid", judul: "Laporan Murid", deskripsi: "Rekap data seluruh murid beserta paket dan kelasnya.", icon: GraduationCap },
  {
    jenis: "kelulusan",
    judul: "Laporan Kelulusan",
    deskripsi: "Rekap status kelulusan murid per mata pelajaran.",
    icon: Award,
    catatan: "Hanya menampilkan nilai yang sudah dirilis ke murid.",
  },
];

export default function AdminLaporanPage() {
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [error, setError] = useState<{ key: string; text: string } | null>(null);
  const [counts, setCounts] = useState<Partial<Record<Jenis, number>>>({});
  const [preview, setPreview] = useState<{ jenis: Jenis; rows: Record<string, unknown>[] } | null>(null);
  const [previewLoading, setPreviewLoading] = useState<Jenis | null>(null);

  useEffect(() => {
    LAPORAN.forEach((l) => {
      api
        .get<{ jenis: Jenis; count: number }>(`/admin/export/laporan/count?jenis=${l.jenis}`)
        .then((r) => setCounts((prev) => ({ ...prev, [l.jenis]: r.count })))
        .catch(() => {});
    });
  }, []);

  async function lihatPreview(jenis: Jenis) {
    setPreviewLoading(jenis);
    try {
      const r = await api.get<{ jenis: Jenis; data: Record<string, unknown>[] }>(`/admin/export/laporan/preview?jenis=${jenis}`);
      setPreview({ jenis, rows: r.data });
    } catch {
      setError({ key: `${jenis}-preview`, text: "Gagal memuat pratinjau laporan." });
    } finally {
      setPreviewLoading(null);
    }
  }

  async function unduh(jenis: Jenis, format: Format) {
    const key = `${jenis}-${format}`;
    setLoadingKey(key);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/export/laporan?jenis=${jenis}&format=${format}`, {
        headers: { Authorization: `Bearer ${getAccessToken()}` },
      });
      if (!res.ok) throw new Error("Gagal mengunduh laporan.");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `laporan-${jenis}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError({ key, text: "Gagal mengunduh laporan. Silakan coba lagi." });
    } finally {
      setLoadingKey(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Laporan</h1>
        <p className="text-sm text-slate-500">Unduh laporan rekap dalam format Excel atau PDF.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {LAPORAN.map((l) => (
          <Card key={l.jenis} className="text-center">
            <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300">
              <l.icon className="h-7 w-7" strokeWidth={2} />
              <span className="absolute -right-2 -top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-slate-800 px-1.5 text-[11px] font-bold text-white dark:bg-slate-100 dark:text-slate-900">
                {counts[l.jenis] ?? "…"}
              </span>
            </div>
            <h2 className="mt-3 text-sm font-semibold text-slate-800 dark:text-white">{l.judul}</h2>
            <p className="mt-1 text-sm text-slate-500">{l.deskripsi}</p>
            <p className="mt-1 text-xs text-slate-400">
              {counts[l.jenis] ?? "…"} data akan diunduh
            </p>
            {l.catatan && (
              <p className="mt-1 text-xs font-medium text-amber-600 dark:text-amber-400">{l.catatan}</p>
            )}

            <div className="mt-4 flex flex-col gap-2">
              <button
                onClick={() => lihatPreview(l.jenis)}
                disabled={previewLoading === l.jenis}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <Eye className="h-4 w-4" strokeWidth={2} />
                {previewLoading === l.jenis ? "Memuat..." : "Lihat"}
              </button>
              <button
                onClick={() => unduh(l.jenis, "xlsx")}
                disabled={loadingKey === `${l.jenis}-xlsx`}
                className="w-full rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-50"
              >
                {loadingKey === `${l.jenis}-xlsx` ? "Menyiapkan..." : "Unduh Excel"}
              </button>
              <button
                onClick={() => unduh(l.jenis, "pdf")}
                disabled={loadingKey === `${l.jenis}-pdf`}
                className="w-full rounded-xl border border-teal-600 px-4 py-2.5 text-sm font-semibold text-teal-600 transition hover:bg-teal-50 disabled:opacity-50 dark:hover:bg-teal-950"
              >
                {loadingKey === `${l.jenis}-pdf` ? "Menyiapkan..." : "Unduh PDF"}
              </button>
            </div>

            {error && error.key.startsWith(l.jenis) && (
              <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-950 dark:text-rose-300">
                {error.text}
              </p>
            )}
          </Card>
        ))}
      </div>

      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[85vh] w-full max-w-3xl flex-col rounded-2xl bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
              <p className="text-sm font-bold text-slate-800 dark:text-white">
                Pratinjau {LAPORAN.find((l) => l.jenis === preview.jenis)?.judul} ({preview.rows.length} baris)
              </p>
              <button
                onClick={() => setPreview(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>
            <div className="overflow-auto p-5">
              {preview.rows.length === 0 ? (
                <p className="text-center text-sm text-slate-500">Tidak ada data untuk ditampilkan.</p>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800">
                      {Object.keys(preview.rows[0]).map((kolom) => (
                        <th key={kolom} className="whitespace-nowrap p-2 pr-4 font-semibold">
                          {kolom}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.map((row, i) => (
                      <tr key={i} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                        {Object.values(row).map((nilai, j) => (
                          <td key={j} className="whitespace-nowrap p-2 pr-4 text-slate-700 dark:text-slate-200">
                            {nilai == null ? "-" : String(nilai)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
