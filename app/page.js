"use client";

import { useState, useEffect } from "react";
import Header from "./components/Header";
import TabNav from "./components/TabNav";
import OverviewTab from "./components/OverviewTab";
import InsightsTab from "./components/InsightsTab";
import AssistantTab from "./components/AssistantTab";
import DataTab from "./components/DataTab";
import AboutTab from "./components/AboutTab";
import LoadingOverlay from "./components/LoadingOverlay";

export default function Home() {
  const [activeTab, setActiveTab] = useState("overview");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeDataset, setActiveDataset] = useState(null);
  const [datasetError, setDatasetError] = useState(null);

  useEffect(() => {
    fetch("/api/dataset")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load dataset.");
        return res.json();
      })
      .then(setActiveDataset)
      .catch((err) => setDatasetError(err.message));
  }, []);

  async function sendMessage(text) {
    if (!text.trim() || isLoading) return;

    const userMsg = { id: crypto.randomUUID(), role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, dataset: activeDataset }),
      });
      const data = await res.json();
      const replyText = data.reply || "Sorry, I couldn't generate a response.";
      const assistantId = crypto.randomUUID();

      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: replyText },
      ]);
      setIsLoading(false);

      // Fetch speech in the background — don't block the UI on it.
      fetch("/api/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: replyText }),
      })
        .then(async (speakRes) => {
          if (!speakRes.ok) return;
          const blob = await speakRes.blob();
          const url = URL.createObjectURL(blob);
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, audioUrl: url } : m))
          );
          const audio = new Audio(url);
          audio.play().catch(() => {
            // Autoplay may be blocked by the browser — Replay button still works.
          });
        })
        .catch(() => {});
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Something went wrong reaching the assistant. Try again.",
        },
      ]);
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-page">
      <Header />
      <TabNav activeTab={activeTab} onChange={setActiveTab} />

      <main className="flex-1 px-6 py-6 sm:px-10">
        {activeTab === "overview" && <OverviewTab dataset={activeDataset} error={datasetError} />}
        {activeTab === "insights" && <InsightsTab dataset={activeDataset} />}
        {activeTab === "assistant" && (
          <AssistantTab
            messages={messages}
            isLoading={isLoading}
            onSend={sendMessage}
          />
        )}
        {activeTab === "data" && <DataTab onDatasetChange={setActiveDataset} />}
        {activeTab === "about" && <AboutTab />}
      </main>

      {isLoading && <LoadingOverlay />}
    </div>
  );
}
