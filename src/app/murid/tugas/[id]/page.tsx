"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Download, Eye, XCircle } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { unduhBerkas, ambilBlobUntukPreview } from "@/lib/download";
import { Card } from "@/components/ui/Card";
import { FileInput } from "@/components/ui/FileInput";
import { usePreview } from "@/components/ui/usePreview";
import { formatTanggalWaktu } from "@/lib/date";
import type { TugasDetailMurid } from "@/lib/types";

const STATUS_LABEL: Record<string, string> = {
  belum: "Sudah dikirim, menunggu dinilai",
  terlambat: "Dikirim terlambat, menunggu dinilai",
  dinilai: "Sudah dinilai",
};

export default function MuridTugasDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <MuridTugasDetailContent key={id} id={id} />;
}

function MuridTugasDetailContent({ id }: { id: string }) {
  const router = useRouter();
  const [tugas, setTugas] = useState<TugasDetailMurid | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [jawaban, setJawaban] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [membatalkan, setMembatalkan] = useState(false);
  const [mengunduh, setMengunduh] = useState(false);
  const [melihat, setMelihat] = useState(false);
  const [mengunduhLampiran, setMengunduhLampiran] = useState(false);
  const [melihatLampiran, setMelihatLampiran] = useState(false);
  const [done, setDone] = useState(false);
  const { bukaPreview, previewNode } = usePreview();

  function load() {
    api
      .get<{ data: TugasDetailMurid }>(`/murid/tugas/${id}`)
      .then((r) => {
        setTugas(r.data);
        setJawaban(r.data.submission?.jawaban ?? "");
        setLoadError(null);
      })
      .catch(() => setLoadError("Gagal memuat detail tugas."));
  }

  useEffect(load, [id]);

  async function kirim() {
    setSubmitting(true);
    setError(null);
    try {
      const fd = new FormData();
      if (jawaban) fd.append("jawaban", jawaban);
      if (file) fd.append("file", file);
      await api.upload(`/murid/tugas/${id}/submit`, fd);
      setDone(true);
      setTimeout(() => router.back(), 1200);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal mengumpulkan tugas.");
    } finally {
      setSubmitting(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!jawaban && !file) {
      setError("Isi jawaban atau lampirkan file.");
      return;
    }
    if (!confirm("Apakah kamu yakin tugas sudah benar dan siap dikirim?")) return;
    await kirim();
  }

  async function batalkan() {
    if (!confirm("Yakin ingin membatalkan pengiriman tugas ini? File yang sudah dikirim akan dihapus dan Anda perlu mengirim ulang.")) {
      return;
    }
    setMembatalkan(true);
    setError(null);
    try {
      await api.del(`/murid/tugas/${id}/submission`);
      setFile(null);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal membatalkan pengiriman tugas.");
    } finally {
      setMembatalkan(false);
    }
  }

  async function lihatSubmission() {
    setMelihat(true);
    try {
      const { url, mimeType } = await ambilBlobUntukPreview(`/murid/tugas/${id}/submission/download`);
      bukaPreview(url, mimeType, `tugas-${id}-jawaban`);
    } catch {
      alert("Gagal membuka berkas.");
    } finally {
      setMelihat(false);
    }
  }

  async function unduhSubmission() {
    setMengunduh(true);
    try {
      await unduhBerkas(`/murid/tugas/${id}/submission/download`, `tugas-${id}-jawaban`);
    } catch {
      alert("Gagal mengunduh berkas.");
    } finally {
      setMengunduh(false);
    }
  }

  async function lihatLampiran() {
    setMelihatLampiran(true);
    try {
      const { url, mimeType } = await ambilBlobUntukPreview(`/murid/tugas/${id}/lampiran/download`);
      bukaPreview(url, mimeType, `lampiran-tugas-${id}`);
    } catch {
      alert("Gagal membuka berkas.");
    } finally {
      setMelihatLampiran(false);
    }
  }

  async function unduhLampiran() {
    setMengunduhLampiran(true);
    try {
      await unduhBerkas(`/murid/tugas/${id}/lampiran/download`, `lampiran-tugas-${id}`);
    } catch {
      alert("Gagal mengunduh berkas.");
    } finally {
      setMengunduhLampiran(false);
    }
  }

  if (done) {
    return (
      <Card className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
          <CheckCircle2 className="h-7 w-7" strokeWidth={2} />
        </div>
        <p className="mt-2 font-semibold">Tugas berhasil dikumpulkan!</p>
      </Card>
    );
  }

  if (loadError) return <p className="text-sm text-rose-600">{loadError}</p>;
  if (!tugas) return <p className="text-sm text-slate-400">Memuat...</p>;

  const submission = tugas.submission;
  const sudahDinilai = submission?.status === "dinilai";

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold text-slate-900 dark:text-white">{tugas.judul}</h1>
        {tugas.mapel && <p className="text-sm text-slate-500">{tugas.mapel}</p>}
        <p className="text-xs text-slate-400">Deadline: {formatTanggalWaktu(tugas.deadline)}</p>
      </div>

      {(tugas.instruksi || tugas.lampiran_url) && (
        <Card>
          {tugas.instruksi && (
            <>
              <h2 className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">Instruksi</h2>
              <p className="whitespace-pre-line text-sm text-slate-700 dark:text-slate-200">{tugas.instruksi}</p>
            </>
          )}
          {tugas.lampiran_url && (
            <div className={tugas.instruksi ? "mt-3" : ""}>
              <h2 className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">Berkas Tugas dari Guru</h2>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={lihatLampiran}
                  disabled={melihatLampiran}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <Eye className="h-4 w-4" strokeWidth={2} />
                  {melihatLampiran ? "Membuka..." : "Lihat Berkas"}
                </button>
                <button
                  onClick={unduhLampiran}
                  disabled={mengunduhLampiran}
                  className="flex items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-50"
                >
                  <Download className="h-4 w-4" strokeWidth={2} />
                  {mengunduhLampiran ? "Menyiapkan..." : "Unduh Berkas"}
                </button>
              </div>
            </div>
          )}
        </Card>
      )}

      <Card>
        {submission && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">Pengiriman Anda</h2>
              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                  sudahDinilai
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                }`}
              >
                {STATUS_LABEL[submission.status]}
              </span>
            </div>

            {submission.submitted_at && (
              <p className="mt-2 text-xs text-slate-400">Dikirim: {formatTanggalWaktu(submission.submitted_at)}</p>
            )}
            {submission.jawaban && (
              <p className="mt-2 whitespace-pre-line text-sm text-slate-700 dark:text-slate-200">{submission.jawaban}</p>
            )}

            {submission.file_url && (
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={lihatSubmission}
                  disabled={melihat}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <Eye className="h-4 w-4" strokeWidth={2} />
                  {melihat ? "Membuka..." : "Lihat Berkas"}
                </button>
                <button
                  onClick={unduhSubmission}
                  disabled={mengunduh}
                  className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-50"
                >
                  <Download className="h-4 w-4" strokeWidth={2} />
                  {mengunduh ? "Menyiapkan..." : "Unduh Berkas"}
                </button>
              </div>
            )}

            {sudahDinilai && (
              <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-800">
                <p className="font-semibold text-teal-700 dark:text-teal-400">Nilai: {submission.nilai}</p>
                {submission.feedback && <p className="mt-1 text-slate-600 dark:text-slate-300">{submission.feedback}</p>}
                <p className="mt-2 text-xs text-slate-400">Tugas sudah dinilai guru, tidak bisa dibatalkan atau dikirim ulang.</p>
              </div>
            )}

            {!sudahDinilai && <div className="my-4 border-t border-slate-100 dark:border-slate-800" />}
          </>
        )}

        {!sudahDinilai && (
          <>
            <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">
              {submission ? "Kirim Ulang Jawaban" : "Kumpulkan Tugas"}
            </h2>
            <form onSubmit={submit} className="space-y-3">
              <textarea
                placeholder="Tulis jawaban (opsional bila melampirkan file)"
                value={jawaban}
                onChange={(e) => setJawaban(e.target.value)}
                rows={5}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Lampiran (opsional)
                </label>
                <FileInput file={file} onChange={setFile} />
              </div>
              {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-950">{error}</p>}
              <div className="flex flex-wrap gap-2">
                {submission ? (
                  <button
                    type="button"
                    onClick={batalkan}
                    disabled={membatalkan}
                    className="flex items-center gap-1.5 rounded-lg border border-rose-300 px-4 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50 dark:border-rose-800 dark:hover:bg-rose-950"
                  >
                    <XCircle className="h-4 w-4" strokeWidth={2} />
                    {membatalkan ? "Membatalkan..." : "Batalkan Kirim Tugas"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Batal
                  </button>
                )}
                <button
                  disabled={submitting}
                  className="flex-1 rounded-lg bg-teal-600 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
                >
                  {submitting ? "Mengirim..." : submission ? "Kirim Ulang" : "Kumpulkan Tugas"}
                </button>
              </div>
            </form>
          </>
        )}
      </Card>
      {previewNode}
    </div>
  );
}
