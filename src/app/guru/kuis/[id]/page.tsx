"use client";

import { use, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import type { EsaiPendingKuis, HasilKuisGuru, KuisDetailGuru, SoalKuisTipe } from "@/lib/types-guru";

const TIPE_OPTIONS: SoalKuisTipe[] = ["pilihan_ganda", "benar_salah", "isian_singkat", "esai"];

const TIPE_LABEL: Record<SoalKuisTipe, string> = {
  pilihan_ganda: "Pilihan Ganda",
  benar_salah: "Benar / Salah",
  isian_singkat: "Isian Singkat",
  esai: "Esai",
};

export default function GuruKuisDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  // `key={id}` memaksa React unmount+mount ulang instance komponen ini setiap
  // kali `id` berubah (mis. guru pindah dari kuis lama yang dihapus ke kuis
  // baru) — tanpa ini, Next.js App Router bisa MEWARISKAN state lama (showForm,
  // kuis, hasil) antar kuis yang berbeda karena keduanya dirender oleh
  // instance komponen client yang sama pada posisi route yang sama.
  return <GuruKuisDetailContent key={id} id={id} />;
}

function GuruKuisDetailContent({ id }: { id: string }) {
  const [kuis, setKuis] = useState<KuisDetailGuru | null>(null);
  const [hasil, setHasil] = useState<HasilKuisGuru | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function load() {
    api
      .get<{ data: KuisDetailGuru }>(`/guru/kuis/${id}`)
      .then((r) => {
        setKuis(r.data);
        setError(null);
      })
      .catch(() => setError("Gagal memuat data kuis. Coba muat ulang halaman."));
    api
      .get<{ data: HasilKuisGuru }>(`/guru/kuis/${id}/hasil`)
      .then((r) => setHasil(r.data))
      .catch(() => {});
  }

  useEffect(load, [id]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{kuis?.judul ?? "Kelola Kuis"}</h1>
        <p className="text-sm text-slate-500">Kelola daftar soal, lihat rekap nilai, dan nilai jawaban esai.</p>
      </div>

      {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>}

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <p className="font-semibold text-slate-800 dark:text-white">Daftar Soal</p>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-teal-700"
          >
            {showForm ? "Tutup Form" : "+ Tambah Soal"}
          </button>
        </div>

        {showForm && (
          <div className="mb-4">
            <SoalForm
              kuisId={id}
              onCreated={() => {
                setShowForm(false);
                load();
              }}
            />
          </div>
        )}

        <div className="space-y-2">
          {(kuis?.soal ?? []).map((s, i) => (
            <div
              key={s.id}
              className="rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-800"
            >
              <div className="mb-1 flex items-center gap-2">
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  #{i + 1} · {TIPE_LABEL[s.tipe]}
                </span>
                <span className="text-xs text-slate-400">{s.poin} poin</span>
              </div>
              <p className="font-medium text-slate-800 dark:text-white">{s.pertanyaan}</p>
              {s.opsi && s.opsi.length > 0 && (
                <ul className="mt-1 list-disc pl-5 text-slate-500">
                  {s.opsi.map((o, oi) => (
                    <li key={oi}>{o}</li>
                  ))}
                </ul>
              )}
              {s.tipe !== "esai" && (
                <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">Jawaban benar: {s.jawaban_benar}</p>
              )}
            </div>
          ))}
          {kuis && kuis.soal.length === 0 && (
            <p className="py-4 text-center text-sm text-slate-400">Belum ada soal.</p>
          )}
        </div>
      </Card>

      <Card>
        <p className="mb-3 font-semibold text-slate-800 dark:text-white">Rekap Nilai</p>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500 dark:border-slate-800">
              <th className="py-2">Murid</th>
              <th className="py-2">NIS</th>
              <th className="py-2">Total Skor</th>
            </tr>
          </thead>
          <tbody>
            {hasil?.rekap_nilai.map((r) => (
              <tr key={r.murid_id} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                <td className="py-2 font-medium text-slate-800 dark:text-white">{r.murid.nama}</td>
                <td className="py-2 text-slate-500">{r.murid.nis ?? "-"}</td>
                <td className="py-2 text-slate-500">{r.total_skor}</td>
              </tr>
            ))}
            {hasil && hasil.rekap_nilai.length === 0 && (
              <tr>
                <td colSpan={3} className="py-4 text-center text-slate-400">
                  Belum ada murid yang mengerjakan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      <Card>
        <p className="mb-3 font-semibold text-slate-800 dark:text-white">Jawaban Esai Menunggu Dinilai</p>
        <div className="space-y-3">
          {hasil?.esai_pending.map((e) => (
            <EsaiPendingRow key={e.id} jawaban={e} onGraded={load} />
          ))}
          {hasil && hasil.esai_pending.length === 0 && (
            <p className="py-4 text-center text-sm text-slate-400">Tidak ada jawaban esai yang menunggu penilaian.</p>
          )}
        </div>
      </Card>
    </div>
  );
}

function SoalForm({ kuisId, onCreated }: { kuisId: string; onCreated: () => void }) {
  const [pertanyaan, setPertanyaan] = useState("");
  const [tipe, setTipe] = useState<SoalKuisTipe>("pilihan_ganda");
  const [opsi, setOpsi] = useState<string[]>(["", ""]);
  const [jawabanBenar, setJawabanBenar] = useState("");
  const [poin, setPoin] = useState("10");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateOpsi(i: number, value: string) {
    setOpsi((prev) => prev.map((o, idx) => (idx === i ? value : o)));
  }

  function tambahOpsi() {
    setOpsi((prev) => [...prev, ""]);
  }

  function hapusOpsi(i: number) {
    setOpsi((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.post(`/guru/kuis/${kuisId}/soal`, {
        pertanyaan,
        tipe,
        opsi: tipe === "pilihan_ganda" ? opsi.filter((o) => o.trim() !== "") : undefined,
        jawaban_benar: tipe === "esai" ? undefined : jawabanBenar,
        poin: Number(poin),
      });
      setPertanyaan("");
      setOpsi(["", ""]);
      setJawabanBenar("");
      setPoin("10");
      onCreated();
    } catch {
      setError("Gagal menambah soal. Pastikan semua field terisi benar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="bg-slate-50 dark:bg-slate-950">
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
        <textarea
          required
          placeholder="Pertanyaan"
          value={pertanyaan}
          onChange={(e) => setPertanyaan(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white sm:col-span-2"
        />
        <select
          value={tipe}
          onChange={(e) => setTipe(e.target.value as SoalKuisTipe)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        >
          {TIPE_OPTIONS.map((t) => (
            <option key={t} value={t}>
              {TIPE_LABEL[t]}
            </option>
          ))}
        </select>
        <input
          required
          type="number"
          min={1}
          placeholder="Poin"
          value={poin}
          onChange={(e) => setPoin(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        />

        {tipe === "pilihan_ganda" && (
          <div className="space-y-2 sm:col-span-2">
            <p className="text-xs text-slate-500">Opsi jawaban</p>
            {opsi.map((o, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  required
                  placeholder={`Opsi ${i + 1}`}
                  value={o}
                  onChange={(e) => updateOpsi(i, e.target.value)}
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
                {opsi.length > 2 && (
                  <button
                    type="button"
                    onClick={() => hapusOpsi(i)}
                    className="text-xs text-rose-600 hover:underline"
                  >
                    Hapus
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={tambahOpsi} className="text-xs text-teal-600 hover:underline">
              + Tambah opsi
            </button>
          </div>
        )}

        {tipe !== "esai" && (
          <input
            required
            placeholder="Jawaban benar"
            value={jawabanBenar}
            onChange={(e) => setJawabanBenar(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white sm:col-span-2"
          />
        )}

        {error && <p className="text-sm text-rose-600 sm:col-span-2">{error}</p>}
        <button
          disabled={saving}
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60 sm:col-span-2"
        >
          {saving ? "Menyimpan..." : "Tambah Soal"}
        </button>
      </form>
    </Card>
  );
}

function EsaiPendingRow({ jawaban, onGraded }: { jawaban: EsaiPendingKuis; onGraded: () => void }) {
  const [skor, setSkor] = useState("");
  const [saving, setSaving] = useState(false);

  async function grade() {
    setSaving(true);
    try {
      await api.post(`/guru/jawaban-kuis/${jawaban.id}/grade`, { skor: Number(skor) });
      onGraded();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-slate-800 dark:text-white">
            {jawaban.murid.nama} <span className="text-xs text-slate-400">({jawaban.murid.nis ?? "-"})</span>
          </p>
          <p className="text-sm text-slate-500">{jawaban.soal.pertanyaan}</p>
          {jawaban.jawaban && <p className="mt-1 text-sm italic text-slate-600 dark:text-slate-300">&ldquo;{jawaban.jawaban}&rdquo;</p>}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Skor"
            value={skor}
            onChange={(e) => setSkor(e.target.value)}
            className="w-20 rounded-lg border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
          <button
            onClick={grade}
            disabled={saving || skor === ""}
            className="rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
          >
            Simpan Nilai
          </button>
        </div>
      </div>
    </div>
  );
}
