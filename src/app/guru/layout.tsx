"use client";

import { Sidebar, type NavItem } from "@/components/ui/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  HelpCircle,
  CheckSquare,
  Video,
  Award,
  UserCheck,
  MessageSquare,
  MessageCircle,
  User as UserIcon,
} from "lucide-react";

const NAV: NavItem[] = [
  { href: "/guru/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/guru/kelas-mapel-saya", label: "Kelas & Mapel Saya", icon: UserCheck },
  { href: "/guru/diskusi", label: "Diskusi", icon: MessageSquare },
  { href: "/guru/chat", label: "Chat", icon: MessageCircle },
  { href: "/guru/materi", label: "Materi", icon: BookOpen },
  { href: "/guru/tugas", label: "Tugas", icon: ClipboardList },
  { href: "/guru/kuis", label: "Kuis", icon: HelpCircle },
  { href: "/guru/absensi", label: "Absensi", icon: CheckSquare },
  { href: "/guru/pertemuan-online", label: "Pertemuan Online", icon: Video },
  { href: "/guru/nilai-akhir", label: "Nilai & Kelulusan", icon: Award },
  { href: "/guru/profil", label: "Profil", icon: UserIcon },
];

export default function GuruLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth("guru");

  if (loading) return <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">Memuat...</div>;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <Sidebar user={user} items={NAV} roleLabel={`Guru${user?.nis ? "" : ""}`} />
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}
