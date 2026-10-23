"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, GraduationCap, Clock, Languages, Handshake } from "lucide-react";
import { SEKOLAH, KONTAK_ADMIN } from "@/lib/school";
import { WhatsAppIcon } from "@/components/ui/BrandIcons";

const SPLASH_MS = 1400;

const KEUNGGULAN_ICON = {
  ijazah: GraduationCap,
  fleksibel: Clock,
  bahasa: Languages,
  pendampingan: Handshake,
} as const;

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

/**
 * Halaman awal (landing/promosi) — tampil sebelum form login, berisi info tentang
 * PKBM PPI Taiwan + tombol "Masuk" yang membawa ke /login (form login sendiri
 * dibuat sesederhana mungkin: cuma logo & teks singkat di sisi kiri, lihat
 * (auth)/login/page.tsx).
 */
export default function LandingPage() {
  const [splashDone, setSplashDone] = useState(false);
  const [splashHiding, setSplashHiding] = useState(false);

  useEffect(() => {
    const hideTimer = setTimeout(() => setSplashHiding(true), SPLASH_MS);
    const doneTimer = setTimeout(() => setSplashDone(true), SPLASH_MS + 500);
    return () => {
      clearTimeout(hideTimer);
      clearTimeout(doneTimer);
    };
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* ── Splash screen (cuma tampil sekali, saat pertama buka web) ──── */}
      {!splashDone && (
        <div
          className={`fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-teal-600 transition-opacity duration-500 ${
            splashHiding ? "pointer-events-none opacity-0" : "opacity-100"
          }`}
        >
          <div className="animate-splash-logo">
            <LogoMark className="h-24 w-24 text-3xl" />
          </div>
          <p className="animate-splash-logo text-center text-sm font-semibold tracking-wide text-white/90">
            {SEKOLAH.nama}
          </p>
        </div>
      )}

      {/* ── Header ───────────────────────────────────────────────────── */}
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <div className="flex items-center gap-2.5">
          <LogoMark className="h-9 w-9 text-xs" />
          <span className="text-sm font-bold text-slate-900 dark:text-white sm:text-base">{SEKOLAH.nama}</span>
        </div>
        <Link
          href="/login"
          className="rounded-full bg-teal-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
        >
          Masuk
        </Link>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-teal-100 dark:bg-teal-900/20" />
        <div className="pointer-events-none absolute -left-24 top-40 h-56 w-56 rounded-full bg-amber-50 dark:bg-amber-900/10" />
        <div className="relative mx-auto max-w-6xl px-5 pb-14 pt-4 sm:px-8 sm:pb-20 sm:pt-8 lg:pt-14">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-block rounded-full bg-teal-50 px-3.5 py-1 text-[11px] font-bold uppercase tracking-wide text-teal-700 dark:bg-teal-950 dark:text-teal-300">
              Sekolah Kesetaraan Paket A · B · C
            </span>
            <h1 className="mt-4 text-3xl font-extrabold leading-tight text-slate-900 dark:text-white sm:text-4xl lg:text-5xl">
              {SEKOLAH.tagline}
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-300 sm:text-base">
              {SEKOLAH.deskripsi}
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/login"
                className="w-full rounded-xl bg-teal-600 px-7 py-3 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 sm:w-auto"
              >
                <span className="inline-flex items-center justify-center gap-1.5">
                  Masuk ke LMS
                  <ArrowRight className="h-4 w-4" strokeWidth={2} />
                </span>
              </Link>
              <Link
                href="/daftar"
                className="w-full rounded-xl border-2 border-teal-600 px-7 py-3 text-center text-sm font-semibold text-teal-700 transition hover:bg-teal-50 dark:text-teal-400 dark:hover:bg-teal-950 sm:w-auto"
              >
                Daftar Murid Baru
              </Link>
              <a
                href={KONTAK_ADMIN.waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-300 px-7 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 sm:w-auto"
              >
                <WhatsAppIcon className="h-4 w-4 shrink-0" />
                Tanya Admin
              </a>
            </div>
            <p className="mt-3 text-xs text-slate-400">
              Pendaftaran murid baru akan ditinjau admin sebelum akun login dibuatkan.
            </p>
          </div>
        </div>
      </section>

      {/* ── Keunggulan ───────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 pb-16 sm:px-8">
        <h2 className="text-center text-lg font-bold text-slate-900 dark:text-white sm:text-xl">
          Kenapa Belajar di {SEKOLAH.nama}?
        </h2>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SEKOLAH.keunggulan.map((k) => {
            const Icon = KEUNGGULAN_ICON[k.icon as keyof typeof KEUNGGULAN_ICON];
            return (
              <div
                key={k.title}
                className="rounded-2xl border border-slate-100 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300">
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">{k.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{k.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-100 py-8 text-center dark:border-slate-800">
        <p className="text-xs text-slate-400">
          {SEKOLAH.nama} ·{" "}
          <a href={`mailto:${KONTAK_ADMIN.email}`} className="font-medium text-teal-600 hover:underline">
            {KONTAK_ADMIN.email}
          </a>
        </p>
      </footer>
    </div>
  );
}
