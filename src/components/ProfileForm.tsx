"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, User as UserIcon, Mail, FileText, Lock, KeyRound, LogOut } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { logout } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import type { User } from "@/lib/types";

const ROLE_LABEL: Record<User["role"], string> = {
  admin: "Administrator",
  guru: "Guru",
  murid: "Murid",
};

interface ProfileUpdateResponse {
  data: User;
}

/**
 * Baris field ala daftar menu (ikon di kiri, label kecil + input di kanan) —
 * gaya diambil dari mobile/lib/features/murid/profil_screen.dart (ListTile
 * berikon dalam kartu putih, bukan form berkotak-kotak).
 */
function FieldRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300">
        <Icon className="h-4 w-4" strokeWidth={2} />
      </div>
      <div className="min-w-0 flex-1">
        <label className="mb-0.5 block text-xs font-medium text-slate-500">{label}</label>
        {children}
      </div>
    </div>
  );
}

const fieldInputClass =
  "w-full rounded-lg border-0 bg-transparent p-0 text-sm text-slate-800 focus:outline-none focus:ring-0 dark:text-white";

/** Form profil dipakai bersama oleh /admin/profil, /guru/profil, /murid/profil. */
export function ProfileForm({ user, onUpdated }: { user: User; onUpdated: (u: User) => void }) {
  const router = useRouter();
  const [nama, setNama] = useState(user.nama);
  const [email, setEmail] = useState(user.email);
  const [bio, setBio] = useState(user.bio ?? "");
  const [savingBiodata, setSavingBiodata] = useState(false);
  const [biodataMsg, setBiodataMsg] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const [passwordSaatIni, setPasswordSaatIni] = useState("");
  const [passwordBaru, setPasswordBaru] = useState("");
  const [passwordBaruConfirmation, setPasswordBaruConfirmation] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url ?? null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    setAvatarError(null);
    try {
      const fd = new FormData();
      fd.append("avatar", file);
      const res = await api.upload<ProfileUpdateResponse>("/profile/avatar", fd);
      setAvatarUrl(res.data.avatar_url ?? null);
      onUpdated(res.data);
    } catch (err) {
      setAvatarError(err instanceof ApiError ? err.message : "Gagal mengunggah foto profil.");
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function submitBiodata(e: React.FormEvent) {
    e.preventDefault();
    setSavingBiodata(true);
    setBiodataMsg(null);
    try {
      const res = await api.put<ProfileUpdateResponse>("/profile", { nama, email, bio });
      onUpdated(res.data);
      setBiodataMsg({ type: "ok", text: "Biodata berhasil diperbarui." });
    } catch (err) {
      setBiodataMsg({ type: "error", text: err instanceof ApiError ? err.message : "Gagal menyimpan biodata." });
    } finally {
      setSavingBiodata(false);
    }
  }

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

  return (
    <div className="space-y-4">
      {/* Hero identitas — avatar besar & tersentral, ala halaman Profil mobile */}
      <Card className="flex flex-col items-center py-8 text-center">
        <div className="relative h-24 w-24 shrink-0">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={user.nama}
              className="h-24 w-24 rounded-full object-cover ring-4 ring-teal-50 dark:ring-teal-950"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-teal-600 text-3xl font-bold text-white ring-4 ring-teal-50 dark:ring-teal-950">
              {user.nama?.[0] ?? "?"}
            </div>
          )}

          {uploadingAvatar && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
            </div>
          )}

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingAvatar}
            aria-label="Ganti foto profil"
            className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-teal-600 text-white shadow-sm hover:bg-teal-700 disabled:opacity-60 dark:border-slate-900"
          >
            <Camera className="h-4 w-4" strokeWidth={2} />
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
        </div>

        <h1 className="mt-3 text-lg font-bold text-slate-900 dark:text-white">{user.nama}</h1>
        <span className="mt-1 rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-teal-700 dark:bg-teal-950 dark:text-teal-300">
          {ROLE_LABEL[user.role]}
        </span>
        <p className="mt-1.5 text-sm text-slate-500">
          {user.email}
          {user.nis ? ` · NIS ${user.nis}` : ""}
          {user.nip ? ` · NIP ${user.nip}` : ""}
        </p>
        {user.muridProfile && (
          <p className="mt-0.5 text-xs text-slate-400">
            {user.muridProfile.kelas?.nama_kelas ?? "Kelas belum ditentukan"} · Paket {user.muridProfile.paket}
          </p>
        )}
        {avatarError && <p className="mt-2 text-xs text-rose-600">{avatarError}</p>}
      </Card>

      {/* Biodata — kartu putih dengan baris berikon + pembatas tipis, ala menu list mobile */}
      <Card className="p-0">
        <h2 className="px-4 pt-4 text-xs font-bold uppercase tracking-wide text-slate-500">Biodata</h2>
        <form onSubmit={submitBiodata}>
          <div className="mt-2 divide-y divide-slate-100 dark:divide-slate-800">
            <FieldRow icon={UserIcon} label="Nama">
              <input required value={nama} onChange={(e) => setNama(e.target.value)} className={fieldInputClass} />
            </FieldRow>
            <FieldRow icon={Mail} label="Email">
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={fieldInputClass}
              />
            </FieldRow>
            <FieldRow icon={FileText} label="Bio">
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={2}
                maxLength={500}
                placeholder="Ceritakan sedikit tentang diri Anda..."
                className={`${fieldInputClass} resize-none`}
              />
            </FieldRow>
          </div>
          <div className="flex flex-wrap items-center gap-3 px-4 pb-4 pt-3">
            <button
              disabled={savingBiodata}
              className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
            >
              {savingBiodata ? "Menyimpan..." : "Simpan Biodata"}
            </button>
            {biodataMsg && (
              <p className={`text-sm ${biodataMsg.type === "ok" ? "text-teal-600" : "text-rose-600"}`}>{biodataMsg.text}</p>
            )}
          </div>
        </form>
      </Card>

      {/* Ganti Password — pola baris sama supaya konsisten */}
      <Card className="p-0">
        <h2 className="px-4 pt-4 text-xs font-bold uppercase tracking-wide text-slate-500">Ganti Password</h2>
        <form onSubmit={submitPassword}>
          <div className="mt-2 divide-y divide-slate-100 dark:divide-slate-800">
            <FieldRow icon={Lock} label="Password saat ini">
              <input
                required
                type="password"
                value={passwordSaatIni}
                onChange={(e) => setPasswordSaatIni(e.target.value)}
                className={fieldInputClass}
              />
            </FieldRow>
            <FieldRow icon={KeyRound} label="Password baru">
              <input
                required
                type="password"
                minLength={8}
                value={passwordBaru}
                onChange={(e) => setPasswordBaru(e.target.value)}
                className={fieldInputClass}
              />
            </FieldRow>
            <FieldRow icon={KeyRound} label="Ulangi password baru">
              <input
                required
                type="password"
                minLength={8}
                value={passwordBaruConfirmation}
                onChange={(e) => setPasswordBaruConfirmation(e.target.value)}
                className={fieldInputClass}
              />
            </FieldRow>
          </div>
          <div className="flex flex-wrap items-center gap-3 px-4 pb-4 pt-3">
            <button
              disabled={savingPassword}
              className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-60 dark:bg-slate-700 dark:hover:bg-slate-600"
            >
              {savingPassword ? "Menyimpan..." : "Ganti Password"}
            </button>
            {passwordMsg && (
              <p className={`text-sm ${passwordMsg.type === "ok" ? "text-teal-600" : "text-rose-600"}`}>{passwordMsg.text}</p>
            )}
          </div>
        </form>
      </Card>

      <button
        onClick={async () => {
          await logout();
          router.replace("/login");
        }}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-rose-300 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 dark:border-rose-800 dark:hover:bg-rose-950"
      >
        <LogOut className="h-4 w-4" strokeWidth={2} />
        Keluar
      </button>
    </div>
  );
}
