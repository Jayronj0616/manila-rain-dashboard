"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import StatCard from "./StatCard";

const MONTH_ORDER = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const AREA_COLORS = {
  Makati: "#A100FF",
  "Quezon City": "#7B2FF7",
  Manila: "#C77DFF",
};

function buildMonthlyTrend(dataset) {
  const areas = dataset.dataset_overview.areas;
  return MONTH_ORDER.map((month) => {
    const row = { month: month.slice(0, 3) };
    areas.forEach((area) => {
      const record = dataset.full_cleaned_dataset.find(
        (d) => d.Area === area && d.Month === month
      );
      row[area] = record ? record["Rain Frequency"] : null;
    });
    return row;
  });
}

export default function OverviewTab({ dataset, error }) {

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 p-6 text-sm text-red-600">
        Failed to load dataset: {error}
      </div>
    );
  }

  if (!dataset) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-muted">
        Loading dataset...
      </div>
    );
  }

  const trendData = buildMonthlyTrend(dataset);
  const totalRows = dataset.dataset_overview.total_rows;
  const areaCount = dataset.dataset_overview.areas.length;
  const avgRain = (
    dataset.full_cleaned_dataset.reduce((sum, d) => sum + d["Rain Frequency"], 0) /
    dataset.full_cleaned_dataset.length
  ).toFixed(2);
  const r2 = dataset.model_info.r2_score.toFixed(3);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard value={totalRows} label="Total Records" />
        <StatCard value={areaCount} label="Areas Covered" />
        <StatCard value={avgRain} label="Avg Rain Frequency" />
        <StatCard value={r2} label="Model R² (Temp → Rain)" />
      </div>

      <div className="rounded-xl bg-white p-5 shadow-sm">
        <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted">
          Monthly Rain Frequency · By Area
        </p>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#6b7280" }} />
            <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} />
            <Tooltip />
            <Legend />
            {dataset.dataset_overview.areas.map((area) => (
              <Line
                key={area}
                type="monotone"
                dataKey={area}
                stroke={AREA_COLORS[area]}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
