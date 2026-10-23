"use client";

import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import { formatTanggal } from "@/lib/date";
import type { PertemuanOnline } from "@/lib/types";

const PLATFORM_LABEL: Record<PertemuanOnline["platform"], string> = {
  zoom: "Zoom",
  google_meet: "Google Meet",
  lainnya: "Lainnya",
};

/**
 * Kartu pertemuan online terdekat + tombol "Join Meeting".
 * Untuk murid: klik Join memanggil GET /pertemuan-online/{id}/join (backend memvalidasi
 * murid terdaftar di kelas & window waktu 10 menit sebelum mulai) baru redirect ke link asli —
 * link mentah TIDAK dikirim ke client sebelum waktunya.
 */
export function PertemuanOnlineCard({ pertemuan, isMurid = false }: { pertemuan: PertemuanOnline; isMurid?: boolean }) {
  const [joining, setJoining] = useState(false);

  async function handleJoin() {
    setJoining(true);
    try {
      if (isMurid) {
        const res = await api.get<{ data: { link_meeting: string } }>(`/pertemuan-online/${pertemuan.id}/join`);
        window.open(res.data.link_meeting, "_blank", "noopener,noreferrer");
      } else {
        window.open(pertemuan.link_meeting, "_blank", "noopener,noreferrer");
      }
    } catch (err) {
      // Tampilkan alasan asli dari backend (403 bukan murid kelas ini, 422 di luar jendela waktu, dst.)
      alert(err instanceof ApiError && err.message ? err.message : "Belum bisa join — cek kembali jadwal pertemuan.");
    } finally {
      setJoining(false);
    }
  }

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="min-w-0">
        <div className="mb-1 flex items-center gap-2">
          <span className="rounded-md bg-teal-100 px-2 py-0.5 text-xs font-semibold text-teal-700 dark:bg-teal-900 dark:text-teal-300">
            {PLATFORM_LABEL[pertemuan.platform]}
          </span>
          <span className="text-xs text-slate-500">
            {formatTanggal(pertemuan.tanggal, { day: "2-digit", month: "short" })} ·{" "}
            {pertemuan.jam_mulai.slice(0, 5)}–{pertemuan.jam_selesai.slice(0, 5)}
          </span>
        </div>
        <p className="truncate font-semibold text-slate-900 dark:text-white">{pertemuan.judul}</p>
        {pertemuan.agenda && <p className="truncate text-sm text-slate-500">{pertemuan.agenda}</p>}
      </div>
      <button
        onClick={handleJoin}
        disabled={!pertemuan.join_aktif || joining}
        className="shrink-0 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
      >
        {pertemuan.join_aktif ? "Join Meeting" : pertemuan.sudah_selesai ? "Sudah Selesai" : "Belum Aktif"}
      </button>
    </div>
  );
}
