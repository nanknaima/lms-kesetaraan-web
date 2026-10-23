"use client";

import { Printer } from "lucide-react";
import { Card } from "@/components/ui/Card";
import type { User } from "@/lib/types";

/**
 * "Kartu Studi" — identitas murid ala kartu pelajar + tombol cetak, meniru
 * mobile/lib/widgets/kartu_siswa_card.dart. Cetak dibuka lewat jendela baru
 * berisi HTML minimal (bukan window.print() di halaman ini langsung) supaya
 * sidebar/header layout murid tidak ikut ke-print — jendela baru itu memanggil
 * print() sendiri lalu bisa ditutup, hasilnya sama seperti "simpan sebagai PDF"
 * lewat dialog print browser.
 */
export function KartuStudiContent({ user }: { user: User }) {
  function cetak() {
    const kelasNama = user.muridProfile?.kelas?.nama_kelas ?? "Kelas belum ditentukan";
    const paket = user.muridProfile?.paket ? ` · Paket ${user.muridProfile.paket}` : "";
    const win = window.open("", "_blank", "width=420,height=280");
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Kartu Studi - ${user.nama}</title>
          <style>
            body { font-family: system-ui, sans-serif; margin: 0; padding: 20px; background: #fff; }
            .kartu {
              background: linear-gradient(135deg, #0d9488, #0f766e);
              border-radius: 16px; padding: 20px; color: white; width: 340px;
              display: flex; align-items: center; gap: 14px;
            }
            .avatar {
              width: 56px; height: 56px; border-radius: 999px; background: rgba(255,255,255,0.2);
              display: flex; align-items: center; justify-content: center;
              font-weight: bold; font-size: 22px; flex-shrink: 0; overflow: hidden;
            }
            .avatar img { width: 100%; height: 100%; object-fit: cover; }
            .label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.8; margin: 0 0 6px; }
            .nama { font-size: 16px; font-weight: bold; margin: 0; }
            .info { font-size: 12px; opacity: 0.85; margin: 2px 0 0; }
          </style>
        </head>
        <body>
          <div class="kartu">
            <div class="avatar">${
              user.avatar_url ? `<img src="${user.avatar_url}" alt="" />` : (user.nama?.[0]?.toUpperCase() ?? "?")
            }</div>
            <div>
              <p class="label">Kartu Studi</p>
              <p class="nama">${user.nama}</p>
              <p class="info">NIS ${user.nis ?? "-"}</p>
              <p class="info">${kelasNama}${paket}</p>
            </div>
          </div>
          <script>
            window.onload = () => { window.print(); };
          </script>
        </body>
      </html>
    `);
    win.document.close();
  }

  const kelasNama = user.muridProfile?.kelas?.nama_kelas ?? "Kelas belum ditentukan";
  const paket = user.muridProfile?.paket ? ` · Paket ${user.muridProfile.paket}` : "";

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold text-slate-900 dark:text-white">Kartu Studi</h1>
        <p className="text-sm text-slate-500">Identitas murid, bisa dicetak/disimpan sebagai PDF.</p>
      </div>

      <div className="rounded-2xl bg-gradient-to-br from-teal-600 to-teal-700 p-5 text-white shadow-sm">
        <div className="flex items-center gap-3.5">
          {user.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatar_url} alt={user.nama} className="h-14 w-14 shrink-0 rounded-full object-cover ring-2 ring-white/30" />
          ) : (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/20 text-xl font-bold ring-2 ring-white/30">
              {user.nama?.[0]?.toUpperCase() ?? "?"}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wide text-teal-100">Kartu Studi</p>
            <p className="truncate text-base font-bold">{user.nama}</p>
            <p className="text-xs text-teal-100">NIS {user.nis ?? "-"}</p>
            <p className="truncate text-xs text-teal-100">
              {kelasNama}
              {paket}
            </p>
          </div>
        </div>
        <button
          onClick={cetak}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-white/15 py-2.5 text-sm font-semibold text-white hover:bg-white/25"
        >
          <Printer className="h-4 w-4" strokeWidth={2} />
          Cetak Kartu Studi (PDF)
        </button>
      </div>

      <Card className="text-xs text-slate-500">
        Rapor resmi tetap dokumen fisik dari sekolah — kartu studi ini hanya identitas digital, bukan pengganti rapor.
      </Card>
    </div>
  );
}
