"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar, type NavItem } from "@/components/ui/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import { logout } from "@/lib/auth";
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  ListChecks,
  CalendarCheck,
  Trophy,
  User as UserIcon,
  Home,
  LogOut,
  Bell,
  School,
  MessageCircle,
} from "lucide-react";

const NAV: NavItem[] = [
  { href: "/murid/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/murid/materi", label: "Mata Pelajaran", icon: BookOpen },
  { href: "/murid/tugas", label: "Tugas", icon: ClipboardList },
  { href: "/murid/kuis", label: "Kuis", icon: ListChecks },
  { href: "/murid/chat", label: "Chat", icon: MessageCircle },
  { href: "/murid/absensi", label: "Absensi", icon: CalendarCheck },
  { href: "/murid/nilai-akhir", label: "Nilai Akhir", icon: Trophy },
  { href: "/murid/profil", label: "Profil", icon: UserIcon },
];

// Bottom nav (HP) sengaja ringkas — Profil dipindah ke avatar di appbar (lihat header di bawah),
// Mapel & Tugas digabung jadi satu hub "Ruang Kelas". Chat personal (BUKAN forum Diskusi
// per-mapel) ikut ditaruh di sini karena setara pentingnya dengan Home di aplikasi mobile.
const BOTTOM_NAV = [
  { href: "/murid/dashboard", label: "Home", icon: Home },
  { href: "/murid/materi", label: "Ruang Kelas", icon: School },
  { href: "/murid/chat", label: "Chat", icon: MessageCircle },
];

/**
 * Layout murid — profesional & konsisten dengan admin/guru: sidebar kiri +
 * konten lebar penuh di layar desktop (>= lg), dan header ringkas + bottom
 * navigation ala aplikasi di layar kecil (< lg, HP/tablet portrait).
 */
export default function MuridLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth("murid");
  const pathname = usePathname();
  const router = useRouter();

  if (loading) return <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">Memuat...</div>;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Sidebar — hanya tampil di layar besar (desktop/laptop), sama seperti admin & guru */}
      <div className="hidden lg:block">
        <Sidebar user={user} items={NAV} roleLabel="Murid" />
      </div>

      <div className="flex h-screen flex-1 flex-col overflow-hidden">
        {/* Header — hanya tampil di layar kecil, sidebar sudah menggantikannya di desktop */}
        <header className="flex items-center justify-between gap-3 bg-gradient-to-br from-teal-600 to-teal-700 px-4 py-4 lg:hidden">
          <Link href="/murid/profil" className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/15 text-sm font-bold text-white ring-1 ring-white/30">
              {user?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatar_url} alt={user.nama} className="h-full w-full object-cover" />
              ) : (
                user?.nama?.[0]?.toUpperCase() ?? "?"
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-bold text-white">Halo, {user?.nama ?? "Murid"}</p>
              <p className="text-xs text-teal-100">Murid · LMS Kesetaraan</p>
            </div>
          </Link>
          <div className="flex shrink-0 items-center gap-1">
            <button
              title="Notifikasi"
              className="flex h-9 w-9 items-center justify-center rounded-full text-white transition hover:bg-white/15"
            >
              <Bell className="h-5 w-5" strokeWidth={2} />
            </button>
            <button
              onClick={async () => {
                await logout();
                router.replace("/login");
              }}
              title="Keluar"
              aria-label="Keluar"
              className="flex h-9 w-9 items-center justify-center rounded-full text-white transition hover:bg-white/15"
            >
              <LogOut className="h-5 w-5" strokeWidth={2} />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 pb-24 lg:p-8 lg:pb-8">
          <div className="mx-auto h-full w-full max-w-6xl">{children}</div>
        </main>
      </div>

      {/* Bottom navigation — hanya di layar kecil */}
      <nav className="fixed bottom-0 left-0 flex w-full items-center justify-around border-t border-slate-200 bg-white/95 py-2 backdrop-blur-sm lg:hidden dark:border-slate-800 dark:bg-slate-900/95">
        {BOTTOM_NAV.map((item) => {
          const active = pathname?.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 rounded-xl px-4 py-1.5 text-xs font-medium transition ${
                active ? "text-teal-600" : "text-slate-400 hover:text-slate-500"
              }`}
            >
              <Icon className={`h-5 w-5 transition ${active ? "scale-110" : ""}`} strokeWidth={2} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
