"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, Mail } from "lucide-react";
import { login, dashboardPathFor, googleLoginUrl } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { SEKOLAH, KONTAK_ADMIN } from "@/lib/school";
import { GoogleIcon, WhatsAppIcon } from "@/components/ui/BrandIcons";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
}

/** Monogram sekolah placeholder — lingkaran dengan inisial "PPI". Ganti dengan logo asli bila sudah tersedia. */
function LogoMark({ className = "h-16 w-16 text-xl" }: { className?: string }) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-white/15 font-extrabold tracking-wide text-white ring-4 ring-white/30 backdrop-blur-sm ${className}`}
    >
      PPI
    </div>
  );
}

function LoginPageInner() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const googleError = searchParams.get("google_error");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await login(identifier, password);
      router.replace(dashboardPathFor(user.role));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal login. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* ── Konten login ─────────────────────────────────────────────── */}
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col lg:max-w-5xl">
        <div className="lg:grid lg:min-h-screen lg:grow lg:grid-cols-2 lg:items-center lg:gap-10 lg:px-6">
          {/* Panel kiri (desktop) / atas (mobile) — sengaja sederhana: cuma logo
              & nama sekolah, bukan halaman promosi. Info lengkap ada di beranda (/). */}
          <div className="relative overflow-hidden rounded-b-[2.5rem] bg-gradient-to-br from-teal-600 to-teal-700 px-6 pb-14 pt-10 text-white lg:order-1 lg:rounded-[2rem] lg:px-8 lg:py-14">
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute -bottom-16 -left-10 h-48 w-48 rounded-full bg-white/10" />
            <div className="relative flex flex-col items-center text-center lg:items-start lg:text-left">
              <Link
                href="/"
                className="mb-4 hidden items-center gap-1 text-xs font-medium text-teal-50/80 hover:text-white lg:flex"
              >
                <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
                Kembali ke beranda
              </Link>
              <LogoMark className="h-14 w-14 text-lg" />
              <span className="mt-4 inline-block rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide">
                {SEKOLAH.nama}
              </span>
              <h1 className="mt-3 text-xl font-bold leading-snug sm:text-2xl lg:text-3xl">{SEKOLAH.tagline}</h1>
            </div>
          </div>

          {/* Kartu form login */}
          <div className="relative z-10 -mt-8 flex-1 px-4 pb-10 lg:order-2 lg:mt-0 lg:px-0">
            <div className="mx-auto w-full max-w-sm animate-fade-in-up rounded-2xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-800 dark:bg-slate-900 sm:p-8">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Masuk</h2>
              <p className="mt-1 text-sm text-slate-500">Paket A · Paket B · Paket C</p>

              {googleError && (
                <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                  {googleError}
                </p>
              )}

              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                    Email / NIS / NIP
                  </label>
                  <input
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100 dark:border-slate-700 dark:bg-slate-800 dark:focus:ring-teal-900"
                    placeholder="Email terdaftar, NIS murid, atau NIP guru"
                  />
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Password</label>
                    <a href="/lupa-sandi" className="text-xs font-medium text-teal-600 hover:underline">
                      Lupa sandi?
                    </a>
                  </div>
                  <div className="relative">
                    <input
                      required
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 pr-11 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100 dark:border-slate-700 dark:bg-slate-800 dark:focus:ring-teal-900"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                      className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showPassword ? (
                        <EyeOff className="h-[18px] w-[18px]" strokeWidth={2} />
                      ) : (
                        <Eye className="h-[18px] w-[18px]" strokeWidth={2} />
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-950">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-teal-600 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:opacity-60"
                >
                  {loading ? "Memproses..." : "Masuk"}
                </button>
              </form>

              <div className="my-5 flex items-center gap-3">
                <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                <span className="text-xs text-slate-400">atau</span>
                <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
              </div>

              <a
                href={googleLoginUrl()}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <GoogleIcon className="h-4 w-4 shrink-0" />
                Masuk dengan Google
              </a>

              <div className="mt-6 rounded-xl bg-slate-50 p-3.5 text-center text-xs text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                <p className="mb-1.5 font-medium text-slate-600 dark:text-slate-300">
                  Belum punya akun? Murid baru tidak bisa mendaftar sendiri — hubungi admin sekolah.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <a
                    href={KONTAK_ADMIN.waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-medium text-teal-600 hover:underline"
                  >
                    <WhatsAppIcon className="h-3.5 w-3.5 shrink-0" />
                    WhatsApp Admin
                  </a>
                  <span className="text-slate-300">|</span>
                  <a
                    href={`mailto:${KONTAK_ADMIN.email}`}
                    className="inline-flex items-center gap-1.5 font-medium text-teal-600 hover:underline"
                  >
                    <Mail className="h-3.5 w-3.5" strokeWidth={2} />
                    Email Admin
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
