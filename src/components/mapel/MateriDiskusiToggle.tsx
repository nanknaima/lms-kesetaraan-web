"use client";

import { useEffect, useRef, useState } from "react";
import { MessageSquare, ChevronDown, ChevronUp } from "lucide-react";
import { DiskusiTab } from "./DiskusiTab";

/**
 * Panel diskusi yang bisa expand/collapse, menempel langsung di bawah satu
 * item materi (bukan tab terpisah) — dipakai di daftar materi guru MAUPUN
 * murid. `defaultOpen` dipakai guru setelah upload materi baru supaya
 * panelnya langsung terbuka (dan halaman scroll ke sana) tanpa guru perlu
 * cari-cari dulu — lihat pemakaian di guru/materi/page.tsx.
 */
export function MateriDiskusiToggle({
  materiId,
  commentCount,
  currentUserId,
  defaultOpen = false,
}: {
  materiId: number;
  commentCount?: number;
  currentUserId?: number;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (defaultOpen) {
      wrapperRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    // Hanya perlu jalan sekali saat mount (baris materi baru selalu mount fresh berkat key={m.id}).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={wrapperRef} className="mt-2 border-t border-slate-100 pt-2 dark:border-slate-800">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs font-semibold text-teal-600 hover:underline"
      >
        <MessageSquare className="h-3.5 w-3.5" strokeWidth={2} />
        Diskusi{commentCount ? ` (${commentCount} komentar)` : ""}
        {open ? <ChevronUp className="h-3 w-3" strokeWidth={2.5} /> : <ChevronDown className="h-3 w-3" strokeWidth={2.5} />}
      </button>
      {open && (
        <div className="mt-2">
          <DiskusiTab materiId={materiId} currentUserId={currentUserId} />
        </div>
      )}
    </div>
  );
}
