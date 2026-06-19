const TABS = [
  { id: "overview", label: "Overview" },
  { id: "insights", label: "Insights" },
  { id: "assistant", label: "AI Assistant" },
  { id: "data", label: "Data" },
];

export default function TabNav({ activeTab, onChange }) {
  return (
    <nav className="bg-plum-light px-6 sm:px-10">
      <div className="flex gap-8">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`relative py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "text-white"
                : "text-purple-300 hover:text-white"
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 h-0.5 w-full bg-accent" />
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}
