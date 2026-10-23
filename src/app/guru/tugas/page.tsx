"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Eye, Download, Pencil, Trash2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { unduhBerkas, ambilBlobUntukPreview } from "@/lib/download";
import { Card } from "@/components/ui/Card";
import { FileInput } from "@/components/ui/FileInput";
import { usePreview } from "@/components/ui/usePreview";
import { PenugasanAktifBanner, TanpaPenugasanAktif } from "@/components/PenugasanAktifBanner";
import { usePenugasanAktif, type PenugasanAktif } from "@/hooks/usePenugasanAktif";
import { formatTanggalWaktu, datetimeLocalToUtcIso, utcIsoToDatetimeLocal } from "@/lib/date";

interface TugasRow {
  id: number;
  judul: string;
  instruksi: string | null;
  deadline: string;
  lampiran_url: string | null;
  submitted_count: number;
}

export default function GuruTugasListPage() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-400">Memuat...</p>}>
      <GuruTugasListPageInner />
    </Suspense>
  );
}

function GuruTugasListPageInner() {
  const { aktif, ready } = usePenugasanAktif();
  const [tugas, setTugas] = useState<TugasRow[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<TugasRow | null>(null);

  function load() {
    if (!aktif) return;
    api.get<{ data: { data: TugasRow[] } }>(`/guru/tugas?kelas_id=${aktif.kelasId}`).then((r) => setTugas(r.data.data ?? []));
  }

  useEffect(load, [aktif]);

  async function hapus(t: TugasRow) {
    if (!confirm(`Hapus tugas "${t.judul}"? Semua jawaban murid yang sudah terkumpul akan ikut terhapus.`)) return;
    try {
      await api.del(`/guru/tugas/${t.id}`);
      load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Gagal menghapus tugas.");
    }
  }

  if (ready && !aktif) return <TanpaPenugasanAktif />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Kelola Tugas</h1>
          <p className="text-sm text-slate-500">Buat tugas baru, lihat progres pengumpulan, dan nilai hasil murid.</p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setShowForm((v) => !v);
          }}
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
        >
          {showForm && !editing ? "Tutup Form" : "+ Tugas Baru"}
        </button>
      </div>

      {aktif && <PenugasanAktifBanner aktif={aktif} />}

      {showForm && !editing && aktif && (
        <TugasForm
          aktif={aktif}
          onSaved={() => {
            setShowForm(false);
            load();
          }}
        />
      )}

      {editing && aktif && (
        <TugasForm
          aktif={aktif}
          editing={editing}
          onSaved={() => {
            setEditing(null);
            load();
          }}
          onCancel={() => setEditing(null)}
        />
      )}

      <Card className="p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500 dark:border-slate-800">
              <th className="p-4">Judul</th>
              <th className="p-4">Deadline</th>
              <th className="p-4">Lampiran</th>
              <th className="p-4">Terkumpul</th>
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody>
            {tugas.map((t) => (
              <tr key={t.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                <td className="p-4 font-medium text-slate-800 dark:text-white">{t.judul}</td>
                <td className="p-4 text-slate-500">{formatTanggalWaktu(t.deadline)}</td>
                <td className="p-4">
                  {t.lampiran_url ? <TugasLampiranActions tugasId={t.id} /> : <span className="text-xs text-slate-400">-</span>}
                </td>
                <td className="p-4 text-slate-500">{t.submitted_count} murid</td>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <Link href={`/guru/tugas/${t.id}`} className="inline-flex items-center gap-0.5 text-teal-600 hover:underline">
                      Nilai
                      <ChevronRight className="h-4 w-4" strokeWidth={2} />
                    </Link>
                    <button
                      onClick={() => {
                        setShowForm(false);
                        setEditing(t);
                      }}
                      title="Edit"
                      className="text-slate-500 hover:text-teal-600"
                    >
                      <Pencil className="h-4 w-4" strokeWidth={2} />
                    </button>
                    <button onClick={() => hapus(t)} title="Hapus" className="text-slate-500 hover:text-rose-600">
                      <Trash2 className="h-4 w-4" strokeWidth={2} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {tugas.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-slate-400">
                  Belum ada tugas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function TugasForm({
  aktif,
  editing,
  onSaved,
  onCancel,
}: {
  aktif: PenugasanAktif;
  editing?: TugasRow;
  onSaved: () => void;
  onCancel?: () => void;
}) {
  const [judul, setJudul] = useState(editing?.judul ?? "");
  const [instruksi, setInstruksi] = useState(editing?.instruksi ?? "");
  const [deadline, setDeadline] = useState(editing ? utcIsoToDatetimeLocal(editing.deadline) : "");
  const [lampiran, setLampiran] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (editing) {
        await api.put(`/guru/tugas/${editing.id}`, {
          judul,
          instruksi,
          deadline: datetimeLocalToUtcIso(deadline),
        });
      } else {
        const fd = new FormData();
        fd.append("judul", judul);
        if (instruksi) fd.append("instruksi", instruksi);
        fd.append("kelas_id", String(aktif.kelasId));
        fd.append("mapel_id", String(aktif.mapelId));
        fd.append("deadline", datetimeLocalToUtcIso(deadline));
        if (lampiran) fd.append("lampiran", lampiran);
        await api.upload("/guru/tugas", fd);
      }
      onSaved();
    } catch {
      setError(editing ? "Gagal menyimpan perubahan." : "Gagal membuat tugas. Pastikan semua field terisi benar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
        <input
          required
          placeholder="Judul tugas"
          value={judul}
          onChange={(e) => setJudul(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-2"
        />
        <textarea
          placeholder="Instruksi"
          value={instruksi}
          onChange={(e) => setInstruksi(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-2"
        />
        <input
          required
          type="datetime-local"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        {editing ? (
          editing.lampiran_url && (
            <p className="text-xs text-slate-400 sm:col-span-2">
              Lampiran yang sudah diunggah tidak bisa diganti lewat form edit — hapus &amp; buat ulang tugas kalau perlu ganti berkas.
            </p>
          )
        ) : (
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
              Lampiran soal/berkas tugas (opsional)
            </label>
            <FileInput file={lampiran} onChange={setLampiran} />
          </div>
        )}
        {error && <p className="text-sm text-rose-600 sm:col-span-2">{error}</p>}
        <div className="flex gap-2 sm:col-span-2">
          <button
            disabled={saving}
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
          >
            {saving ? "Menyimpan..." : editing ? "Simpan Perubahan" : "Simpan Tugas"}
          </button>
          {editing && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              Batal
            </button>
          )}
        </div>
      </form>
    </Card>
  );
}

/** Tombol Lihat/Unduh untuk lampiran soal tugas di baris tabel — dipakai guru untuk mengecek ulang berkas yang sudah diunggah. */
function TugasLampiranActions({ tugasId }: { tugasId: number }) {
  const [melihat, setMelihat] = useState(false);
  const [mengunduh, setMengunduh] = useState(false);
  const { bukaPreview, previewNode } = usePreview();

  const path = `/guru/tugas/${tugasId}/lampiran/download`;

  async function lihat() {
    setMelihat(true);
    try {
      const { url, mimeType } = await ambilBlobUntukPreview(path);
      bukaPreview(url, mimeType, `lampiran-tugas-${tugasId}`);
    } catch {
      alert("Gagal membuka berkas.");
    } finally {
      setMelihat(false);
    }
  }

  async function unduh() {
    setMengunduh(true);
    try {
      await unduhBerkas(path, `lampiran-tugas-${tugasId}`);
    } catch {
      alert("Gagal mengunduh berkas.");
    } finally {
      setMengunduh(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button onClick={lihat} disabled={melihat} title="Lihat" className="text-slate-500 hover:text-teal-600 disabled:opacity-50">
        <Eye className="h-4 w-4" strokeWidth={2} />
      </button>
      <button onClick={unduh} disabled={mengunduh} title="Unduh" className="text-slate-500 hover:text-teal-600 disabled:opacity-50">
        <Download className="h-4 w-4" strokeWidth={2} />
      </button>
      {previewNode}
    </div>
  );
}
