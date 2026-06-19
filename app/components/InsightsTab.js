import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Line,
} from "recharts";

const AREA_COLORS = {
  Makati: "#A100FF",
  "Quezon City": "#7B2FF7",
  Manila: "#C77DFF",
};

function buildPredictiveLine(model_info) {
  const { intercept, coefficient_temperature } = model_info;
  const points = [];
  for (let t = 18; t <= 32; t += 0.5) {
    points.push({ Temperature: t, Predicted: intercept + coefficient_temperature * t });
  }
  return points;
}

export default function InsightsTab({ dataset }) {
  if (!dataset) {
    return (
      <div className="rounded-xl bg-gray-50 p-6 text-sm text-muted">
        Loading dataset...
      </div>
    );
  }

  const predictiveLine = buildPredictiveLine(dataset.model_info);

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted">
          Temperature vs Rain Frequency · All Areas
        </p>
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="Temperature"
              type="number"
              name="Temperature"
              tick={{ fontSize: 12, fill: "#6b7280" }}
              label={{
                value: "Temperature (°C)",
                position: "insideBottom",
                offset: -5,
                fill: "#6b7280",
                fontSize: 12,
              }}
            />
            <YAxis
              dataKey="Rain Frequency"
              name="Rain Frequency"
              tick={{ fontSize: 12, fill: "#6b7280" }}
            />
            <Tooltip cursor={{ strokeDasharray: "3 3" }} />
            <Legend />
            {dataset.dataset_overview.areas.map((area) => (
              <Scatter
                key={area}
                name={area}
                data={dataset.full_cleaned_dataset.filter((d) => d.Area === area)}
                fill={AREA_COLORS[area]}
              />
            ))}
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-xl bg-white p-5 shadow-sm">
        <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted">
          Predictive Model · Linear Regression (Temperature → Rain Frequency)
        </p>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="Temperature"
              type="number"
              domain={[18, 32]}
              tick={{ fontSize: 12, fill: "#6b7280" }}
              label={{
                value: "Temperature (°C)",
                position: "insideBottom",
                offset: -5,
                fill: "#6b7280",
                fontSize: 12,
              }}
            />
            <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} />
            <Tooltip />
            <Legend />
            <Scatter
              data={dataset.full_cleaned_dataset}
              dataKey="Rain Frequency"
              name="Actual Data"
              fill="#2D0A4E"
            />
            <Line
              data={predictiveLine}
              dataKey="Predicted"
              type="monotone"
              stroke="#A100FF"
              strokeWidth={2}
              dot={false}
              name="Predicted"
            />
          </ComposedChart>
        </ResponsiveContainer>
        <p className="mt-3 text-xs text-muted">
          RMSE: {dataset.model_info.rmse} · R²: {dataset.model_info.r2_score} —
          temperature alone explains roughly{" "}
          {(dataset.model_info.r2_score * 100).toFixed(1)}% of the variation in
          rain frequency across the 36-row dataset.
        </p>
      </div>
    </div>
  );
}
