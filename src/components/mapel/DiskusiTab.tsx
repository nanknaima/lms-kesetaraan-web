"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { formatTanggalWaktu } from "@/lib/date";
import { ReaksiBar } from "./ReaksiBar";
import type { Diskusi, DiskusiReaksiRingkas, Paginated } from "@/lib/types";

function Avatar({ nama, avatarUrl }: { nama: string; avatarUrl: string | null }) {
  if (avatarUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={avatarUrl} alt={nama} className="h-9 w-9 shrink-0 rounded-full object-cover" />;
  }
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-100 text-sm font-bold text-teal-700 dark:bg-teal-900 dark:text-teal-300">
      {nama?.[0]?.toUpperCase() ?? "?"}
    </div>
  );
}

/**
 * Feed komentar + reaksi emoji — diskusi per MATERI (kirim `materiId`) atau
 * per MAPEL secara umum (kirim `mapelId`, dipakai tab "Diskusi" di halaman
 * detail mapel). Kirim salah satu; `materiId` diprioritaskan kalau keduanya ada.
 */
export function DiskusiTab({
  mapelId,
  materiId,
  currentUserId,
}: {
  mapelId?: number;
  materiId?: number;
  currentUserId?: number;
}) {
  const [items, setItems] = useState<Diskusi[] | null>(null);
  const [pesan, setPesan] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const queryParam = materiId ? `materi_id=${materiId}` : `mapel_id=${mapelId}`;

  useEffect(() => {
    api
      .get<{ data: Paginated<Diskusi> }>(`/diskusi?${queryParam}`)
      .then((r) => setItems(r.data.data))
      .catch(() => setItems([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [materiId, mapelId]);

  async function kirim(e: React.FormEvent) {
    e.preventDefault();
    if (!pesan.trim()) return;
    setSending(true);
    setError(null);
    try {
      const res = await api.post<{ data: Diskusi }>("/diskusi", {
        ...(materiId ? { materi_id: materiId } : { mapel_id: mapelId }),
        pesan: pesan.trim(),
      });
      setItems((prev) => [...(prev ?? []), res.data]);
      setPesan("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal mengirim komentar.");
    } finally {
      setSending(false);
    }
  }

  async function reaksi(diskusiId: number, emoji: string) {
    try {
      const res = await api.post<{ data: DiskusiReaksiRingkas[] }>(`/diskusi/${diskusiId}/reaksi`, { emoji });
      setItems((prev) => prev?.map((it) => (it.id === diskusiId ? { ...it, reaksi_summary: res.data } : it)) ?? prev);
    } catch {
      // reaksi gagal — biarkan tampilan tetap seperti semula, tanpa mengganggu alur diskusi
    }
  }

  async function hapus(diskusiId: number) {
    if (!confirm("Hapus komentar ini?")) return;
    try {
      await api.del(`/diskusi/${diskusiId}`);
      setItems((prev) => prev?.filter((it) => it.id !== diskusiId) ?? prev);
    } catch {
      alert("Gagal menghapus komentar.");
    }
  }

  return (
    <div className="space-y-3">
      {items === null && <p className="text-sm text-slate-400">Memuat diskusi...</p>}

      {items !== null && items.length === 0 && (
        <Card className="text-center text-sm text-slate-500">Belum ada diskusi. Jadilah yang pertama bertanya!</Card>
      )}

      <div className="space-y-3">
        {items?.map((item) => (
          <Card key={item.id} className="p-3.5">
            <div className="flex items-start gap-2.5">
              <Avatar nama={item.user.nama} avatarUrl={item.user.avatar_url} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-semibold text-slate-800 dark:text-white">{item.user.nama}</p>
                  {item.user.role !== "murid" && (
                    <span className="rounded-full bg-teal-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-teal-700 dark:bg-teal-900 dark:text-teal-300">
                      {item.user.role}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 whitespace-pre-line text-sm text-slate-700 dark:text-slate-200">{item.pesan}</p>
                <p className="mt-1 text-[11px] text-slate-400">{formatTanggalWaktu(item.created_at)}</p>

                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <ReaksiBar summary={item.reaksi_summary ?? []} onReact={(emoji) => reaksi(item.id, emoji)} />
                  {currentUserId === item.user_id && (
                    <button
                      onClick={() => hapus(item.id)}
                      className="ml-auto text-[11px] font-medium text-rose-500 hover:underline"
                    >
                      Hapus
                    </button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <form onSubmit={kirim} className="sticky bottom-0 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <input
          value={pesan}
          onChange={(e) => setPesan(e.target.value)}
          placeholder="Tulis komentar atau pertanyaan..."
          className="min-w-0 flex-1 rounded-xl border-0 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-100 dark:bg-slate-800 dark:focus:ring-teal-900"
        />
        <button
          type="submit"
          disabled={sending || !pesan.trim()}
          className="shrink-0 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-50"
        >
          {sending ? "..." : "Kirim"}
        </button>
      </form>
      {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-950">{error}</p>}
    </div>
  );
}
