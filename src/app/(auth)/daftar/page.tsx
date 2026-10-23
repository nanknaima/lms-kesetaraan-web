"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { SEKOLAH } from "@/lib/school";
import { Card } from "@/components/ui/Card";

/** Rasio ukuran dokumen sesuai batas backend PendaftaranPublicController::store() (max:5120 KB). */
const MAKS_DOKUMEN_KB = 5120;

/**
 * Form pendaftaran PUBLIK calon murid baru (Bagian G) — tidak perlu login.
 * Data masuk berstatus "pending", muncul di menu Pendaftaran admin untuk
 * ditinjau (setujui/tolak), lalu admin buat akun resmi lewat menu Tambah Murid.
 */
export default function DaftarPage() {
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [noHp, setNoHp] = useState("");
  const [paket, setPaket] = useState<"A" | "B" | "C" | "">("");
  const [tglLahir, setTglLahir] = useState("");
  const [alamat, setAlamat] = useState("");
  const [dokumen, setDokumen] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sukses, setSukses] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!dokumen) {
      setError("Dokumen pendukung (rapor/ijazah terakhir/KTP orang tua) wajib dilampirkan.");
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("nama", nama);
      fd.append("email", email);
      fd.append("no_hp", noHp);
      fd.append("paket", paket);
      fd.append("tgl_lahir", tglLahir);
      if (alamat) fd.append("alamat", alamat);
      fd.append("dokumen", dokumen);
      await api.upload("/pendaftaran", fd);
      setSukses(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal mengirim pendaftaran. Coba lagi.");
    } finally {
      setSaving(false);
    }
  }

  if (sukses) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
        <Card className="max-w-md text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
            <CheckCircle2 className="h-7 w-7" strokeWidth={2} />
          </div>
          <h1 className="mt-3 text-lg font-bold text-slate-900 dark:text-white">Pendaftaran Terkirim</h1>
          <p className="mt-2 text-sm text-slate-500">
            Terima kasih, {nama}. Pendaftaran Anda sudah kami terima dan akan ditinjau oleh admin {SEKOLAH.nama}.
            Informasi kelulusan seleksi & akun login akan dikirim ke email <strong>{email}</strong>.
          </p>
          <Link href="/" className="mt-5 inline-block rounded-lg bg-teal-600 px-5 py-2 text-sm font-semibold text-white hover:bg-teal-700">
            Kembali ke Beranda
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 dark:bg-slate-950 sm:py-12">
      <div className="mx-auto max-w-xl">
        <Link href="/" className="mb-4 inline-flex items-center gap-1 text-sm text-teal-600 hover:underline">
          <ArrowLeft className="h-4 w-4" strokeWidth={2} />
          Kembali ke Beranda
        </Link>

        <Card>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Pendaftaran Murid Baru</h1>
          <p className="mt-1 text-sm text-slate-500">
            Isi formulir di bawah untuk mendaftar sebagai calon murid {SEKOLAH.nama}. Data akan ditinjau admin sebelum
            akun login dibuatkan.
          </p>

          <form onSubmit={submit} className="mt-5 grid gap-3 sm:grid-cols-2">
            <input
              required
              placeholder="Nama lengkap"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-2 dark:border-slate-700 dark:bg-slate-800"
            />
            <input
              required
              type="email"
              placeholder="Email aktif"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
            />
            <input
              required
              placeholder="No. HP / WhatsApp"
              value={noHp}
              onChange={(e) => setNoHp(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
            />
            <select
              required
              value={paket}
              onChange={(e) => setPaket(e.target.value as "A" | "B" | "C")}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
            >
              <option value="">Pilih paket kesetaraan...</option>
              <option value="A">Paket A (setara SD)</option>
              <option value="B">Paket B (setara SMP)</option>
              <option value="C">Paket C (setara SMA)</option>
            </select>
            <label className="text-xs text-slate-500">
              Tanggal Lahir
              <input
                required
                type="date"
                max={new Date().toISOString().slice(0, 10)}
                value={tglLahir}
                onChange={(e) => setTglLahir(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
              />
            </label>
            <textarea
              placeholder="Alamat (opsional)"
              value={alamat}
              onChange={(e) => setAlamat(e.target.value)}
              rows={2}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-2 dark:border-slate-700 dark:bg-slate-800"
            />
            <label className="text-xs text-slate-500 sm:col-span-2">
              Dokumen Pendukung (rapor/ijazah terakhir, atau KTP — PDF/JPG/PNG, maks {MAKS_DOKUMEN_KB / 1024}MB)
              <input
                required
                type="file"
                accept=".pdf,image/jpeg,image/png"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  if (file && file.size > MAKS_DOKUMEN_KB * 1024) {
                    setError(`Dokumen "${file.name}" melebihi batas maksimal ${MAKS_DOKUMEN_KB / 1024}MB.`);
                    e.target.value = "";
                    setDokumen(null);
                    return;
                  }
                  setError(null);
                  setDokumen(file);
                }}
                className="mt-1 block w-full text-sm text-slate-600 dark:text-slate-300"
              />
            </label>

            {error && <p className="text-sm text-rose-600 sm:col-span-2">{error}</p>}

            <button
              disabled={saving}
              className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60 sm:col-span-2"
            >
              {saving ? "Mengirim..." : "Kirim Pendaftaran"}
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
}
