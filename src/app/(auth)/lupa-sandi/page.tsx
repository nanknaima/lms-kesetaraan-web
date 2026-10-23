"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { forgotPassword, verifyOtp, resetPassword } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { KONTAK_ADMIN } from "@/lib/school";

type Step = "email" | "otp" | "password" | "selesai";

export default function LupaSandiPage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submitEmail(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await forgotPassword(email);
      setInfo(res.message);
      setStep("otp");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal mengirim OTP. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  async function submitOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await verifyOtp(email, otp);
      setInfo(null);
      setStep("password");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Kode OTP salah atau sudah kedaluwarsa.");
    } finally {
      setLoading(false);
    }
  }

  async function submitPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== passwordConfirm) {
      setError("Konfirmasi password tidak sama.");
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email, otp, password, passwordConfirm);
      setStep("selesai");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal mengubah password. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-teal-50 to-blue-50 px-4 dark:from-slate-950 dark:to-slate-900">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-lg dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-xl font-bold text-teal-700 dark:text-teal-400">Lupa Sandi</h1>
        <p className="mt-1 text-sm text-slate-500">
          {step === "email" && "Masukkan email akun Anda, kami kirimkan kode OTP."}
          {step === "otp" && "Masukkan kode OTP 6 digit yang dikirim ke email Anda."}
          {step === "password" && "Buat password baru untuk akun Anda."}
          {step === "selesai" && "Password berhasil diubah."}
        </p>

        {info && step === "otp" && (
          <p className="mt-4 rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-700 dark:bg-teal-950 dark:text-teal-300">
            {info}
          </p>
        )}
        {error && (
          <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-950">{error}</p>
        )}

        {step === "email" && (
          <form onSubmit={submitEmail} className="mt-6 space-y-4">
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@contoh.com"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
            />
            <button
              disabled={loading}
              className="w-full rounded-lg bg-teal-600 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
            >
              {loading ? "Mengirim..." : "Kirim Kode OTP"}
            </button>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={submitOtp} className="mt-6 space-y-4">
            <input
              required
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="6 digit kode OTP"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-center text-lg tracking-[0.5em] focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
            />
            <button
              disabled={loading}
              className="w-full rounded-lg bg-teal-600 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
            >
              {loading ? "Memeriksa..." : "Verifikasi Kode"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setOtp("");
                setError(null);
              }}
              className="w-full text-xs font-medium text-slate-500 hover:underline"
            >
              Salah email? Ulangi
            </button>
          </form>
        )}

        {step === "password" && (
          <form onSubmit={submitPassword} className="mt-6 space-y-4">
            <input
              required
              type="password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password baru (min. 8 karakter)"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
            />
            <input
              required
              type="password"
              minLength={8}
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder="Ulangi password baru"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
            />
            <button
              disabled={loading}
              className="w-full rounded-lg bg-teal-600 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
            >
              {loading ? "Menyimpan..." : "Simpan Password Baru"}
            </button>
          </form>
        )}

        {step === "selesai" && (
          <div className="mt-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <CheckCircle2 className="h-8 w-8" strokeWidth={2} />
            </div>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              Password berhasil diubah. Silakan masuk dengan password baru Anda.
            </p>
            <a
              href="/login"
              className="mt-4 inline-block w-full rounded-lg bg-teal-600 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
            >
              Ke Halaman Login
            </a>
          </div>
        )}

        <p className="mt-6 text-center text-xs text-slate-400">
          Tidak menerima email atau tidak bisa akses email lama?{" "}
          <a href={KONTAK_ADMIN.waLink} target="_blank" rel="noopener noreferrer" className="font-medium text-teal-600 hover:underline">
            Hubungi Admin
          </a>
        </p>
      </div>
    </div>
  );
}
