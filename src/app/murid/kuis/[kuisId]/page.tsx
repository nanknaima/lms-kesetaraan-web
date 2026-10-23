"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import type { KuisMurid, SoalKuisMurid } from "@/lib/types";

interface MulaiResponse {
  kuis: KuisMurid;
  soal: SoalKuisMurid[];
}

const BENAR_SALAH_OPSI = ["Benar", "Salah"];

export default function MuridKuisKerjakanPage({ params }: { params: Promise<{ kuisId: string }> }) {
  const { kuisId } = use(params);
  const router = useRouter();

  const [data, setData] = useState<MulaiResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    api
      .get<{ data: MulaiResponse }>(`/murid/kuis/${kuisId}/mulai`)
      .then((r) => setData(r.data))
      .catch((err) =>
        setLoadError(err instanceof ApiError ? err.message : "Kuis tidak bisa dibuka saat ini."),
      );
  }, [kuisId]);

  function pilihJawaban(soalId: number, jawaban: string) {
    setAnswers((prev) => ({ ...prev, [soalId]: jawaban }));
    // Auto-save per soal — kegagalan tidak menghentikan pengerjaan, jawaban tetap tersimpan di submit akhir.
    api.post(`/murid/kuis/${kuisId}/jawab`, { soal_id: soalId, jawaban }).catch(() => {});
  }

  async function submitKuis() {
    setSubmitting(true);
    setSubmitError(null);
    try {
      await api.post(`/murid/kuis/${kuisId}/submit`);
      setDone(true);
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : "Gagal mengirim kuis.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loadError) {
    return (
      <Card className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
          <AlertTriangle className="h-6 w-6" strokeWidth={2} />
        </div>
        <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-200">{loadError}</p>
        <button
          onClick={() => router.back()}
          className="mt-3 rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
        >
          Kembali
        </button>
      </Card>
    );
  }

  if (!data) return <p className="text-sm text-slate-400">Memuat kuis...</p>;

  if (done) {
    const dijawab = Object.keys(answers).length;
    return (
      <Card className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
          <CheckCircle2 className="h-8 w-8" strokeWidth={2} />
        </div>
        <h1 className="mt-3 text-lg font-bold text-slate-900 dark:text-white">Kuis Berhasil Dikumpulkan!</h1>
        <p className="mt-1 text-sm text-slate-500">
          {dijawab} dari {data.soal.length} soal terjawab.
        </p>
        <p className="mt-2 text-xs text-slate-400">
          Nilai pilihan ganda &amp; benar/salah dihitung otomatis; soal esai akan dinilai guru. Hasil akhir bisa
          dilihat lewat menu Nilai.
        </p>
        <button
          onClick={() => router.push(`/murid/materi/${data.kuis.mapel_id}`)}
          className="mt-4 w-full rounded-lg bg-teal-600 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
        >
          Kembali ke Mapel
        </button>
      </Card>
    );
  }

  const soal = data.soal[index];
  const totalSoal = data.soal.length;
  const isLast = index === totalSoal - 1;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold text-slate-900 dark:text-white">{data.kuis.judul}</h1>
        <p className="text-xs text-slate-500">Durasi: {data.kuis.durasi_menit} menit</p>
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-slate-500">
          <span>
            Soal {index + 1}/{totalSoal}
          </span>
          <span>{Object.keys(answers).length} terjawab</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div
            className="h-full rounded-full bg-teal-600 transition-all"
            style={{ width: `${((index + 1) / totalSoal) * 100}%` }}
          />
        </div>
      </div>

      <Card>
        <p className="text-sm font-semibold text-slate-800 dark:text-white">{soal.pertanyaan}</p>

        <div className="mt-4 space-y-2">
          {soal.tipe === "pilihan_ganda" &&
            (soal.opsi ?? []).map((opsi) => (
              <label
                key={opsi}
                className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm transition ${
                  answers[soal.id] === opsi
                    ? "border-teal-400 bg-teal-50 dark:border-teal-700 dark:bg-teal-950"
                    : "border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                }`}
              >
                <input
                  type="radio"
                  name={`soal-${soal.id}`}
                  checked={answers[soal.id] === opsi}
                  onChange={() => pilihJawaban(soal.id, opsi)}
                  className="accent-teal-600"
                />
                <span className="text-slate-700 dark:text-slate-200">{opsi}</span>
              </label>
            ))}

          {soal.tipe === "benar_salah" &&
            BENAR_SALAH_OPSI.map((opsi) => (
              <label
                key={opsi}
                className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm transition ${
                  answers[soal.id] === opsi
                    ? "border-teal-400 bg-teal-50 dark:border-teal-700 dark:bg-teal-950"
                    : "border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                }`}
              >
                <input
                  type="radio"
                  name={`soal-${soal.id}`}
                  checked={answers[soal.id] === opsi}
                  onChange={() => pilihJawaban(soal.id, opsi)}
                  className="accent-teal-600"
                />
                <span className="text-slate-700 dark:text-slate-200">{opsi}</span>
              </label>
            ))}

          {soal.tipe === "isian_singkat" && (
            <input
              value={answers[soal.id] ?? ""}
              onChange={(e) => pilihJawaban(soal.id, e.target.value)}
              placeholder="Tulis jawaban singkat..."
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
            />
          )}

          {soal.tipe === "esai" && (
            <textarea
              value={answers[soal.id] ?? ""}
              onChange={(e) => pilihJawaban(soal.id, e.target.value)}
              rows={5}
              placeholder="Tulis jawaban esai..."
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
            />
          )}
        </div>
      </Card>

      {submitError && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-950">{submitError}</p>}

      <div className="flex gap-2">
        <button
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          className="flex-1 rounded-xl border border-slate-300 py-2.5 text-sm font-semibold text-slate-600 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300"
        >
          Sebelumnya
        </button>
        {isLast ? (
          <button
            onClick={submitKuis}
            disabled={submitting}
            className="flex-1 rounded-xl bg-teal-600 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
          >
            {submitting ? "Mengirim..." : "Selesai & Kumpulkan"}
          </button>
        ) : (
          <button
            onClick={() => setIndex((i) => Math.min(totalSoal - 1, i + 1))}
            className="flex-1 rounded-xl bg-teal-600 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
          >
            Berikutnya
          </button>
        )}
      </div>
    </div>
  );
}
