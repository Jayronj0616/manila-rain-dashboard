"use client";

import { useState } from "react";
import { Send, Volume2 } from "lucide-react";

const PREDEFINED_QUESTIONS = [
  "Which month has the highest rain frequency in Manila?",
  "How does temperature affect rain frequency across all areas?",
  "Which area receives the most rainfall overall?",
  "Compare the rainy season vs dry season rainfall in Quezon City.",
  "What is the average rain frequency for each area?",
];

export default function AssistantTab({ messages, isLoading, onSend, onReplay }) {
  const [input, setInput] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSend(input);
    setInput("");
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
          Ask About the Dataset
        </p>
        <div className="flex flex-wrap gap-2">
          {PREDEFINED_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => onSend(q)}
              disabled={isLoading}
              className="rounded-full border border-accent px-3 py-1.5 text-sm text-plum transition-colors hover:bg-accent hover:text-white disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl bg-white p-5 shadow-sm">
        <div className="flex max-h-[420px] flex-col gap-3 overflow-y-auto pr-1">
          {messages.length === 0 && (
            <p className="text-sm text-muted">
              Ask a question above or type your own below.
            </p>
          )}
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={
                  m.role === "user"
                    ? "max-w-[80%] rounded-2xl bg-accent px-4 py-2 text-sm text-white"
                    : "max-w-[80%] rounded-2xl border-l-4 border-accent bg-gray-50 px-4 py-2 text-sm text-ink"
                }
              >
                <p>{m.content}</p>
                {m.role === "assistant" && m.audioUrl && (
                  <button
                    onClick={() => onReplay(m.audioUrl)}
                    className="mt-2 flex items-center gap-1 text-xs text-plum hover:text-accent"
                  >
                    <Volume2 size={14} /> Replay
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="mt-4 flex gap-2 border-t pt-4">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question..."
            disabled={isLoading}
            className="flex-1 rounded-full border border-gray-200 px-4 py-2 text-sm focus:border-accent focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center justify-center rounded-full bg-accent px-4 py-2 text-white transition-colors hover:bg-plum disabled:opacity-50"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
