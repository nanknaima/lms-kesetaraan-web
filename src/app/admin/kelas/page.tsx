"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import type { BobotNilai, GuruAkun, Kelas, Mapel, Paginated } from "@/lib/types";

export default function AdminKelasPage() {
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [mapelList, setMapelList] = useState<Mapel[]>([]);
  const [guruList, setGuruList] = useState<GuruAkun[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const [showKelasForm, setShowKelasForm] = useState(false);
  const [editingKelas, setEditingKelas] = useState<Kelas | null>(null);
  const [showMapelForm, setShowMapelForm] = useState(false);
  const [editingMapel, setEditingMapel] = useState<Mapel | null>(null);

  function load() {
    Promise.all([
      api.get<{ data: Paginated<Kelas> }>("/admin/kelas?per_page=100"),
      api.get<{ data: Paginated<Mapel> }>("/admin/mapel?per_page=100"),
      api.get<{ data: Paginated<GuruAkun> }>("/admin/guru?per_page=100"),
    ])
      .then(([k, m, g]) => {
        setKelasList(k.data.data ?? []);
        setMapelList(m.data.data ?? []);
        setGuruList(g.data.data ?? []);
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function hapusKelas(k: Kelas) {
    if (!confirm(`Hapus kelas ${k.nama_kelas}?`)) return;
    try {
      await api.del(`/admin/kelas/${k.id}`);
      setNotice({ type: "ok", text: `Kelas ${k.nama_kelas} dihapus.` });
      load();
    } catch (err) {
      setNotice({ type: "error", text: err instanceof ApiError ? err.message : "Gagal menghapus kelas." });
    }
  }

  async function hapusMapel(m: Mapel) {
    if (!confirm(`Hapus mata pelajaran ${m.nama_mapel}?`)) return;
    try {
      await api.del(`/admin/mapel/${m.id}`);
      setNotice({ type: "ok", text: `Mata pelajaran ${m.nama_mapel} dihapus.` });
      load();
    } catch (err) {
      setNotice({ type: "error", text: err instanceof ApiError ? err.message : "Gagal menghapus mata pelajaran." });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Kelas & Mata Pelajaran</h1>
        <p className="text-sm text-slate-500">Kelola kelas, wali kelas, mata pelajaran, dan bobot nilai akhir.</p>
      </div>

      {notice && (
        <p className={`rounded-lg px-3 py-2 text-sm ${notice.type === "ok" ? "bg-teal-50 text-teal-700" : "bg-rose-50 text-rose-600"}`}>
          {notice.text}
        </p>
      )}

      {/* ==================== KELAS ==================== */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Kelas</h2>
        <button
          onClick={() => {
            setEditingKelas(null);
            setShowKelasForm((v) => !v);
          }}
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
        >
          {showKelasForm && !editingKelas ? "Tutup Form" : "+ Tambah Kelas"}
        </button>
      </div>

      {(showKelasForm || editingKelas) && (
        <KelasForm
          guruList={guruList}
          editing={editingKelas}
          onDone={() => {
            setShowKelasForm(false);
            setEditingKelas(null);
            load();
          }}
          onCancel={() => {
            setShowKelasForm(false);
            setEditingKelas(null);
          }}
          onError={(text) => setNotice({ type: "error", text })}
        />
      )}

      <Card className="p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500 dark:border-slate-800">
              <th className="p-4">Nama Kelas</th>
              <th className="p-4">Paket</th>
              <th className="p-4">Tingkat</th>
              <th className="p-4">Wali Kelas</th>
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody>
            {kelasList.map((k) => (
              <tr key={k.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                <td className="p-4 font-medium text-slate-800 dark:text-white">{k.nama_kelas}</td>
                <td className="p-4 text-slate-500">Paket {k.paket}</td>
                <td className="p-4 text-slate-500">{k.tingkat}</td>
                <td className="p-4 text-slate-500">{k.wali_kelas?.nama ?? "-"}</td>
                <td className="p-4">
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowKelasForm(false);
                        setEditingKelas(k);
                      }}
                      className="text-xs font-medium text-teal-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button onClick={() => hapusKelas(k)} className="text-xs font-medium text-rose-600 hover:underline">
                      Hapus
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && kelasList.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-slate-400">
                  Belum ada data kelas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      {/* ==================== MAPEL ==================== */}
      <div className="flex items-center justify-between pt-2">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Mata Pelajaran</h2>
        <button
          onClick={() => {
            setEditingMapel(null);
            setShowMapelForm((v) => !v);
          }}
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
        >
          {showMapelForm && !editingMapel ? "Tutup Form" : "+ Tambah Mapel"}
        </button>
      </div>

      {(showMapelForm || editingMapel) && (
        <MapelForm
          editing={editingMapel}
          onDone={() => {
            setShowMapelForm(false);
            setEditingMapel(null);
            load();
          }}
          onCancel={() => {
            setShowMapelForm(false);
            setEditingMapel(null);
          }}
          onError={(text) => setNotice({ type: "error", text })}
        />
      )}

      <Card className="p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500 dark:border-slate-800">
              <th className="p-4">Nama Mapel</th>
              <th className="p-4">Kode</th>
              <th className="p-4">Paket</th>
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody>
            {mapelList.map((m) => (
              <tr key={m.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                <td className="p-4 font-medium text-slate-800 dark:text-white">{m.nama_mapel}</td>
                <td className="p-4 text-slate-500">{m.kode}</td>
                <td className="p-4 text-slate-500">Paket {m.paket}</td>
                <td className="p-4">
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowMapelForm(false);
                        setEditingMapel(m);
                      }}
                      className="text-xs font-medium text-teal-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button onClick={() => hapusMapel(m)} className="text-xs font-medium text-rose-600 hover:underline">
                      Hapus
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && mapelList.length === 0 && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-slate-400">
                  Belum ada data mata pelajaran.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      <BobotNilaiForm />
    </div>
  );
}

function KelasForm({
  guruList,
  editing,
  onDone,
  onCancel,
  onError,
}: {
  guruList: GuruAkun[];
  editing: Kelas | null;
  onDone: () => void;
  onCancel: () => void;
  onError: (text: string) => void;
}) {
  const [namaKelas, setNamaKelas] = useState(editing?.nama_kelas ?? "");
  const [paket, setPaket] = useState<"A" | "B" | "C" | "">(editing?.paket ?? "");
  const [tingkat, setTingkat] = useState(editing?.tingkat ?? "");
  const [waliKelasId, setWaliKelasId] = useState(editing?.wali_kelas?.id ? String(editing.wali_kelas.id) : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (editing) {
        await api.put(`/admin/kelas/${editing.id}`, {
          nama_kelas: namaKelas,
          tingkat,
          wali_kelas_id: waliKelasId ? Number(waliKelasId) : undefined,
        });
      } else {
        await api.post("/admin/kelas", {
          nama_kelas: namaKelas,
          paket,
          tingkat,
          wali_kelas_id: waliKelasId ? Number(waliKelasId) : undefined,
        });
      }
      onDone();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Gagal menyimpan kelas.";
      setError(msg);
      onError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <p className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
        {editing ? `Edit Kelas ${editing.nama_kelas}` : "Tambah Kelas Baru"}
      </p>
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
        <input
          required
          placeholder="Nama kelas"
          value={namaKelas}
          onChange={(e) => setNamaKelas(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
        />
        <select
          required
          disabled={!!editing}
          value={paket}
          onChange={(e) => setPaket(e.target.value as "A" | "B" | "C")}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800"
        >
          <option value="">Pilih paket...</option>
          <option value="A">Paket A</option>
          <option value="B">Paket B</option>
          <option value="C">Paket C</option>
        </select>
        <input
          required
          placeholder="Tingkat (mis. VII, VIII, X)"
          value={tingkat}
          onChange={(e) => setTingkat(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
        />
        <select
          value={waliKelasId}
          onChange={(e) => setWaliKelasId(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
        >
          <option value="">Wali kelas (opsional)</option>
          {guruList.map((g) => (
            <option key={g.id} value={g.id}>
              {g.nama}
            </option>
          ))}
        </select>
        {editing && (
          <p className="text-xs text-slate-400 sm:col-span-2">Paket tidak dapat diubah setelah kelas dibuat.</p>
        )}
        {error && <p className="text-sm text-rose-600 sm:col-span-2">{error}</p>}
        <div className="flex gap-2 sm:col-span-2">
          <button
            disabled={saving}
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
          >
            {saving ? "Menyimpan..." : "Simpan Kelas"}
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

function MapelForm({
  editing,
  onDone,
  onCancel,
  onError,
}: {
  editing: Mapel | null;
  onDone: () => void;
  onCancel: () => void;
  onError: (text: string) => void;
}) {
  const [namaMapel, setNamaMapel] = useState(editing?.nama_mapel ?? "");
  const [kode, setKode] = useState(editing?.kode ?? "");
  const [paket, setPaket] = useState<"A" | "B" | "C" | "">(editing?.paket ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (editing) {
        await api.put(`/admin/mapel/${editing.id}`, { nama_mapel: namaMapel, kode });
      } else {
        await api.post("/admin/mapel", { nama_mapel: namaMapel, kode, paket });
      }
      onDone();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Gagal menyimpan mata pelajaran.";
      setError(msg);
      onError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <p className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
        {editing ? `Edit Mapel ${editing.nama_mapel}` : "Tambah Mata Pelajaran Baru"}
      </p>
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
        <input
          required
          placeholder="Nama mata pelajaran"
          value={namaMapel}
          onChange={(e) => setNamaMapel(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
        />
        <input
          required
          placeholder="Kode mapel (unik)"
          value={kode}
          onChange={(e) => setKode(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
        />
        <select
          required
          disabled={!!editing}
          value={paket}
          onChange={(e) => setPaket(e.target.value as "A" | "B" | "C")}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 sm:col-span-2"
        >
          <option value="">Pilih paket...</option>
          <option value="A">Paket A</option>
          <option value="B">Paket B</option>
          <option value="C">Paket C</option>
        </select>
        {editing && (
          <p className="text-xs text-slate-400 sm:col-span-2">Paket tidak dapat diubah setelah mapel dibuat.</p>
        )}
        {error && <p className="text-sm text-rose-600 sm:col-span-2">{error}</p>}
        <div className="flex gap-2 sm:col-span-2">
          <button
            disabled={saving}
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
          >
            {saving ? "Menyimpan..." : "Simpan Mapel"}
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

function BobotNilaiForm() {
  const [bobotTugas, setBobotTugas] = useState("0");
  const [bobotKuis, setBobotKuis] = useState("0");
  const [bobotAbsensi, setBobotAbsensi] = useState("0");
  const [bobotUjian, setBobotUjian] = useState("0");
  const [passingGrade, setPassingGrade] = useState("0");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  useEffect(() => {
    api
      .get<{ data: BobotNilai }>("/admin/bobot-nilai")
      .then((r) => {
        const b = r.data;
        setBobotTugas(String(b.bobot_tugas));
        setBobotKuis(String(b.bobot_kuis));
        setBobotAbsensi(String(b.bobot_absensi));
        setBobotUjian(String(b.bobot_ujian));
        setPassingGrade(String(b.passing_grade));
      })
      .finally(() => setLoading(false));
  }, []);

  const total =
    (Number(bobotTugas) || 0) + (Number(bobotKuis) || 0) + (Number(bobotAbsensi) || 0) + (Number(bobotUjian) || 0);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setNotice(null);
    try {
      await api.put("/admin/bobot-nilai", {
        mapel_id: null,
        bobot_tugas: Number(bobotTugas),
        bobot_kuis: Number(bobotKuis),
        bobot_absensi: Number(bobotAbsensi),
        bobot_ujian: Number(bobotUjian),
        passing_grade: Number(passingGrade),
      });
      setNotice({ type: "ok", text: "Bobot nilai akhir berhasil disimpan." });
    } catch (err) {
      setNotice({ type: "error", text: err instanceof ApiError ? err.message : "Gagal menyimpan bobot nilai." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Pengaturan Bobot Nilai Akhir (Default)</p>
      <p className="mt-1 text-xs text-slate-500">
        Total keempat bobot di bawah harus tepat 100. Berlaku sebagai bobot default untuk semua mata pelajaran.
      </p>

      {loading ? (
        <p className="mt-3 text-sm text-slate-400">Memuat...</p>
      ) : (
        <form onSubmit={submit} className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label className="text-xs text-slate-500">
            Bobot Tugas (%)
            <input
              required
              type="number"
              min={0}
              max={100}
              value={bobotTugas}
              onChange={(e) => setBobotTugas(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
            />
          </label>
          <label className="text-xs text-slate-500">
            Bobot Kuis (%)
            <input
              required
              type="number"
              min={0}
              max={100}
              value={bobotKuis}
              onChange={(e) => setBobotKuis(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
            />
          </label>
          <label className="text-xs text-slate-500">
            Bobot Absensi (%)
            <input
              required
              type="number"
              min={0}
              max={100}
              value={bobotAbsensi}
              onChange={(e) => setBobotAbsensi(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
            />
          </label>
          <label className="text-xs text-slate-500">
            Bobot Ujian (%)
            <input
              required
              type="number"
              min={0}
              max={100}
              value={bobotUjian}
              onChange={(e) => setBobotUjian(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
            />
          </label>
          <label className="text-xs text-slate-500">
            Passing Grade
            <input
              required
              type="number"
              min={0}
              max={100}
              value={passingGrade}
              onChange={(e) => setPassingGrade(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
            />
          </label>

          <p className={`flex items-center gap-1 text-xs font-semibold sm:col-span-2 lg:col-span-5 ${total === 100 ? "text-teal-600" : "text-rose-600"}`}>
            Total bobot saat ini: {total}%
            {total === 100 ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> : " (harus tepat 100%)"}
          </p>

          {notice && (
            <p
              className={`text-sm sm:col-span-2 lg:col-span-5 ${
                notice.type === "ok" ? "text-teal-600" : "text-rose-600"
              }`}
            >
              {notice.text}
            </p>
          )}

          <button
            disabled={saving}
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60 sm:col-span-2 lg:col-span-5"
          >
            {saving ? "Menyimpan..." : "Simpan Bobot Nilai"}
          </button>
        </form>
      )}
    </Card>
  );
}
