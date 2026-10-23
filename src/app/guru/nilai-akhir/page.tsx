"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { api, getAccessToken, ApiError } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { PenugasanAktifBanner, TanpaPenugasanAktif } from "@/components/PenugasanAktifBanner";
import { usePenugasanAktif } from "@/hooks/usePenugasanAktif";
import type {
  KelasGuru,
  KirimAdminMassalResponse,
  KomponenNilai,
  KomponenNilaiTipe,
  MatriksNilai,
  MuridRingkasKelas,
  NilaiAkhirGuru,
  Paginated,
} from "@/lib/types-guru";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

const TIPE_LABEL: Record<KomponenNilaiTipe, string> = {
  manual: "Manual",
  auto_tugas: "Otomatis · rata-rata Tugas",
  auto_absensi: "Otomatis · % Kehadiran",
};

/** Nilai akhir dihitung ULANG di klien dari state matriks terkini (termasuk edit yang belum disimpan) supaya kolom "Nilai Akhir" auto-update instan — rumusnya sama persis dengan backend (nilai kosong dianggap 0). */
function hitungNilaiAkhirLokal(nilaiPerKomponen: Record<number, number | null>, komponen: KomponenNilai[]): number {
  const total = komponen.reduce((sum, k) => sum + (nilaiPerKomponen[k.id] ?? 0) * (k.bobot_persen / 100), 0);
  return Math.round(total * 100) / 100;
}

export default function GuruNilaiAkhirPage() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-400">Memuat...</p>}>
      <GuruNilaiAkhirPageInner />
    </Suspense>
  );
}

function GuruNilaiAkhirPageInner() {
  const { aktif, ready } = usePenugasanAktif();
  const [roster, setRoster] = useState<MuridRingkasKelas[]>([]);
  const [nilaiList, setNilaiList] = useState<NilaiAkhirGuru[]>([]);
  const [komponen, setKomponen] = useState<KomponenNilai[]>([]);
  const [matriks, setMatriks] = useState<MatriksNilai | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<"xlsx" | "pdf" | null>(null);
  const [menghitungSemua, setMenghitungSemua] = useState(false);
  const [mengirimMassal, setMengirimMassal] = useState(false);
  const [search, setSearch] = useState("");

  function loadKomponen() {
    if (!aktif) return Promise.resolve();
    return api
      .get<{ data: KomponenNilai[] }>(`/guru/komponen-nilai?mapel_id=${aktif.mapelId}`)
      .then((r) => setKomponen(r.data ?? []));
  }

  function loadMatriks() {
    if (!aktif) return Promise.resolve();
    return api
      .get<{ data: MatriksNilai }>(`/guru/nilai-komponen/matriks?mapel_id=${aktif.mapelId}&kelas_id=${aktif.kelasId}`)
      .then((r) => setMatriks(r.data));
  }

  function loadNilai() {
    if (!aktif) return Promise.resolve();
    return api
      .get<{ data: Paginated<NilaiAkhirGuru> }>(`/guru/nilai-akhir?per_page=100&mapel_id=${aktif.mapelId}`)
      .then((r) => setNilaiList(r.data.data ?? []));
  }

  function reloadSemua() {
    setLoading(true);
    return Promise.all([loadKomponen(), loadMatriks(), loadNilai()]).finally(() => setLoading(false));
  }

  useEffect(() => {
    if (!aktif) return;
    Promise.all([
      api.get<{ data: KelasGuru[] }>("/guru/kelas").then((r) => {
        const kelasIni = (r.data ?? []).find((k) => k.id === aktif.kelasId);
        setRoster(kelasIni?.murid ?? []);
      }),
      loadKomponen(),
      loadMatriks(),
      loadNilai(),
    ]).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aktif]);

  async function hitung(muridId: number) {
    if (!aktif) return;
    await api.post(`/guru/nilai-akhir/${muridId}/hitung?mapel_id=${aktif.mapelId}`);
    loadNilai();
  }

  async function hitungSemua() {
    if (!aktif || roster.length === 0) return;
    setMenghitungSemua(true);
    try {
      for (const m of roster) {
        await api.post(`/guru/nilai-akhir/${m.user_id}/hitung?mapel_id=${aktif.mapelId}`).catch(() => {});
      }
      await loadNilai();
    } finally {
      setMenghitungSemua(false);
    }
  }

  // Cerminan logika eligibility di backend (NilaiAkhirController::kirimAdminMassal) —
  // dipakai supaya guru sudah lihat perkiraan jumlah SEBELUM klik, bukan cuma dikejutkan hasil akhirnya.
  const jumlahEligible = nilaiList.filter(
    (n) => n.rekomendasi_guru_lulus !== null && !n.dikirim_ke_admin_at && !n.verified_by_admin,
  ).length;

  async function kirimSemuaKeAdmin() {
    if (!aktif || mengirimMassal || jumlahEligible === 0) return;
    if (!confirm(`Kirim ${jumlahEligible} murid ke admin untuk validasi kelulusan?`)) return;

    setMengirimMassal(true);
    try {
      const res = await api.post<KirimAdminMassalResponse>(`/guru/nilai-akhir/kirim-admin-massal?mapel_id=${aktif.mapelId}`);
      let pesan = res.message;
      if (res.dilewati.length > 0) {
        pesan += "\n\nDilewati:\n" + res.dilewati.map((d) => `- ${d.nama}: ${d.alasan}`).join("\n");
      }
      alert(pesan);
      await loadNilai();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Gagal mengirim ke admin.");
    } finally {
      setMengirimMassal(false);
    }
  }

  async function unduh(format: "xlsx" | "pdf") {
    if (!aktif) return;
    setDownloading(format);
    try {
      const res = await fetch(
        `${API_BASE_URL}/guru/export/nilai?format=${format}&mapel_id=${aktif.mapelId}&kelas_id=${aktif.kelasId}`,
        { headers: { Authorization: `Bearer ${getAccessToken()}` } },
      );
      if (!res.ok) throw new Error("Gagal mengunduh.");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `nilai-akhir.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      alert("Gagal mengunduh nilai akhir.");
    } finally {
      setDownloading(null);
    }
  }

  if (ready && !aktif) return <TanpaPenugasanAktif />;

  const nilaiByMurid = new Map(nilaiList.map((n) => [n.murid_id, n]));
  const bobotTotal = komponen.reduce((s, k) => s + k.bobot_persen, 0);

  const searchQuery = search.trim().toLowerCase();
  const filteredRoster = searchQuery
    ? roster.filter(
        (m) => m.user.nama.toLowerCase().includes(searchQuery) || (m.user.nis ?? "").toLowerCase().includes(searchQuery),
      )
    : roster;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Nilai &amp; Kelulusan</h1>
          <p className="text-sm text-slate-500">Atur komponen nilai, isi nilai per murid, lalu hitung &amp; kirim ke admin.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => unduh("xlsx")}
            disabled={downloading !== null}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {downloading === "xlsx" ? "Menyiapkan..." : "Unduh Excel"}
          </button>
          <button
            onClick={() => unduh("pdf")}
            disabled={downloading !== null}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {downloading === "pdf" ? "Menyiapkan..." : "Unduh PDF"}
          </button>
          <button
            onClick={kirimSemuaKeAdmin}
            disabled={mengirimMassal || jumlahEligible === 0}
            title={jumlahEligible === 0 ? "Belum ada murid yang siap dikirim (isi rekomendasi lulus/tidak dulu)" : undefined}
            className="rounded-lg bg-slate-800 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-50 dark:bg-slate-700 dark:hover:bg-slate-600"
          >
            {mengirimMassal ? "Mengirim..." : `Kirim Semua ke Admin${jumlahEligible > 0 ? ` (${jumlahEligible})` : ""}`}
          </button>
        </div>
      </div>

      {aktif && <PenugasanAktifBanner aktif={aktif} />}

      {aktif && (
        <KomponenNilaiManager
          mapelId={aktif.mapelId}
          komponen={komponen}
          bobotTotal={bobotTotal}
          onChanged={reloadSemua}
        />
      )}

      <Card className="p-0">
        <div className="flex flex-wrap items-center justify-between gap-2 p-4">
          <h2 className="text-sm font-bold text-slate-800 dark:text-white">Spreadsheet Nilai</h2>
          <button
            onClick={hitungSemua}
            disabled={menghitungSemua || bobotTotal !== 100 || roster.length === 0}
            title={bobotTotal !== 100 ? "Total bobot komponen harus 100% dulu" : undefined}
            className="rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
          >
            {menghitungSemua ? "Menghitung..." : "Hitung Nilai Akhir Semua Murid"}
          </button>
        </div>

        {loading && <p className="px-4 pb-4 text-sm text-slate-400">Memuat...</p>}
        {!loading && matriks && (
          <NilaiSpreadsheet
            matriks={matriks}
            onSaved={(muridId, komponenId, nilai) => {
              setMatriks((prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  baris: prev.baris.map((b) =>
                    b.murid_id === muridId
                      ? { ...b, nilai_per_komponen: { ...b.nilai_per_komponen, [komponenId]: nilai } }
                      : b,
                  ),
                };
              });
            }}
          />
        )}
      </Card>

      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-800 dark:text-white">Approval Nilai Akhir</h2>
        <input
          type="text"
          placeholder="Cari nama atau NIS murid..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white sm:max-w-xs"
        />
        {!loading && roster.length === 0 && (
          <Card className="text-center text-sm text-slate-500">Belum ada murid di kelas ini.</Card>
        )}
        {!loading && roster.length > 0 && filteredRoster.length === 0 && (
          <Card className="text-center text-sm text-slate-500">Tidak ada murid yang cocok dengan pencarian.</Card>
        )}
        {filteredRoster.map((m) => {
          const nilai = nilaiByMurid.get(m.user_id);
          return nilai ? (
            <NilaiRow key={m.user_id} nilai={nilai} onChanged={loadNilai} onHitungUlang={() => hitung(m.user_id)} />
          ) : (
            <Card key={m.user_id} className="flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-800 dark:text-white">{m.user.nama}</p>
                <p className="text-xs text-slate-400">{m.user.nis ?? "-"}</p>
              </div>
              <button
                onClick={() => hitung(m.user_id)}
                disabled={bobotTotal !== 100}
                className="rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
              >
                Hitung Nilai
              </button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/** Panel kelola komponen nilai (Bagian 5) — guru atur sendiri nama & bobot%, total harus 100%. */
function KomponenNilaiManager({
  mapelId,
  komponen,
  bobotTotal,
  onChanged,
}: {
  mapelId: number;
  komponen: KomponenNilai[];
  bobotTotal: number;
  onChanged: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<KomponenNilai | null>(null);
  const [nama, setNama] = useState("");
  const [tipe, setTipe] = useState<KomponenNilaiTipe>("manual");
  const [bobot, setBobot] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function bukaForm(k: KomponenNilai | null) {
    setEditing(k);
    setNama(k?.nama ?? "");
    setTipe(k?.tipe ?? "manual");
    setBobot(k ? String(k.bobot_persen) : "");
    setError(null);
    setShowForm(true);
  }

  async function simpan(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = { mapel_id: mapelId, nama, tipe, bobot_persen: Number(bobot) };
      if (editing) {
        await api.put(`/guru/komponen-nilai/${editing.id}`, payload);
      } else {
        await api.post("/guru/komponen-nilai", payload);
      }
      setShowForm(false);
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal menyimpan komponen nilai.");
    } finally {
      setSaving(false);
    }
  }

  async function hapus(k: KomponenNilai) {
    if (!confirm(`Hapus komponen "${k.nama}"? Nilai murid untuk komponen ini (kalau ada) ikut terhapus.`)) return;
    await api.del(`/guru/komponen-nilai/${k.id}`);
    onChanged();
  }

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-slate-800 dark:text-white">Kelola Komponen Nilai</h2>
        <button
          onClick={() => (showForm ? setShowForm(false) : bukaForm(null))}
          className="flex items-center gap-1 rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-teal-700"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
          Tambah Komponen
        </button>
      </div>

      <p className={`mt-2 text-sm font-semibold ${bobotTotal === 100 ? "text-teal-600" : "text-amber-600"}`}>
        Total bobot: {bobotTotal}% {bobotTotal !== 100 && "(harus 100% sebelum bisa menghitung nilai akhir)"}
      </p>

      {komponen.length > 0 && (
        <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
          {komponen.map((k) => (
            <div key={k.id} className="flex items-center justify-between gap-2 py-2 text-sm">
              <div className="min-w-0">
                <p className="font-medium text-slate-800 dark:text-white">{k.nama}</p>
                <p className="text-xs text-slate-400">{TIPE_LABEL[k.tipe]}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="font-semibold text-slate-600 dark:text-slate-300">{k.bobot_persen}%</span>
                <button onClick={() => bukaForm(k)} className="text-teal-600 hover:underline">
                  <Pencil className="h-4 w-4" strokeWidth={2} />
                </button>
                <button onClick={() => hapus(k)} className="text-rose-600 hover:underline">
                  <Trash2 className="h-4 w-4" strokeWidth={2} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {komponen.length === 0 && !showForm && (
        <p className="mt-3 text-sm text-slate-400">
          Belum ada komponen nilai. Tambahkan minimal satu (mis. &quot;Tugas Harian&quot;, &quot;UTS&quot;, &quot;UAS&quot;) dengan total bobot 100%.
        </p>
      )}

      {showForm && (
        <form onSubmit={simpan} className="mt-3 grid gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800 sm:grid-cols-3">
          <input
            required
            placeholder="Nama komponen (mis. UTS)"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white sm:col-span-1"
          />
          <select
            value={tipe}
            onChange={(e) => setTipe(e.target.value as KomponenNilaiTipe)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          >
            <option value="manual">Manual (guru input)</option>
            <option value="auto_tugas">Otomatis — rata-rata Tugas</option>
            <option value="auto_absensi">Otomatis — % Kehadiran</option>
          </select>
          <input
            required
            type="number"
            min={0}
            max={100}
            step="0.01"
            placeholder="Bobot %"
            value={bobot}
            onChange={(e) => setBobot(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
          {error && <p className="text-sm text-rose-600 sm:col-span-3">{error}</p>}
          <div className="flex gap-2 sm:col-span-3">
            <button
              disabled={saving}
              className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
            >
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-700"
            >
              Batal
            </button>
          </div>
        </form>
      )}
    </Card>
  );
}

/** Tabel spreadsheet: baris = murid, kolom = tiap komponen (manual bisa diklik-edit, auto read-only), kolom terakhir = Nilai Akhir (live). */
function NilaiSpreadsheet({
  matriks,
  onSaved,
}: {
  matriks: MatriksNilai;
  onSaved: (muridId: number, komponenId: number, nilai: number | null) => void;
}) {
  const { komponen, baris } = matriks;

  if (komponen.length === 0) {
    return <p className="px-4 pb-4 text-sm text-slate-400">Tambahkan komponen nilai dulu supaya tabel ini terisi.</p>;
  }

  const rataRata = (komponenId: number) => {
    const nilai = baris.map((b) => b.nilai_per_komponen[komponenId]).filter((v): v is number => v !== null);
    if (nilai.length === 0) return "-";
    return (nilai.reduce((a, b) => a + b, 0) / nilai.length).toFixed(1);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-slate-500 dark:border-slate-800">
            <th className="whitespace-nowrap px-4 py-2">Murid</th>
            {komponen.map((k) => (
              <th key={k.id} className="whitespace-nowrap px-3 py-2">
                {k.nama}
                <span className="ml-1 font-normal text-slate-400">({k.bobot_persen}%)</span>
              </th>
            ))}
            <th className="whitespace-nowrap px-3 py-2">Nilai Akhir</th>
          </tr>
        </thead>
        <tbody>
          {baris.map((b) => (
            <tr key={b.murid_id} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
              <td className="whitespace-nowrap px-4 py-2 font-medium text-slate-800 dark:text-white">
                {b.murid.nama} <span className="text-xs text-slate-400">({b.murid.nis ?? "-"})</span>
              </td>
              {komponen.map((k) => (
                <NilaiSel
                  key={k.id}
                  muridId={b.murid_id}
                  komponen={k}
                  nilai={b.nilai_per_komponen[k.id]}
                  onSaved={onSaved}
                />
              ))}
              <td className="px-3 py-2 font-bold text-teal-700 dark:text-teal-400">
                {hitungNilaiAkhirLokal(b.nilai_per_komponen, komponen)}
              </td>
            </tr>
          ))}
          {baris.length === 0 && (
            <tr>
              <td colSpan={komponen.length + 2} className="py-6 text-center text-slate-400">
                Belum ada murid di kelas ini.
              </td>
            </tr>
          )}
        </tbody>
        {baris.length > 0 && (
          <tfoot>
            <tr className="border-t border-slate-200 text-xs text-slate-400 dark:border-slate-800">
              <td className="px-4 py-2">Rata-rata kelas</td>
              {komponen.map((k) => (
                <td key={k.id} className="px-3 py-2">
                  {rataRata(k.id)}
                </td>
              ))}
              <td className="px-3 py-2" />
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}

function NilaiSel({
  muridId,
  komponen,
  nilai,
  onSaved,
}: {
  muridId: number;
  komponen: KomponenNilai;
  nilai: number | null;
  onSaved: (muridId: number, komponenId: number, nilai: number | null) => void;
}) {
  const [value, setValue] = useState(nilai !== null ? String(nilai) : "");
  const [saving, setSaving] = useState(false);

  if (komponen.tipe !== "manual") {
    return <td className="px-3 py-2 text-slate-400">{nilai ?? "-"}</td>;
  }

  async function simpan() {
    const parsed = value === "" ? null : Number(value);
    if (parsed === nilai) return;
    setSaving(true);
    try {
      await api.put("/guru/nilai-komponen/bulk", {
        data: [{ komponen_nilai_id: komponen.id, murid_id: muridId, nilai: parsed }],
      });
      onSaved(muridId, komponen.id, parsed);
    } catch {
      alert("Gagal menyimpan nilai.");
      setValue(nilai !== null ? String(nilai) : "");
    } finally {
      setSaving(false);
    }
  }

  return (
    <td className="px-3 py-2">
      <input
        type="number"
        min={0}
        max={100}
        step="0.01"
        value={value}
        disabled={saving}
        onChange={(e) => setValue(e.target.value)}
        onBlur={simpan}
        className="w-16 rounded-lg border border-slate-300 px-2 py-1 text-sm disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
      />
    </td>
  );
}

function NilaiRow({
  nilai,
  onChanged,
  onHitungUlang,
}: {
  nilai: NilaiAkhirGuru;
  onChanged: () => void;
  onHitungUlang: () => void;
}) {
  const [nilaiAkhir, setNilaiAkhir] = useState(nilai.nilai_akhir?.toString() ?? "");
  const [catatan, setCatatan] = useState(nilai.catatan_guru ?? "");
  const [lulus, setLulus] = useState<string>(
    nilai.rekomendasi_guru_lulus === true ? "lulus" : nilai.rekomendasi_guru_lulus === false ? "tidak_lulus" : "",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flashDiperbarui, setFlashDiperbarui] = useState(false);
  const sudahMount = useRef(false);

  // Sinkronkan ulang nilaiAkhir/lulus saat props berubah (mis. setelah "Hitung
  // Ulang" menimpa nilai_akhir & rekomendasi_guru_lulus di server) — sebelumnya
  // kedua state ini hanya di-set sekali saat mount, jadi field di layar tetap
  // menampilkan angka lama walau data baru sudah tersimpan & ke-refetch.
  // `catatan` SENGAJA tidak ikut disinkronkan — itu draft murni guru yang
  // tidak pernah diubah proses Hitung Ulang, supaya ketikan guru tidak hilang.
  useEffect(() => {
    if (!sudahMount.current) {
      sudahMount.current = true;
      return;
    }
    setNilaiAkhir(nilai.nilai_akhir?.toString() ?? "");
    setLulus(nilai.rekomendasi_guru_lulus === true ? "lulus" : nilai.rekomendasi_guru_lulus === false ? "tidak_lulus" : "");
    setFlashDiperbarui(true);
    const timer = setTimeout(() => setFlashDiperbarui(false), 2000);
    return () => clearTimeout(timer);
  }, [nilai.nilai_akhir, nilai.rekomendasi_guru_lulus]);

  async function simpan() {
    if (lulus === "") {
      setError("Pilih rekomendasi lulus/tidak lulus terlebih dahulu.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.put(`/guru/nilai-akhir/${nilai.id}`, {
        nilai_akhir: nilaiAkhir !== "" ? Number(nilaiAkhir) : undefined,
        catatan_guru: catatan,
        rekomendasi_guru_lulus: lulus === "lulus",
      });
      onChanged();
    } catch {
      setError("Gagal menyimpan perubahan.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-800 dark:text-white">
            {nilai.murid.nama} <span className="text-xs text-slate-400">({nilai.murid.nis ?? "-"})</span>
          </p>
          <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500">
            {nilai.rincian_komponen && nilai.rincian_komponen.length > 0 ? (
              nilai.rincian_komponen.map((r) => (
                <span key={r.komponen_nilai_id}>
                  {r.nama}: {r.nilai} ({r.bobot_persen}%)
                </span>
              ))
            ) : (
              <span className="italic text-slate-400">Belum ada rincian komponen (nilai lama / belum dihitung ulang).</span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {flashDiperbarui && (
            <span className="rounded-full bg-sky-100 px-2.5 py-1 text-[10px] font-bold uppercase text-sky-700 dark:bg-sky-950 dark:text-sky-300">
              Diperbarui
            </span>
          )}
          {!nilai.verified_by_admin && nilai.dikirim_ke_admin_at && (
            <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-[10px] font-bold uppercase text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              Terkirim ke Admin
            </span>
          )}
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
              nilai.verified_by_admin
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
            }`}
          >
            {nilai.verified_by_admin ? "Terverifikasi Admin" : "Belum Diverifikasi"}
          </span>
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
              nilai.dirilis_ke_murid
                ? "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300"
                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            {nilai.dirilis_ke_murid ? "Sudah Dirilis" : "Belum Dirilis"}
          </span>
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs text-slate-500">
          Nilai Akhir (override manual)
          <input
            type="number"
            value={nilaiAkhir}
            onChange={(e) => setNilaiAkhir(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-500">
          Rekomendasi
          <select
            value={lulus}
            onChange={(e) => setLulus(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          >
            <option value="">- Pilih -</option>
            <option value="lulus">Lulus</option>
            <option value="tidak_lulus">Tidak Lulus</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-500 sm:col-span-2">
          Catatan Guru
          <textarea
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </label>
      </div>

      {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={simpan}
          disabled={saving}
          className="rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
        >
          {saving ? "Menyimpan..." : "Simpan"}
        </button>
        <button
          onClick={onHitungUlang}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Hitung Ulang
        </button>
      </div>
    </Card>
  );
}
