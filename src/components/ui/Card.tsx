export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 ${className}`}
    >
      {children}
    </div>
  );
}

export function StatCard({ label, value, accent = "teal" }: { label: string; value: string | number; accent?: "teal" | "orange" | "blue" }) {
  const accentMap = {
    teal: "text-teal-600 dark:text-teal-400",
    orange: "text-orange-600 dark:text-orange-400",
    blue: "text-blue-600 dark:text-blue-400",
  };
  return (
    <Card>
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${accentMap[accent]}`}>{value}</p>
    </Card>
  );
}
