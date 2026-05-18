"use client";

import { useState } from "react";
import { Bot, Copy, Check, X, Loader2, Download } from "lucide-react";
import { formatDate, formatTime } from "@/lib/utils";

interface Props {
  eventId: string;
  eventName: string;
}

export default function ExportForClaudeButton({ eventId, eventName }: Props) {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [markdown, setMarkdown] = useState("");
  const [copied, setCopied] = useState(false);

  async function generate() {
    setLoading(true);
    setShow(true);
    try {
      const [eventRes, tasksRes, postsRes] = await Promise.all([
        fetch(`/api/events/${eventId}`),
        fetch(`/api/events/${eventId}/tasks`),
        fetch(`/api/events/${eventId}/marketing-posts`),
      ]);

      const event  = eventRes.ok  ? await eventRes.json()  : null;
      const tasks  = tasksRes.ok  ? await tasksRes.json()  : [];
      const posts  = postsRes.ok  ? await postsRes.json()  : [];

      if (!event) { setMarkdown("Failed to load event data."); return; }

      const lines: string[] = [];

      // ── Header ──────────────────────────────────────────────────────────────
      lines.push(`# Event Brief: ${event.name}`);
      lines.push("");
      lines.push(`> This document contains the full details of the event for use as AI context.`);
      lines.push(`> Generated: ${new Date().toUTCString()}`);
      lines.push("");

      // ── Overview ────────────────────────────────────────────────────────────
      lines.push("## Overview");
      lines.push(`- **Status:** ${event.status}`);
      lines.push(`- **Start:** ${formatDate(event.startDate, "EEEE, MMMM d yyyy")} at ${formatTime(event.startDate)}`);
      if (event.endDate) lines.push(`- **End:** ${formatTime(event.endDate)}`);
      if (event.doorsOpen) lines.push(`- **Doors Open:** ${formatTime(event.doorsOpen)}`);
      if (event.venue) lines.push(`- **Venue:** ${[event.venue, event.city, event.state].filter(Boolean).join(", ")}`);
      if (event.address) lines.push(`- **Address:** ${event.address}`);
      if (event.capacity) lines.push(`- **Capacity:** ${event.capacity}`);
      if (event.dresscode) lines.push(`- **Dress Code:** ${event.dresscode}`);
      if (event.ageLimit) lines.push(`- **Age Limit:** ${event.ageLimit}`);
      if (event.price != null && event.price > 0) lines.push(`- **Ticket Price:** $${event.price}`);
      if (event.ticketUrl) lines.push(`- **Tickets:** ${event.ticketUrl}`);
      if (event.isPublic) lines.push(`- **Public Page:** ${typeof window !== "undefined" ? window.location.origin : ""}/e/${eventId}`);
      lines.push("");

      if (event.tagline) {
        lines.push(`**Tagline:** ${event.tagline}`);
        lines.push("");
      }
      if (event.description) {
        lines.push(`**Description:** ${event.description}`);
        lines.push("");
      }

      // ── Genres ──────────────────────────────────────────────────────────────
      if (event.genres?.length > 0) {
        lines.push(`**Music Genres:** ${event.genres.map((g: { genre: string }) => g.genre).join(", ")}`);
        lines.push("");
      }

      // ── DJ Lineup ───────────────────────────────────────────────────────────
      if (event.djs?.length > 0) {
        lines.push("## DJ Lineup");
        event.djs.forEach((dj: {
          name: string; featured: boolean; setTime?: string; setDuration?: number;
          instagramHandle?: string; genres?: string; bio?: string;
        }) => {
          lines.push(`### ${dj.name}${dj.featured ? " ⭐ (Headliner)" : ""}`);
          if (dj.setTime) lines.push(`- **Set Time:** ${dj.setTime}${dj.setDuration ? ` (${dj.setDuration} min)` : ""}`);
          if (dj.instagramHandle) lines.push(`- **Instagram:** ${dj.instagramHandle}`);
          if (dj.genres) {
            try { lines.push(`- **Genres:** ${JSON.parse(dj.genres).join(", ")}`); } catch {}
          }
          if (dj.bio) lines.push(`- **Bio:** ${dj.bio}`);
        });
        lines.push("");
      }

      // ── Schedule ────────────────────────────────────────────────────────────
      if (event.scheduleItems?.length > 0) {
        lines.push("## Event Schedule");
        const sorted = [...event.scheduleItems].sort(
          (a: { startTime: string }, b: { startTime: string }) =>
            new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        );
        sorted.forEach((item: {
          title: string; type: string; startTime: string; endTime?: string; assignee?: string;
        }) => {
          const time = `${formatTime(item.startTime)}${item.endTime ? ` – ${formatTime(item.endTime)}` : ""}`;
          lines.push(`- **${time}** — ${item.title} _(${item.type})_${item.assignee ? ` · ${item.assignee}` : ""}`);
        });
        lines.push("");
      }

      // ── Team ────────────────────────────────────────────────────────────────
      if (event.members?.length > 0) {
        lines.push("## Team");
        event.members.forEach((m: { role: string; user: { name?: string; email: string } }) => {
          lines.push(`- **${m.user.name ?? m.user.email}** (${m.role}) — ${m.user.email}`);
        });
        lines.push("");
      }

      // ── Tasks ───────────────────────────────────────────────────────────────
      if (tasks.length > 0) {
        lines.push("## Tasks");
        const byStatus: Record<string, typeof tasks> = {};
        tasks.forEach((t: { status: string }) => {
          byStatus[t.status] = byStatus[t.status] ?? [];
          byStatus[t.status].push(t);
        });
        ["TODO", "IN_PROGRESS", "BLOCKED", "DONE"].forEach(status => {
          const group = byStatus[status];
          if (!group?.length) return;
          const label = status === "TODO" ? "To Do" : status === "IN_PROGRESS" ? "In Progress" :
            status === "BLOCKED" ? "Blocked" : "Done";
          lines.push(`### ${label}`);
          group.forEach((t: { title: string; priority: string; dueDate?: string; category?: string; assignee?: { name?: string } }) => {
            const done = status === "DONE";
            const due = t.dueDate ? ` · Due ${formatDate(t.dueDate, "MMM d")}` : "";
            const cat = t.category ? ` · [${t.category}]` : "";
            const assignee = t.assignee?.name ? ` · ${t.assignee.name}` : "";
            lines.push(`- [${done ? "x" : " "}] **${t.title}** (${t.priority})${due}${cat}${assignee}`);
          });
          lines.push("");
        });
      }

      // ── Marketing Posts ──────────────────────────────────────────────────────
      if (posts.length > 0) {
        lines.push("## Social Media Posts");
        const platforms = [...new Set(posts.map((p: { platform: string }) => p.platform))];
        platforms.forEach(platform => {
          const platformPosts = posts.filter((p: { platform: string }) => p.platform === platform);
          lines.push(`### ${platform}`);
          platformPosts.forEach((p: {
            status: string; scheduledAt?: string; content: string;
            hashtags?: string; notes?: string;
          }) => {
            const status = p.scheduledAt
              ? `Scheduled ${formatDate(p.scheduledAt, "MMM d")} at ${formatTime(p.scheduledAt)}`
              : p.status;
            lines.push(`**[${status}]**`);
            lines.push(`> ${p.content.replace(/\n/g, "\n> ")}`);
            if (p.hashtags) lines.push(`> ${p.hashtags}`);
            if (p.notes) lines.push(`> _Note: ${p.notes}_`);
            lines.push("");
          });
        });
      }

      // ── Usage hint ──────────────────────────────────────────────────────────
      lines.push("---");
      lines.push("*Add this document to your Claude Project to get AI assistance that knows your event details.*");

      setMarkdown(lines.join("\n"));
    } finally {
      setLoading(false);
    }
  }

  function copy() {
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function download() {
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${eventName.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-brief.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <button
        onClick={generate}
        className="flex items-center gap-1.5 text-xs text-dj-muted hover:text-dj-text border border-dj-border hover:border-dj-primary/30 rounded-lg px-3 py-1.5 transition-all"
      >
        <Bot className="w-3.5 h-3.5" /> Export for Claude
      </button>

      {show && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-dj-800 border border-dj-border rounded-xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-dj-border flex-shrink-0">
              <div>
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <Bot className="w-4 h-4 text-dj-primary" /> Export for Claude Project
                </h3>
                <p className="text-xs text-dj-muted mt-0.5">
                  Copy this and add it as a document in your Claude.ai Project
                </p>
              </div>
              <button onClick={() => setShow(false)} className="text-dj-muted hover:text-dj-text">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="flex items-center justify-center h-40">
                  <Loader2 className="w-6 h-6 animate-spin text-dj-muted" />
                </div>
              ) : (
                <pre className="text-xs text-dj-text font-mono whitespace-pre-wrap leading-relaxed bg-dj-900 rounded-lg p-4 border border-dj-border/50">
                  {markdown}
                </pre>
              )}
            </div>

            {/* Footer */}
            {!loading && (
              <div className="flex items-center gap-3 px-5 py-4 border-t border-dj-border flex-shrink-0">
                <p className="text-xs text-dj-muted flex-1">
                  Go to <span className="text-dj-primary-light">claude.ai/projects</span> → open your project → Add content → paste this document
                </p>
                <button onClick={download}
                  className="flex items-center gap-1.5 text-xs btn-secondary px-3 py-1.5">
                  <Download className="w-3.5 h-3.5" /> .md
                </button>
                <button onClick={copy}
                  className="flex items-center gap-1.5 text-sm btn-primary px-4 py-2">
                  {copied
                    ? <><Check className="w-4 h-4" /> Copied!</>
                    : <><Copy className="w-4 h-4" /> Copy All</>}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
