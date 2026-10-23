"use client";

import { User as UserIcon, Settings, HelpCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { ProfilMenu } from "@/components/profile/ProfilMenu";

const ITEMS = [
  { href: "/admin/kelola-profil", label: "Kelola Profil", desc: "Ganti foto, nama, bio, dan password", icon: UserIcon },
  { href: "/admin/pengaturan", label: "Pengaturan", desc: "Ganti password & hapus akun", icon: Settings },
  { href: "/admin/bantuan", label: "Bantuan dan Dukungan", desc: "Pertanyaan yang sering diajukan", icon: HelpCircle },
];

/** Halaman ringkasan Profil admin — pola sama dengan murid/guru (Kartu Studi & Media Library tidak relevan untuk admin). */
export default function AdminProfilPage() {
  const { user, loading } = useAuth("admin");

  if (loading || !user) return <p className="text-sm text-slate-400">Memuat...</p>;

  return (
    <div>
      <h1 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">Profil</h1>
      <ProfilMenu user={user} kelolaProfilHref="/admin/kelola-profil" items={ITEMS} />
    </div>
  );
}
