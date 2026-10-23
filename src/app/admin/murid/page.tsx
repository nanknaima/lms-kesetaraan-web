"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Dices } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import type { Kelas, MuridAkun, Paginated, Pendaftaran } from "@/lib/types";

/** Password acak 10 karakter — cuma tawaran cepat buat admin, field tetap bisa diedit manual sebelum submit. */
function buatPasswordAcak(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*";
  let hasil = "";
  for (let i = 0; i < 10; i++) {
    hasil += chars[Math.floor(Math.random() * chars.length)];
  }
  return hasil;
}

const PAKET_OPTIONS = ["", "A", "B", "C"] as const;

export default function AdminMuridPage() {
  const [murid, setMurid] = useState<MuridAkun[]>([]);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [paketFilter, setPaketFilter] = useState<(typeof PAKET_OPTIONS)[number]>("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [prefillPendaftaran, setPrefillPendaftaran] = useState<Pendaftaran | null>(null);
  const searchParams = useSearchParams();

  // Datang dari tombol "Buat Akun Murid" di menu Pendaftaran (Bagian G) — ambil
  // data pendaftar yang sudah disetujui itu, buka form Tambah Murid, dan
  // prefill field-nya supaya admin tidak input ulang dari nol.
  useEffect(() => {
    const dariPendaftaran = searchParams.get("dari_pendaftaran");
    if (!dariPendaftaran) return;
    api
      .get<{ data: Pendaftaran }>(`/admin/pendaftaran/${dariPendaftaran}`)
      .then((r) => {
        setPrefillPendaftaran(r.data);
        setShowForm(true);
      })
      .catch(() => setNotice({ type: "error", text: "Gagal memuat data pendaftaran untuk prefill." }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function load() {
    const q = new URLSearchParams();
    if (paketFilter) q.set("paket", paketFilter);
    if (search) q.set("search", search);
    Promise.all([
      api.get<{ data: Paginated<MuridAkun> }>(`/admin/murid${q.toString() ? `?${q}` : ""}`),
      api.get<{ data: Paginated<Kelas> }>("/admin/kelas?per_page=100"),
    ])
      .then(([m, k]) => {
        setMurid(m.data.data ?? []);
        setKelasList(k.data.data ?? []);
      })
      .finally(() => setLoading(false));
  }

  // `search` sengaja TIDAK masuk dependency — pencarian hanya dipicu manual
  // lewat handleSearchSubmit (submit form/tombol Cari), bukan tiap ketikan.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, [paketFilter]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    load();
  }

  async function ubahKelas(m: MuridAkun, kelasId: string) {
    setSavingId(m.id);
    setNotice(null);
    try {
      await api.put(`/admin/murid/${m.id}`, { kelas_id: Number(kelasId) });
      setNotice({ type: "ok", text: `Kelas ${m.nama} diperbarui.` });
      load();
    } catch (err) {
      setNotice({ type: "error", text: err instanceof ApiError ? err.message : "Gagal memperbarui kelas." });
    } finally {
      setSavingId(null);
    }
  }

  async function nonaktifkan(m: MuridAkun) {
    if (!confirm(`Nonaktifkan akun murid ${m.nama}?`)) return;
    try {
      await api.del(`/admin/murid/${m.id}`);
      load();
    } catch (err) {
      setNotice({ type: "error", text: err instanceof ApiError ? err.message : "Gagal menonaktifkan murid." });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Kelola Murid</h1>
          <p className="text-sm text-slate-500">
            Pendaftar baru lewat website disetujui di{" "}
            <Link href="/admin/pendaftaran" className="text-teal-600 hover:underline">
              menu Pendaftaran
            </Link>
            . Untuk murid lama yang sudah terdaftar offline di sekolah, buat akunnya langsung di sini.
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
        >
          {showForm ? "Tutup Form" : "+ Tambah Murid"}
        </button>
      </div>

      {showForm && (
        <MuridForm
          kelasList={kelasList}
          prefill={prefillPendaftaran}
          onCreated={() => {
            setShowForm(false);
            setPrefillPendaftaran(null);
            load();
          }}
        />
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-2">
          {PAKET_OPTIONS.map((p) => (
            <button
              key={p || "semua"}
              onClick={() => setPaketFilter(p)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                paketFilter === p
                  ? "bg-teal-600 text-white"
                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              {p ? `Paket ${p}` : "Semua Paket"}
            </button>
          ))}
        </div>
        <form onSubmit={handleSearchSubmit} className="ml-auto flex gap-2">
          <input
            placeholder="Cari nama murid..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800"
          />
          <button className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300">
            Cari
          </button>
        </form>
      </div>

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
              <th className="p-4">NIS</th>
              <th className="p-4">Paket</th>
              <th className="p-4">Kelas</th>
              <th className="p-4">Status</th>
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody>
            {murid.map((m) => (
              <tr key={m.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                <td className="p-4">
                  <p className="font-medium text-slate-800 dark:text-white">{m.nama}</p>
                  <p className="text-xs text-slate-400">{m.email}</p>
                </td>
                <td className="p-4 text-slate-500">{m.nis ?? "-"}</td>
                <td className="p-4 text-slate-500">{m.muridProfile?.paket ? `Paket ${m.muridProfile.paket}` : "-"}</td>
                <td className="p-4">
                  <select
                    defaultValue={m.muridProfile?.kelas?.id ?? ""}
                    disabled={savingId === m.id}
                    onChange={(e) => e.target.value && ubahKelas(m, e.target.value)}
                    className="rounded-lg border border-slate-300 px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800"
                  >
                    <option value="">Belum ada kelas</option>
                    {kelasList
                      .filter((k) => !m.muridProfile?.paket || k.paket === m.muridProfile.paket)
                      .map((k) => (
                        <option key={k.id} value={k.id}>
                          {k.nama_kelas}
                        </option>
                      ))}
                  </select>
                </td>
                <td className="p-4">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                      m.status === "aktif" ? "bg-teal-100 text-teal-700" : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {m.status}
                  </span>
                </td>
                <td className="p-4">
                  {m.status === "aktif" && (
                    <button onClick={() => nonaktifkan(m)} className="text-xs font-medium text-rose-600 hover:underline">
                      Nonaktifkan
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!loading && murid.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-slate-400">
                  Belum ada akun murid.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function MuridForm({
  kelasList,
  prefill,
  onCreated,
}: {
  kelasList: Kelas[];
  prefill?: Pendaftaran | null;
  onCreated: () => void;
}) {
  const [nama, setNama] = useState(prefill?.nama ?? "");
  const [email, setEmail] = useState(prefill?.email ?? "");
  const [nis, setNis] = useState("");
  const [password, setPassword] = useState("");
  const [paket, setPaket] = useState<"A" | "B" | "C" | "">(prefill?.paket ?? "");
  const [kelasId, setKelasId] = useState("");
  const [tglLahir, setTglLahir] = useState(prefill?.tgl_lahir?.slice(0, 10) ?? "");
  const [alamat, setAlamat] = useState(prefill?.alamat ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ nama: string; nis: string; email: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await api.post<{ data: { nama: string; nis: string; email: string }; password_awal: string }>(
        "/admin/murid",
        {
          nama,
          email,
          nis,
          password,
          paket,
          kelas_id: kelasId ? Number(kelasId) : undefined,
          tgl_lahir: tglLahir || undefined,
          alamat: alamat || undefined,
          pendaftaran_id: prefill?.id,
        },
      );
      setCreated({ nama: res.data.nama, nis: res.data.nis, email: res.data.email, password: res.password_awal });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal menambah murid.");
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
        <h2 className="mt-2 font-semibold text-slate-800 dark:text-white">Akun murid {created.nama} berhasil dibuat</h2>
        <p className="mt-1 text-sm text-slate-500">
          Kredensial ini juga sudah dikirim ke email murid. Kalau perlu, catat/salin dulu sekarang — password tidak
          ditampilkan lagi setelah halaman ini ditutup.
        </p>
        <div className="mt-3 rounded-lg border border-teal-200 bg-teal-50 p-3 dark:border-teal-900 dark:bg-teal-950">
          <p className="text-xs text-slate-500">NIS</p>
          <p className="font-mono text-sm font-bold text-slate-800 dark:text-slate-100">{created.nis}</p>
          <p className="mt-2 text-xs text-slate-500">Email</p>
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
      {prefill && (
        <p className="mb-3 rounded-lg bg-teal-50 px-3 py-2 text-xs text-teal-700 dark:bg-teal-950 dark:text-teal-300">
          Formulir diisi otomatis dari pendaftaran <strong>{prefill.nama}</strong> yang sudah disetujui. Lengkapi NIS &
          password lalu simpan.
        </p>
      )}
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
          placeholder="NIS (sesuai sistem akademik)"
          value={nis}
          onChange={(e) => setNis(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
        />
        <div className="flex gap-2">
          <input
            required
            minLength={8}
            placeholder="Password (minimal 8 karakter)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
          />
          <button
            type="button"
            onClick={() => setPassword(buatPasswordAcak())}
            title="Buat password acak — masih bisa diedit manual sebelum disimpan"
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <Dices className="h-4 w-4" strokeWidth={2} />
            Buat Password Acak
          </button>
        </div>
        <select
          required
          value={paket}
          onChange={(e) => setPaket(e.target.value as "A" | "B" | "C")}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
        >
          <option value="">Pilih paket...</option>
          <option value="A">Paket A</option>
          <option value="B">Paket B</option>
          <option value="C">Paket C</option>
        </select>
        <select
          value={kelasId}
          onChange={(e) => setKelasId(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
        >
          <option value="">Kelas (opsional, bisa diatur nanti)</option>
          {kelasList
            .filter((k) => !paket || k.paket === paket)
            .map((k) => (
              <option key={k.id} value={k.id}>
                {k.nama_kelas}
              </option>
            ))}
        </select>
        <input
          type="date"
          value={tglLahir}
          onChange={(e) => setTglLahir(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
        />
        <input
          placeholder="Alamat (opsional)"
          value={alamat}
          onChange={(e) => setAlamat(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
        />
        {error && <p className="text-sm text-rose-600 sm:col-span-2">{error}</p>}
        <p className="text-xs text-slate-400 sm:col-span-2">
          NIS diisi sesuai data dari sistem akademik (bukan digenerate aplikasi). Password ini juga akan dikirim ke
          email murid dan ditampilkan sekali lagi setelah akun berhasil dibuat.
        </p>
        <button
          disabled={saving}
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60 sm:col-span-2"
        >
          {saving ? "Menyimpan..." : "Simpan Murid"}
        </button>
      </form>
    </Card>
  );
}
