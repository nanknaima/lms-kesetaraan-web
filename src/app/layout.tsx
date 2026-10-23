import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LMS Sekolah Kesetaraan",
  description: "LMS untuk Paket A, Paket B, dan Paket C",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-slate-50 font-sans dark:bg-slate-950">{children}</body>
    </html>
  );
}
