"use client";

import { User as UserIcon, BadgeCheck, Image as ImageIcon, Settings, HelpCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { ProfilMenu } from "@/components/profile/ProfilMenu";

const ITEMS = [
  { href: "/murid/kelola-profil", label: "Kelola Profil", desc: "Ganti foto, nama, bio, dan password", icon: UserIcon },
  { href: "/murid/kartu-siswa", label: "Kartu Studi", desc: "Kartu identitas murid, bisa dicetak", icon: BadgeCheck },
  { href: "/murid/media-library", label: "Media Library", desc: "File yang sudah Anda unggah", icon: ImageIcon },
  { href: "/murid/pengaturan", label: "Pengaturan", desc: "Ganti password & hapus akun", icon: Settings },
  { href: "/murid/bantuan", label: "Bantuan dan Dukungan", desc: "Pertanyaan yang sering diajukan", icon: HelpCircle },
];

/** Halaman ringkasan Profil murid — identitas + menu, meniru mobile/lib/features/murid/profil_screen.dart. */
export default function MuridProfilPage() {
  const { user, loading } = useAuth("murid");

  if (loading || !user) return <p className="text-sm text-slate-400">Memuat...</p>;

  return (
    <div>
      <h1 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">Profil</h1>
      <ProfilMenu user={user} kelolaProfilHref="/murid/kelola-profil" items={ITEMS} />
    </div>
  );
}
