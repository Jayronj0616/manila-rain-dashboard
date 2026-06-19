export default function StatCard({ value, label }) {
  return (
    <div className="flex gap-4 rounded-xl bg-white p-5 shadow-sm">
      <span className="w-1 rounded-full bg-accent" />
      <div>
        <div className="text-2xl font-bold text-ink sm:text-3xl">{value}</div>
        <div className="mt-1 text-sm text-muted">{label}</div>
      </div>
    </div>
  );
}
