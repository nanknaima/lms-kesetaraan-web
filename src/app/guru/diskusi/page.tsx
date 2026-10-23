"use client";

import { Suspense, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { PenugasanAktifBanner, TanpaPenugasanAktif } from "@/components/PenugasanAktifBanner";
import { usePenugasanAktif } from "@/hooks/usePenugasanAktif";
import { useAuth } from "@/hooks/useAuth";
import { MateriFeedItem } from "@/components/mapel/MateriFeedItem";
import type { MateriGuru, Paginated } from "@/lib/types-guru";

/**
 * Tab "Diskusi" guru — feed gaya media sosial: setiap materi yang guru
 * unggah tampil sebagai post lengkap dengan lampiran (Unduh/putar video) dan
 * thread komentar murid langsung di bawahnya, supaya guru bisa langsung
 * membalas tanpa berpindah halaman. Cerminan dari tab Diskusi milik murid.
 */
export default function GuruDiskusiPage() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-400">Memuat...</p>}>
      <GuruDiskusiPageInner />
    </Suspense>
  );
}

function GuruDiskusiPageInner() {
  const { aktif, ready } = usePenugasanAktif();
  const { user } = useAuth("guru");
  const [materi, setMateri] = useState<MateriGuru[] | null>(null);

  useEffect(() => {
    if (!aktif) return;
    api
      .get<{ data: Paginated<MateriGuru> }>(`/guru/materi?per_page=50&kelas_id=${aktif.kelasId}`)
      .then((r) => setMateri(r.data.data ?? []))
      .catch(() => setMateri([]));
  }, [aktif]);

  if (ready && !aktif) return <TanpaPenugasanAktif />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Diskusi</h1>
        <p className="text-sm text-slate-500">Materi yang Anda unggah beserta diskusi murid — balas langsung di sini.</p>
      </div>

      {aktif && <PenugasanAktifBanner aktif={aktif} />}

      <div className="space-y-3">
        {materi === null && <p className="text-sm text-slate-400">Memuat diskusi...</p>}
        {materi !== null && materi.length === 0 && (
          <Card className="text-center text-sm text-slate-500">Belum ada materi yang diunggah untuk kelas ini.</Card>
        )}

        {materi?.map((m) => (
          <MateriFeedItem
            key={m.id}
            materi={m}
            posterNama={user?.nama ?? "Anda"}
            posterAvatarUrl={user?.avatar_url}
            currentUserId={user?.id}
            endpointBase="/guru/materi"
            trackWatch={false}
          />
        ))}
      </div>
    </div>
  );
}
