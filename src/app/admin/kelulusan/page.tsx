"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import type { KelulusanAdmin, Paginated } from "@/lib/types";

export default function AdminKelulusanPage() {
  const [list, setList] = useState<KelulusanAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);

  function load() {
    api
      .get<{ data: Paginated<KelulusanAdmin> }>("/admin/kelulusan?per_page=50")
      .then((r) => setList(r.data.data ?? []))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function verifikasi(row: KelulusanAdmin, approve: boolean) {
    if (!approve && !confirm(`Tolak nilai ${row.murid.nama} untuk ${row.mapel.nama_mapel}? Status akan dikembalikan ke pending.`)) {
      return;
    }
    setProcessingId(row.id);
    try {
      await api.post(`/admin/kelulusan/${row.id}/verifikasi`, { approve });
      setNotice({
        type: "ok",
        text: approve
          ? `Nilai ${row.murid.nama} untuk ${row.mapel.nama_mapel} disetujui dan dirilis ke murid.`
          : `Nilai ${row.murid.nama} untuk ${row.mapel.nama_mapel} ditolak dan dikembalikan ke pending.`,
      });
      load();
    } catch (err) {
      setNotice({ type: "error", text: err instanceof ApiError ? err.message : "Gagal memproses verifikasi." });
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Verifikasi Kelulusan</h1>
        <p className="text-sm text-slate-500">
          Nilai akhir yang sudah direkomendasikan guru dan menunggu persetujuan admin sebelum dirilis ke murid.
        </p>
      </div>

      {notice && (
        <p className={`rounded-lg px-3 py-2 text-sm ${notice.type === "ok" ? "bg-teal-50 text-teal-700" : "bg-rose-50 text-rose-600"}`}>
          {notice.text}
        </p>
      )}

      <Card className="p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500 dark:border-slate-800">
              <th className="p-4">Murid</th>
              <th className="p-4">Mapel</th>
              <th className="p-4">Nilai Akhir</th>
              <th className="p-4">Rekomendasi Guru</th>
              <th className="p-4">Catatan Guru</th>
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody>
            {list.map((row) => (
              <tr key={row.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                <td className="p-4">
                  <p className="font-medium text-slate-800 dark:text-white">{row.murid.nama}</p>
                  <p className="text-xs text-slate-400">NIS {row.murid.nis}</p>
                </td>
                <td className="p-4 text-slate-500">{row.mapel.nama_mapel}</td>
                <td className="p-4 font-semibold text-slate-800 dark:text-white">{row.nilai_akhir}</td>
                <td className="p-4">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                      row.rekomendasi_guru_lulus
                        ? "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300"
                        : "bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-300"
                    }`}
                  >
                    {row.rekomendasi_guru_lulus ? "Lulus" : "Tidak Lulus"}
                  </span>
                </td>
                <td className="p-4 max-w-xs text-slate-500">{row.catatan_guru ?? "-"}</td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <button
                      disabled={processingId === row.id}
                      onClick={() => verifikasi(row, true)}
                      className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
                    >
                      Setujui
                    </button>
                    <button
                      disabled={processingId === row.id}
                      onClick={() => verifikasi(row, false)}
                      className="rounded-lg border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-60"
                    >
                      Tolak
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && list.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-slate-400">
                  Tidak ada nilai yang menunggu validasi kelulusan saat ini.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
