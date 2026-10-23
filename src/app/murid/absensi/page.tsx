"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { formatTanggal, hariIniStr } from "@/lib/date";
import type { AbsensiMurid, MapelMurid } from "@/lib/types";

const STATUS_LABEL: Record<AbsensiMurid["status"], string> = {
  hadir: "Hadir",
  izin: "Izin",
  sakit: "Sakit",
  alpa: "Alpa",
};

const STATUS_STYLE: Record<AbsensiMurid["status"], string> = {
  hadir: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  izin: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  sakit: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  alpa: "bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-300",
};

export default function MuridAbsensiPage() {
  const [absensi, setAbsensi] = useState<AbsensiMurid[] | null>(null);
  const [showForm, setShowForm] = useState(false);

  function load() {
    api
      .get<{ data: AbsensiMurid[] }>("/murid/absensi")
      .then((r) => setAbsensi(r.data))
      .catch(() => setAbsensi([]));
  }

  useEffect(load, []);

  const total = absensi?.length ?? 0;
  const hitung = (status: AbsensiMurid["status"]) => absensi?.filter((a) => a.status === status).length ?? 0;

  const sorted = [...(absensi ?? [])].sort((a, b) => (a.tanggal < b.tanggal ? 1 : -1));

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">Absensi Saya</h1>
          <p className="text-sm text-slate-500">Rekap kehadiran Anda di semua mata pelajaran.</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="shrink-0 rounded-lg bg-teal-600 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-700"
        >
          {showForm ? "Tutup" : "Ajukan Izin/Sakit"}
        </button>
      </div>

      {showForm && (
        <AjukanIzinForm
          onSubmitted={() => {
            setShowForm(false);
            load();
          }}
        />
      )}

      <div className="grid grid-cols-4 gap-2">
        <Card className="p-3 text-center">
          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
            {hitung("hadir")}/{total}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500">Hadir</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-lg font-bold text-sky-600 dark:text-sky-400">{hitung("izin")}</p>
          <p className="mt-0.5 text-[11px] text-slate-500">Izin</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{hitung("sakit")}</p>
          <p className="mt-0.5 text-[11px] text-slate-500">Sakit</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-lg font-bold text-rose-600 dark:text-rose-400">{hitung("alpa")}</p>
          <p className="mt-0.5 text-[11px] text-slate-500">Alpa</p>
        </Card>
      </div>

      <div className="space-y-2">
        {absensi === null && <p className="text-sm text-slate-400">Memuat...</p>}

        {absensi !== null && sorted.length === 0 && (
          <Card className="text-center text-sm text-slate-500">Belum ada data absensi.</Card>
        )}

        {sorted.map((a) => (
          <Card key={a.id} className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-800 dark:text-white">
                {a.mapel?.nama_mapel ?? "-"}
              </p>
              <p className="text-xs text-slate-500">{formatTanggal(a.tanggal)}</p>
              {a.keterangan && <p className="mt-1 text-xs text-slate-500">{a.keterangan}</p>}
            </div>
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${STATUS_STYLE[a.status]}`}
            >
              {STATUS_LABEL[a.status]}
            </span>
          </Card>
        ))}
      </div>
    </div>
  );
}

/** Form ajukan izin/sakit sendiri — murid TIDAK BOLEH mengajukan status "hadir"/"alpa", keduanya hanya dari guru/sistem. */
function AjukanIzinForm({ onSubmitted }: { onSubmitted: () => void }) {
  const [mapelList, setMapelList] = useState<MapelMurid[] | null>(null);
  const [mapelId, setMapelId] = useState("");
  const [tanggal, setTanggal] = useState(hariIniStr());
  const [status, setStatus] = useState<"izin" | "sakit">("izin");
  const [keterangan, setKeterangan] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<{ data: MapelMurid[] }>("/murid/mapel")
      .then((r) => setMapelList(r.data))
      .catch(() => setMapelList([]));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!mapelId) {
      setError("Pilih mata pelajaran terlebih dahulu.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.post("/murid/absensi", { mapel_id: Number(mapelId), tanggal, status, keterangan });
      onSubmitted();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal mengajukan izin/sakit.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <h2 className="mb-3 text-sm font-bold text-slate-800 dark:text-white">Ajukan Izin/Sakit</h2>
      <form onSubmit={submit} className="space-y-3">
        <select
          required
          value={mapelId}
          onChange={(e) => setMapelId(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        >
          <option value="">- Pilih Mata Pelajaran -</option>
          {mapelList?.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nama_mapel}
            </option>
          ))}
        </select>

        <input
          required
          type="date"
          value={tanggal}
          max={hariIniStr()}
          onChange={(e) => setTanggal(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        />

        <div className="flex gap-4 text-sm text-slate-700 dark:text-slate-200">
          <label className="flex items-center gap-1.5">
            <input type="radio" checked={status === "izin"} onChange={() => setStatus("izin")} />
            Izin
          </label>
          <label className="flex items-center gap-1.5">
            <input type="radio" checked={status === "sakit"} onChange={() => setStatus("sakit")} />
            Sakit
          </label>
        </div>

        <textarea
          required
          placeholder="Alasan (wajib diisi)"
          value={keterangan}
          onChange={(e) => setKeterangan(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        />

        {error && <p className="text-sm text-rose-600">{error}</p>}
        <button
          disabled={saving}
          className="w-full rounded-lg bg-teal-600 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
        >
          {saving ? "Mengirim..." : "Ajukan"}
        </button>
      </form>
    </Card>
  );
}
