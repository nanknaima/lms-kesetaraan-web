"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, LogOut } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { logout } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import type { User } from "@/lib/types";

export interface ProfilMenuItem {
  href: string;
  label: string;
  desc: string;
  icon: LucideIcon;
}

/**
 * Halaman ringkasan Profil (bukan form edit) — identitas + daftar menu akun +
 * tombol Keluar, meniru pola mobile/lib/features/murid/profil_screen.dart
 * (dan versi guru-nya). Dipakai bareng oleh /murid/profil, /guru/profil, dan
 * /admin/profil — cuma daftar `items` yang beda per role (mis. murid punya
 * "Kartu Studi", guru & admin tidak).
 */
export function ProfilMenu({
  user,
  kelolaProfilHref,
  items,
}: {
  user: User;
  kelolaProfilHref: string;
  items: ProfilMenuItem[];
}) {
  const router = useRouter();

  return (
    <div className="space-y-4">
      <Link href={kelolaProfilHref}>
        <Card className="flex items-center gap-3 transition hover:border-teal-200 hover:shadow-md dark:hover:border-teal-800">
          {user.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatar_url} alt={user.nama} className="h-14 w-14 shrink-0 rounded-full object-cover" />
          ) : (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-teal-600 text-lg font-bold text-white">
              {user.nama?.[0]?.toUpperCase() ?? "?"}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-slate-800 dark:text-white">{user.nama}</p>
            <p className="truncate text-xs text-slate-500">{user.email}</p>
            {(user.nis || user.nip) && (
              <p className="truncate text-xs text-slate-400">{user.nis ? `NIS: ${user.nis}` : `NIP: ${user.nip}`}</p>
            )}
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" strokeWidth={2} />
        </Card>
      </Link>

      <Card className="p-0">
        <nav className="divide-y divide-slate-100 dark:divide-slate-800">
          {items.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className="flex items-center gap-3 rounded-xl px-3 py-3 transition hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300">
                <m.icon className="h-5 w-5" strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-800 dark:text-white">{m.label}</p>
                <p className="truncate text-xs text-slate-500">{m.desc}</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" strokeWidth={2} />
            </Link>
          ))}
        </nav>
      </Card>

      <button
        onClick={async () => {
          await logout();
          router.replace("/login");
        }}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-rose-300 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 dark:border-rose-800 dark:hover:bg-rose-950"
      >
        <LogOut className="h-4 w-4" strokeWidth={2} />
        Keluar
      </button>
    </div>
  );
}
