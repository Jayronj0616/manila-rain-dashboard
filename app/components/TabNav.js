import { HelpCircle } from "lucide-react";

const TABS = [
  {
    id: "overview",
    label: "Overview",
    step: 1,
    intro: "See key metrics and a monthly rain frequency trend chart for Makati, Quezon City, and Manila.",
  },
  {
    id: "insights",
    label: "Insights",
    step: 2,
    intro: "Explore how temperature correlates with rain frequency, and see the linear regression prediction model.",
  },
  {
    id: "assistant",
    label: "AI Assistant",
    step: 3,
    intro: "Ask questions about the dataset. Click a predefined question or type your own — responses are read aloud via Azure Speech.",
  },
  {
    id: "data",
    label: "Data",
    step: 4,
    intro: "Switch the active dataset or upload a new one. Changes update the entire dashboard live.",
  },
  {
    id: "about",
    label: "About",
    step: 5,
    intro: "Learn about the project, the tech stack, and what each tab does.",
  },
];

export default function TabNav({ activeTab, onChange, onStartTour }) {
  return (
    <nav className="bg-plum-light px-6 sm:px-10">
      <div className="flex items-center gap-8">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            data-step={tab.step}
            data-intro={tab.intro}
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

        <button
          onClick={onStartTour}
          title="Take the Tour"
          className="ml-auto py-3 text-purple-300 hover:text-white transition-colors"
        >
          <HelpCircle size={18} />
        </button>
      </div>
    </nav>
  );
}
