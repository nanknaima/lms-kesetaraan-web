"use client";

import { User as UserIcon, Image as ImageIcon, Settings, HelpCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { ProfilMenu } from "@/components/profile/ProfilMenu";

const ITEMS = [
  { href: "/guru/kelola-profil", label: "Kelola Profil", desc: "Ganti foto, nama, bio, dan password", icon: UserIcon },
  { href: "/guru/media-library", label: "Media Library", desc: "File materi & lampiran tugas yang Anda unggah", icon: ImageIcon },
  { href: "/guru/pengaturan", label: "Pengaturan", desc: "Ganti password & hapus akun", icon: Settings },
  { href: "/guru/bantuan", label: "Bantuan dan Dukungan", desc: "Pertanyaan yang sering diajukan", icon: HelpCircle },
];

/** Halaman ringkasan Profil guru — sama seperti murid tapi tanpa "Kartu Studi" (khusus identitas murid). */
export default function GuruProfilPage() {
  const { user, loading } = useAuth("guru");

  if (loading || !user) return <p className="text-sm text-slate-400">Memuat...</p>;

  return (
    <div>
      <h1 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">Profil</h1>
      <ProfilMenu user={user} kelolaProfilHref="/guru/kelola-profil" items={ITEMS} />
    </div>
  );
}
