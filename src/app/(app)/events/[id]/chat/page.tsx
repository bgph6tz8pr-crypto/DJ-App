"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  MessageSquare,
  Send,
  Loader2,
  Megaphone,
  RefreshCw,
} from "lucide-react";
import { getInitials, timeAgo, getRoleColor } from "@/lib/utils";

interface Message {
  id: string;
  content: string;
  type: string;
  createdAt: string;
  user: {
    id: string;
    name?: string | null;
    email: string;
    image?: string | null;
    role: string;
  };
}

interface TeamMember {
  id: string;
  role: string;
  user: { id: string; name?: string | null; email: string };
}

export default function ChatPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const userId = (session?.user as { id?: string })?.id;

  const [messages, setMessages] = useState<Message[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [content, setContent] = useState("");
  const [msgType, setMsgType] = useState<"TEXT" | "ANNOUNCEMENT">("TEXT");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const fetchMessages = useCallback(async (silent = false) => {
    const res = await fetch(`/api/events/${id}/messages`);
    if (res.ok) {
      const data = await res.json();
      setMessages(data);
      if (!silent) setLoading(false);
    }
  }, [id]);

  const fetchTeam = useCallback(async () => {
    const res = await fetch(`/api/events/${id}/team`);
    if (res.ok) setTeam(await res.json());
  }, [id]);

  useEffect(() => {
    fetchMessages();
    fetchTeam();
  }, [fetchMessages, fetchTeam]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => fetchMessages(true), 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchMessages]);

  async function sendMessage() {
    if (!content.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/events/${id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim(), type: msgType }),
      });
      if (res.ok) {
        setContent("");
        setMsgType("TEXT");
        fetchMessages(true);
      }
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const myMembership = team.find(m => m.user.id === userId);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-dj-muted" /></div>;
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col" style={{ height: "calc(100vh - 160px)" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h1 className="page-title flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-dj-primary" /> Team Chat
        </h1>
        <div className="flex items-center gap-2">
          <span className="text-xs text-dj-muted">{messages.length} messages</span>
          <button
            onClick={() => fetchMessages(true)}
            className="p-2 text-dj-muted hover:text-dj-text hover:bg-dj-800 rounded-lg transition-colors"
            title="Refresh messages"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`text-xs px-2 py-1 rounded-full border transition-colors ${
              autoRefresh
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-dj-800 text-dj-muted border-dj-border"
            }`}
          >
            {autoRefresh ? "● Live" : "⏸ Paused"}
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-0">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageSquare className="w-10 h-10 text-dj-muted mb-3" />
            <p className="text-dj-muted text-sm">No messages yet.</p>
            <p className="text-dj-muted text-xs mt-1">Start the conversation with your team.</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.user.id === userId;
            const isAnnouncement = msg.type === "ANNOUNCEMENT";
            const prevMsg = i > 0 ? messages[i - 1] : null;
            const showAvatar = !prevMsg || prevMsg.user.id !== msg.user.id || isAnnouncement;

            if (isAnnouncement) {
              return (
                <div key={msg.id} className="bg-dj-primary/10 border border-dj-primary/20 rounded-xl p-4 mx-4">
                  <div className="flex items-start gap-3">
                    <Megaphone className="w-4 h-4 text-dj-primary-light flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-dj-primary-light">ANNOUNCEMENT</span>
                        <span className="text-xs text-dj-muted">by {msg.user.name ?? msg.user.email}</span>
                      </div>
                      <p className="text-sm text-white">{msg.content}</p>
                      <p className="text-xs text-dj-muted mt-1">{timeAgo(msg.createdAt)}</p>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div key={msg.id} className={`flex gap-2.5 ${isMe ? "flex-row-reverse" : ""} ${!showAvatar ? "ml-10" : ""}`}>
                {showAvatar && (
                  <div className="avatar w-8 h-8 bg-dj-primary/20 text-dj-primary-light text-xs flex-shrink-0 self-end">
                    {getInitials(msg.user.name)}
                  </div>
                )}
                <div className={`max-w-[75%] ${isMe ? "items-end" : ""} flex flex-col`}>
                  {showAvatar && (
                    <div className={`flex items-center gap-2 mb-1 ${isMe ? "flex-row-reverse" : ""}`}>
                      <span className="text-xs font-medium text-dj-text">
                        {isMe ? "You" : (msg.user.name ?? msg.user.email)}
                      </span>
                      <span className={`badge text-xs ${getRoleColor(msg.user.role)}`}>
                        {msg.user.role}
                      </span>
                    </div>
                  )}
                  <div className={`rounded-2xl px-3.5 py-2.5 text-sm break-words ${
                    isMe
                      ? "bg-dj-primary text-white rounded-tr-sm"
                      : "bg-dj-800 text-dj-text border border-dj-border rounded-tl-sm"
                  }`}>
                    {msg.content}
                  </div>
                  <span className="text-xs text-dj-muted mt-1 px-1">{timeAgo(msg.createdAt)}</span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 mt-4 pt-4 border-t border-dj-border">
        {/* Type toggle */}
        <div className="flex gap-2 mb-2">
          <button
            onClick={() => setMsgType("TEXT")}
            className={`text-xs px-3 py-1 rounded-full border transition-all ${
              msgType === "TEXT"
                ? "bg-dj-primary/15 text-dj-primary-light border-dj-primary/30"
                : "text-dj-muted border-dj-border hover:border-dj-border/80"
            }`}
          >
            Message
          </button>
          <button
            onClick={() => setMsgType("ANNOUNCEMENT")}
            className={`text-xs px-3 py-1 rounded-full border transition-all flex items-center gap-1 ${
              msgType === "ANNOUNCEMENT"
                ? "bg-dj-primary/15 text-dj-primary-light border-dj-primary/30"
                : "text-dj-muted border-dj-border hover:border-dj-border/80"
            }`}
          >
            <Megaphone className="w-3 h-3" /> Announcement
          </button>
        </div>

        <div className="flex gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={msgType === "ANNOUNCEMENT" ? "Post an announcement to the team..." : "Message the team... (Enter to send)"}
              className={`input-field resize-none py-3 pr-10 ${msgType === "ANNOUNCEMENT" ? "border-dj-primary/40 bg-dj-primary/5" : ""}`}
              rows={1}
              style={{ minHeight: "44px", maxHeight: "120px" }}
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={!content.trim() || sending}
            className="btn-primary flex-shrink-0 px-4 flex items-center gap-2"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
        <p className="text-xs text-dj-muted mt-1.5">
          {team.length} member{team.length !== 1 ? "s" : ""} in this channel · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
