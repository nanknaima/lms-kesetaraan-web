"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import type { KelasMapelKombinasi, KelasMapelTersediaResponse, PenugasanMengajar, StatusPenugasan } from "@/lib/types-guru";

const STATUS_STYLE: Record<StatusPenugasan, string> = {
  diajukan: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  disetujui: "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
  ditolak: "bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-300",
  dicabut: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
};

const STATUS_LABEL: Record<StatusPenugasan, string> = {
  diajukan: "Menunggu Persetujuan",
  disetujui: "Aktif",
  ditolak: "Ditolak",
  dicabut: "Dicabut",
};

const PAKET_LIST: ("A" | "B" | "C")[] = ["A", "B", "C"];

type Paket = "A" | "B" | "C";
type KombinasiDenganPaket = KelasMapelKombinasi & { paket: Paket };

export default function GuruKelasMapelSayaPage() {
  const [tersedia, setTersedia] = useState<KelasMapelTersediaResponse>({ A: [], B: [], C: [] });
  const [riwayat, setRiwayat] = useState<PenugasanMengajar[]>([]);
  const [loading, setLoading] = useState(true);
  const [ajukanId, setAjukanId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [paketAktif, setPaketAktif] = useState<Paket>("A");
  const [search, setSearch] = useState("");

  function load() {
    Promise.all([
      api.get<{ data: KelasMapelTersediaResponse }>("/guru/kelas-mapel-tersedia"),
      api.get<{ data: PenugasanMengajar[] }>("/guru/penugasan-saya"),
    ])
      .then(([t, r]) => {
        setTersedia(t.data ?? { A: [], B: [], C: [] });
        setRiwayat(r.data ?? []);
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function ajukan(kombinasi: KelasMapelKombinasi) {
    const key = `${kombinasi.kelas_id}-${kombinasi.mapel_id}`;
    const catatan = prompt(`Catatan untuk pengajuan ${kombinasi.nama_mapel} - ${kombinasi.nama_kelas} (opsional):`) ?? undefined;
    setAjukanId(key);
    setNotice(null);
    try {
      await api.post("/guru/penugasan-saya", {
        kelas_id: kombinasi.kelas_id,
        mapel_id: kombinasi.mapel_id,
        catatan_guru: catatan || undefined,
      });
      setNotice({ type: "ok", text: `Pengajuan ${kombinasi.nama_mapel} - ${kombinasi.nama_kelas} terkirim, menunggu persetujuan admin.` });
      load();
    } catch (err) {
      setNotice({ type: "error", text: err instanceof ApiError ? err.message : "Gagal mengajukan penugasan." });
    } finally {
      setAjukanId(null);
    }
  }

  // Semua kombinasi lintas paket, dengan `paket` disematkan ke tiap baris —
  // dibutuhkan panel "Ajukan Cepat" (kombobox kelas lintas paket) di bawah.
  const semuaKombinasi: KombinasiDenganPaket[] = useMemo(
    () => PAKET_LIST.flatMap((p) => (tersedia[p] ?? []).map((k) => ({ ...k, paket: p }))),
    [tersedia],
  );

  const kombinasiPaket = useMemo(() => tersedia[paketAktif] ?? [], [tersedia, paketAktif]);
  const kombinasiTerfilter = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return kombinasiPaket;
    return kombinasiPaket.filter((k) => k.nama_kelas.toLowerCase().includes(q) || k.nama_mapel.toLowerCase().includes(q));
  }, [kombinasiPaket, search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Kelas &amp; Mapel Saya</h1>
        <p className="text-sm text-slate-500">
          Ajukan diri untuk mengampu kombinasi kelas &amp; mata pelajaran yang masih kosong. Pengajuan menunggu
          persetujuan admin sebelum aktif.
        </p>
      </div>

      {notice && (
        <p className={`rounded-lg px-3 py-2 text-sm ${notice.type === "ok" ? "bg-teal-50 text-teal-700" : "bg-rose-50 text-rose-600"}`}>
          {notice.text}
        </p>
      )}

      <AjukanCepatPanel semuaKombinasi={semuaKombinasi} ajukanId={ajukanId} onAjukan={ajukan} />

      <Card>
        <p className="mb-3 font-semibold text-slate-800 dark:text-white">Cari &amp; Pilih dari Daftar</p>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {PAKET_LIST.map((p) => (
            <button
              key={p}
              onClick={() => setPaketAktif(p)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                paketAktif === p
                  ? "bg-teal-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              }`}
            >
              Paket {p}
            </button>
          ))}
          <form
            onSubmit={(e) => e.preventDefault()}
            className="ml-auto flex items-center gap-2"
          >
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" strokeWidth={2} />
              <input
                type="text"
                placeholder="Cari nama kelas atau mapel..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-56 rounded-lg border border-slate-300 py-1.5 pl-8 pr-3 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>
            <button
              type="submit"
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Cari
            </button>
          </form>
        </div>

        {loading ? (
          <p className="text-sm text-slate-400">Memuat...</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {kombinasiTerfilter.map((k) => {
              const key = `${k.kelas_id}-${k.mapel_id}`;
              return (
                <div
                  key={key}
                  className="flex items-center justify-between rounded-lg border border-slate-200 p-3 dark:border-slate-700"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-white">{k.nama_mapel}</p>
                    <p className="text-xs text-slate-500">{k.nama_kelas}</p>
                    {k.status === "terisi" && k.guru_pengampu && (
                      <p className="mt-0.5 text-xs text-slate-400">Diampu: {k.guru_pengampu.nama}</p>
                    )}
                  </div>
                  {k.status === "kosong" ? (
                    <button
                      disabled={ajukanId === key}
                      onClick={() => ajukan(k)}
                      className="shrink-0 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
                    >
                      {ajukanId === key ? "Mengirim..." : "Ajukan"}
                    </button>
                  ) : (
                    <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      Terisi
                    </span>
                  )}
                </div>
              );
            })}
            {kombinasiTerfilter.length === 0 && (
              <p className="text-sm text-slate-400 sm:col-span-2">
                {search.trim()
                  ? `Tidak ada kelas/mapel Paket ${paketAktif} yang cocok dengan "${search}".`
                  : `Belum ada kelas/mapel untuk Paket ${paketAktif}.`}
              </p>
            )}
          </div>
        )}
      </Card>

      <Card className="p-0">
        <p className="p-4 pb-0 font-semibold text-slate-800 dark:text-white">Riwayat Pengajuan Saya</p>
        <table className="mt-2 w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500 dark:border-slate-800">
              <th className="p-4">Mapel</th>
              <th className="p-4">Kelas</th>
              <th className="p-4">Status</th>
              <th className="p-4">Catatan</th>
            </tr>
          </thead>
          <tbody>
            {riwayat.map((r) => (
              <tr key={r.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                <td className="p-4 font-medium text-slate-800 dark:text-white">{r.mapel?.nama_mapel ?? "-"}</td>
                <td className="p-4 text-slate-500">{r.kelas?.nama_kelas ?? "-"}</td>
                <td className="p-4">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_STYLE[r.status]}`}>
                    {STATUS_LABEL[r.status]}
                  </span>
                </td>
                <td className="p-4 max-w-xs text-slate-500">
                  {r.status === "ditolak" && r.catatan_admin ? (
                    <span className="text-rose-600 dark:text-rose-400">{r.catatan_admin}</span>
                  ) : (
                    r.catatan_guru ?? "-"
                  )}
                </td>
              </tr>
            ))}
            {riwayat.length === 0 && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-slate-400">
                  Belum ada riwayat pengajuan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

/**
 * Panel "Ajukan Cepat" — dua kombobox yang bisa diketik manual (input+datalist,
 * bawaan HTML) untuk memilih kombinasi kelas+mapel tanpa harus gonta-ganti tab
 * Paket & scroll cari kartu. Kelas mencakup SEMUA paket (label menyertakan
 * paketnya, mis. "Kelas 1 (Paket C)") supaya nama yang sama di paket berbeda
 * tidak ambigu; pilihan Mapel menyesuaikan paket dari Kelas yang sudah dipilih.
 */
function AjukanCepatPanel({
  semuaKombinasi,
  ajukanId,
  onAjukan,
}: {
  semuaKombinasi: KombinasiDenganPaket[];
  ajukanId: string | null;
  onAjukan: (k: KelasMapelKombinasi) => void;
}) {
  const [kelasInput, setKelasInput] = useState("");
  const [mapelInput, setMapelInput] = useState("");

  const kelasOptions = useMemo(() => {
    const map = new Map<number, { kelasId: number; paket: Paket; label: string }>();
    semuaKombinasi.forEach((k) => {
      if (!map.has(k.kelas_id)) {
        map.set(k.kelas_id, { kelasId: k.kelas_id, paket: k.paket, label: `${k.nama_kelas} (Paket ${k.paket})` });
      }
    });
    return Array.from(map.values());
  }, [semuaKombinasi]);

  const kelasTerpilih = kelasOptions.find((o) => o.label.toLowerCase() === kelasInput.trim().toLowerCase());

  const mapelOptions = useMemo(() => {
    if (!kelasTerpilih) return [];
    const map = new Map<number, string>();
    semuaKombinasi
      .filter((k) => k.paket === kelasTerpilih.paket)
      .forEach((k) => map.set(k.mapel_id, k.nama_mapel));
    return Array.from(map.values());
  }, [semuaKombinasi, kelasTerpilih]);

  const targetKombinasi = kelasTerpilih
    ? semuaKombinasi.find(
        (k) =>
          k.kelas_id === kelasTerpilih.kelasId &&
          k.nama_mapel.toLowerCase() === mapelInput.trim().toLowerCase(),
      )
    : undefined;

  const valid = !!targetKombinasi && targetKombinasi.status === "kosong";
  const sudahMengetik = kelasInput.trim() !== "" && mapelInput.trim() !== "";
  const key = targetKombinasi ? `${targetKombinasi.kelas_id}-${targetKombinasi.mapel_id}` : "";

  return (
    <Card>
      <p className="mb-1 font-semibold text-slate-800 dark:text-white">Ajukan Cepat</p>
      <p className="mb-3 text-xs text-slate-500">Ketik atau pilih langsung nama kelas &amp; mata pelajaran.</p>
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <div>
          <input
            list="kelas-options"
            placeholder="Ketik/pilih kelas... (mis. Kelas 1 (Paket C))"
            value={kelasInput}
            onChange={(e) => {
              setKelasInput(e.target.value);
              setMapelInput("");
            }}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
          <datalist id="kelas-options">
            {kelasOptions.map((o) => (
              <option key={o.kelasId} value={o.label} />
            ))}
          </datalist>
        </div>
        <div>
          <input
            list="mapel-options"
            disabled={!kelasTerpilih}
            placeholder={kelasTerpilih ? "Ketik/pilih mapel..." : "Pilih kelas dulu"}
            value={mapelInput}
            onChange={(e) => setMapelInput(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
          <datalist id="mapel-options">
            {mapelOptions.map((nama) => (
              <option key={nama} value={nama} />
            ))}
          </datalist>
        </div>
        <button
          disabled={!valid || ajukanId === key}
          onClick={() => targetKombinasi && onAjukan(targetKombinasi)}
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
        >
          {ajukanId === key ? "Mengirim..." : "Ajukan"}
        </button>
      </div>
      {sudahMengetik && !valid && (
        <p className="mt-2 text-xs text-rose-600">
          Kombinasi tidak ditemukan{targetKombinasi?.status === "terisi" ? " — sudah diampu guru lain." : "."}
        </p>
      )}
    </Card>
  );
}
