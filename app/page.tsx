"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  KeyboardEvent,
  FormEvent,
} from "react";
import { createSession, sendAgentMessage } from "@/lib/api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type ChatMessage = { id: number; role: "user" | "agent"; text: string };
type Status = "connecting" | "ready" | "error";

type AgentEvent = {
  author?: string;
  content?: { role?: string; parts?: { text?: string }[] };
};

// /run returns an array of events. Keep only the agent's text parts.
function extractAgentText(events: unknown): string {
  if (!Array.isArray(events)) return "";
  return (events as AgentEvent[])
    .filter((e) => e?.content?.role !== "user" && e?.author !== "user")
    .flatMap((e) => e?.content?.parts ?? [])
    .map((p) => p?.text ?? "")
    .filter((t) => t.trim().length > 0)
    .join("\n")
    .trim();
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

const css = `
  :root { color-scheme: light dark; }
  * { box-sizing: border-box; }
  body { margin: 0; }

  .app {
    --bg: #f7f7f8;
    --surface: #ffffff;
    --border: #e4e4e7;
    --text: #18181b;
    --muted: #71717a;
    --accent: #2563eb;
    --accent-text: #ffffff;
    --agent-bubble: #f1f1f4;
    --danger: #dc2626;
    display: flex;
    flex-direction: column;
    height: 100dvh;
    background: var(--bg);
    color: var(--text);
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  }
  @media (prefers-color-scheme: dark) {
    .app {
      --bg: #0b0b0d;
      --surface: #151518;
      --border: #27272a;
      --text: #f4f4f5;
      --muted: #a1a1aa;
      --accent: #3b82f6;
      --agent-bubble: #1f1f23;
      --danger: #f87171;
    }
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 20px;
    background: var(--surface);
    border-bottom: 1px solid var(--border);
  }
  .title { font-size: 16px; font-weight: 600; margin: 0; }
  .status { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--muted); }
  .dot { width: 8px; height: 8px; border-radius: 50%; background: #a1a1aa; }
  .dot.ready { background: #22c55e; }
  .dot.connecting { background: #f59e0b; animation: pulse 1.2s infinite; }
  .dot.error { background: var(--danger); }
  @keyframes pulse { 50% { opacity: 0.3; } }

  .messages {
    flex: 1;
    overflow-y: auto;
    padding: 24px 16px;
  }
  .inner {
    max-width: 760px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .empty {
    margin: auto;
    text-align: center;
    color: var(--muted);
    padding: 48px 0;
  }
  .empty h2 { color: var(--text); font-size: 20px; margin: 0 0 6px; }

  .row { display: flex; }
  .row.user { justify-content: flex-end; }
  .bubble {
    max-width: 78%;
    padding: 10px 14px;
    border-radius: 16px;
    font-size: 15px;
    line-height: 1.5;
    white-space: pre-wrap;
    word-wrap: break-word;
  }
  .row.user .bubble {
    background: var(--accent);
    color: var(--accent-text);
    border-bottom-right-radius: 4px;
  }
  .row.agent .bubble {
    background: var(--agent-bubble);
    border-bottom-left-radius: 4px;
  }
    .bubble.md { white-space: normal; }
  .bubble.md h1, .bubble.md h2, .bubble.md h3 { font-size: 16px; margin: 12px 0 6px; }
  .bubble.md p { margin: 6px 0; }
  .bubble.md ul, .bubble.md ol { margin: 6px 0; padding-left: 20px; }
  .bubble.md li { margin: 3px 0; }
  .bubble.md hr { border: none; border-top: 1px solid var(--border); margin: 10px 0; }
  .bubble.md strong { font-weight: 600; }
  
  .typing { display: inline-flex; gap: 4px; padding: 12px 14px; }
  .typing span {
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--muted);
    animation: bounce 1.2s infinite;
  }
  .typing span:nth-child(2) { animation-delay: 0.15s; }
  .typing span:nth-child(3) { animation-delay: 0.3s; }
  @keyframes bounce {
    0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
    40% { transform: translateY(-4px); opacity: 1; }
  }

  .banner {
    max-width: 760px;
    margin: 0 auto 12px;
    padding: 10px 14px;
    border: 1px solid var(--danger);
    color: var(--danger);
    border-radius: 10px;
    font-size: 14px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
  }

  .composer {
    background: var(--surface);
    border-top: 1px solid var(--border);
    padding: 12px 16px 16px;
  }
  .composer-box {
    max-width: 760px;
    margin: 0 auto;
    display: flex;
    align-items: flex-end;
    gap: 8px;
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 8px 8px 8px 14px;
    background: var(--bg);
  }
  .composer-box:focus-within { border-color: var(--accent); }
  textarea {
    flex: 1;
    resize: none;
    border: none;
    outline: none;
    background: transparent;
    color: var(--text);
    font: inherit;
    font-size: 15px;
    line-height: 1.5;
    max-height: 160px;
    padding: 6px 0;
  }
  button {
    font: inherit;
    cursor: pointer;
    border: none;
    border-radius: 10px;
    padding: 8px 14px;
    background: var(--accent);
    color: var(--accent-text);
    font-weight: 600;
    font-size: 14px;
  }
  button:disabled { opacity: 0.4; cursor: not-allowed; }
  .hint { text-align: center; font-size: 12px; color: var(--muted); margin-top: 8px; }
`;

type ChatMessage = { id: number; role: "user" | "agent"; text: string };
type Status = "connecting" | "ready" | "error";

type AgentEvent = {
  author?: string;
  content?: { role?: string; parts?: { text?: string }[] };
};

// /run returns an array of events. Keep only the agent's text parts.
function extractAgentText(events: unknown): string {
  if (!Array.isArray(events)) return "";
  return (events as AgentEvent[])
    .filter((e) => e?.content?.role !== "user" && e?.author !== "user")
    .flatMap((e) => e?.content?.parts ?? [])
    .map((p) => p?.text ?? "")
    .filter((t) => t.trim().length > 0)
    .join("\n")
    .trim();
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

const css = `
  :root { color-scheme: light dark; }
  * { box-sizing: border-box; }
  body { margin: 0; }

  .app {
    --bg: #f7f7f8;
    --surface: #ffffff;
    --border: #e4e4e7;
    --text: #18181b;
    --muted: #71717a;
    --accent: #2563eb;
    --accent-text: #ffffff;
    --agent-bubble: #f1f1f4;
    --danger: #dc2626;
    display: flex;
    flex-direction: column;
    height: 100dvh;
    background: var(--bg);
    color: var(--text);
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  }
  @media (prefers-color-scheme: dark) {
    .app {
      --bg: #0b0b0d;
      --surface: #151518;
      --border: #27272a;
      --text: #f4f4f5;
      --muted: #a1a1aa;
      --accent: #3b82f6;
      --agent-bubble: #1f1f23;
      --danger: #f87171;
    }
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 20px;
    background: var(--surface);
    border-bottom: 1px solid var(--border);
  }
  .title { font-size: 16px; font-weight: 600; margin: 0; }
  .status { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--muted); }
  .dot { width: 8px; height: 8px; border-radius: 50%; background: #a1a1aa; }
  .dot.ready { background: #22c55e; }
  .dot.connecting { background: #f59e0b; animation: pulse 1.2s infinite; }
  .dot.error { background: var(--danger); }
  @keyframes pulse { 50% { opacity: 0.3; } }

  .messages {
    flex: 1;
    overflow-y: auto;
    padding: 24px 16px;
  }
  .inner {
    max-width: 760px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .empty {
    margin: auto;
    text-align: center;
    color: var(--muted);
    padding: 48px 0;
  }
  .empty h2 { color: var(--text); font-size: 20px; margin: 0 0 6px; }

  .row { display: flex; }
  .row.user { justify-content: flex-end; }
  .bubble {
    max-width: 78%;
    padding: 10px 14px;
    border-radius: 16px;
    font-size: 15px;
    line-height: 1.5;
    white-space: pre-wrap;
    word-wrap: break-word;
  }
  .row.user .bubble {
    background: var(--accent);
    color: var(--accent-text);
    border-bottom-right-radius: 4px;
  }
  .row.agent .bubble {
    background: var(--agent-bubble);
    border-bottom-left-radius: 4px;
  }

  .typing { display: inline-flex; gap: 4px; padding: 12px 14px; }
  .typing span {
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--muted);
    animation: bounce 1.2s infinite;
  }
  .typing span:nth-child(2) { animation-delay: 0.15s; }
  .typing span:nth-child(3) { animation-delay: 0.3s; }
  @keyframes bounce {
    0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
    40% { transform: translateY(-4px); opacity: 1; }
  }

  .banner {
    max-width: 760px;
    margin: 0 auto 12px;
    padding: 10px 14px;
    border: 1px solid var(--danger);
    color: var(--danger);
    border-radius: 10px;
    font-size: 14px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
  }

  .composer {
    background: var(--surface);
    border-top: 1px solid var(--border);
    padding: 12px 16px 16px;
  }
  .composer-box {
    max-width: 760px;
    margin: 0 auto;
    display: flex;
    align-items: flex-end;
    gap: 8px;
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 8px 8px 8px 14px;
    background: var(--bg);
  }
  .composer-box:focus-within { border-color: var(--accent); }
  textarea {
    flex: 1;
    resize: none;
    border: none;
    outline: none;
    background: transparent;
    color: var(--text);
    font: inherit;
    font-size: 15px;
    line-height: 1.5;
    max-height: 160px;
    padding: 6px 0;
  }
  button {
    font: inherit;
    cursor: pointer;
    border: none;
    border-radius: 10px;
    padding: 8px 14px;
    background: var(--accent);
    color: var(--accent-text);
    font-weight: 600;
    font-size: 14px;
  }
  button:disabled { opacity: 0.4; cursor: not-allowed; }
  .hint { text-align: center; font-size: 12px; color: var(--muted); margin-top: 8px; }
`;

export default function ChatPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("connecting");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const startedRef = useRef(false); // avoids a second session in React Strict Mode
  const nextId = useRef(0);

  const connect = useCallback(async () => {
    setStatus("connecting");
    setError(null);
    try {
      const session = await createSession();
      setSessionId(session.id);
      setStatus("ready");
    } catch (err) {
      setError(errorMessage(err));
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    connect();
  }, [connect]);

  // Keep the newest message in view.
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  // Auto-grow the textarea up to its max height.
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${ta.scrollHeight}px`;
  }, [input]);

  async function send(text: string) {
    const clean = text.trim();
    if (!sessionId || busy || !clean) return;

    setMessages((prev) => [...prev, { id: nextId.current++, role: "user", text: clean }]);
    setInput("");
    setBusy(true);
    setError(null);

    try {
      const events = await sendAgentMessage(sessionId, clean);
      const reply = extractAgentText(events) || "The agent returned no text.";
      setMessages((prev) => [...prev, { id: nextId.current++, role: "agent", text: reply }]);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
      textareaRef.current?.focus();
    }
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    send(input);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    // Enter sends; Shift+Enter inserts a newline.
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  const statusLabel =
    status === "ready" ? "Connected" : status === "connecting" ? "Connecting…" : "Disconnected";
  const canType = status === "ready" && !busy;

  return (
    <div className="app">
      <style>{css}</style>

      <header className="header">
        <h1 className="title">Interview Prep</h1>
        <div className="status">
          <span className={`dot ${status}`} />
          {statusLabel}
        </div>
      </header>

      <div className="messages" ref={listRef}>
        <div className="inner">
          {messages.length === 0 && status === "ready" && (
            <div className="empty">
              <h2>Ready when you are</h2>
              <p>Type a message below to start the interview.</p>
            </div>
          )}

          {messages.map((m) => (
  <div key={m.id} className={`row ${m.role}`}>
    {m.role === "agent" ? (
      <div className="bubble md">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.text}</ReactMarkdown>
      </div>
    ) : (
      <div className="bubble">{m.text}</div>
    )}
  </div>
))}

          {busy && (
            <div className="row agent">
              <div className="bubble typing">
                <span />
                <span />
                <span />
              </div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="banner" role="alert">
          <span>{error}</span>
          {status === "error" ? (
            <button onClick={connect}>Retry</button>
          ) : (
            <button onClick={() => setError(null)} style={{ background: "transparent", color: "var(--danger)" }}>
              Dismiss
            </button>
          )}
        </div>
      )}

      <footer className="composer">
        <form className="composer-box" onSubmit={handleSubmit}>
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={canType ? "Message the interviewer…" : status === "connecting" ? "Connecting…" : "Unavailable"}
            disabled={!canType}
            aria-label="Message"
          />
          <button type="submit" disabled={!canType || !input.trim()}>
            Send
          </button>
        </form>
        <div className="hint">Enter to send · Shift + Enter for a new line</div>
      </footer>
    </div>
  );
}
