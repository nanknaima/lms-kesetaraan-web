"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { MateriAttachment, TIPE_ICON, TIPE_LABEL } from "@/components/mapel/MateriAttachment";
import type { MateriMurid, Paginated } from "@/lib/types";

/**
 * Tab "Materi" pada halaman detail mapel — daftar cepat berkas belajar per
 * mapel (tanpa thread komentar; diskusi lengkap gaya feed ada di tab
 * "Diskusi", lihat DiskusiFeedTab).
 */
export function MateriTab({ mapelId }: { mapelId: number; currentUserId?: number }) {
  const [materi, setMateri] = useState<MateriMurid[] | null>(null);

  useEffect(() => {
    api
      .get<{ data: Paginated<MateriMurid> }>(`/murid/materi?mapel_id=${mapelId}`)
      .then((r) => setMateri(r.data.data))
      .catch(() => setMateri([]));
  }, [mapelId]);

  return (
    <div className="space-y-2.5">
      {materi === null && <p className="text-sm text-slate-400">Memuat materi...</p>}
      {materi !== null && materi.length === 0 && (
        <Card className="text-center text-sm text-slate-500">Belum ada materi untuk mapel ini.</Card>
      )}

      {materi?.map((m) => {
        const Icon = TIPE_ICON[m.tipe];
        return (
          <Card key={m.id} className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300">
              <Icon className="h-5 w-5" strokeWidth={2} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-semibold text-slate-800 dark:text-white">{m.judul}</p>
                <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-500 dark:bg-slate-800">
                  {TIPE_LABEL[m.tipe]}
                </span>
              </div>

              {m.deskripsi && (
                <p className="mt-0.5 whitespace-pre-line text-xs text-slate-500">{m.deskripsi}</p>
              )}

              <MateriAttachment materi={m} />
            </div>
          </Card>
        );
      })}
    </div>
  );
}
