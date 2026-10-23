"use client";

import { useEffect, useRef, useState } from "react";
import EmojiPicker, { Theme, type EmojiClickData } from "emoji-picker-react";
import { ThumbsUp, Heart, Laugh, Frown, HandHeart, Plus, type LucideIcon } from "lucide-react";
import type { DiskusiReaksiRingkas } from "@/lib/types";

/** Reaksi cepat gaya Facebook: ikon + warna per jenis, nilai "emoji" tetap dikirim ke API seperti semula. */
export const REACTIONS: { emoji: string; label: string; icon: LucideIcon; color: string }[] = [
  { emoji: "👍", label: "Suka", icon: ThumbsUp, color: "text-blue-600 dark:text-blue-400" },
  { emoji: "❤️", label: "Sayang", icon: Heart, color: "text-rose-600 dark:text-rose-400" },
  { emoji: "😂", label: "Haha", icon: Laugh, color: "text-amber-500 dark:text-amber-400" },
  { emoji: "😢", label: "Sedih", icon: Frown, color: "text-amber-600 dark:text-amber-500" },
  { emoji: "🙏", label: "Terima kasih", icon: HandHeart, color: "text-teal-600 dark:text-teal-400" },
];

/** Tombol "+" yang membuka picker emoji lengkap (gaya keyboard hp/laptop) untuk reaksi bebas. */
function EmojiPickerButton({ onPick }: { onPick: (emoji: string) => void }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleOutsideClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [open]);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title="Pilih emoji lain"
        className={`flex h-[26px] w-[26px] items-center justify-center rounded-full border transition ${
          open
            ? "border-teal-300 bg-teal-50 text-teal-700 dark:border-teal-800 dark:bg-teal-950 dark:text-teal-300"
            : "border-dashed border-slate-300 text-slate-400 hover:border-teal-300 hover:text-teal-600 dark:border-slate-600 dark:hover:border-teal-700 dark:hover:text-teal-400"
        }`}
      >
        <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
      </button>
      {open && (
        <div className="absolute bottom-full left-0 z-20 mb-2">
          <EmojiPicker
            onEmojiClick={(data: EmojiClickData) => {
              onPick(data.emoji);
              setOpen(false);
            }}
            theme={Theme.AUTO}
            width={280}
            height={320}
            previewConfig={{ showPreview: false }}
            lazyLoadEmojis
          />
        </div>
      )}
    </div>
  );
}

/**
 * Baris tombol reaksi cepat + picker emoji lengkap — dipakai baik untuk
 * komentar diskusi (DiskusiTab) maupun POST materi itu sendiri
 * (MateriFeedItem). TIDAK membungkus dengan div sendiri supaya pemanggil
 * bebas menaruhnya di baris apa pun (mis. digabung dengan tombol Hapus atau
 * jumlah komentar).
 */
export function ReaksiBar({ summary, onReact }: { summary: DiskusiReaksiRingkas[]; onReact: (emoji: string) => void }) {
  return (
    <>
      {REACTIONS.map(({ emoji, label, icon: Icon, color }) => {
        const found = summary.find((r) => r.emoji === emoji);
        return (
          <button
            key={emoji}
            onClick={() => onReact(emoji)}
            title={label}
            className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition ${
              found?.reacted
                ? "border-teal-300 bg-teal-50 dark:border-teal-800 dark:bg-teal-950"
                : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
            }`}
          >
            <Icon className={`h-3.5 w-3.5 ${color}`} strokeWidth={2} fill={Icon === Heart ? "currentColor" : "none"} />
            {found && found.count > 0 && <span className="text-slate-500">{found.count}</span>}
          </button>
        );
      })}
      <EmojiPickerButton onPick={onReact} />
    </>
  );
}
