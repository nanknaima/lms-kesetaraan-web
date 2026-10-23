"use client";

import { Sidebar, type NavItem } from "@/components/ui/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard,
  GraduationCap,
  UserSquare2,
  ClipboardList,
  School,
  Megaphone,
  Award,
  FileText,
  UserCheck,
  ShieldCheck,
  User as UserIcon,
} from "lucide-react";

const NAV_DASAR: NavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/guru", label: "Guru", icon: UserSquare2 },
  { href: "/admin/murid", label: "Murid", icon: GraduationCap },
  { href: "/admin/pendaftaran", label: "Pendaftaran", icon: ClipboardList },
  { href: "/admin/kelas", label: "Kelas & Mapel", icon: School },
  { href: "/admin/penugasan", label: "Penugasan Guru", icon: UserCheck },
  { href: "/admin/pengumuman", label: "Pengumuman", icon: Megaphone },
  { href: "/admin/kelulusan", label: "Kelulusan", icon: Award },
  { href: "/admin/laporan", label: "Laporan", icon: FileText },
  { href: "/admin/profil", label: "Profil", icon: UserIcon },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth("admin");

  if (loading) return <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">Memuat...</div>;

  // "Kelola Admin" cuma tampil untuk admin_level='super' (Bagian 10) — akun
  // 'staff' tidak melihat menu ini sama sekali, akses langsung via URL tetap
  // ditolak backend (lihat AdminAkunController::pastikanSuper).
  const nav: NavItem[] =
    user?.admin_level === "super"
      ? [...NAV_DASAR, { href: "/admin/akun-admin", label: "Kelola Admin", icon: ShieldCheck }]
      : NAV_DASAR;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <Sidebar user={user} items={nav} roleLabel="Administrator" />
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}
