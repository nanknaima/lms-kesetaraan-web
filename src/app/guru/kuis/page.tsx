"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { PenugasanAktifBanner, TanpaPenugasanAktif } from "@/components/PenugasanAktifBanner";
import { usePenugasanAktif, type PenugasanAktif } from "@/hooks/usePenugasanAktif";
import { datetimeLocalToUtcIso, formatTanggalWaktu } from "@/lib/date";
import type { KuisGuru, Paginated } from "@/lib/types-guru";

export default function GuruKuisListPage() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-400">Memuat...</p>}>
      <GuruKuisListPageInner />
    </Suspense>
  );
}

function GuruKuisListPageInner() {
  const { aktif, ready } = usePenugasanAktif();
  const [kuis, setKuis] = useState<KuisGuru[]>([]);
  const [showForm, setShowForm] = useState(false);

  function load() {
    api.get<{ data: Paginated<KuisGuru> }>("/guru/kuis?per_page=50").then((r) => setKuis(r.data.data ?? []));
  }

  useEffect(load, []);

  async function hapus(id: number) {
    if (!confirm("Hapus kuis ini? Semua soal dan jawaban murid yang terkait akan ikut terhapus.")) return;
    await api.del(`/guru/kuis/${id}`);
    load();
  }

  if (ready && !aktif) return <TanpaPenugasanAktif />;

  const kuisKelasIni = aktif ? kuis.filter((k) => k.kelas_id === aktif.kelasId) : kuis;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Kelola Kuis</h1>
          <p className="text-sm text-slate-500">Buat kuis baru, kelola soal, dan nilai hasil murid.</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
        >
          {showForm ? "Tutup Form" : "+ Kuis Baru"}
        </button>
      </div>

      {aktif && <PenugasanAktifBanner aktif={aktif} />}

      {showForm && aktif && (
        <KuisForm
          aktif={aktif}
          onCreated={() => {
            setShowForm(false);
            load();
          }}
        />
      )}

      <Card className="p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500 dark:border-slate-800">
              <th className="p-4">Judul</th>
              <th className="p-4">Jumlah Soal</th>
              <th className="p-4">Periode</th>
              <th className="p-4">Durasi</th>
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody>
            {kuisKelasIni.map((k) => (
              <tr key={k.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                <td className="p-4 font-medium text-slate-800 dark:text-white">{k.judul}</td>
                <td className="p-4 text-slate-500">{k.soal_count} soal</td>
                <td className="p-4 text-slate-500">
                  {formatTanggalWaktu(k.mulai)} – {formatTanggalWaktu(k.selesai)}
                </td>
                <td className="p-4 text-slate-500">{k.durasi_menit} menit</td>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <Link href={`/guru/kuis/${k.id}`} className="inline-flex items-center gap-0.5 text-teal-600 hover:underline">
                      Kelola Soal &amp; Hasil
                      <ChevronRight className="h-4 w-4" strokeWidth={2} />
                    </Link>
                    <button onClick={() => hapus(k.id)} className="text-rose-600 hover:underline">
                      Hapus
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {kuisKelasIni.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-slate-400">
                  Belum ada kuis.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function KuisForm({ aktif, onCreated }: { aktif: PenugasanAktif; onCreated: () => void }) {
  const [judul, setJudul] = useState("");
  const [durasiMenit, setDurasiMenit] = useState("");
  const [randomSoal, setRandomSoal] = useState(false);
  const [mulai, setMulai] = useState("");
  const [selesai, setSelesai] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.post("/guru/kuis", {
        kelas_id: aktif.kelasId,
        mapel_id: aktif.mapelId,
        judul,
        durasi_menit: Number(durasiMenit),
        random_soal: randomSoal,
        mulai: datetimeLocalToUtcIso(mulai),
        selesai: datetimeLocalToUtcIso(selesai),
      });
      onCreated();
    } catch {
      setError("Gagal membuat kuis. Pastikan waktu selesai setelah waktu mulai dan semua field terisi benar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
        <input
          required
          placeholder="Judul kuis"
          value={judul}
          onChange={(e) => setJudul(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white sm:col-span-2"
        />
        <input
          required
          type="number"
          min={1}
          placeholder="Durasi (menit)"
          value={durasiMenit}
          onChange={(e) => setDurasiMenit(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        />
        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <input type="checkbox" checked={randomSoal} onChange={(e) => setRandomSoal(e.target.checked)} />
          Acak urutan soal
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-500">
          Mulai
          <input
            required
            type="datetime-local"
            value={mulai}
            onChange={(e) => setMulai(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-500">
          Selesai
          <input
            required
            type="datetime-local"
            value={selesai}
            onChange={(e) => setSelesai(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </label>
        {error && <p className="text-sm text-rose-600 sm:col-span-2">{error}</p>}
        <button
          disabled={saving}
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60 sm:col-span-2"
        >
          {saving ? "Menyimpan..." : "Simpan Kuis"}
        </button>
      </form>
    </Card>
  );
}
