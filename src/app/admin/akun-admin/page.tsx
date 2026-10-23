"use client";

import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/Card";
import type { AdminAkun, Paginated } from "@/lib/types";

/** Halaman "Kelola Admin" (Bagian 10) — hanya boleh dibuka admin_level='super' (nav sudah disembunyikan untuk 'staff' di layout, ini lapis kedua di sisi frontend, backend tetap jadi penjaga utama). */
export default function AdminAkunAdminPage() {
  const { user } = useAuth("admin");
  const [akun, setAkun] = useState<AdminAkun[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [showForm, setShowForm] = useState(false);

  function load() {
    api
      .get<{ data: Paginated<AdminAkun> }>("/admin/admin-akun")
      .then((r) => setAkun(r.data.data ?? []))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function hapus(a: AdminAkun) {
    if (!confirm(`Hapus akun admin ${a.nama}?`)) return;
    try {
      await api.del(`/admin/admin-akun/${a.id}`);
      load();
    } catch (err) {
      setNotice({ type: "error", text: err instanceof ApiError ? err.message : "Gagal menghapus akun admin." });
    }
  }

  if (user && user.admin_level !== "super") {
    return (
      <Card className="text-center text-sm text-rose-600">
        Hanya admin super yang boleh membuka halaman ini.
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Kelola Admin</h1>
          <p className="text-sm text-slate-500">Daftar akun admin, buat akun baru, atau hapus akun yang sudah tidak diperlukan.</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
        >
          {showForm ? "Tutup Form" : "+ Tambah Admin"}
        </button>
      </div>

      {showForm && (
        <AdminForm
          onCreated={() => {
            setShowForm(false);
            load();
          }}
        />
      )}

      {notice && (
        <p className={`rounded-lg px-3 py-2 text-sm ${notice.type === "ok" ? "bg-teal-50 text-teal-700" : "bg-rose-50 text-rose-600"}`}>
          {notice.text}
        </p>
      )}

      <Card className="p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500 dark:border-slate-800">
              <th className="p-4">Nama</th>
              <th className="p-4">Tingkat</th>
              <th className="p-4">Status</th>
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody>
            {akun.map((a) => (
              <tr key={a.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                <td className="p-4">
                  <p className="font-medium text-slate-800 dark:text-white">{a.nama}</p>
                  <p className="text-xs text-slate-400">{a.email}</p>
                </td>
                <td className="p-4">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                      a.admin_level === "super"
                        ? "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    {a.admin_level}
                  </span>
                </td>
                <td className="p-4 text-slate-500">{a.status}</td>
                <td className="p-4">
                  {a.id !== user?.id && (
                    <button onClick={() => hapus(a)} className="text-xs font-medium text-rose-600 hover:underline">
                      Hapus
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!loading && akun.length === 0 && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-slate-400">
                  Belum ada akun admin.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function AdminForm({ onCreated }: { onCreated: () => void }) {
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [adminLevel, setAdminLevel] = useState<"super" | "staff">("staff");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ nama: string; email: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await api.post<{ data: { nama: string; email: string }; password_awal: string }>("/admin/admin-akun", {
        nama,
        email,
        admin_level: adminLevel,
      });
      setCreated({ nama: res.data.nama, email: res.data.email, password: res.password_awal });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal menambah akun admin.");
    } finally {
      setSaving(false);
    }
  }

  if (created) {
    return (
      <Card>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
          <CheckCircle2 className="h-6 w-6" strokeWidth={2} />
        </div>
        <h2 className="mt-2 font-semibold text-slate-800 dark:text-white">Akun admin {created.nama} berhasil dibuat</h2>
        <p className="mt-1 text-sm text-slate-500">
          Kredensial ini juga sudah dikirim ke email. Catat/salin dulu sekarang — password tidak ditampilkan lagi
          setelah halaman ini ditutup.
        </p>
        <div className="mt-3 rounded-lg border border-teal-200 bg-teal-50 p-3 dark:border-teal-900 dark:bg-teal-950">
          <p className="text-xs text-slate-500">Email</p>
          <p className="font-mono text-sm text-slate-800 dark:text-slate-100">{created.email}</p>
          <p className="mt-2 text-xs text-slate-500">Password awal</p>
          <p className="font-mono text-lg font-bold tracking-wide text-teal-700 dark:text-teal-300">{created.password}</p>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={async () => {
              await navigator.clipboard.writeText(created.password);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
          >
            {copied ? "Tersalin!" : "Salin Password"}
          </button>
          <button
            type="button"
            onClick={onCreated}
            className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700"
          >
            Selesai
          </button>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
        <input
          required
          placeholder="Nama lengkap"
          value={nama}
          onChange={(e) => setNama(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
        />
        <input
          required
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
        />
        <select
          value={adminLevel}
          onChange={(e) => setAdminLevel(e.target.value as "super" | "staff")}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 sm:col-span-2"
        >
          <option value="staff">Staff (operasional harian)</option>
          <option value="super">Super (bisa kelola akun admin lain)</option>
        </select>
        {error && <p className="text-sm text-rose-600 sm:col-span-2">{error}</p>}
        <p className="text-xs text-slate-400 sm:col-span-2">
          Password awal dibuat otomatis oleh sistem, dikirim ke email, dan ditampilkan sekali setelah akun berhasil
          dibuat.
        </p>
        <button
          disabled={saving}
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60 sm:col-span-2"
        >
          {saving ? "Menyimpan..." : "Simpan Admin"}
        </button>
      </form>
    </Card>
  );
}
