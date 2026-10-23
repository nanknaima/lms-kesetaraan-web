"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import type { GuruAkun, Kelas, Mapel, Paginated } from "@/lib/types";
import type { PenugasanMengajar, StatusPenugasan } from "@/lib/types-guru";

const STATUS_STYLE: Record<StatusPenugasan, string> = {
  diajukan: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  disetujui: "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
  ditolak: "bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-300",
  dicabut: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
};

const STATUS_LABEL: Record<StatusPenugasan, string> = {
  diajukan: "Menunggu",
  disetujui: "Aktif",
  ditolak: "Ditolak",
  dicabut: "Dicabut",
};

export default function AdminPenugasanPage() {
  const [list, setList] = useState<PenugasanMengajar[]>([]);
  const [guruList, setGuruList] = useState<GuruAkun[]>([]);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [mapelList, setMapelList] = useState<Mapel[]>([]);
  const [filterStatus, setFilterStatus] = useState<StatusPenugasan | "">("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [notice, setNotice] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  function load() {
    const qs = filterStatus ? `?status=${filterStatus}` : "";
    api
      .get<{ data: PenugasanMengajar[] }>(`/admin/penugasan${qs}`)
      .then((r) => setList(r.data ?? []))
      .finally(() => setLoading(false));
  }

  useEffect(load, [filterStatus]);

  useEffect(() => {
    Promise.all([
      api.get<{ data: Paginated<GuruAkun> }>("/admin/guru?per_page=100"),
      api.get<{ data: Paginated<Kelas> }>("/admin/kelas?per_page=100"),
      api.get<{ data: Paginated<Mapel> }>("/admin/mapel?per_page=100"),
    ]).then(([g, k, m]) => {
      setGuruList(g.data.data ?? []);
      setKelasList(k.data.data ?? []);
      setMapelList(m.data.data ?? []);
    });
  }, []);

  async function setujui(row: PenugasanMengajar) {
    setProcessingId(row.id);
    try {
      await api.post(`/admin/penugasan/${row.id}/setujui`);
      setNotice({ type: "ok", text: `Penugasan ${row.guru?.nama} disetujui.` });
      load();
    } catch (err) {
      setNotice({ type: "error", text: err instanceof ApiError ? err.message : "Gagal menyetujui penugasan." });
    } finally {
      setProcessingId(null);
    }
  }

  async function tolak(row: PenugasanMengajar) {
    const catatan = prompt(`Alasan menolak pengajuan ${row.guru?.nama} untuk ${row.mapel?.nama_mapel} - ${row.kelas?.nama_kelas}:`);
    if (catatan === null) return;
    if (!catatan.trim()) {
      setNotice({ type: "error", text: "Alasan penolakan wajib diisi." });
      return;
    }
    setProcessingId(row.id);
    try {
      await api.post(`/admin/penugasan/${row.id}/tolak`, { catatan_admin: catatan.trim() });
      setNotice({ type: "ok", text: `Pengajuan ${row.guru?.nama} ditolak.` });
      load();
    } catch (err) {
      setNotice({ type: "error", text: err instanceof ApiError ? err.message : "Gagal menolak pengajuan." });
    } finally {
      setProcessingId(null);
    }
  }

  async function cabut(row: PenugasanMengajar) {
    if (!confirm(`Cabut penugasan ${row.guru?.nama} untuk ${row.mapel?.nama_mapel} - ${row.kelas?.nama_kelas}?`)) return;
    setProcessingId(row.id);
    try {
      await api.del(`/admin/penugasan/${row.id}`);
      setNotice({ type: "ok", text: `Penugasan ${row.guru?.nama} dicabut.` });
      load();
    } catch (err) {
      setNotice({ type: "error", text: err instanceof ApiError ? err.message : "Gagal mencabut penugasan." });
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Penugasan Guru</h1>
          <p className="text-sm text-slate-500">
            Kelola guru mana yang mengampu kombinasi kelas &amp; mata pelajaran mana — pengganti aturan lama &quot;1 guru = 1 mapel&quot;.
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
        >
          {showForm ? "Tutup Form" : "+ Tugaskan Guru"}
        </button>
      </div>

      {notice && (
        <p className={`rounded-lg px-3 py-2 text-sm ${notice.type === "ok" ? "bg-teal-50 text-teal-700" : "bg-rose-50 text-rose-600"}`}>
          {notice.text}
        </p>
      )}

      {showForm && (
        <TugaskanForm
          guruList={guruList}
          kelasList={kelasList}
          mapelList={mapelList}
          onDone={() => {
            setShowForm(false);
            load();
          }}
          onError={(text) => setNotice({ type: "error", text })}
        />
      )}

      <div className="flex flex-wrap gap-2">
        {(["", "diajukan", "disetujui", "ditolak", "dicabut"] as const).map((s) => (
          <button
            key={s || "semua"}
            onClick={() => setFilterStatus(s)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
              filterStatus === s
                ? "bg-teal-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            }`}
          >
            {s === "" ? "Semua" : STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      <Card className="p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500 dark:border-slate-800">
              <th className="p-4">Guru</th>
              <th className="p-4">Kelas</th>
              <th className="p-4">Mapel</th>
              <th className="p-4">Status</th>
              <th className="p-4">Diajukan Oleh</th>
              <th className="p-4">Catatan</th>
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody>
            {list.map((row) => (
              <tr key={row.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                <td className="p-4 font-medium text-slate-800 dark:text-white">{row.guru?.nama ?? "-"}</td>
                <td className="p-4 text-slate-500">{row.kelas?.nama_kelas ?? "-"}</td>
                <td className="p-4 text-slate-500">{row.mapel?.nama_mapel ?? "-"}</td>
                <td className="p-4">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_STYLE[row.status]}`}>
                    {STATUS_LABEL[row.status]}
                  </span>
                </td>
                <td className="p-4 text-slate-500 capitalize">{row.diajukan_oleh}</td>
                <td className="p-4 max-w-xs text-slate-500">
                  {row.status === "ditolak" && row.catatan_admin ? (
                    <span className="text-rose-600 dark:text-rose-400">{row.catatan_admin}</span>
                  ) : (
                    row.catatan_guru ?? row.catatan_admin ?? "-"
                  )}
                </td>
                <td className="p-4">
                  <div className="flex gap-2">
                    {row.status === "diajukan" && (
                      <>
                        <button
                          disabled={processingId === row.id}
                          onClick={() => setujui(row)}
                          className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
                        >
                          Setujui
                        </button>
                        <button
                          disabled={processingId === row.id}
                          onClick={() => tolak(row)}
                          className="rounded-lg border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-60"
                        >
                          Tolak
                        </button>
                      </>
                    )}
                    {row.status === "disetujui" && (
                      <button
                        disabled={processingId === row.id}
                        onClick={() => cabut(row)}
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-300"
                      >
                        Cabut
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!loading && list.length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-slate-400">
                  Tidak ada data penugasan untuk filter ini.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

/** Label guru unik (nama + NIP kalau ada) supaya nama yang sama tidak ambigu di datalist. */
function labelGuru(g: GuruAkun): string {
  return g.nip ? `${g.nama} (${g.nip})` : g.nama;
}

function TugaskanForm({
  guruList,
  kelasList,
  mapelList,
  onDone,
  onError,
}: {
  guruList: GuruAkun[];
  kelasList: Kelas[];
  mapelList: Mapel[];
  onDone: () => void;
  onError: (text: string) => void;
}) {
  const [guruInput, setGuruInput] = useState("");
  const [paket, setPaket] = useState<"A" | "B" | "C" | "">("");
  const [kelasInput, setKelasInput] = useState("");
  const [mapelInput, setMapelInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const kelasPaket = kelasList.filter((k) => k.paket === paket);
  const mapelPaket = mapelList.filter((m) => m.paket === paket);

  const guruTerpilih = guruList.find((g) => labelGuru(g).toLowerCase() === guruInput.trim().toLowerCase());
  const kelasTerpilih = kelasPaket.find((k) => k.nama_kelas.toLowerCase() === kelasInput.trim().toLowerCase());
  const mapelTerpilih = mapelPaket.find((m) => m.nama_mapel.toLowerCase() === mapelInput.trim().toLowerCase());

  const siapDisimpan = !!guruTerpilih && !!paket && !!kelasTerpilih && !!mapelTerpilih;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!guruTerpilih || !kelasTerpilih || !mapelTerpilih) {
      setError("Pilih guru, kelas, dan mapel yang valid dari daftar (bisa diketik untuk mencari).");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.post("/admin/penugasan", {
        guru_id: guruTerpilih.id,
        kelas_id: kelasTerpilih.id,
        mapel_id: mapelTerpilih.id,
      });
      onDone();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Gagal menugaskan guru.";
      setError(msg);
      onError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <p className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Tugaskan Guru ke Kelas &amp; Mapel</p>
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <input
            required
            list="admin-guru-options"
            placeholder="Ketik atau pilih nama guru..."
            value={guruInput}
            onChange={(e) => setGuruInput(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
          />
          <datalist id="admin-guru-options">
            {guruList.map((g) => (
              <option key={g.id} value={labelGuru(g)} />
            ))}
          </datalist>
        </div>
        <select
          required
          value={paket}
          onChange={(e) => {
            setPaket(e.target.value as "A" | "B" | "C");
            setKelasInput("");
            setMapelInput("");
          }}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 sm:col-span-2"
        >
          <option value="">Pilih paket...</option>
          <option value="A">Paket A</option>
          <option value="B">Paket B</option>
          <option value="C">Paket C</option>
        </select>
        <div>
          <input
            required
            list="admin-kelas-options"
            disabled={!paket}
            placeholder={paket ? "Ketik/pilih kelas..." : "Pilih paket dulu"}
            value={kelasInput}
            onChange={(e) => setKelasInput(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800"
          />
          <datalist id="admin-kelas-options">
            {kelasPaket.map((k) => (
              <option key={k.id} value={k.nama_kelas} />
            ))}
          </datalist>
        </div>
        <div>
          <input
            required
            list="admin-mapel-options"
            disabled={!paket}
            placeholder={paket ? "Ketik/pilih mapel..." : "Pilih paket dulu"}
            value={mapelInput}
            onChange={(e) => setMapelInput(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800"
          />
          <datalist id="admin-mapel-options">
            {mapelPaket.map((m) => (
              <option key={m.id} value={m.nama_mapel} />
            ))}
          </datalist>
        </div>
        {paket && (kelasInput.trim() || mapelInput.trim()) && !(kelasTerpilih && mapelTerpilih) && (
          <p className="text-xs text-amber-600 sm:col-span-2">Kelas/mapel belum cocok dengan data Paket {paket} — pilih dari saran yang muncul.</p>
        )}
        {error && <p className="text-sm text-rose-600 sm:col-span-2">{error}</p>}
        <button
          disabled={saving || !siapDisimpan}
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50 sm:col-span-2"
        >
          {saving ? "Menyimpan..." : "Tugaskan"}
        </button>
      </form>
    </Card>
  );
}
