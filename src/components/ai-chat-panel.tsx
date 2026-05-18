"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  X,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ListTodo,
  Megaphone,
  Music2,
  Calendar,
  Settings,
} from "lucide-react";

interface ApiMessage {
  role: "user" | "assistant";
  content: string;
}

interface ToolAction {
  type: string;
  title: string;
  id?: string;
}

interface ToolState {
  toolId: string;
  tool: string;
  status: "pending" | "done" | "error";
  action?: ToolAction;
}

interface DisplayMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
  toolStates?: ToolState[];
  hasActions?: boolean;
}

const TOOL_ICONS: Record<string, React.ElementType> = {
  create_task: ListTodo,
  update_event: Settings,
  create_marketing_post: Megaphone,
  add_dj: Music2,
  add_schedule_item: Calendar,
};

const SUGGESTIONS = [
  "Draft an Instagram caption for this event",
  "Create a task to book the venue",
  "What tasks are still open?",
  "Add a headliner DJ to the lineup",
  "Write a Facebook event description",
  "Create tasks for a full event checklist",
];

function ToolCard({ state }: { state: ToolState }) {
  const Icon = TOOL_ICONS[state.tool] ?? Settings;
  const isPending = state.status === "pending";
  const isError = state.status === "error";

  return (
    <div
      className={`flex items-center gap-2 text-xs rounded-lg px-3 py-2 border mt-2 ${
        isPending
          ? "bg-dj-900 border-dj-border text-dj-muted"
          : isError
          ? "bg-red-500/10 border-red-500/30 text-red-400"
          : "bg-dj-primary/10 border-dj-primary/30 text-dj-primary-light"
      }`}
    >
      {isPending ? (
        <Loader2 className="w-3 h-3 animate-spin flex-shrink-0" />
      ) : isError ? (
        <AlertCircle className="w-3 h-3 flex-shrink-0" />
      ) : (
        <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
      )}
      <Icon className="w-3 h-3 flex-shrink-0" />
      <span className="truncate">
        {state.action?.title ?? (isPending ? `Running ${state.tool.replace(/_/g, " ")}…` : state.tool)}
      </span>
    </div>
  );
}

function MessageBubble({ msg }: { msg: DisplayMessage }) {
  if (msg.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] bg-dj-primary/20 border border-dj-primary/30 text-dj-text rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm leading-relaxed">
          {msg.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2.5">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-dj-primary to-dj-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
        <Sparkles className="w-3.5 h-3.5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        {msg.toolStates && msg.toolStates.length > 0 && (
          <div className="mb-2">
            {msg.toolStates.map((ts) => (
              <ToolCard key={ts.toolId} state={ts} />
            ))}
          </div>
        )}
        {msg.content && (
          <div
            className={`text-sm leading-relaxed text-dj-text whitespace-pre-wrap ${
              msg.streaming ? "after:content-['▋'] after:animate-pulse after:text-dj-primary" : ""
            }`}
          >
            {msg.content}
          </div>
        )}
        {!msg.content && msg.streaming && !msg.toolStates?.length && (
          <div className="flex items-center gap-1.5 text-dj-muted text-xs">
            <Loader2 className="w-3 h-3 animate-spin" />
            Thinking…
          </div>
        )}
      </div>
    </div>
  );
}

interface Props {
  eventId: string;
  eventName: string;
}

export default function AIChatPanel({ eventId, eventName }: Props) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [apiMessages, setApiMessages] = useState<ApiMessage[]>([]);
  const [displayMessages, setDisplayMessages] = useState<DisplayMessage[]>([]);
  const [didMutate, setDidMutate] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [displayMessages, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      const userMsg: ApiMessage = { role: "user", content: text.trim() };
      const newApiMessages = [...apiMessages, userMsg];
      setApiMessages(newApiMessages);
      setInput("");

      const userDisplay: DisplayMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: text.trim(),
      };

      const assistantId = crypto.randomUUID();
      const assistantDisplay: DisplayMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        streaming: true,
        toolStates: [],
      };

      setDisplayMessages((prev) => [...prev, userDisplay, assistantDisplay]);
      setIsLoading(true);

      let fullText = "";
      let mutated = false;

      try {
        const res = await fetch(`/api/events/${eventId}/ai-chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: newApiMessages }),
        });

        if (!res.ok || !res.body) {
          throw new Error("Request failed");
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const event = JSON.parse(line.slice(6)) as {
                type: string;
                delta?: string;
                toolId?: string;
                tool?: string;
                action?: ToolAction;
                message?: string;
              };

              if (event.type === "text" && event.delta) {
                fullText += event.delta;
                setDisplayMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId ? { ...m, content: fullText } : m
                  )
                );
              } else if (event.type === "tool_start" && event.toolId && event.tool) {
                const newState: ToolState = {
                  toolId: event.toolId,
                  tool: event.tool,
                  status: "pending",
                };
                setDisplayMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, toolStates: [...(m.toolStates ?? []), newState] }
                      : m
                  )
                );
              } else if (event.type === "tool_done" && event.toolId) {
                mutated = true;
                setDisplayMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? {
                          ...m,
                          toolStates: (m.toolStates ?? []).map((ts) =>
                            ts.toolId === event.toolId
                              ? {
                                  ...ts,
                                  status: event.action?.type === "error" ? "error" : "done",
                                  action: event.action,
                                }
                              : ts
                          ),
                        }
                      : m
                  )
                );
              } else if (event.type === "error" && event.message) {
                fullText = `Sorry, something went wrong: ${event.message}`;
                setDisplayMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId ? { ...m, content: fullText } : m
                  )
                );
              } else if (event.type === "done") {
                setDisplayMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, streaming: false, hasActions: mutated }
                      : m
                  )
                );
              }
            } catch {
              // skip malformed lines
            }
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Connection error";
        setDisplayMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: `Error: ${msg}`, streaming: false }
              : m
          )
        );
      } finally {
        setIsLoading(false);
        const assistantMsg: ApiMessage = { role: "assistant", content: fullText };
        setApiMessages([...newApiMessages, assistantMsg]);

        if (mutated) {
          setDidMutate(true);
          router.refresh();
        }
      }
    },
    [apiMessages, eventId, isLoading, router]
  );

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg transition-all duration-200 ${
          isOpen ? "opacity-0 pointer-events-none" : "opacity-100"
        } bg-gradient-to-r from-dj-primary to-dj-secondary text-white text-sm font-medium hover:shadow-dj-primary/30 hover:shadow-xl hover:scale-105`}
      >
        <Sparkles className="w-4 h-4" />
        AI Assistant
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[420px] bg-dj-900 border-l border-dj-border z-50 flex flex-col shadow-2xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-dj-border flex-shrink-0 bg-dj-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-dj-primary to-dj-secondary flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">AI Assistant</h3>
              <p className="text-xs text-dj-muted truncate max-w-[220px]">{eventName}</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-dj-muted hover:text-dj-text p-1 rounded-lg hover:bg-dj-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {displayMessages.length === 0 && (
            <div className="space-y-4">
              <div className="flex gap-2.5">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-dj-primary to-dj-secondary flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-dj-text leading-relaxed">
                    Hi! I&apos;m your AI assistant for <strong className="text-white">{eventName}</strong>. I know all the details about your event and can help you:
                  </p>
                  <ul className="mt-2 space-y-1 text-xs text-dj-muted">
                    <li>• Create tasks, marketing posts, and schedule items</li>
                    <li>• Draft captions, bios, and descriptions</li>
                    <li>• Answer questions about your event</li>
                    <li>• Update event details</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-xs text-dj-muted px-0.5">Try asking:</p>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="w-full text-left text-xs text-dj-muted hover:text-dj-text bg-dj-800 hover:bg-dj-700 border border-dj-border hover:border-dj-primary/30 rounded-lg px-3 py-2 transition-all"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {displayMessages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} />
          ))}

          {didMutate && displayMessages.length > 0 && !isLoading && (
            <div className="flex items-center justify-center gap-2 text-xs text-dj-muted py-1">
              <CheckCircle2 className="w-3 h-3 text-green-400" />
              <span>Changes saved · page refreshed</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Scroll hint when content is long */}
        <div className="flex-shrink-0">
          {displayMessages.length > 3 && (
            <button
              onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })}
              className="w-full flex items-center justify-center gap-1 py-1 text-xs text-dj-muted hover:text-dj-text transition-colors"
            >
              <ChevronDown className="w-3 h-3" />
            </button>
          )}

          {/* Input */}
          <div className="px-4 py-3 border-t border-dj-border bg-dj-800">
            <div className="flex gap-2 items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about your event…"
                disabled={isLoading}
                rows={1}
                className="flex-1 bg-dj-900 border border-dj-border rounded-xl px-3 py-2.5 text-sm text-dj-text placeholder:text-dj-muted resize-none focus:outline-none focus:border-dj-primary/50 transition-colors disabled:opacity-50"
                style={{ maxHeight: "120px" }}
                onInput={(e) => {
                  const t = e.currentTarget;
                  t.style.height = "auto";
                  t.style.height = Math.min(t.scrollHeight, 120) + "px";
                }}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={isLoading || !input.trim()}
                className="flex-shrink-0 w-9 h-9 rounded-xl bg-dj-primary hover:bg-dj-primary/80 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                ) : (
                  <Send className="w-4 h-4 text-white" />
                )}
              </button>
            </div>
            <p className="text-xs text-dj-muted mt-1.5 text-center">
              Enter to send · Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
