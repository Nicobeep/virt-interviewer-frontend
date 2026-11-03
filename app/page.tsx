"use client";

import { useState, useEffect } from "react";
import { createSession, sendAgentMessage } from "@/lib/api";

export default function ChatPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([]);
  const [loading, setLoading] = useState(false);

  // Initialize ADK session on component load
  useEffect(() => {
    createSession().then((data) => {
      if (data.id) setSessionId(data.id);
    }).catch((err) => console.error("Failed to create session:", err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !sessionId || loading) return;

    const userMsg = input;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setLoading(true);

    try {
      const data = await sendAgentMessage(sessionId, userMsg);
      const agentText = data?.events?.[-1]?.content?.parts?.[0]?.text || "No response received.";
      setMessages((prev) => [...prev, { role: "model", text: agentText }]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [...prev, { role: "system", text: "Error communicating with agent backend." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex flex-col h-screen max-w-2xl mx-auto p-4 justify-between">
      <div className="border rounded-lg p-4 flex-1 overflow-y-auto space-y-4 bg-gray-50 dark:bg-zinc-900 shadow-sm">
        <h1 className="text-xl font-bold text-center mb-4">Grill-Me AI Architect</h1>
        {messages.map((msg, idx) => (
          <div key={idx} className={`p-3 rounded-lg ${msg.role === "user" ? "bg-blue-600 text-white ml-auto max-w-[80%]" : "bg-white dark:bg-zinc-800 border mr-auto max-w-[80%]"}`}>
            <p className="text-xs font-semibold opacity-75 mb-1">{msg.role === "user" ? "You" : "Architect"}</p>
            <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
          </div>
        ))}
        {loading && <p className="text-sm text-gray-400 italic">Thinking through architecture branches...</p>}
      </div>

      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe your project idea or answer a question..."
          className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 dark:border-zinc-700 text-sm"
        />
        <button type="submit" disabled={loading} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 text-sm">
          Send
        </button>
      </form>
    </main>
  );
}