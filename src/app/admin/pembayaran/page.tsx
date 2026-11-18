"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import type { MuridAkun, Paginated, PembayaranMurid, TagihanPembayaran } from "@/lib/types";
import { bulanIniStr, hariIniStr } from "@/lib/date";

type Currency = "IDR" | "NTD";
type BillStatus = "belum_lunas" | "sebagian" | "lunas";

const formatUang = (jumlah: string | number, mataUang: Currency) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: mataUang, maximumFractionDigits: 2 }).format(Number(jumlah));

export default function AdminPembayaranPage() {
  const [tagihan, setTagihan] = useState<TagihanPembayaran[]>([]);
  const [loading, setLoading] = useState(true);
  const [periode, setPeriode] = useState("");
  const [status, setStatus] = useState<BillStatus | "">("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [notice, setNotice] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (periode) params.set("periode", periode);
    if (status) params.set("status", status);
    if (search.trim()) params.set("search", search.trim());
    params.set("page", String(page));
    try {
      const response = await api.get<{ data: Paginated<TagihanPembayaran> }>(`/admin/pembayaran?${params}`);
      setTagihan(response.data.data ?? []);
      setLastPage(response.data.last_page ?? 1);
      setTotal(response.data.total ?? 0);
    } catch (error) {
      setNotice({ type: "error", text: error instanceof ApiError ? error.message : "Gagal memuat tagihan." });
    } finally {
      setLoading(false);
    }
  }, [periode, status, search, page]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Pembayaran Murid</h1>
          <p className="text-sm text-slate-500">Buat tagihan per periode dan catat pembayaran manual dalam IDR atau NTD.</p>
        </div>
        <button onClick={() => setShowForm((value) => !value)} className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700">
          {showForm ? "Tutup Form" : "+ Buat Tagihan"}
        </button>
      </div>

      {notice && <p className={`rounded-lg px-3 py-2 text-sm ${notice.type === "ok" ? "bg-teal-50 text-teal-700" : "bg-rose-50 text-rose-600"}`}>{notice.text}</p>}

      {showForm && <BuatTagihanForm onCreated={() => { setShowForm(false); load(); }} />}

      <div className="flex flex-wrap gap-2">
        <input type="month" value={periode} onChange={(event) => { setPeriode(event.target.value); setPage(1); }} className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800" />
        <select value={status} onChange={(event) => { setStatus(event.target.value as BillStatus | ""); setPage(1); }} className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800">
          <option value="">Semua status</option>
          <option value="belum_lunas">Belum lunas</option>
          <option value="sebagian">Sebagian</option>
          <option value="lunas">Lunas</option>
        </select>
        <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Cari nama/NIS murid" className="min-w-52 rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800" />
      </div>

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[760px] text-sm">
          <thead><tr className="border-b border-slate-200 text-left text-slate-500 dark:border-slate-800">
            <th className="p-4">Murid</th><th className="p-4">Periode</th><th className="p-4">Tagihan</th><th className="p-4">Dibayar</th><th className="p-4">Sisa</th><th className="p-4">Status</th><th className="p-4">Aksi</th>
          </tr></thead>
          <tbody>
            {tagihan.map((item) => <TagihanRow key={item.id} tagihan={item} onUpdated={load} onError={(text) => setNotice({ type: "error", text })} />)}
            {!loading && tagihan.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-slate-400">Belum ada tagihan untuk filter ini.</td></tr>}
            {loading && <tr><td colSpan={7} className="p-6 text-center text-slate-400">Memuat...</td></tr>}
          </tbody>
        </table>
      </Card>
      <Pagination page={page} lastPage={lastPage} total={total} onChange={setPage} />
    </div>
  );
}

function BuatTagihanForm({ onCreated }: { onCreated: () => void }) {
  const [murid, setMurid] = useState<MuridAkun[]>([]);
  const [cariMurid, setCariMurid] = useState("");
  const [muridId, setMuridId] = useState("");
  const [periode, setPeriode] = useState(bulanIniStr());
  const [jumlah, setJumlah] = useState("");
  const [mataUang, setMataUang] = useState<Currency>("IDR");
  const [keterangan, setKeterangan] = useState("");
  const [jatuhTempo, setJatuhTempo] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams({ per_page: "100" });
    if (cariMurid.trim()) params.set("search", cariMurid.trim());
    api.get<{ data: Paginated<MuridAkun> }>(`/admin/murid?${params}`)
      .then((response) => setMurid(response.data.data ?? []))
      .catch((cause) => setError(cause instanceof ApiError ? cause.message : "Gagal memuat daftar murid."));
  }, [cariMurid]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.post("/admin/pembayaran", {
        murid_id: Number(muridId),
        periode,
        jumlah: Number(jumlah),
        mata_uang: mataUang,
        keterangan: keterangan || null,
        jatuh_tempo: jatuhTempo || null,
      });
      onCreated();
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Gagal membuat tagihan.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <h2 className="mb-3 font-semibold text-slate-800 dark:text-white">Tagihan baru</h2>
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
        <input value={cariMurid} onChange={(event) => setCariMurid(event.target.value)} placeholder="Cari murid berdasarkan nama" className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800" />
        <select required value={muridId} onChange={(event) => setMuridId(event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800">
          <option value="">Pilih murid</option>
          {murid.map((item) => <option key={item.id} value={item.id}>{item.nama}{item.nis ? ` · ${item.nis}` : ""}</option>)}
        </select>
        <label className="space-y-1 text-xs text-slate-500">Periode<input required type="month" value={periode} onChange={(event) => setPeriode(event.target.value)} className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white" /></label>
        <label className="space-y-1 text-xs text-slate-500">Jumlah<input required min="0.01" step="0.01" type="number" value={jumlah} onChange={(event) => setJumlah(event.target.value)} className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white" /></label>
        <label className="space-y-1 text-xs text-slate-500">Mata uang<select value={mataUang} onChange={(event) => setMataUang(event.target.value as Currency)} className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"><option value="IDR">Rupiah (IDR)</option><option value="NTD">Dolar Taiwan (NTD)</option></select></label>
        <label className="space-y-1 text-xs text-slate-500">Jatuh tempo (opsional)<input type="date" value={jatuhTempo} onChange={(event) => setJatuhTempo(event.target.value)} className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white" /></label>
        <input value={keterangan} onChange={(event) => setKeterangan(event.target.value)} placeholder="Keterangan (opsional)" className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 sm:col-span-2" />
        {error && <p className="text-sm text-rose-600 sm:col-span-2">{error}</p>}
        <button disabled={saving} className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60 sm:col-span-2">{saving ? "Menyimpan..." : "Simpan Tagihan"}</button>
      </form>
    </Card>
  );
}

function TagihanRow({ tagihan, onUpdated, onError }: { tagihan: TagihanPembayaran; onUpdated: () => void; onError: (message: string) => void }) {
  const [showPayment, setShowPayment] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [payments, setPayments] = useState<PembayaranMurid[]>([]);
  const [jumlah, setJumlah] = useState(tagihan.sisa);
  const [tanggal, setTanggal] = useState(hariIniStr());
  const [metode, setMetode] = useState<"tunai" | "transfer" | "lainnya">("transfer");
  const [saving, setSaving] = useState(false);
  const statusLabel = { belum_lunas: "Belum lunas", sebagian: "Sebagian", lunas: "Lunas" }[tagihan.status_pembayaran];

  async function catatPembayaran(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await api.post(`/admin/pembayaran/${tagihan.id}/catat`, { jumlah: Number(jumlah), tanggal, metode });
      setShowPayment(false);
      onUpdated();
    } catch (cause) {
      onError(cause instanceof ApiError ? cause.message : "Gagal mencatat pembayaran.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleHistory() {
    if (showHistory) {
      setShowHistory(false);
      return;
    }
    try {
      const response = await api.get<{ data: TagihanPembayaran }>(`/admin/pembayaran/${tagihan.id}`);
      setPayments(response.data.pembayaran ?? []);
      setShowHistory(true);
    } catch (cause) {
      onError(cause instanceof ApiError ? cause.message : "Gagal memuat riwayat pembayaran.");
    }
  }

  return (
    <>
    <tr className="border-b border-slate-100 align-top last:border-0 dark:border-slate-800">
      <td className="p-4"><p className="font-medium text-slate-800 dark:text-white">{tagihan.murid?.nama ?? "Murid"}</p><p className="text-xs text-slate-400">{tagihan.murid?.nis}</p></td>
      <td className="p-4">{tagihan.periode}</td>
      <td className="p-4">{formatUang(tagihan.jumlah, tagihan.mata_uang)}</td>
      <td className="p-4">{formatUang(tagihan.total_dibayar, tagihan.mata_uang)}</td>
      <td className="p-4">{formatUang(tagihan.sisa, tagihan.mata_uang)}</td>
      <td className="p-4"><span className={`rounded-full px-2 py-1 text-xs ${tagihan.status_pembayaran === "lunas" ? "bg-teal-100 text-teal-700" : "bg-amber-100 text-amber-700"}`}>{statusLabel}</span></td>
      <td className="p-4">
        <button onClick={toggleHistory} className="mr-2 text-xs font-semibold text-slate-600 hover:underline">{showHistory ? "Tutup Riwayat" : "Riwayat"}</button>
        {tagihan.status_pembayaran !== "lunas" && <button onClick={() => setShowPayment((value) => !value)} className="text-xs font-semibold text-teal-700 hover:underline">{showPayment ? "Batal" : "Catat Bayar"}</button>}
        {showPayment && <form onSubmit={catatPembayaran} className="mt-2 grid min-w-52 gap-2">
          <input required min="0.01" step="0.01" max={tagihan.sisa} type="number" value={jumlah} onChange={(event) => setJumlah(event.target.value)} className="rounded border border-slate-300 px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800" />
          <input required type="date" value={tanggal} onChange={(event) => setTanggal(event.target.value)} className="rounded border border-slate-300 px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800" />
          <select value={metode} onChange={(event) => setMetode(event.target.value as typeof metode)} className="rounded border border-slate-300 px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800"><option value="transfer">Transfer</option><option value="tunai">Tunai</option><option value="lainnya">Lainnya</option></select>
          <button disabled={saving} className="rounded bg-teal-600 px-2 py-1 text-xs font-semibold text-white disabled:opacity-60">{saving ? "Menyimpan..." : "Simpan Pembayaran"}</button>
        </form>}
      </td>
    </tr>
    {showHistory && <tr className="border-b border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
      <td colSpan={7} className="px-4 pb-4">
        <p className="mb-2 text-xs font-semibold text-slate-600 dark:text-slate-300">Riwayat cicilan</p>
        {payments.length === 0 ? <p className="text-xs text-slate-400">Belum ada pembayaran.</p> : <ul className="space-y-1">
          {payments.map((payment) => <li key={payment.id} className="text-xs text-slate-500">{payment.tanggal} · {formatUang(payment.jumlah, tagihan.mata_uang)} · {payment.metode}{payment.catatan ? ` · ${payment.catatan}` : ""}</li>)}
        </ul>}
      </td>
    </tr>}
    </>
  );
}

function Pagination({ page, lastPage, total, onChange }: { page: number; lastPage: number; total: number; onChange: (page: number) => void }) {
  return <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
    <span>{total} tagihan · Halaman {page} dari {lastPage}</span>
    <div className="flex gap-2">
      <button disabled={page <= 1} onClick={() => onChange(page - 1)} className="rounded border border-slate-300 px-3 py-1.5 disabled:opacity-40 dark:border-slate-700">Sebelumnya</button>
      <button disabled={page >= lastPage} onClick={() => onChange(page + 1)} className="rounded border border-slate-300 px-3 py-1.5 disabled:opacity-40 dark:border-slate-700">Berikutnya</button>
    </div>
  </div>;
}
