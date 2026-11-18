"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import type { GuruAkun, HonorGuruAdmin, Paginated } from "@/lib/types";
import { bulanIniStr, hariIniStr } from "@/lib/date";

type Currency = "IDR" | "NTD";

const formatUang = (jumlah: string | number, mataUang: Currency) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: mataUang, maximumFractionDigits: 2 }).format(Number(jumlah));

export default function AdminRekapHonorPage() {
  const [honor, setHonor] = useState<HonorGuruAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [periode, setPeriode] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [notice, setNotice] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (periode) params.set("periode", periode);
    if (search.trim()) params.set("search", search.trim());
    params.set("page", String(page));
    try {
      const response = await api.get<{ data: Paginated<HonorGuruAdmin> }>(`/admin/rekap-honor?${params}`);
      setHonor(response.data.data ?? []);
      setLastPage(response.data.last_page ?? 1);
      setTotal(response.data.total ?? 0);
    } catch (error) {
      setNotice({ type: "error", text: error instanceof ApiError ? error.message : "Gagal memuat rekap honor." });
    } finally {
      setLoading(false);
    }
  }, [periode, search, page]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Rekap Honor Guru</h1>
          <p className="text-sm text-slate-500">Masukkan nominal honor per guru dan periode. Pembayaran tercatat sebagai pengeluaran keuangan.</p>
        </div>
        <button onClick={() => setShowForm((value) => !value)} className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700">
          {showForm ? "Tutup Form" : "+ Tambah Rekap Honor"}
        </button>
      </div>

      {notice && <p className={`rounded-lg px-3 py-2 text-sm ${notice.type === "ok" ? "bg-teal-50 text-teal-700" : "bg-rose-50 text-rose-600"}`}>{notice.text}</p>}
      {showForm && <BuatHonorForm onCreated={() => { setShowForm(false); load(); }} />}

      <div className="flex flex-wrap gap-2">
        <input type="month" value={periode} onChange={(event) => { setPeriode(event.target.value); setPage(1); }} className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800" />
        <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Cari nama/NIP guru" className="min-w-52 rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800" />
      </div>

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[720px] text-sm">
          <thead><tr className="border-b border-slate-200 text-left text-slate-500 dark:border-slate-800">
            <th className="p-4">Guru</th><th className="p-4">Periode</th><th className="p-4">Keterangan</th><th className="p-4">Honor</th><th className="p-4">Status</th><th className="p-4">Aksi</th>
          </tr></thead>
          <tbody>
            {honor.map((item) => <HonorRow key={item.id} honor={item} onUpdated={load} onError={(text) => setNotice({ type: "error", text })} />)}
            {!loading && honor.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-slate-400">Belum ada rekap honor untuk filter ini.</td></tr>}
            {loading && <tr><td colSpan={6} className="p-6 text-center text-slate-400">Memuat...</td></tr>}
          </tbody>
        </table>
      </Card>
      <Pagination page={page} lastPage={lastPage} total={total} onChange={setPage} />
    </div>
  );
}

function BuatHonorForm({ onCreated }: { onCreated: () => void }) {
  const [guru, setGuru] = useState<GuruAkun[]>([]);
  const [cariGuru, setCariGuru] = useState("");
  const [guruId, setGuruId] = useState("");
  const [periode, setPeriode] = useState(bulanIniStr());
  const [jumlah, setJumlah] = useState("");
  const [mataUang, setMataUang] = useState<Currency>("IDR");
  const [keterangan, setKeterangan] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams({ per_page: "100" });
    if (cariGuru.trim()) params.set("search", cariGuru.trim());
    api.get<{ data: Paginated<GuruAkun> }>(`/admin/guru?${params}`)
      .then((response) => setGuru(response.data.data ?? []))
      .catch((cause) => setError(cause instanceof ApiError ? cause.message : "Gagal memuat daftar guru."));
  }, [cariGuru]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.post("/admin/rekap-honor", {
        guru_id: Number(guruId),
        periode,
        jumlah: Number(jumlah),
        mata_uang: mataUang,
        keterangan: keterangan || null,
      });
      onCreated();
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Gagal membuat rekap honor.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <h2 className="mb-3 font-semibold text-slate-800 dark:text-white">Rekap honor baru</h2>
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
        <input value={cariGuru} onChange={(event) => setCariGuru(event.target.value)} placeholder="Cari guru berdasarkan nama" className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800" />
        <select required value={guruId} onChange={(event) => setGuruId(event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800">
          <option value="">Pilih guru</option>
          {guru.map((item) => <option key={item.id} value={item.id}>{item.nama}{item.nip ? ` · ${item.nip}` : ""}</option>)}
        </select>
        <label className="space-y-1 text-xs text-slate-500">Periode<input required type="month" value={periode} onChange={(event) => setPeriode(event.target.value)} className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white" /></label>
        <label className="space-y-1 text-xs text-slate-500">Nominal honor<input required min="0.01" step="0.01" type="number" value={jumlah} onChange={(event) => setJumlah(event.target.value)} className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white" /></label>
        <label className="space-y-1 text-xs text-slate-500">Mata uang<select value={mataUang} onChange={(event) => setMataUang(event.target.value as Currency)} className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"><option value="IDR">Rupiah (IDR)</option><option value="NTD">Dolar Taiwan (NTD)</option></select></label>
        <input value={keterangan} onChange={(event) => setKeterangan(event.target.value)} placeholder="Keterangan (opsional)" className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800" />
        {error && <p className="text-sm text-rose-600 sm:col-span-2">{error}</p>}
        <button disabled={saving} className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60 sm:col-span-2">{saving ? "Menyimpan..." : "Simpan Rekap"}</button>
      </form>
    </Card>
  );
}

function HonorRow({ honor, onUpdated, onError }: { honor: HonorGuruAdmin; onUpdated: () => void; onError: (message: string) => void }) {
  const [edit, setEdit] = useState(false);
  const [jumlah, setJumlah] = useState(honor.jumlah);
  const [mataUang, setMataUang] = useState<Currency>(honor.mata_uang);
  const [tanggalBayar, setTanggalBayar] = useState(hariIniStr());
  const [metode, setMetode] = useState<"tunai" | "transfer" | "lainnya">("transfer");
  const [saving, setSaving] = useState(false);

  async function update(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await api.put(`/admin/rekap-honor/${honor.id}`, { jumlah: Number(jumlah), mata_uang: mataUang, keterangan: honor.keterangan });
      setEdit(false);
      onUpdated();
    } catch (cause) {
      onError(cause instanceof ApiError ? cause.message : "Gagal memperbarui rekap honor.");
    } finally {
      setSaving(false);
    }
  }

  async function bayar() {
    setSaving(true);
    try {
      await api.post(`/admin/rekap-honor/${honor.id}/bayar`, { tanggal_bayar: tanggalBayar, metode_bayar: metode });
      onUpdated();
    } catch (cause) {
      onError(cause instanceof ApiError ? cause.message : "Gagal mencatat pembayaran honor.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <tr className="border-b border-slate-100 align-top last:border-0 dark:border-slate-800">
      <td className="p-4"><p className="font-medium text-slate-800 dark:text-white">{honor.guru?.nama ?? "Guru"}</p><p className="text-xs text-slate-400">{honor.guru?.nip}</p></td>
      <td className="p-4">{honor.periode}</td>
      <td className="p-4">{honor.keterangan || "-"}</td>
      <td className="p-4">{formatUang(honor.jumlah, honor.mata_uang)}</td>
      <td className="p-4"><span className={`rounded-full px-2 py-1 text-xs ${honor.status === "dibayar" ? "bg-teal-100 text-teal-700" : "bg-amber-100 text-amber-700"}`}>{honor.status === "dibayar" ? "Dibayar" : "Belum dibayar"}</span></td>
      <td className="p-4">
        {honor.status === "belum_dibayar" && <div className="space-y-2">
          {!edit && <div className="flex flex-wrap gap-2">
            <button onClick={() => setEdit(true)} className="text-xs font-semibold text-slate-600 hover:underline">Ubah</button>
            <button disabled={saving} onClick={bayar} className="text-xs font-semibold text-teal-700 hover:underline disabled:opacity-50">Tandai Dibayar</button>
          </div>}
          {edit && <form onSubmit={update} className="grid min-w-48 gap-2">
            <input required min="0.01" step="0.01" type="number" value={jumlah} onChange={(event) => setJumlah(event.target.value)} className="rounded border border-slate-300 px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800" />
            <select value={mataUang} onChange={(event) => setMataUang(event.target.value as Currency)} className="rounded border border-slate-300 px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800"><option value="IDR">IDR</option><option value="NTD">NTD</option></select>
            <button disabled={saving} className="text-left text-xs font-semibold text-teal-700 disabled:opacity-50">{saving ? "Menyimpan..." : "Simpan"}</button>
          </form>}
          <div className="mt-2 grid min-w-48 gap-2">
            <input aria-label="Tanggal pembayaran honor" type="date" value={tanggalBayar} onChange={(event) => setTanggalBayar(event.target.value)} className="rounded border border-slate-300 px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800" />
            <select aria-label="Metode pembayaran honor" value={metode} onChange={(event) => setMetode(event.target.value as typeof metode)} className="rounded border border-slate-300 px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800"><option value="transfer">Transfer</option><option value="tunai">Tunai</option><option value="lainnya">Lainnya</option></select>
          </div>
        </div>}
        {honor.status === "dibayar" && <p className="text-xs text-slate-500">{honor.tanggal_bayar}</p>}
      </td>
    </tr>
  );
}

function Pagination({ page, lastPage, total, onChange }: { page: number; lastPage: number; total: number; onChange: (page: number) => void }) {
  return <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
    <span>{total} rekap · Halaman {page} dari {lastPage}</span>
    <div className="flex gap-2">
      <button disabled={page <= 1} onClick={() => onChange(page - 1)} className="rounded border border-slate-300 px-3 py-1.5 disabled:opacity-40 dark:border-slate-700">Sebelumnya</button>
      <button disabled={page >= lastPage} onClick={() => onChange(page + 1)} className="rounded border border-slate-300 px-3 py-1.5 disabled:opacity-40 dark:border-slate-700">Berikutnya</button>
    </div>
  </div>;
}
