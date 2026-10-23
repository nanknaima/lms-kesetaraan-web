"use client";

import { Suspense, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { PenugasanAktifBanner, TanpaPenugasanAktif } from "@/components/PenugasanAktifBanner";
import { usePenugasanAktif, type PenugasanAktif } from "@/hooks/usePenugasanAktif";
import { PertemuanOnlineCard } from "@/components/PertemuanOnlineCard";
import type { Paginated, PertemuanOnlineGuru } from "@/lib/types-guru";
import type { PertemuanOnline } from "@/lib/types";

const STATUS_FILTER: { value: string; label: string }[] = [
  { value: "", label: "Semua" },
  { value: "terjadwal", label: "Terjadwal" },
  { value: "terlaksana", label: "Terlaksana" },
  { value: "batal", label: "Batal" },
];

export default function GuruPertemuanOnlinePage() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-400">Memuat...</p>}>
      <GuruPertemuanOnlinePageInner />
    </Suspense>
  );
}

function GuruPertemuanOnlinePageInner() {
  const { aktif, ready } = usePenugasanAktif();
  const [status, setStatus] = useState("");
  const [pertemuan, setPertemuan] = useState<PertemuanOnlineGuru[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PertemuanOnlineGuru | null>(null);

  function load() {
    if (!aktif) return;
    const qs = new URLSearchParams({ per_page: "50", kelas_id: String(aktif.kelasId), mapel_id: String(aktif.mapelId) });
    if (status) qs.set("status", status);
    api.get<{ data: Paginated<PertemuanOnlineGuru> }>(`/guru/pertemuan-online?${qs}`).then((r) => setPertemuan(r.data.data ?? []));
  }

  useEffect(() => {
    load();
    // Status aktif tombol "Gabung" bergantung waktu berjalan — refresh berkala supaya
    // otomatis update tanpa reload manual.
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, aktif]);

  async function batalkan(id: number) {
    if (!confirm("Batalkan pertemuan ini?")) return;
    await api.post(`/guru/pertemuan-online/${id}/batalkan`);
    load();
  }

  async function hapus(id: number) {
    if (!confirm("Hapus pertemuan ini dari riwayat? Tindakan ini tidak bisa dibatalkan.")) return;
    try {
      await api.del(`/guru/pertemuan-online/${id}`);
      load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Gagal menghapus pertemuan.");
    }
  }

  if (ready && !aktif) return <TanpaPenugasanAktif />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Pertemuan Online</h1>
          <p className="text-sm text-slate-500">Jadwalkan dan kelola sesi pertemuan online dengan murid.</p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setShowForm((v) => !v);
          }}
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
        >
          {showForm && !editing ? "Tutup Form" : "+ Jadwalkan Pertemuan"}
        </button>
      </div>

      {aktif && <PenugasanAktifBanner aktif={aktif} />}

      {(showForm || editing) && aktif && (
        <PertemuanForm
          aktif={aktif}
          editing={editing}
          onCreated={() => {
            setShowForm(false);
            setEditing(null);
            load();
          }}
          onCancel={() => {
            setShowForm(false);
            setEditing(null);
          }}
        />
      )}

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTER.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatus(f.value)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
              status === f.value
                ? "bg-teal-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {pertemuan.map((p) => (
          <div key={p.id} className="space-y-2">
            <PertemuanOnlineCard pertemuan={p as PertemuanOnline} />
            <div className="flex gap-2">
              {p.status === "terjadwal" && !p.sudah_selesai && (
                <button
                  onClick={() => batalkan(p.id)}
                  className="rounded-lg border border-rose-300 px-3 py-1.5 text-sm font-medium text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:hover:bg-rose-950"
                >
                  Batalkan
                </button>
              )}
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditing(p);
                }}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Edit
              </button>
              <button
                onClick={() => hapus(p.id)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Hapus
              </button>
            </div>
          </div>
        ))}
        {pertemuan.length === 0 && <Card className="text-center text-sm text-slate-500">Belum ada pertemuan.</Card>}
      </div>
    </div>
  );
}

function PertemuanForm({
  aktif,
  editing,
  onCreated,
  onCancel,
}: {
  aktif: PenugasanAktif;
  editing?: PertemuanOnlineGuru | null;
  onCreated: () => void;
  onCancel: () => void;
}) {
  const [judul, setJudul] = useState(editing?.judul ?? "");
  const [platform, setPlatform] = useState<"zoom" | "google_meet" | "lainnya">(editing?.platform ?? "zoom");
  const [linkMeeting, setLinkMeeting] = useState(editing?.link_meeting ?? "");
  const [tanggal, setTanggal] = useState(editing?.tanggal?.slice(0, 10) ?? "");
  const [jamMulai, setJamMulai] = useState(editing?.jam_mulai?.slice(0, 5) ?? "");
  const [jamSelesai, setJamSelesai] = useState(editing?.jam_selesai?.slice(0, 5) ?? "");
  const [agenda, setAgenda] = useState(editing?.agenda ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (editing) {
        await api.put(`/guru/pertemuan-online/${editing.id}`, {
          judul,
          tanggal,
          jam_mulai: jamMulai,
          jam_selesai: jamSelesai,
          agenda: agenda || undefined,
        });
      } else {
        await api.post("/guru/pertemuan-online", {
          kelas_id: aktif.kelasId,
          mapel_id: aktif.mapelId,
          judul,
          platform,
          link_meeting: linkMeeting,
          tanggal,
          jam_mulai: jamMulai,
          jam_selesai: jamSelesai,
          agenda: agenda || undefined,
        });
      }
      onCreated();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message ?? "Gagal menyimpan pertemuan.");
      } else {
        setError("Gagal menyimpan pertemuan. Pastikan semua field terisi benar.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      {editing && (
        <p className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Edit Pertemuan &quot;{editing.judul}&quot;</p>
      )}
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
        <input
          required
          placeholder="Judul pertemuan"
          value={judul}
          onChange={(e) => setJudul(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white sm:col-span-2"
        />
        {!editing && (
          <>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value as "zoom" | "google_meet" | "lainnya")}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            >
              <option value="zoom">Zoom</option>
              <option value="google_meet">Google Meet</option>
              <option value="lainnya">Lainnya</option>
            </select>
            <input
              required
              type="text"
              placeholder="Link meeting"
              value={linkMeeting}
              onChange={(e) => setLinkMeeting(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </>
        )}
        <input
          required
          type="date"
          value={tanggal}
          onChange={(e) => setTanggal(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        />
        <label className="flex flex-col gap-1 text-xs text-slate-500">
          Jam mulai
          <input
            required
            type="time"
            value={jamMulai}
            onChange={(e) => setJamMulai(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-500">
          Jam selesai
          <input
            required
            type="time"
            value={jamSelesai}
            onChange={(e) => setJamSelesai(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </label>
        <textarea
          placeholder="Agenda (opsional)"
          value={agenda}
          onChange={(e) => setAgenda(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white sm:col-span-2"
        />
        {editing && (
          <p className="text-xs text-slate-400 sm:col-span-2">Platform dan link meeting tidak bisa diubah setelah dibuat.</p>
        )}
        {error && <p className="text-sm text-rose-600 sm:col-span-2">{error}</p>}
        <div className="flex gap-2 sm:col-span-2">
          <button
            disabled={saving}
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
          >
            {saving ? "Menyimpan..." : editing ? "Simpan Perubahan" : "Simpan Pertemuan"}
          </button>
          {editing && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
            >
              Batal
            </button>
          )}
        </div>
      </form>
    </Card>
  );
}
