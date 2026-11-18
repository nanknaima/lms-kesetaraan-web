"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu, X } from "lucide-react";
import { logout } from "@/lib/auth";
import type { User } from "@/lib/types";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export function Sidebar({ user, items, roleLabel }: { user: User | null; items: NavItem[]; roleLabel: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileOpen(false);
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-30 flex h-14 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 lg:hidden">
        <button
          type="button"
          aria-label={mobileOpen ? "Tutup menu" : "Buka menu"}
          aria-expanded={mobileOpen}
          aria-controls="app-sidebar"
          onClick={() => setMobileOpen((open) => !open)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-teal-700 dark:text-teal-400">LMS Kesetaraan</p>
          <p className="truncate text-xs text-slate-500">{roleLabel}</p>
        </div>
      </div>

      {mobileOpen && (
        <button
          type="button"
          aria-label="Tutup menu"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden"
        />
      )}

      <aside
        id="app-sidebar"
        className={`fixed inset-y-0 left-0 z-50 flex h-dvh w-64 shrink-0 flex-col border-r border-slate-200 bg-white transition-transform dark:border-slate-800 dark:bg-slate-950 lg:static lg:z-auto lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="border-b border-slate-200 p-5 dark:border-slate-800">
          <p className="text-lg font-bold text-teal-700 dark:text-teal-400">LMS Kesetaraan</p>
          <p className="text-xs text-slate-500">{roleLabel}</p>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {items.map((item) => {
            const active = pathname?.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"
                }`}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-200 p-3 dark:border-slate-800">
          <div className="mb-2 flex items-center gap-2 px-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-600 text-sm font-bold text-white">
              {user?.nama?.[0] ?? "?"}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{user?.nama ?? "..."}</p>
              <p className="truncate text-xs text-slate-500">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={async () => {
              await logout();
              router.replace("/login");
            }}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950"
          >
            <LogOut className="h-[18px] w-[18px]" strokeWidth={2} />
            Keluar
          </button>
        </div>
      </aside>
    </>
  );
}
