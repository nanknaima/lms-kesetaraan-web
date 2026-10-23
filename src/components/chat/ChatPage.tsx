"use client";

import { useEffect, useRef, useState } from "react";
import {
  Send,
  Lock,
  MessageSquare,
  Search,
  X,
  MoreVertical,
  Pin,
  PinOff,
  Trash2,
  CheckSquare,
  Check,
  CheckCheck,
} from "lucide-react";
import { api } from "@/lib/api";
import { formatWaktu } from "@/lib/date";
import type { ChatKontak, ChatMessage } from "@/lib/types";

const POLL_KONTAK_MS = 8000;
const POLL_PESAN_MS = 4000;

function Avatar({ nama, avatarUrl, size = 44 }: { nama: string | null; avatarUrl: string | null; size?: number }) {
  const style = { width: size, height: size };
  if (avatarUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={avatarUrl} alt={nama ?? ""} className="shrink-0 rounded-full object-cover" style={style} />;
  }
  return (
    <div
      style={style}
      className="flex shrink-0 items-center justify-center rounded-full bg-teal-600 text-sm font-bold text-white"
    >
      {nama?.[0]?.toUpperCase() ?? "?"}
    </div>
  );
}

function formatWaktuKontak(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return formatWaktu(d);
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit" });
}

/**
 * Chat personal (1:1) murid<->guru/murid<->murid/guru<->guru — BUKAN forum
 * Diskusi per-mapel yang publik. Dipakai bareng oleh /murid/chat & /guru/chat
 * (endpoint backend & aturan siapa-boleh-chat-siapa sama untuk kedua role,
 * termasuk fitur pencarian/pin/hapus/centang dibaca di bawah — implementasi
 * SATU komponen ini dipakai berdua supaya keduanya benar-benar identik).
 * MVP polling (bukan websocket): daftar kontak tiap 8 detik, pesan dalam
 * obrolan yang sedang dibuka tiap 4 detik (dijeda saat mode pilih/hapus aktif
 * atau saat pencarian pesan aktif, supaya tidak mengganggu interaksi).
 */
export function ChatPage({ currentUserId }: { currentUserId?: number }) {
  const [kontak, setKontak] = useState<ChatKontak[] | null>(null);
  const [selected, setSelected] = useState<ChatKontak | null>(null);
  const [pesan, setPesan] = useState<ChatMessage[] | null>(null);
  const [teks, setTeks] = useState("");
  const [mengirim, setMengirim] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const [cariKontak, setCariKontak] = useState("");

  const [cariPesanAktif, setCariPesanAktif] = useState(false);
  const [cariPesanTeks, setCariPesanTeks] = useState("");

  const [menuTerbuka, setMenuTerbuka] = useState<number | null>(null);
  const [modePilih, setModePilih] = useState(false);
  const [terpilih, setTerpilih] = useState<Set<number>>(new Set());
  const [aksiError, setAksiError] = useState<string | null>(null);

  function loadKontak() {
    api
      .get<{ data: ChatKontak[] }>("/chat/kontak")
      .then((r) => setKontak(r.data))
      .catch(() => setKontak([]));
  }

  function loadPesan(lawanId: number, q?: string) {
    const qs = q ? `?q=${encodeURIComponent(q)}` : "";
    api
      .get<{ data: ChatMessage[] }>(`/chat/${lawanId}${qs}`)
      .then((r) => setPesan(r.data))
      .catch(() => setPesan([]));
  }

  useEffect(() => {
    loadKontak();
    const interval = setInterval(loadKontak, POLL_KONTAK_MS);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!selected) return;
    loadPesan(selected.id, cariPesanTeks || undefined);
    if (modePilih || cariPesanAktif) return;
    const interval = setInterval(() => loadPesan(selected.id), POLL_PESAN_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id, modePilih, cariPesanAktif]);

  // Debounce pencarian dalam percakapan — jangan tembak API di setiap ketukan huruf.
  useEffect(() => {
    if (!selected || !cariPesanAktif) return;
    const t = setTimeout(() => loadPesan(selected.id, cariPesanTeks || undefined), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cariPesanTeks]);

  /** Ganti kontak yang dipilih — pesan lama langsung dikosongkan di sini (event
   * handler klik, BUKAN di useEffect) supaya tidak sempat kelihatan pesan
   * kontak sebelumnya sekilas sebelum pesan kontak baru selesai dimuat. */
  function pilihKontak(k: ChatKontak) {
    setSelected(k);
    setPesan(null);
    setModePilih(false);
    setTerpilih(new Set());
    setMenuTerbuka(null);
    setCariPesanAktif(false);
    setCariPesanTeks("");
    setAksiError(null);
  }

  async function hapusPercakapan(k: ChatKontak) {
    if (!confirm(`Hapus seluruh percakapan dengan ${k.nama}? Riwayat ini akan hilang dari daftar Anda (${k.nama} tetap bisa melihatnya).`)) {
      return;
    }
    try {
      await api.post(`/chat/${k.id}/hapus-semua`);
      if (selected?.id === k.id) {
        setSelected(null);
        setPesan(null);
      }
      loadKontak();
    } catch {
      alert("Gagal menghapus percakapan.");
    }
  }

  useEffect(() => {
    if (!modePilih && !cariPesanAktif) bottomRef.current?.scrollIntoView({ block: "end" });
  }, [pesan, modePilih, cariPesanAktif]);

  async function kirim(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || !teks.trim() || mengirim) return;
    setMengirim(true);
    try {
      const res = await api.post<{ data: ChatMessage }>(`/chat/${selected.id}`, { pesan: teks.trim() });
      setPesan((prev) => [...(prev ?? []), res.data]);
      setTeks("");
      loadKontak();
    } catch {
      alert("Gagal mengirim pesan.");
    } finally {
      setMengirim(false);
    }
  }

  async function togglePin(p: ChatMessage) {
    if (!selected) return;
    setMenuTerbuka(null);
    try {
      await api.post(`/chat/${selected.id}/pesan/${p.id}/pin`);
      loadPesan(selected.id, cariPesanTeks || undefined);
    } catch {
      setAksiError("Gagal mengubah status pin.");
    }
  }

  async function hapus(ids: number[], mode: "for_me" | "for_everyone") {
    if (!selected || ids.length === 0) return;
    setMenuTerbuka(null);
    setAksiError(null);
    try {
      await api.post(`/chat/${selected.id}/hapus`, { ids, mode });
      setModePilih(false);
      setTerpilih(new Set());
      loadPesan(selected.id, cariPesanTeks || undefined);
      loadKontak();
    } catch (err) {
      setAksiError(err && typeof err === "object" && "message" in err ? String((err as Error).message) : "Gagal menghapus pesan.");
    }
  }

  function toggleTerpilih(id: number) {
    setTerpilih((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const kontakTersaring = (kontak ?? []).filter((k) =>
    (k.nama ?? "").toLowerCase().includes(cariKontak.trim().toLowerCase()),
  );

  const pesanDipin = (pesan ?? []).filter((p) => p.pinned && !p.dihapus_untuk_semua_at);
  const semuaTerpilihMilikSaya = [...terpilih].every(
    (id) => pesan?.find((p) => p.id === id)?.pengirim_id === currentUserId,
  );

  return (
    <div className="flex h-[75vh] min-h-[500px] overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      {/* Kontak — kiri */}
      <div className="flex w-full max-w-xs shrink-0 flex-col border-r border-slate-200 dark:border-slate-800">
        <div className="border-b border-slate-200 p-4 dark:border-slate-800">
          <h1 className="text-sm font-bold text-slate-800 dark:text-white">Chat</h1>
          <p className="text-xs text-slate-500">Obrolan personal, bukan forum diskusi.</p>
          <div className="relative mt-2.5">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" strokeWidth={2} />
            <input
              value={cariKontak}
              onChange={(e) => setCariKontak(e.target.value)}
              placeholder="Cari nama kontak..."
              className="w-full rounded-lg border-0 bg-slate-100 py-1.5 pl-8 pr-2 text-xs focus:outline-none focus:ring-2 focus:ring-teal-200 dark:bg-slate-800 dark:focus:ring-teal-900"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {kontak === null && <p className="p-4 text-sm text-slate-400">Memuat...</p>}
          {kontak !== null && kontak.length === 0 && (
            <p className="p-4 text-center text-sm text-slate-500">Belum ada kontak yang tersedia.</p>
          )}
          {kontak !== null && kontak.length > 0 && kontakTersaring.length === 0 && (
            <p className="p-4 text-center text-sm text-slate-500">Tidak ada kontak dengan nama itu.</p>
          )}
          {kontakTersaring.map((k) => (
            <div
              key={k.id}
              className={`group relative border-b border-slate-100 dark:border-slate-800 ${
                selected?.id === k.id ? "bg-teal-50 dark:bg-teal-950" : ""
              }`}
            >
              <button
                onClick={() => pilihKontak(k)}
                className="flex w-full items-center gap-3 px-4 py-3 pr-10 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <Avatar nama={k.nama} avatarUrl={k.avatar_url} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-slate-800 dark:text-white">{k.nama}</p>
                    {k.waktu_terakhir && (
                      <span className="shrink-0 text-[10px] text-slate-400">{formatWaktuKontak(k.waktu_terakhir)}</span>
                    )}
                  </div>
                  <p className="truncate text-xs text-slate-500">{k.pesan_terakhir ?? k.peran}</p>
                </div>
                {k.belum_dibaca > 0 && (
                  <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-teal-600 px-1 text-[10px] font-bold text-white">
                    {k.belum_dibaca}
                  </span>
                )}
              </button>
              {k.pesan_terakhir && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    hapusPercakapan(k);
                  }}
                  title="Hapus percakapan"
                  className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:text-slate-500 dark:hover:bg-rose-950"
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Percakapan — kanan */}
      <div className="flex min-w-0 flex-1 flex-col">
        {!selected ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-slate-400">
            <MessageSquare className="h-10 w-10" strokeWidth={1.5} />
            <p className="text-sm">Pilih kontak untuk mulai mengobrol.</p>
          </div>
        ) : (
          <>
            <div className="border-b border-slate-200 dark:border-slate-800">
              {!modePilih ? (
                <div className="flex items-center gap-3 px-4 py-3">
                  <Avatar nama={selected.nama} avatarUrl={selected.avatar_url} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800 dark:text-white">{selected.nama}</p>
                    <p className="truncate text-xs text-slate-500">{selected.peran}</p>
                  </div>
                  <button
                    onClick={() => {
                      setCariPesanAktif((v) => !v);
                      setCariPesanTeks("");
                    }}
                    title="Cari pesan"
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition ${
                      cariPesanAktif ? "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300" : "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <Search className="h-4 w-4" strokeWidth={2} />
                  </button>
                  <button
                    onClick={() => setModePilih(true)}
                    title="Pilih pesan"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <CheckSquare className="h-4 w-4" strokeWidth={2} />
                  </button>
                  <span className="hidden shrink-0 items-center gap-1 text-[10px] text-slate-400 sm:flex">
                    <Lock className="h-3 w-3" strokeWidth={2} />
                    Personal
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-3 px-4 py-3">
                  <button
                    onClick={() => {
                      setModePilih(false);
                      setTerpilih(new Set());
                    }}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <X className="h-4 w-4" strokeWidth={2} />
                  </button>
                  <p className="flex-1 text-sm font-semibold text-slate-700 dark:text-slate-200">{terpilih.size} dipilih</p>
                  <button
                    disabled={terpilih.size === 0}
                    onClick={() => hapus([...terpilih], "for_me")}
                    className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Hapus untuk saya
                  </button>
                  {semuaTerpilihMilikSaya && (
                    <button
                      disabled={terpilih.size === 0}
                      onClick={() => hapus([...terpilih], "for_everyone")}
                      className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-40 dark:hover:bg-rose-950"
                    >
                      Hapus untuk semua
                    </button>
                  )}
                </div>
              )}

              {cariPesanAktif && !modePilih && (
                <div className="relative px-4 pb-3">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" strokeWidth={2} />
                  <input
                    autoFocus
                    value={cariPesanTeks}
                    onChange={(e) => setCariPesanTeks(e.target.value)}
                    placeholder="Cari kata dalam percakapan ini..."
                    className="w-full rounded-lg border-0 bg-slate-100 py-1.5 pl-8 pr-2 text-xs focus:outline-none focus:ring-2 focus:ring-teal-200 dark:bg-slate-800 dark:focus:ring-teal-900"
                  />
                </div>
              )}
            </div>

            {pesanDipin.length > 0 && !cariPesanAktif && (
              <div className="flex items-start gap-2 border-b border-amber-100 bg-amber-50 px-4 py-2 text-xs dark:border-amber-950 dark:bg-amber-950/40">
                <Pin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" strokeWidth={2} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-amber-800 dark:text-amber-300">{pesanDipin[pesanDipin.length - 1].pesan}</p>
                  {pesanDipin.length > 1 && (
                    <p className="text-[10px] text-amber-600 dark:text-amber-500">+{pesanDipin.length - 1} pesan dipin lainnya</p>
                  )}
                </div>
              </div>
            )}

            {aksiError && (
              <p className="border-b border-rose-100 bg-rose-50 px-4 py-1.5 text-xs text-rose-600 dark:border-rose-950 dark:bg-rose-950/40">
                {aksiError}
              </p>
            )}

            <div className="flex-1 space-y-2 overflow-y-auto p-4">
              {pesan === null && <p className="text-sm text-slate-400">Memuat...</p>}
              {pesan !== null && pesan.length === 0 && (
                <p className="text-center text-sm text-slate-500">
                  {cariPesanTeks ? "Tidak ada pesan yang cocok." : "Belum ada pesan. Mulai obrolan Anda."}
                </p>
              )}
              {pesan?.map((p) => {
                const milikSaya = p.pengirim_id === currentUserId;
                const dihapusUntukSemua = !!p.dihapus_untuk_semua_at;
                return (
                  <div key={p.id} className={`group flex items-end gap-1.5 ${milikSaya ? "justify-end" : "justify-start"}`}>
                    {modePilih && (
                      <input
                        type="checkbox"
                        checked={terpilih.has(p.id)}
                        onChange={() => toggleTerpilih(p.id)}
                        className="mb-1.5 h-4 w-4 shrink-0 accent-teal-600"
                      />
                    )}
                    <div className={`relative max-w-[75%] ${milikSaya ? "order-2" : ""}`}>
                      <div
                        className={`rounded-2xl px-3.5 py-2 text-sm ${
                          dihapusUntukSemua
                            ? "italic text-slate-400 " + (milikSaya ? "rounded-br-sm bg-slate-100 dark:bg-slate-800" : "rounded-bl-sm bg-slate-100 dark:bg-slate-800")
                            : milikSaya
                              ? "rounded-br-sm bg-teal-600 text-white"
                              : "rounded-bl-sm bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        }`}
                      >
                        <p className="whitespace-pre-line">{dihapusUntukSemua ? "Pesan telah dihapus" : p.pesan}</p>
                        <div className={`mt-1 flex items-center gap-1 text-[10px] ${milikSaya ? "text-teal-100" : "text-slate-400"}`}>
                          {p.pinned && !dihapusUntukSemua && <Pin className="h-2.5 w-2.5" strokeWidth={2.5} />}
                          <span>{formatWaktu(p.created_at)}</span>
                          {milikSaya &&
                            !dihapusUntukSemua &&
                            (p.dibaca_at ? (
                              <CheckCheck className="h-3 w-3" strokeWidth={2} />
                            ) : (
                              <Check className="h-3 w-3" strokeWidth={2} />
                            ))}
                        </div>
                      </div>

                      {!dihapusUntukSemua && !modePilih && (
                        <button
                          onClick={() => setMenuTerbuka(menuTerbuka === p.id ? null : p.id)}
                          className={`absolute top-0 flex h-6 w-6 items-center justify-center rounded-full bg-white text-slate-400 opacity-0 shadow ring-1 ring-slate-200 transition group-hover:opacity-100 dark:bg-slate-900 dark:ring-slate-700 ${
                            milikSaya ? "-left-7" : "-right-7"
                          }`}
                        >
                          <MoreVertical className="h-3.5 w-3.5" strokeWidth={2} />
                        </button>
                      )}

                      {menuTerbuka === p.id && (
                        <div
                          className={`absolute z-10 top-6 w-44 rounded-xl border border-slate-200 bg-white py-1 text-xs shadow-lg dark:border-slate-700 dark:bg-slate-900 ${
                            milikSaya ? "right-0" : "left-0"
                          }`}
                        >
                          <button
                            onClick={() => togglePin(p)}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                          >
                            {p.pinned ? <PinOff className="h-3.5 w-3.5" strokeWidth={2} /> : <Pin className="h-3.5 w-3.5" strokeWidth={2} />}
                            {p.pinned ? "Lepas pin" : "Pin pesan"}
                          </button>
                          <button
                            onClick={() => hapus([p.id], "for_me")}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                          >
                            <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                            Hapus untuk saya
                          </button>
                          {milikSaya && (
                            <button
                              onClick={() => hapus([p.id], "for_everyone")}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950"
                            >
                              <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                              Hapus untuk semua orang
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setMenuTerbuka(null);
                              setModePilih(true);
                              setTerpilih(new Set([p.id]));
                            }}
                            className="flex w-full items-center gap-2 border-t border-slate-100 px-3 py-2 text-left text-slate-500 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
                          >
                            <CheckSquare className="h-3.5 w-3.5" strokeWidth={2} />
                            Pilih beberapa pesan...
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            <form onSubmit={kirim} className="flex items-center gap-2 border-t border-slate-200 p-3 dark:border-slate-800">
              <input
                value={teks}
                onChange={(e) => setTeks(e.target.value)}
                placeholder="Tulis pesan..."
                className="min-w-0 flex-1 rounded-full border-0 bg-slate-100 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200 dark:bg-slate-800 dark:focus:ring-teal-900"
              />
              <button
                type="submit"
                disabled={mengirim || !teks.trim()}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-600 text-white transition hover:bg-teal-700 disabled:opacity-50"
              >
                <Send className="h-4 w-4" strokeWidth={2} />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
