"use client";

import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { formatRelatif } from "@/lib/date";
import { MateriAttachment, type MateriLampiran } from "./MateriAttachment";
import { ReaksiBar } from "./ReaksiBar";
import { DiskusiTab } from "./DiskusiTab";
import type { DiskusiReaksiRingkas } from "@/lib/types";

function AvatarGuru({ nama, avatarUrl }: { nama: string; avatarUrl?: string | null }) {
  if (avatarUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={avatarUrl} alt={nama} className="h-10 w-10 shrink-0 rounded-full object-cover" />;
  }
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-100 text-sm font-bold text-teal-700 dark:bg-teal-900 dark:text-teal-300">
      {nama?.[0]?.toUpperCase() ?? "?"}
    </div>
  );
}

interface MateriFeedable extends MateriLampiran {
  judul: string;
  deskripsi: string | null;
  created_at: string;
  diskusi_count?: number;
  reaksi_summary?: DiskusiReaksiRingkas[];
}

/**
 * Satu "post" di feed diskusi — materi yang diunggah guru, dengan lampiran
 * (tombol Unduh / pemutar video) dan thread komentar langsung menempel di
 * bawahnya (SELALU terbuka, bukan expand/collapse) supaya murid/guru bisa
 * mengunduh & berdiskusi tanpa harus mencari-cari, gaya feed media sosial.
 * `endpointBase`/`trackWatch` diteruskan ke MateriAttachment supaya sisi
 * guru memakai /guru/materi/... (tanpa pencatatan absensi-otomatis).
 */
export function MateriFeedItem({
  materi,
  posterNama,
  posterAvatarUrl,
  currentUserId,
  endpointBase,
  trackWatch,
}: {
  materi: MateriFeedable;
  posterNama: string;
  posterAvatarUrl?: string | null;
  currentUserId?: number;
  endpointBase?: string;
  trackWatch?: boolean;
}) {
  const [reaksiSummary, setReaksiSummary] = useState<DiskusiReaksiRingkas[]>(materi.reaksi_summary ?? []);

  async function reaksiMateri(emoji: string) {
    try {
      const res = await api.post<{ data: DiskusiReaksiRingkas[] }>(`/materi/${materi.id}/reaksi`, { emoji });
      setReaksiSummary(res.data);
    } catch {
      // reaksi gagal — biarkan tampilan tetap seperti semula, tanpa mengganggu alur diskusi
    }
  }

  return (
    <Card className="p-3.5">
      <div className="flex items-start gap-2.5">
        <AvatarGuru nama={posterNama} avatarUrl={posterAvatarUrl} />
        <div className="min-w-0 flex-1">
          <p className="text-sm text-slate-700 dark:text-slate-200">
            <span className="font-semibold text-slate-900 dark:text-white">{posterNama}</span> menambahkan materi{" "}
            <span className="font-semibold text-teal-700 dark:text-teal-400">{materi.judul}</span>
          </p>
          <p className="mt-0.5 text-xs text-slate-400">{formatRelatif(materi.created_at)}</p>

          {materi.deskripsi && (
            <p className="mt-2 whitespace-pre-line text-sm text-slate-600 dark:text-slate-300">{materi.deskripsi}</p>
          )}

          <MateriAttachment materi={materi} endpointBase={endpointBase} trackWatch={trackWatch} />

          <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-2 dark:border-slate-800">
            <ReaksiBar summary={reaksiSummary} onReact={reaksiMateri} />
            <span className="ml-auto flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400">
              <MessageSquare className="h-3.5 w-3.5" strokeWidth={2} />
              {materi.diskusi_count ? `${materi.diskusi_count} Komentar` : "Belum ada komentar"}
            </span>
          </div>

          <div className="mt-2">
            <DiskusiTab materiId={materi.id} currentUserId={currentUserId} />
          </div>
        </div>
      </div>
    </Card>
  );
}
