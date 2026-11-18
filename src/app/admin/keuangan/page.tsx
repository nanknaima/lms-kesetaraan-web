"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import type { MataUang, Paginated, TransaksiKeuangan } from "@/lib/types";
import { hariIniStr } from "@/lib/date";

interface Ringkasan {
  mata_uang: MataUang;
  pemasukan: string;
  pengeluaran: string;
  saldo: string;
}

const formatUang = (jumlah: string | number, mataUang: MataUang) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: mataUang, maximumFractionDigits: 2 }).format(Number(jumlah));

export default function AdminKeuanganPage() {
  const [transaksi, setTransaksi] = useState<TransaksiKeuangan[]>([]);
  const [ringkasan, setRingkasan] = useState<Ringkasan[]>([]);
  const [loading, setLoading] = useState(true);
  const [dari, setDari] = useState("");
  const [sampai, setSampai] = useState("");
  const [mataUang, setMataUang] = useState<MataUang | "">("");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [notice, setNotice] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (dari) params.set("dari", dari);
    if (sampai) params.set("sampai", sampai);
    if (mataUang) params.set("mata_uang", mataUang);
    params.set("page", String(page));
    try {
      const response = await api.get<{ data: Paginated<TransaksiKeuangan>; ringkasan: Ringkasan[] }>(`/admin/keuangan?${params}`);
      setTransaksi(response.data.data ?? []);
      setRingkasan(response.ringkasan ?? []);
      setLastPage(response.data.last_page ?? 1);
      setTotal(response.data.total ?? 0);
    } catch (error) {
      setNotice({ type: "error", text: error instanceof ApiError ? error.message : "Gagal memuat data keuangan." });
    } finally {
      setLoading(false);
    }
  }, [dari, sampai, mataUang, page]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  const periodeLabel = dari || sampai ? `${dari || "Awal"} – ${sampai || "Sekarang"}` : "Semua periode";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Keuangan</h1>
          <p className="text-sm text-slate-500">Rekap transaksi pembayaran murid, honor, serta pemasukan dan pengeluaran lainnya.</p>
        </div>
        <button onClick={() => setShowForm((value) => !value)} className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700">
          {showForm ? "Tutup Form" : "+ Catat Transaksi"}
        </button>
      </div>

      {notice && <p className={`rounded-lg px-3 py-2 text-sm ${notice.type === "ok" ? "bg-teal-50 text-teal-700" : "bg-rose-50 text-rose-600"}`}>{notice.text}</p>}
      {showForm && <TransaksiForm onCreated={() => { setShowForm(false); load(); }} />}

      <div className="flex flex-wrap gap-2">
        <label className="space-y-1 text-xs text-slate-500">Dari<input type="date" value={dari} onChange={(event) => { setDari(event.target.value); setPage(1); }} className="block rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white" /></label>
        <label className="space-y-1 text-xs text-slate-500">Sampai<input type="date" value={sampai} onChange={(event) => { setSampai(event.target.value); setPage(1); }} className="block rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white" /></label>
        <label className="space-y-1 text-xs text-slate-500">Mata uang<select value={mataUang} onChange={(event) => { setMataUang(event.target.value as MataUang | ""); setPage(1); }} className="block rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"><option value="">Semua</option><option value="IDR">IDR</option><option value="NTD">NTD</option></select></label>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {(["IDR", "NTD"] as const).filter((currency) => !mataUang || currency === mataUang).map((currency) => {
          const item = ringkasan.find((summary) => summary.mata_uang === currency);
          return <Card key={currency}>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{currency === "IDR" ? "Rupiah" : "Dolar Taiwan"} · {periodeLabel}</p>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
              <div><p className="text-xs text-slate-500">Pemasukan</p><p className="mt-1 text-sm font-bold text-teal-700 dark:text-teal-300">{formatUang(item?.pemasukan ?? 0, currency)}</p></div>
              <div><p className="text-xs text-slate-500">Pengeluaran</p><p className="mt-1 text-sm font-bold text-rose-600">{formatUang(item?.pengeluaran ?? 0, currency)}</p></div>
              <div><p className="text-xs text-slate-500">Saldo</p><p className="mt-1 text-sm font-bold text-slate-800 dark:text-white">{formatUang(item?.saldo ?? 0, currency)}</p></div>
            </div>
          </Card>;
        })}
      </div>

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[680px] text-sm">
          <thead><tr className="border-b border-slate-200 text-left text-slate-500 dark:border-slate-800">
            <th className="p-4">Tanggal</th><th className="p-4">Jenis</th><th className="p-4">Keterangan</th><th className="p-4">Sumber</th><th className="p-4">Jumlah</th>
          </tr></thead>
          <tbody>
            {transaksi.map((item) => <tr key={item.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
              <td className="p-4">{item.tanggal}</td>
              <td className="p-4"><span className={`rounded-full px-2 py-1 text-xs ${item.jenis === "pemasukan" ? "bg-teal-100 text-teal-700" : "bg-rose-100 text-rose-700"}`}>{item.jenis === "pemasukan" ? "Pemasukan" : "Pengeluaran"}</span></td>
              <td className="p-4">{item.keterangan}</td>
              <td className="p-4 capitalize">{item.sumber}</td>
              <td className={`p-4 font-semibold ${item.jenis === "pemasukan" ? "text-teal-700" : "text-rose-600"}`}>{formatUang(item.jumlah, item.mata_uang)}</td>
            </tr>)}
            {!loading && transaksi.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-slate-400">Belum ada transaksi pada periode ini.</td></tr>}
            {loading && <tr><td colSpan={5} className="p-6 text-center text-slate-400">Memuat...</td></tr>}
          </tbody>
        </table>
      </Card>
      <Pagination page={page} lastPage={lastPage} total={total} onChange={setPage} />
    </div>
  );
}

function TransaksiForm({ onCreated }: { onCreated: () => void }) {
  const [jenis, setJenis] = useState<"pemasukan" | "pengeluaran">("pengeluaran");
  const [keterangan, setKeterangan] = useState("");
  const [jumlah, setJumlah] = useState("");
  const [mataUang, setMataUang] = useState<MataUang>("IDR");
  const [tanggal, setTanggal] = useState(hariIniStr());
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.post("/admin/keuangan", { jenis, keterangan, jumlah: Number(jumlah), mata_uang: mataUang, tanggal });
      onCreated();
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Gagal mencatat transaksi.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <h2 className="mb-3 font-semibold text-slate-800 dark:text-white">Transaksi manual</h2>
      <p className="mb-3 text-xs text-slate-500">Pembayaran murid dan honor yang dibayar sudah tercatat otomatis sebagai transaksi.</p>
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-xs text-slate-500">Jenis<select value={jenis} onChange={(event) => setJenis(event.target.value as typeof jenis)} className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"><option value="pemasukan">Pemasukan</option><option value="pengeluaran">Pengeluaran</option></select></label>
        <label className="space-y-1 text-xs text-slate-500">Tanggal<input required type="date" value={tanggal} onChange={(event) => setTanggal(event.target.value)} className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white" /></label>
        <label className="space-y-1 text-xs text-slate-500">Keterangan<input required maxLength={255} value={keterangan} onChange={(event) => setKeterangan(event.target.value)} className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white" /></label>
        <label className="space-y-1 text-xs text-slate-500">Jumlah<input required min="0.01" step="0.01" type="number" value={jumlah} onChange={(event) => setJumlah(event.target.value)} className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white" /></label>
        <label className="space-y-1 text-xs text-slate-500">Mata uang<select value={mataUang} onChange={(event) => setMataUang(event.target.value as MataUang)} className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"><option value="IDR">Rupiah (IDR)</option><option value="NTD">Dolar Taiwan (NTD)</option></select></label>
        {error && <p className="text-sm text-rose-600 sm:col-span-2">{error}</p>}
        <button disabled={saving} className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60 sm:col-span-2">{saving ? "Menyimpan..." : "Simpan Transaksi"}</button>
      </form>
    </Card>
  );
}

function Pagination({ page, lastPage, total, onChange }: { page: number; lastPage: number; total: number; onChange: (page: number) => void }) {
  return <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
    <span>{total} transaksi · Halaman {page} dari {lastPage}</span>
    <div className="flex gap-2">
      <button disabled={page <= 1} onClick={() => onChange(page - 1)} className="rounded border border-slate-300 px-3 py-1.5 disabled:opacity-40 dark:border-slate-700">Sebelumnya</button>
      <button disabled={page >= lastPage} onClick={() => onChange(page + 1)} className="rounded border border-slate-300 px-3 py-1.5 disabled:opacity-40 dark:border-slate-700">Berikutnya</button>
    </div>
  </div>;
}
