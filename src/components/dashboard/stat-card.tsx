type StatCardProps = {
  label: string;
  value: string;
  helper: string;
};

export function StatCard({ label, value, helper }: StatCardProps) {
  return (
    <div className="sagva-panel p-5">
      <p className="text-sm font-bold text-slate-600">{label}</p>
      <p className="mt-2 text-3xl font-bold text-[#064ea4]">{value}</p>
      <p className="mt-2 text-sm text-slate-600">{helper}</p>
    </div>
  );
}
