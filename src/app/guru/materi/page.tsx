"use client";

import { Fragment, Suspense, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { FileInput } from "@/components/ui/FileInput";
import { PenugasanAktifBanner, TanpaPenugasanAktif } from "@/components/PenugasanAktifBanner";
import { MateriDiskusiToggle } from "@/components/mapel/MateriDiskusiToggle";
import { usePenugasanAktif, type PenugasanAktif } from "@/hooks/usePenugasanAktif";
import { useAuth } from "@/hooks/useAuth";
import { formatTanggal } from "@/lib/date";
import type { MateriGuru, MateriTipe, Paginated } from "@/lib/types-guru";

const TIPE_OPTIONS: MateriTipe[] = ["pdf", "video", "link", "teks", "ppt", "docx", "gambar"];

const TIPE_LABEL: Record<MateriTipe, string> = {
  pdf: "PDF",
  video: "Video",
  link: "Link",
  teks: "Teks",
  ppt: "PPT",
  docx: "DOCX",
  gambar: "Gambar",
};

const TIPE_STYLE: Record<MateriTipe, string> = {
  pdf: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  video: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
  link: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  teks: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  ppt: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  docx: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  gambar: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
};

export default function GuruMateriPage() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-400">Memuat...</p>}>
      <GuruMateriPageInner />
    </Suspense>
  );
}

function GuruMateriPageInner() {
  const { aktif, ready } = usePenugasanAktif();
  const { user } = useAuth("guru");
  const [materi, setMateri] = useState<MateriGuru[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<MateriGuru | null>(null);
  const [justCreatedId, setJustCreatedId] = useState<number | null>(null);

  function load() {
    if (!aktif) return;
    api
      .get<{ data: Paginated<MateriGuru> }>(`/guru/materi?per_page=50&kelas_id=${aktif.kelasId}`)
      .then((r) => setMateri(r.data.data ?? []));
  }

  useEffect(load, [aktif]);

  async function hapus(id: number) {
    if (!confirm("Hapus materi ini?")) return;
    await api.del(`/guru/materi/${id}`);
    load();
  }

  if (ready && !aktif) return <TanpaPenugasanAktif />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Kelola Materi</h1>
          <p className="text-sm text-slate-500">Unggah materi pembelajaran untuk murid di kelas Anda.</p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setShowForm((v) => !v);
          }}
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
        >
          {showForm && !editing ? "Tutup Form" : "+ Materi Baru"}
        </button>
      </div>

      {aktif && <PenugasanAktifBanner aktif={aktif} />}

      {showForm && !editing && aktif && (
        <MateriCreateForm
          aktif={aktif}
          onCreated={(newId) => {
            setShowForm(false);
            setJustCreatedId(newId);
            load();
          }}
        />
      )}

      {editing && (
        <MateriEditForm
          materi={editing}
          onSaved={() => {
            setEditing(null);
            load();
          }}
          onCancel={() => setEditing(null)}
        />
      )}

      <Card className="p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500 dark:border-slate-800">
              <th className="p-4">Judul</th>
              <th className="p-4">Tipe</th>
              <th className="p-4">Tanggal</th>
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody>
            {materi.map((m) => (
              <Fragment key={m.id}>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <td className="p-4 font-medium text-slate-800 dark:text-white">
                    {m.judul}
                    {m.deskripsi && <p className="mt-0.5 text-xs font-normal text-slate-500">{m.deskripsi}</p>}
                  </td>
                  <td className="p-4">
                    <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${TIPE_STYLE[m.tipe]}`}>
                      {TIPE_LABEL[m.tipe]}
                    </span>
                  </td>
                  <td className="p-4 text-slate-500">{formatTanggal(m.created_at)}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          setShowForm(false);
                          setEditing(m);
                        }}
                        className="text-teal-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button onClick={() => hapus(m.id)} className="text-rose-600 hover:underline">
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
                <tr className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                  <td colSpan={4} className="px-4 pb-3">
                    <MateriDiskusiToggle
                      materiId={m.id}
                      commentCount={m.diskusi_count}
                      currentUserId={user?.id}
                      defaultOpen={m.id === justCreatedId}
                    />
                  </td>
                </tr>
              </Fragment>
            ))}
            {materi.length === 0 && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-slate-400">
                  Belum ada materi.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function MateriCreateForm({ aktif, onCreated }: { aktif: PenugasanAktif; onCreated: (newId: number) => void }) {
  const [judul, setJudul] = useState("");
  const [tipe, setTipe] = useState<MateriTipe>("pdf");
  const [file, setFile] = useState<File | null>(null);
  const [link, setLink] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const butuhFile = tipe === "pdf" || tipe === "video";
  const butuhLink = tipe === "link";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (butuhFile && !file) {
      setError("Pilih file terlebih dahulu.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (butuhFile && file && file.size > 50 * 1024 * 1024) {
        setError("Ukuran file maksimal 50MB.");
        setSaving(false);
        return;
      }
      const fd = new FormData();
      fd.append("kelas_id", String(aktif.kelasId));
      fd.append("mapel_id", String(aktif.mapelId));
      fd.append("judul", judul);
      fd.append("tipe", tipe);
      if (deskripsi) fd.append("deskripsi", deskripsi);
      if (butuhFile && file) fd.append("file", file);
      if (butuhLink) fd.append("link", link);
      const res = await api.upload<{ data: MateriGuru }>("/guru/materi", fd);
      onCreated(res.data.id);
    } catch {
      setError("Gagal menyimpan materi. Pastikan semua field terisi benar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
        <input
          required
          placeholder="Judul materi"
          value={judul}
          onChange={(e) => setJudul(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white sm:col-span-2"
        />
        <select
          value={tipe}
          onChange={(e) => setTipe(e.target.value as MateriTipe)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        >
          {TIPE_OPTIONS.map((t) => (
            <option key={t} value={t}>
              {TIPE_LABEL[t]}
            </option>
          ))}
        </select>

        {butuhFile && (
          <div className="sm:col-span-1">
            <FileInput file={file} onChange={setFile} />
          </div>
        )}
        {butuhLink && (
          <input
            required
            type="url"
            placeholder="https://..."
            value={link}
            onChange={(e) => setLink(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        )}
        {!butuhFile && !butuhLink && <div />}

        <textarea
          placeholder="Deskripsi (opsional)"
          value={deskripsi}
          onChange={(e) => setDeskripsi(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white sm:col-span-2"
        />

        {error && <p className="text-sm text-rose-600 sm:col-span-2">{error}</p>}
        <button
          disabled={saving}
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60 sm:col-span-2"
        >
          {saving ? "Menyimpan..." : "Simpan Materi"}
        </button>
      </form>
    </Card>
  );
}

function MateriEditForm({
  materi,
  onSaved,
  onCancel,
}: {
  materi: MateriGuru;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [judul, setJudul] = useState(materi.judul);
  const [deskripsi, setDeskripsi] = useState(materi.deskripsi ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.put(`/guru/materi/${materi.id}`, { judul, deskripsi });
      onSaved();
    } catch {
      setError("Gagal menyimpan perubahan.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
        <input
          required
          placeholder="Judul materi"
          value={judul}
          onChange={(e) => setJudul(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white sm:col-span-2"
        />
        <textarea
          placeholder="Deskripsi (opsional)"
          value={deskripsi}
          onChange={(e) => setDeskripsi(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white sm:col-span-2"
        />
        {error && <p className="text-sm text-rose-600 sm:col-span-2">{error}</p>}
        <div className="flex gap-2 sm:col-span-2">
          <button
            disabled={saving}
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
          >
            {saving ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Batal
          </button>
        </div>
      </form>
    </Card>
  );
}
