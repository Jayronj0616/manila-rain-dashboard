// ─── Update this URL once the PDF is ready ───────────────────────────────────
const DOCUMENTATION_URL = "/Manila_Rain_Dashboard_Presentation.pdf";
// ─────────────────────────────────────────────────────────────────────────────

const TABS_INFO = [
  {
    label: "Overview",
    description:
      "Key metrics + monthly rain frequency trend chart per area.",
  },
  {
    label: "Insights",
    description:
      "Scatter plot of temperature vs rain frequency + linear regression model line.",
  },
  {
    label: "AI Assistant",
    description:
      "Ask questions about the dataset. Responses are read aloud via Azure Speech.",
  },
  {
    label: "Data",
    description:
      "Switch active dataset or upload a new one (passcode required).",
  },
];

const STACK = [
  ["Data & ML", "Azure Databricks · Scikit-Learn"],
  ["AI", "Azure OpenAI — gpt-4.1-mini"],
  ["Speech", "Azure Speech — Jenny Neural"],
  ["Storage", "Azure Blob Storage"],
  ["Frontend", "Next.js · Tailwind · Recharts"],
  ["Deployment", "Vercel"],
];

export default function AboutTab() {
  return (
    <div className="mt-8 space-y-6">

      {/* Row 1 — Title + Documentation button side by side */}
      <div className="flex items-center justify-between gap-6 rounded-xl bg-white px-6 py-5 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-ink">Manila Rain Frequency Dashboard</h1>
          <p className="text-sm text-muted mt-0.5">
            AI Bootcamp Final Project · Accenture ATCP Resources · June 2026
          </p>
        </div>
        <a
          href={DOCUMENTATION_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={`shrink-0 inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-opacity ${
            DOCUMENTATION_URL === "#"
              ? "bg-gray-400 pointer-events-none"
              : "bg-accent hover:opacity-90"
          }`}
        >
          View Documentation ↗
        </a>
      </div>

      {/* Row 2 — What is this + Tech Stack side by side */}
      <div className="grid grid-cols-2 gap-6">
        <div className="rounded-xl bg-white px-6 py-5 shadow-sm space-y-2">
          <h2 className="text-sm font-semibold text-ink">What is this?</h2>
          <p className="text-sm text-ink leading-relaxed">
            A dashboard that predicts rain frequency in Metro Manila based on temperature.
            Built with a Linear Regression model trained in Azure Databricks, an AI chatbot
            via Azure OpenAI, and text-to-speech via Azure Speech — deployed live on Vercel.
          </p>
          <p className="text-sm text-ink leading-relaxed">
            Covers three areas (Makati, Quezon City, Manila) across 12 months. Missing values
            filled using group mean per area to preserve each location's rainfall baseline.
          </p>
        </div>

        <div className="rounded-xl bg-white px-6 py-5 shadow-sm space-y-3">
          <h2 className="text-sm font-semibold text-ink">Built with</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
            {STACK.map(([layer, tech]) => (
              <div key={layer}>
                <p className="text-xs font-medium text-muted uppercase tracking-wide">{layer}</p>
                <p className="text-sm text-ink">{tech}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3 — Tab guide horizontal cards */}
      <div className="grid grid-cols-4 gap-4">
        {TABS_INFO.map((tab) => (
          <div key={tab.label} className="rounded-xl bg-white px-5 py-4 shadow-sm space-y-2">
            <span className="inline-flex items-center rounded-md bg-accent px-2.5 py-0.5 text-xs font-semibold text-white">
              {tab.label}
            </span>
            <p className="text-sm text-ink leading-relaxed">{tab.description}</p>
          </div>
        ))}
      </div>

    </div>
  );
}
