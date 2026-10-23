"use client";

import { useState } from "react";
import { ChevronDown, HeadphonesIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";

const FAQ_MURID = [
  { q: "Bagaimana cara mengumpulkan tugas?", a: "Buka menu Tugas di sidebar, pilih tugas yang ingin dikumpulkan, lalu unggah jawaban Anda sebelum deadline." },
  { q: "Kenapa nama saya gagal diubah?", a: "Pastikan koneksi internet stabil, lalu coba lagi dari menu Kelola Profil. Jika masih gagal, hubungi admin sekolah." },
  { q: "Bagaimana cara reset password?", a: "Gunakan menu Pengaturan untuk ganti password. Jika lupa password lama, hubungi admin sekolah lewat halaman login." },
  { q: "Kapan rapor bisa dicetak?", a: "Rapor resmi tetap dokumen fisik dari sekolah. Kartu Studi di halaman ini bisa dicetak/disimpan sebagai PDF sendiri sebagai identitas murid." },
] as const;

const FAQ_GURU = [
  { q: "Bagaimana cara menilai tugas murid?", a: "Buka menu Tugas, pilih tugas yang ingin dinilai, lalu buka submission tiap murid untuk memberi nilai & feedback." },
  { q: "Kenapa nama saya gagal diubah?", a: "Pastikan koneksi internet stabil, lalu coba lagi dari menu Kelola Profil. Jika masih gagal, hubungi admin sekolah." },
  { q: "Bagaimana cara reset password?", a: "Gunakan menu Pengaturan untuk ganti password. Jika lupa password lama, hubungi admin sekolah lewat halaman login." },
] as const;

const FAQ_ADMIN = [
  { q: "Bagaimana cara menyetujui pendaftaran murid baru?", a: "Buka menu Pendaftaran, tinjau data pendaftar, lalu Setujui atau Tolak. Setelah disetujui, buat akun resminya lewat menu Murid." },
  { q: "Bagaimana cara reset password akun saya?", a: "Gunakan menu Pengaturan untuk ganti password." },
] as const;

/** "Bantuan dan Dukungan" — konten FAQ statis, meniru mobile/lib/features/murid/bantuan_screen.dart. */
export function BantuanContent({ role }: { role: "murid" | "guru" | "admin" }) {
  const faqs = role === "murid" ? FAQ_MURID : role === "guru" ? FAQ_GURU : FAQ_ADMIN;
  const [terbuka, setTerbuka] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold text-slate-900 dark:text-white">Bantuan dan Dukungan</h1>
        <p className="text-sm text-slate-500">Pertanyaan yang sering diajukan.</p>
      </div>

      <div className="space-y-2">
        {faqs.map((f, i) => (
          <Card key={i} className="p-0">
            <button
              onClick={() => setTerbuka(terbuka === i ? null : i)}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
            >
              <p className="text-sm font-semibold text-slate-800 dark:text-white">{f.q}</p>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${terbuka === i ? "rotate-180" : ""}`}
                strokeWidth={2}
              />
            </button>
            {terbuka === i && <p className="px-4 pb-4 text-sm text-slate-600 dark:text-slate-300">{f.a}</p>}
          </Card>
        ))}
      </div>

      <Card className="flex items-center gap-3 bg-teal-50 dark:bg-teal-950">
        <HeadphonesIcon className="h-5 w-5 shrink-0 text-teal-700 dark:text-teal-300" strokeWidth={2} />
        <p className="text-sm text-teal-700 dark:text-teal-300">
          Kendala lain di luar FAQ di atas? Hubungi admin sekolah langsung.
        </p>
      </Card>
    </div>
  );
}
