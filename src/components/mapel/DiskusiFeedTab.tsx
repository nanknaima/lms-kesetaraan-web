"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { MateriFeedItem } from "./MateriFeedItem";
import { DiskusiTab } from "./DiskusiTab";
import type { MateriMurid, Paginated } from "@/lib/types";

/**
 * Tab "Diskusi" pada halaman detail mapel murid — feed gaya media sosial:
 * tiap materi yang diunggah guru tampil sebagai post lengkap dengan lampiran
 * (tombol Unduh / pemutar video) dan thread komentarnya langsung di
 * bawahnya, plus ruang diskusi umum (tidak terikat materi tertentu) di
 * bagian paling bawah.
 */
export function DiskusiFeedTab({ mapelId, currentUserId }: { mapelId: number; currentUserId?: number }) {
  const [materi, setMateri] = useState<MateriMurid[] | null>(null);

  useEffect(() => {
    api
      .get<{ data: Paginated<MateriMurid> }>(`/murid/materi?mapel_id=${mapelId}`)
      .then((r) => setMateri(r.data.data))
      .catch(() => setMateri([]));
  }, [mapelId]);

  return (
    <div className="space-y-3">
      {materi === null && <p className="text-sm text-slate-400">Memuat diskusi...</p>}
      {materi !== null && materi.length === 0 && (
        <Card className="text-center text-sm text-slate-500">Belum ada materi yang diunggah guru untuk mapel ini.</Card>
      )}

      {materi?.map((m) => (
        <MateriFeedItem
          key={m.id}
          materi={m}
          posterNama={m.guru?.nama ?? "Guru"}
          posterAvatarUrl={m.guru?.avatar_url}
          currentUserId={currentUserId}
        />
      ))}

      <div className="pt-2">
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Diskusi Umum</h3>
        <DiskusiTab mapelId={mapelId} currentUserId={currentUserId} />
      </div>
    </div>
  );
}
