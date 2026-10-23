"use client";

import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import type { GuruAkun, Mapel, Paginated } from "@/lib/types";

export default function AdminGuruPage() {
  const [guru, setGuru] = useState<GuruAkun[]>([]);
  const [mapelList, setMapelList] = useState<Mapel[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [showForm, setShowForm] = useState(false);

  function load() {
    const q = new URLSearchParams();
    if (search) q.set("search", search);
    Promise.all([
      api.get<{ data: Paginated<GuruAkun> }>(`/admin/guru${q.toString() ? `?${q}` : ""}`),
      api.get<{ data: Paginated<Mapel> }>("/admin/mapel?per_page=100"),
    ])
      .then(([g, m]) => {
        setGuru(g.data.data ?? []);
        setMapelList(m.data.data ?? []);
      })
      .finally(() => setLoading(false));
  }

  // `search` sengaja TIDAK masuk dependency — pencarian hanya dipicu manual
  // lewat handleSearchSubmit, sama pola dengan admin/murid/page.tsx.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, []);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    load();
  }

  async function nonaktifkan(g: GuruAkun) {
    if (!confirm(`Nonaktifkan akun guru ${g.nama}?`)) return;
    try {
      await api.del(`/admin/guru/${g.id}`);
      load();
    } catch (err) {
      setNotice({ type: "error", text: err instanceof ApiError ? err.message : "Gagal menonaktifkan guru." });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Kelola Guru</h1>
          <p className="text-sm text-slate-500">Daftar akun guru, tambah akun baru, dan nonaktifkan akun yang sudah tidak aktif.</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
        >
          {showForm ? "Tutup Form" : "+ Tambah Guru"}
        </button>
      </div>

      {showForm && (
        <GuruForm
          mapelList={mapelList}
          onCreated={() => {
            setShowForm(false);
            load();
          }}
        />
      )}

      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <input
          placeholder="Cari nama guru..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800"
        />
        <button className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300">
          Cari
        </button>
      </form>

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
              <th className="p-4">NIP</th>
              <th className="p-4">Mapel Diampu</th>
              <th className="p-4">Status</th>
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody>
            {guru.map((g) => (
              <tr key={g.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                <td className="p-4">
                  <p className="font-medium text-slate-800 dark:text-white">{g.nama}</p>
                  <p className="text-xs text-slate-400">{g.email}</p>
                </td>
                <td className="p-4 text-slate-500">{g.nip ?? "-"}</td>
                <td className="p-4 text-slate-500">{g.guruProfile?.mapel?.nama_mapel ?? "-"}</td>
                <td className="p-4">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                      g.status === "aktif" ? "bg-teal-100 text-teal-700" : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {g.status}
                  </span>
                </td>
                <td className="p-4">
                  {g.status === "aktif" && (
                    <button onClick={() => nonaktifkan(g)} className="text-xs font-medium text-rose-600 hover:underline">
                      Nonaktifkan
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!loading && guru.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-slate-400">
                  Belum ada akun guru.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function GuruForm({ mapelList, onCreated }: { mapelList: Mapel[]; onCreated: () => void }) {
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [nip, setNip] = useState("");
  const [mapelId, setMapelId] = useState("");
  const [noHp, setNoHp] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ nama: string; email: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await api.post<{ data: { nama: string; email: string }; password_awal: string }>("/admin/guru", {
        nama,
        email,
        nip,
        mapel_id: Number(mapelId),
        no_hp: noHp || undefined,
      });
      setCreated({ nama: res.data.nama, email: res.data.email, password: res.password_awal });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal menambah guru.");
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
        <h2 className="mt-2 font-semibold text-slate-800 dark:text-white">Akun guru {created.nama} berhasil dibuat</h2>
        <p className="mt-1 text-sm text-slate-500">
          Kredensial ini juga sudah dikirim ke email guru. Kalau perlu, catat/salin dulu sekarang — password tidak
          ditampilkan lagi setelah halaman ini ditutup.
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
        <input
          required
          placeholder="NIP"
          value={nip}
          onChange={(e) => setNip(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
        />
        <select
          required
          value={mapelId}
          onChange={(e) => setMapelId(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
        >
          <option value="">Pilih mata pelajaran diampu...</option>
          {mapelList.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nama_mapel} (Paket {m.paket})
            </option>
          ))}
        </select>
        <input
          placeholder="No. HP (opsional)"
          value={noHp}
          onChange={(e) => setNoHp(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 sm:col-span-2"
        />
        {error && <p className="text-sm text-rose-600 sm:col-span-2">{error}</p>}
        <p className="text-xs text-slate-400 sm:col-span-2">
          Password awal dibuat otomatis oleh sistem, dikirim ke email guru, dan ditampilkan sekali setelah akun
          berhasil dibuat. Satu mapel hanya boleh diampu satu guru aktif.
        </p>
        <button
          disabled={saving}
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60 sm:col-span-2"
        >
          {saving ? "Menyimpan..." : "Simpan Guru"}
        </button>
      </form>
    </Card>
  );
}
