"use client";

import { useEffect, useState } from "react";
import { Trophy, Medal, Crown } from "lucide-react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/hooks/useAuth";
import type { Leaderboard } from "@/lib/types";

const MEDALI_STYLE: Record<number, string> = {
  1: "bg-amber-400 text-white",
  2: "bg-slate-300 text-white",
  3: "bg-orange-400 text-white",
};

/** Papan peringkat kuis di kelas murid sendiri — poin dari akumulasi skor kuis (Bagian E). */
export default function MuridLeaderboardPage() {
  const { user } = useAuth("murid");
  const [data, setData] = useState<Leaderboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<{ data: Leaderboard }>("/murid/leaderboard")
      .then((r) => setData(r.data))
      .catch(() => setError("Belum terdaftar di kelas manapun, atau gagal memuat papan peringkat."));
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Papan Peringkat</h1>
        <p className="text-sm text-slate-500">Peringkat kuis di kelasmu, dihitung dari akumulasi poin kuis.</p>
      </div>

      {error && <Card className="text-center text-sm text-slate-500">{error}</Card>}

      {data && (
        <>
          <Card className="bg-gradient-to-br from-teal-600 to-teal-700 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15">
                  <Trophy className="h-6 w-6" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-xs text-teal-100">Poin Kamu</p>
                  <p className="text-xl font-bold">{data.poin_saya} pts</p>
                </div>
              </div>
              <div className="h-10 w-px bg-white/20" />
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-right text-xs text-teal-100">Peringkatmu</p>
                  <p className="text-right text-xl font-bold">
                    {data.peringkat_saya ? `#${data.peringkat_saya}` : "-"}
                    <span className="text-xs font-normal text-teal-100"> /{data.total_murid}</span>
                  </p>
                </div>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15">
                  <Medal className="h-6 w-6" strokeWidth={2} />
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-0">
            <h2 className="px-4 pt-4 text-xs font-bold uppercase tracking-wide text-slate-500">Top 10 Kelas</h2>
            <div className="mt-2 divide-y divide-slate-100 dark:divide-slate-800">
              {data.top.length === 0 && (
                <p className="px-4 py-6 text-center text-sm text-slate-500">Belum ada data murid di kelas ini.</p>
              )}
              {data.top.map((m) => {
                const sayaSendiri = m.murid_id === user?.id;
                return (
                  <div
                    key={m.murid_id}
                    className={`flex items-center gap-3 px-4 py-3 ${sayaSendiri ? "bg-teal-50 dark:bg-teal-950" : ""}`}
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        MEDALI_STYLE[m.peringkat] ?? "bg-slate-100 text-slate-500 dark:bg-slate-800"
                      }`}
                    >
                      {m.peringkat <= 3 ? <Crown className="h-4 w-4" strokeWidth={2} /> : m.peringkat}
                    </div>
                    {m.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.avatar_url} alt={m.nama} className="h-9 w-9 shrink-0 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-600 text-sm font-bold text-white">
                        {m.nama?.[0]?.toUpperCase() ?? "?"}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800 dark:text-white">
                        {m.nama}
                        {sayaSendiri && <span className="ml-1.5 text-xs font-normal text-teal-600">(Kamu)</span>}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-bold text-teal-600 dark:text-teal-400">{m.poin} pts</p>
                  </div>
                );
              })}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
