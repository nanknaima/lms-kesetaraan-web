"use client";

import { useEffect, useState } from "react";
import { Pin } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { ImageCropModal } from "@/components/ImageCropModal";
import { formatTanggal } from "@/lib/date";
import type { Kelas, Paginated, Pengumuman } from "@/lib/types";

/** Rasio crop gambar pengumuman — mendekati rasio tampil area slideshow dashboard (Bagian F2). */
const RASIO_GAMBAR_PENGUMUMAN = 16 / 9;

const STATUS_STYLE: Record<NonNullable<Pengumuman["status_publish"]>, string> = {
  draft: "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
  published: "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
  expired: "bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-300",
};

const STATUS_LABEL: Record<NonNullable<Pengumuman["status_publish"]>, string> = {
  draft: "Draft",
  published: "Terbit",
  expired: "Kedaluwarsa",
};

const FIELD_LABEL: Record<string, string> = {
  judul: "Judul",
  konten: "Konten",
  gambar: "Gambar",
  target: "Target",
  target_id: "Target (paket/kelas)",
  tanggal_mulai: "Tanggal Mulai",
  tanggal_berakhir: "Tanggal Berakhir",
  pinned: "Pin",
  status_publish: "Status",
};

/** Susun pesan error jadi rinci per-field (bukan cuma "Data tidak valid." generik),
 * supaya admin tahu persis input mana yang salah dan kenapa. */
function formatApiError(err: unknown, fallback: string): string {
  if (!(err instanceof ApiError)) return fallback;
  if (err.errors && Object.keys(err.errors).length > 0) {
    return Object.entries(err.errors)
      .map(([field, messages]) => `${FIELD_LABEL[field] ?? field}: ${messages.join(" ")}`)
      .join(" | ");
  }
  return err.message;
}

function targetLabel(p: Pengumuman, kelasList: Kelas[]) {
  if (p.target === "semua") return "Semua Murid";
  if (p.target === "paket") return `Paket ${p.target_id ?? "-"}`;
  if (p.target === "kelas") {
    const k = kelasList.find((kl) => kl.id === Number(p.target_id));
    return k ? `Kelas ${k.nama_kelas}` : `Kelas #${p.target_id}`;
  }
  return "-";
}

export default function AdminPengumumanPage() {
  const [list, setList] = useState<Pengumuman[]>([]);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Pengumuman | null>(null);

  function load() {
    Promise.all([
      api.get<{ data: Paginated<Pengumuman> }>("/admin/pengumuman?per_page=50"),
      api.get<{ data: Paginated<Kelas> }>("/admin/kelas?per_page=100"),
    ])
      .then(([p, k]) => {
        setList(p.data.data ?? []);
        setKelasList(k.data.data ?? []);
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function togglePin(p: Pengumuman) {
    try {
      await api.post(`/admin/pengumuman/${p.id}/pin`);
      load();
    } catch (err) {
      setNotice({ type: "error", text: formatApiError(err, "Gagal mengubah status pin.") });
    }
  }

  async function hapus(p: Pengumuman) {
    if (!confirm(`Hapus pengumuman "${p.judul}"?`)) return;
    try {
      await api.del(`/admin/pengumuman/${p.id}`);
      setNotice({ type: "ok", text: "Pengumuman dihapus." });
      load();
    } catch (err) {
      setNotice({ type: "error", text: formatApiError(err, "Gagal menghapus pengumuman.") });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Pengumuman</h1>
          <p className="text-sm text-slate-500">Kelola pengumuman untuk murid.</p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setShowForm((v) => !v);
          }}
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
        >
          {showForm && !editing ? "Tutup Form" : "+ Tambah Pengumuman"}
        </button>
      </div>

      {notice && (
        <p className={`rounded-lg px-3 py-2 text-sm ${notice.type === "ok" ? "bg-teal-50 text-teal-700" : "bg-rose-50 text-rose-600"}`}>
          {notice.text}
        </p>
      )}

      {(showForm || editing) && (
        <PengumumanForm
          kelasList={kelasList}
          editing={editing}
          onDone={() => {
            setShowForm(false);
            setEditing(null);
            load();
          }}
          onCancel={() => {
            setShowForm(false);
            setEditing(null);
          }}
        />
      )}

      <Card className="p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500 dark:border-slate-800">
              <th className="p-4"></th>
              <th className="p-4">Judul</th>
              <th className="p-4">Target</th>
              <th className="p-4">Periode</th>
              <th className="p-4">Status</th>
              <th className="p-4">Pin</th>
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                <td className="p-4">
                  {p.gambar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.gambar_url} alt={p.judul} className="h-10 w-14 rounded-lg object-cover" />
                  ) : (
                    <div className="h-10 w-14 rounded-lg bg-slate-100 dark:bg-slate-800" />
                  )}
                </td>
                <td className="p-4 font-medium text-slate-800 dark:text-white">{p.judul}</td>
                <td className="p-4 text-slate-500">{targetLabel(p, kelasList)}</td>
                <td className="p-4 text-slate-500">
                  {p.tanggal_mulai ? formatTanggal(p.tanggal_mulai) : "-"} &ndash;{" "}
                  {p.tanggal_berakhir ? formatTanggal(p.tanggal_berakhir) : "-"}
                </td>
                <td className="p-4">
                  {p.status_publish && (
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_STYLE[p.status_publish]}`}>
                      {STATUS_LABEL[p.status_publish]}
                    </span>
                  )}
                </td>
                <td className="p-4">
                  <button
                    onClick={() => togglePin(p)}
                    title={p.pinned ? "Lepas pin" : "Pin pengumuman"}
                    className={p.pinned ? "text-amber-500" : "text-slate-300 dark:text-slate-600"}
                  >
                    <Pin className="h-[18px] w-[18px]" strokeWidth={2} fill={p.pinned ? "currentColor" : "none"} />
                  </button>
                </td>
                <td className="p-4">
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowForm(false);
                        setEditing(p);
                      }}
                      className="text-xs font-medium text-teal-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button onClick={() => hapus(p)} className="text-xs font-medium text-rose-600 hover:underline">
                      Hapus
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && list.length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-slate-400">
                  Belum ada pengumuman.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function PengumumanForm({
  kelasList,
  editing,
  onDone,
  onCancel,
}: {
  kelasList: Kelas[];
  editing: Pengumuman | null;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [judul, setJudul] = useState(editing?.judul ?? "");
  const [konten, setKonten] = useState(editing?.konten ?? "");
  const [gambar, setGambar] = useState<File | null>(null);
  const [gambarPreviewUrl, setGambarPreviewUrl] = useState<string | null>(null);
  const [fileMenungguCrop, setFileMenungguCrop] = useState<File | null>(null);
  const [target, setTarget] = useState<"semua" | "paket" | "kelas">(editing?.target ?? "semua");
  const [targetId, setTargetId] = useState(editing?.target_id != null ? String(editing.target_id) : "");
  const [tanggalMulai, setTanggalMulai] = useState(editing?.tanggal_mulai?.slice(0, 10) ?? "");
  const [tanggalBerakhir, setTanggalBerakhir] = useState(editing?.tanggal_berakhir?.slice(0, 10) ?? "");
  const [pinned, setPinned] = useState(editing?.pinned ?? false);
  const [statusPublish, setStatusPublish] = useState<NonNullable<Pengumuman["status_publish"]>>(
    editing?.status_publish ?? "draft",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Revoke object URL lama setiap kali diganti crop baru, dan saat form ditutup/unmount.
  useEffect(() => {
    return () => {
      if (gambarPreviewUrl) URL.revokeObjectURL(gambarPreviewUrl);
    };
  }, [gambarPreviewUrl]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (editing) {
        await api.put(`/admin/pengumuman/${editing.id}`, {
          judul,
          konten,
          tanggal_mulai: tanggalMulai,
          tanggal_berakhir: tanggalBerakhir,
          status_publish: statusPublish,
        });
      } else {
        const fd = new FormData();
        fd.append("judul", judul);
        fd.append("konten", konten);
        fd.append("target", target);
        if (target !== "semua") fd.append("target_id", targetId);
        fd.append("tanggal_mulai", tanggalMulai);
        fd.append("tanggal_berakhir", tanggalBerakhir);
        fd.append("pinned", pinned ? "1" : "0");
        if (gambar) fd.append("gambar", gambar);
        await api.upload("/admin/pengumuman", fd);
      }
      onDone();
    } catch (err) {
      // Ditampilkan hanya di dalam form (dekat tombol Simpan), tidak perlu didobel
      // di banner atas halaman (onError) — dulu keduanya tampil sekaligus dengan
      // teks generik "Data tidak valid." yang sama, sekarang cukup satu tapi rinci.
      setError(formatApiError(err, "Gagal menyimpan pengumuman."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <p className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
        {editing ? `Edit Pengumuman "${editing.judul}"` : "Tambah Pengumuman Baru"}
      </p>
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
        <input
          required
          placeholder="Judul"
          value={judul}
          onChange={(e) => setJudul(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-2 dark:border-slate-700 dark:bg-slate-800"
        />
        <textarea
          required
          placeholder="Konten pengumuman"
          value={konten}
          onChange={(e) => setKonten(e.target.value)}
          rows={4}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-2 dark:border-slate-700 dark:bg-slate-800"
        />

        {!editing && (
          <>
            <select
              value={target}
              onChange={(e) => {
                setTarget(e.target.value as "semua" | "paket" | "kelas");
                setTargetId("");
              }}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
            >
              <option value="semua">Semua Murid</option>
              <option value="paket">Per Paket</option>
              <option value="kelas">Per Kelas</option>
            </select>

            {target === "paket" && (
              <select
                required
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
              >
                <option value="">Pilih paket...</option>
                <option value="A">Paket A</option>
                <option value="B">Paket B</option>
                <option value="C">Paket C</option>
              </select>
            )}

            {target === "kelas" && (
              <select
                required
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
              >
                <option value="">Pilih kelas...</option>
                {kelasList.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.nama_kelas}
                  </option>
                ))}
              </select>
            )}

            <label className="text-xs text-slate-500 sm:col-span-2">
              Gambar (opsional, maks 2MB)
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  setError(null);
                  if (file) setFileMenungguCrop(file);
                  e.target.value = "";
                }}
                className="mt-1 block w-full text-sm text-slate-600 dark:text-slate-300"
              />
              {gambar && gambarPreviewUrl && (
                <div className="mt-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={gambarPreviewUrl} alt="Pratinjau gambar" className="h-24 w-full rounded-lg object-cover" />
                  <p className="mt-1 text-xs text-teal-600">
                    Siap diunggah (sudah dipotong sesuai rasio slideshow): {gambar.name} ({(gambar.size / 1024).toFixed(0)} KB)
                  </p>
                </div>
              )}
            </label>
          </>
        )}

        {fileMenungguCrop && (
          <ImageCropModal
            file={fileMenungguCrop}
            aspect={RASIO_GAMBAR_PENGUMUMAN}
            onCancel={() => setFileMenungguCrop(null)}
            onCropped={(hasil) => {
              setFileMenungguCrop(null);
              if (hasil.size > 2048 * 1024) {
                setError(
                  `Hasil crop gambar "${hasil.name}" masih berukuran ${(hasil.size / (1024 * 1024)).toFixed(1)}MB, melebihi batas maksimal 2MB. Perkecil area crop atau pilih gambar lain.`,
                );
                return;
              }
              setGambarPreviewUrl(URL.createObjectURL(hasil));
              setGambar(hasil);
            }}
          />
        )}

        <label className="text-xs text-slate-500">
          Tanggal Mulai
          <input
            required
            type="date"
            value={tanggalMulai}
            onChange={(e) => setTanggalMulai(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
          />
        </label>
        <label className="text-xs text-slate-500">
          Tanggal Berakhir
          <input
            required
            type="date"
            value={tanggalBerakhir}
            onChange={(e) => setTanggalBerakhir(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
          />
        </label>

        {editing ? (
          <select
            value={statusPublish}
            onChange={(e) => setStatusPublish(e.target.value as NonNullable<Pengumuman["status_publish"]>)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
          >
            <option value="draft">Draft</option>
            <option value="published">Terbit</option>
            <option value="expired">Kedaluwarsa</option>
          </select>
        ) : (
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
            Sematkan (pin) pengumuman ini
          </label>
        )}

        {editing && (
          <p className="text-xs text-slate-400 sm:col-span-2">
            Target dan gambar tidak dapat diubah setelah pengumuman dibuat.
          </p>
        )}

        {error && <p className="text-sm text-rose-600 sm:col-span-2">{error}</p>}

        <div className="flex gap-2 sm:col-span-2">
          <button
            disabled={saving}
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
          >
            {saving ? "Menyimpan..." : "Simpan Pengumuman"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
          >
            Batal
          </button>
        </div>
      </form>
    </Card>
  );
}
