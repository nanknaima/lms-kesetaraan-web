"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Trash2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { logout } from "@/lib/auth";
import { Card } from "@/components/ui/Card";

/**
 * "Pengaturan" — Ganti Password & Hapus Akun (lihat backend ProfileController::update()/destroy(),
 * sudah generik untuk semua role). Meniru mobile/lib/features/murid/pengaturan_screen.dart;
 * opsi Bahasa & Dark Mode versi mobile TIDAK diikutkan karena web belum punya
 * infrastruktur i18n/theme-toggle-nya (dark mode web masih ikut preferensi sistem browser).
 */
export function PengaturanContent({ bisaHapusAkun = true }: { bisaHapusAkun?: boolean }) {
  const router = useRouter();

  const [passwordSaatIni, setPasswordSaatIni] = useState("");
  const [passwordBaru, setPasswordBaru] = useState("");
  const [passwordBaruConfirmation, setPasswordBaruConfirmation] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const [showHapusAkun, setShowHapusAkun] = useState(false);
  const [passwordHapus, setPasswordHapus] = useState("");
  const [savingHapus, setSavingHapus] = useState(false);
  const [hapusError, setHapusError] = useState<string | null>(null);

  async function submitPassword(e: React.FormEvent) {
    e.preventDefault();
    if (passwordBaru !== passwordBaruConfirmation) {
      setPasswordMsg({ type: "error", text: "Konfirmasi password baru tidak sama." });
      return;
    }
    setSavingPassword(true);
    setPasswordMsg(null);
    try {
      await api.put("/profile", {
        password_saat_ini: passwordSaatIni,
        password_baru: passwordBaru,
        password_baru_confirmation: passwordBaruConfirmation,
      });
      setPasswordMsg({ type: "ok", text: "Password berhasil diganti." });
      setPasswordSaatIni("");
      setPasswordBaru("");
      setPasswordBaruConfirmation("");
    } catch (err) {
      setPasswordMsg({ type: "error", text: err instanceof ApiError ? err.message : "Gagal mengganti password." });
    } finally {
      setSavingPassword(false);
    }
  }

  async function hapusAkun(e: React.FormEvent) {
    e.preventDefault();
    setSavingHapus(true);
    setHapusError(null);
    try {
      await api.del("/profile", { password: passwordHapus });
      await logout();
      router.replace("/login");
    } catch (err) {
      setHapusError(err instanceof ApiError ? err.message : "Gagal menghapus akun. Periksa password Anda.");
      setSavingHapus(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold text-slate-900 dark:text-white">Pengaturan</h1>
        <p className="text-sm text-slate-500">Kelola keamanan akun Anda.</p>
      </div>

      <Card className="p-0">
        <h2 className="flex items-center gap-2 px-4 pt-4 text-xs font-bold uppercase tracking-wide text-slate-500">
          <Lock className="h-3.5 w-3.5" strokeWidth={2} />
          Ganti Password
        </h2>
        <form onSubmit={submitPassword} className="grid gap-3 p-4 sm:grid-cols-3">
          <input
            required
            type="password"
            placeholder="Password saat ini"
            value={passwordSaatIni}
            onChange={(e) => setPasswordSaatIni(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
          />
          <input
            required
            type="password"
            minLength={8}
            placeholder="Password baru"
            value={passwordBaru}
            onChange={(e) => setPasswordBaru(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
          />
          <input
            required
            type="password"
            minLength={8}
            placeholder="Ulangi password baru"
            value={passwordBaruConfirmation}
            onChange={(e) => setPasswordBaruConfirmation(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
          />
          {passwordMsg && (
            <p className={`text-sm sm:col-span-3 ${passwordMsg.type === "ok" ? "text-teal-600" : "text-rose-600"}`}>
              {passwordMsg.text}
            </p>
          )}
          <button
            disabled={savingPassword}
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60 sm:col-span-3"
          >
            {savingPassword ? "Menyimpan..." : "Ganti Password"}
          </button>
        </form>
      </Card>

      {bisaHapusAkun ? (
      <Card className="p-0">
        <h2 className="flex items-center gap-2 px-4 pt-4 text-xs font-bold uppercase tracking-wide text-rose-600">
          <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
          Hapus Akun
        </h2>
        <div className="p-4">
          <p className="text-sm text-slate-500">
            Akun yang dihapus tidak bisa dipakai login lagi. Tindakan ini tidak bisa dibatalkan.
          </p>
          {!showHapusAkun ? (
            <button
              onClick={() => setShowHapusAkun(true)}
              className="mt-3 rounded-lg border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:hover:bg-rose-950"
            >
              Hapus Akun Saya
            </button>
          ) : (
            <form onSubmit={hapusAkun} className="mt-3 space-y-2">
              <input
                required
                type="password"
                placeholder="Masukkan password untuk konfirmasi"
                value={passwordHapus}
                onChange={(e) => setPasswordHapus(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
              />
              {hapusError && <p className="text-sm text-rose-600">{hapusError}</p>}
              <div className="flex gap-2">
                <button
                  disabled={savingHapus}
                  className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
                >
                  {savingHapus ? "Menghapus..." : "Konfirmasi Hapus Akun"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowHapusAkun(false);
                    setHapusError(null);
                    setPasswordHapus("");
                  }}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                >
                  Batal
                </button>
              </div>
            </form>
          )}
        </div>
      </Card>
      ) : null}
    </div>
  );
}
