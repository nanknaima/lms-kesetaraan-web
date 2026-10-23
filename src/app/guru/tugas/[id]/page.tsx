"use client";

import { use, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Download, Eye } from "lucide-react";
import { api, getAccessToken, API_BASE_URL } from "@/lib/api";
import { unduhBerkas, ambilBlobUntukPreview } from "@/lib/download";
import { usePreview } from "@/components/ui/usePreview";
import { Card } from "@/components/ui/Card";
import { formatTanggalWaktu } from "@/lib/date";
import type { SubmissionTugas } from "@/lib/types";

/**
 * Halaman grading: lihat hasil upload murid → input nilai + feedback → export.
 * Melengkapi alur "1 fitur contoh: kelola tugas (create → submit → grade → export)".
 */
export default function GradingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [submissions, setSubmissions] = useState<SubmissionTugas[]>([]);
  const [downloading, setDownloading] = useState<"xlsx" | "pdf" | null>(null);

  function load() {
    api.get<{ data: SubmissionTugas[] }>(`/guru/tugas/${id}/submissions`).then((r) => setSubmissions(r.data));
  }
  useEffect(load, [id]);

  async function unduhRekap(format: "xlsx" | "pdf") {
    setDownloading(format);
    try {
      const res = await fetch(`${API_BASE_URL}/guru/export/tugas?tugas_id=${id}&format=${format}`, {
        headers: { Authorization: `Bearer ${getAccessToken()}` },
      });
      if (!res.ok) throw new Error("Gagal mengunduh.");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rekap-tugas-${id}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      alert("Gagal mengunduh rekap tugas.");
    } finally {
      setDownloading(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Penilaian Tugas</h1>
        <div className="flex gap-2">
          <button
            onClick={() => unduhRekap("xlsx")}
            disabled={downloading !== null}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-60"
          >
            {downloading === "xlsx" ? "Menyiapkan..." : "Export Excel"}
          </button>
          <button
            onClick={() => unduhRekap("pdf")}
            disabled={downloading !== null}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-60"
          >
            {downloading === "pdf" ? "Menyiapkan..." : "Print PDF"}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {submissions.map((s) => (
          <SubmissionRow key={s.id} submission={s} tugasId={id} onGraded={load} />
        ))}
        {submissions.length === 0 && <Card>Belum ada murid yang mengumpulkan.</Card>}
      </div>
    </div>
  );
}

function SubmissionRow({
  submission,
  tugasId,
  onGraded,
}: {
  submission: SubmissionTugas;
  tugasId: string;
  onGraded: () => void;
}) {
  const [nilai, setNilai] = useState(submission.nilai?.toString() ?? "");
  const [feedback, setFeedback] = useState(submission.feedback ?? "");
  const [savedNilai, setSavedNilai] = useState(submission.nilai?.toString() ?? "");
  const [savedFeedback, setSavedFeedback] = useState(submission.feedback ?? "");
  const [saving, setSaving] = useState(false);
  const [melihat, setMelihat] = useState(false);
  const [mengunduh, setMengunduh] = useState(false);
  const { bukaPreview, previewNode } = usePreview();

  const downloadPath = `/guru/tugas/${tugasId}/submissions/${submission.id}/download`;
  // Tombol Simpan berubah jadi ceklis hijau begitu nilai TERSIMPAN sesuai isian saat ini —
  // supaya guru tahu sudah tersimpan (dan tidak klik berkali-kali). Begitu nilai/feedback
  // diedit lagi, otomatis balik jadi tombol "Simpan" karena sudah tidak cocok lagi.
  const sudahTersimpan = !saving && nilai !== "" && nilai === savedNilai && feedback === savedFeedback;

  async function grade() {
    setSaving(true);
    try {
      await api.post(`/guru/submissions/${submission.id}/grade`, { nilai: Number(nilai), feedback });
      setSavedNilai(nilai);
      setSavedFeedback(feedback);
      onGraded();
    } finally {
      setSaving(false);
    }
  }

  async function lihat() {
    setMelihat(true);
    try {
      const { url, mimeType } = await ambilBlobUntukPreview(downloadPath);
      bukaPreview(url, mimeType, `jawaban-${submission.murid.nama}`);
    } catch {
      alert("Gagal membuka berkas.");
    } finally {
      setMelihat(false);
    }
  }

  async function unduh() {
    setMengunduh(true);
    try {
      await unduhBerkas(downloadPath, `jawaban-${submission.murid.nama}`);
    } catch {
      alert("Gagal mengunduh berkas.");
    } finally {
      setMengunduh(false);
    }
  }

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-800 dark:text-white">
            {submission.murid.nama} <span className="text-xs text-slate-400">({submission.murid.nis})</span>
          </p>
          <p className="flex items-center gap-1 text-xs text-slate-500">
            {submission.status === "terlambat" ? (
              <>
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" strokeWidth={2} />
                Dikumpulkan terlambat
              </>
            ) : (
              "Dikumpulkan tepat waktu"
            )}{" "}
            · {submission.submitted_at ? formatTanggalWaktu(submission.submitted_at) : "-"}
          </p>
          {submission.file_url && (
            <div className="mt-1.5 flex flex-wrap gap-2">
              <button
                onClick={lihat}
                disabled={melihat}
                className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <Eye className="h-3.5 w-3.5" strokeWidth={2} />
                {melihat ? "Membuka..." : "Lihat"}
              </button>
              <button
                onClick={unduh}
                disabled={mengunduh}
                className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-teal-700 disabled:opacity-50"
              >
                <Download className="h-3.5 w-3.5" strokeWidth={2} />
                {mengunduh ? "Menyiapkan..." : "Unduh"}
              </button>
            </div>
          )}
          {previewNode}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Nilai"
            value={nilai}
            onChange={(e) => setNilai(e.target.value)}
            className="w-20 rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
          />
          <input
            placeholder="Feedback"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="w-48 rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
          />
          <button
            onClick={grade}
            disabled={saving || !nilai || sudahTersimpan}
            title={sudahTersimpan ? "Tersimpan" : undefined}
            className={
              sudahTersimpan
                ? "flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500 text-white"
                : "rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-50"
            }
          >
            {sudahTersimpan ? <CheckCircle2 className="h-5 w-5" strokeWidth={2.5} /> : saving ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </div>
    </Card>
  );
}
