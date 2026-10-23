"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Download } from "lucide-react";
import { api, ApiError, getAccessToken, API_BASE_URL } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { formatTanggal } from "@/lib/date";
import type { Paginated, Pendaftaran } from "@/lib/types";

const STATUS_OPTIONS = ["pending", "approved", "rejected"] as const;

const STATUS_LABEL: Record<Pendaftaran["status"], string> = {
  pending: "Menunggu",
  approved: "Disetujui",
  rejected: "Ditolak",
};

const STATUS_STYLE: Record<Pendaftaran["status"], string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  approved: "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
  rejected: "bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-300",
};

export default function AdminPendaftaranPage() {
  const [status, setStatus] = useState<(typeof STATUS_OPTIONS)[number]>("pending");
  const [daftar, setDaftar] = useState<Pendaftaran[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [processing, setProcessing] = useState<number | null>(null);

  function load() {
    api
      .get<{ data: Paginated<Pendaftaran> }>(`/admin/pendaftaran?status=${status}`)
      .then((r) => {
        setDaftar(r.data.data ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  useEffect(load, [status]);

  async function approve(p: Pendaftaran) {
    if (!confirm(`Setujui pendaftaran ${p.nama}? Selanjutnya buat akun murid resmi lewat menu Tambah Murid.`)) return;
    setProcessing(p.id);
    setNotice(null);
    try {
      await api.post(`/admin/pendaftaran/${p.id}/approve`);
      setNotice({ type: "ok", text: `Pendaftaran ${p.nama} disetujui. Lanjutkan ke "Buat Akun Murid" untuk membuat akunnya.` });
      load();
    } catch (err) {
      setNotice({ type: "error", text: err instanceof ApiError ? err.message : "Gagal menyetujui pendaftaran." });
    } finally {
      setProcessing(null);
    }
  }

  const [exporting, setExporting] = useState<"pdf" | "xlsx" | null>(null);

  async function unduhRekap(format: "pdf" | "xlsx") {
    setExporting(format);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/pendaftaran/export?status=${status}&format=${format}`, {
        headers: { Authorization: `Bearer ${getAccessToken()}` },
      });
      if (!res.ok) throw new Error("Gagal mengunduh rekap.");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rekap-pendaftaran.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setNotice({ type: "error", text: "Gagal mengunduh rekap pendaftaran." });
    } finally {
      setExporting(null);
    }
  }

  async function reject(p: Pendaftaran, alasan: string) {
    setProcessing(p.id);
    setNotice(null);
    try {
      await api.post(`/admin/pendaftaran/${p.id}/reject`, { alasan });
      setNotice({ type: "ok", text: `Pendaftaran ${p.nama} ditolak.` });
      load();
    } catch (err) {
      setNotice({ type: "error", text: err instanceof ApiError ? err.message : "Gagal menolak pendaftaran." });
    } finally {
      setProcessing(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Pendaftaran Murid Baru</h1>
          <p className="text-sm text-slate-500">
            Tinjau pendaftar lewat website. Setujui, lalu buat akun resminya lewat menu Tambah Murid (NIS & password input manual).
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={() => unduhRekap("xlsx")}
            disabled={exporting !== null}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300"
          >
            <Download className="h-3.5 w-3.5" strokeWidth={2} />
            {exporting === "xlsx" ? "Mengunduh..." : "Excel"}
          </button>
          <button
            onClick={() => unduhRekap("pdf")}
            disabled={exporting !== null}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300"
          >
            <Download className="h-3.5 w-3.5" strokeWidth={2} />
            {exporting === "pdf" ? "Mengunduh..." : "PDF"}
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              status === s ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            {STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      {notice && (
        <p className={`rounded-lg px-3 py-2 text-sm ${notice.type === "ok" ? "bg-teal-50 text-teal-700" : "bg-rose-50 text-rose-600"}`}>
          {notice.text}
        </p>
      )}

      <div className="space-y-3">
        {loading && <p className="text-sm text-slate-400">Memuat...</p>}
        {!loading && daftar.length === 0 && (
          <Card className="text-center text-sm text-slate-500">Tidak ada pendaftaran dengan status &quot;{STATUS_LABEL[status]}&quot;.</Card>
        )}
        {daftar.map((p) => (
          <PendaftaranRow
            key={p.id}
            pendaftaran={p}
            processing={processing === p.id}
            onApprove={() => approve(p)}
            onReject={(alasan) => reject(p, alasan)}
          />
        ))}
      </div>
    </div>
  );
}

function PendaftaranRow({
  pendaftaran: p,
  processing,
  onApprove,
  onReject,
}: {
  pendaftaran: Pendaftaran;
  processing: boolean;
  onApprove: () => void;
  onReject: (alasan: string) => void;
}) {
  const [showReject, setShowReject] = useState(false);
  const [alasan, setAlasan] = useState("");

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-800 dark:text-white">
            {p.nama} <span className="text-xs font-normal text-slate-400">Paket {p.paket}</span>
          </p>
          <p className="text-xs text-slate-500">{p.email} · {p.no_hp}</p>
          <p className="text-xs text-slate-500">Lahir: {formatTanggal(p.tgl_lahir)}</p>
          {p.alamat && <p className="mt-1 text-xs text-slate-500">{p.alamat}</p>}
          {p.dokumen_url && (
            <a href={p.dokumen_url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-xs font-semibold text-teal-600 hover:underline">
              Lihat dokumen
            </a>
          )}
          {p.status === "rejected" && p.alasan_reject && (
            <p className="mt-1 text-xs text-rose-500">Alasan ditolak: {p.alasan_reject}</p>
          )}
          {p.status === "approved" && (
            <div className="mt-2">
              {p.user_id ? (
                <span className="text-xs font-semibold text-teal-600">Akun murid sudah dibuat.</span>
              ) : (
                <Link
                  href={`/admin/murid?dari_pendaftaran=${p.id}`}
                  className="inline-block rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700"
                >
                  Buat Akun Murid
                </Link>
              )}
            </div>
          )}
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${STATUS_STYLE[p.status]}`}>
          {STATUS_LABEL[p.status]}
        </span>
      </div>

      {p.status === "pending" && (
        <div className="mt-3 space-y-2">
          {showReject ? (
            <div className="space-y-2">
              <textarea
                required
                placeholder="Alasan penolakan (wajib diisi)"
                value={alasan}
                onChange={(e) => setAlasan(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
              <div className="flex gap-2">
                <button
                  disabled={processing || !alasan.trim()}
                  onClick={() => onReject(alasan)}
                  className="rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                >
                  {processing ? "Memproses..." : "Kirim Penolakan"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowReject(false)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                disabled={processing}
                onClick={onApprove}
                className="rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
              >
                {processing ? "Memproses..." : "Setujui"}
              </button>
              <button
                disabled={processing}
                onClick={() => setShowReject(true)}
                className="rounded-lg border border-rose-300 px-3 py-1.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50 dark:border-rose-800 dark:hover:bg-rose-950"
              >
                Tolak
              </button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
