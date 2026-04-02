"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  Clock,
  CheckCircle2,
  Circle,
  Music2,
  Megaphone,
  Loader2,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { formatTime, formatDate, getInitials } from "@/lib/utils";

interface ScheduleItem {
  id: string;
  title: string;
  description?: string | null;
  type: string;
  startTime: string;
  endTime?: string | null;
  assignee?: string | null;
  color?: string | null;
  completed: boolean;
  order: number;
}

interface Message {
  id: string;
  content: string;
  type: string;
  createdAt: string;
  user: { id: string; name?: string | null };
}

interface EventBasic {
  id: string;
  name: string;
  startDate: string;
  status: string;
  venue?: string | null;
  city?: string | null;
}

const typeIcons: Record<string, React.ReactNode> = {
  DJ_SET: <Music2 className="w-4 h-4" />,
  BREAK: <Clock className="w-4 h-4" />,
  SETUP: <AlertCircle className="w-4 h-4" />,
  DOORS: <Circle className="w-4 h-4" />,
  GENERAL: <Circle className="w-4 h-4" />,
};

export default function DayOfPage() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<EventBasic | null>(null);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [announcements, setAnnouncements] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());
  const [announcement, setAnnouncement] = useState("");
  const [sending, setSending] = useState(false);

  const fetchData = useCallback(async () => {
    const [eventRes, schedRes, msgRes] = await Promise.all([
      fetch(`/api/events/${id}`),
      fetch(`/api/events/${id}/schedule`),
      fetch(`/api/events/${id}/messages?type=ANNOUNCEMENT`),
    ]);
    if (eventRes.ok) setEvent(await eventRes.json());
    if (schedRes.ok) setSchedule(await schedRes.json());
    if (msgRes.ok) setAnnouncements(await msgRes.json());
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Auto refresh every 30s
  useEffect(() => {
    const t = setInterval(() => fetchData(), 30000);
    return () => clearInterval(t);
  }, [fetchData]);

  async function toggleComplete(itemId: string, completed: boolean) {
    await fetch(`/api/events/${id}/schedule/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !completed }),
    });
    setSchedule(s => s.map(item => item.id === itemId ? { ...item, completed: !item.completed } : item));
  }

  async function sendAnnouncement() {
    if (!announcement.trim()) return;
    setSending(true);
    try {
      await fetch(`/api/events/${id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: announcement, type: "ANNOUNCEMENT" }),
      });
      setAnnouncement("");
      fetchData();
    } finally {
      setSending(false);
    }
  }

  function getCurrentItem(): ScheduleItem | null {
    return schedule.find(item => {
      const start = new Date(item.startTime);
      const end = item.endTime ? new Date(item.endTime) : new Date(start.getTime() + 60 * 60 * 1000);
      return now >= start && now <= end;
    }) ?? null;
  }

  function getNextItem(): ScheduleItem | null {
    const upcoming = schedule
      .filter(item => new Date(item.startTime) > now && !item.completed)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    return upcoming[0] ?? null;
  }

  const sorted = [...schedule].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  const currentItem = getCurrentItem();
  const nextItem = getNextItem();
  const completedCount = schedule.filter(s => s.completed).length;

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-dj-muted" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Live clock header */}
      <div className="card p-5 mb-6 bg-gradient-to-br from-dj-800 to-dj-750">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="page-title flex items-center gap-2">
              <Clock className="w-5 h-5 text-dj-primary" /> Day-Of Mode
            </h1>
            {event && (
              <p className="text-dj-muted text-sm mt-0.5">
                {event.name} · {event.venue ?? ""}{event.city ? `, ${event.city}` : ""}
              </p>
            )}
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-white font-mono tabular-nums">
              {now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </div>
            <div className="text-xs text-dj-muted mt-0.5">
              {formatDate(now)}
            </div>
          </div>
        </div>

        {/* Current / Next */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          <div className={`p-3 rounded-xl border ${currentItem ? "bg-dj-primary/10 border-dj-primary/30" : "bg-dj-900/50 border-dj-border/30"}`}>
            <p className="text-xs font-medium text-dj-muted uppercase tracking-wide mb-1">Now Playing</p>
            {currentItem ? (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-dj-primary animate-pulse" />
                <span className="text-sm font-semibold text-white">{currentItem.title}</span>
                {currentItem.assignee && <span className="text-xs text-dj-muted">({currentItem.assignee})</span>}
              </div>
            ) : (
              <span className="text-sm text-dj-muted">Nothing scheduled</span>
            )}
          </div>
          <div className="p-3 rounded-xl border bg-dj-900/50 border-dj-border/30">
            <p className="text-xs font-medium text-dj-muted uppercase tracking-wide mb-1">Up Next</p>
            {nextItem ? (
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">{nextItem.title}</span>
                <span className="text-xs text-dj-secondary">{formatTime(nextItem.startTime)}</span>
              </div>
            ) : (
              <span className="text-sm text-dj-muted">No more items</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Schedule</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-dj-muted">{completedCount}/{schedule.length} done</span>
              <button onClick={() => fetchData()} className="p-1.5 text-dj-muted hover:text-dj-text hover:bg-dj-800 rounded-lg transition-colors">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {schedule.length === 0 ? (
            <div className="card p-8 text-center">
              <Clock className="w-8 h-8 text-dj-muted mx-auto mb-3" />
              <p className="text-dj-muted text-sm">No schedule set. Add items in Planning.</p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-dj-border/50" />

              <div className="space-y-3">
                {sorted.map((item) => {
                  const isPast = item.endTime
                    ? new Date(item.endTime) < now
                    : new Date(item.startTime) < now;
                  const isCurrent = currentItem?.id === item.id;

                  return (
                    <div key={item.id} className={`flex items-start gap-4 relative ${isPast && !isCurrent ? "opacity-50" : ""}`}>
                      {/* Timeline dot */}
                      <button
                        onClick={() => toggleComplete(item.id, item.completed)}
                        className={`w-10 h-10 rounded-full border-2 flex items-center justify-center flex-shrink-0 z-10 transition-all ${
                          item.completed
                            ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                            : isCurrent
                            ? "border-dj-primary bg-dj-primary/20 text-dj-primary-light animate-pulse"
                            : "bg-dj-900 border-dj-border text-dj-muted hover:border-dj-border/80"
                        }`}
                        title="Click to mark complete"
                      >
                        {item.completed ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <span>{typeIcons[item.type] ?? <Circle className="w-4 h-4" />}</span>
                        )}
                      </button>

                      {/* Content */}
                      <div className={`flex-1 card p-3.5 mb-1 ${isCurrent ? "border-dj-primary/30 bg-dj-primary/5" : ""}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-dj-primary animate-pulse" />}
                              <span className={`font-medium text-sm ${item.completed ? "line-through text-dj-muted" : "text-white"}`}>
                                {item.title}
                              </span>
                              <span className="text-xs text-dj-muted bg-dj-700 px-1.5 py-0.5 rounded">
                                {item.type}
                              </span>
                            </div>
                            {item.description && <p className="text-xs text-dj-muted mt-0.5">{item.description}</p>}
                            {item.assignee && <p className="text-xs text-dj-muted mt-0.5">→ {item.assignee}</p>}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-sm font-semibold" style={{ color: item.color ?? "#7c3aed" }}>
                              {formatTime(item.startTime)}
                            </div>
                            {item.endTime && (
                              <div className="text-xs text-dj-muted">{formatTime(item.endTime)}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Announcements panel */}
        <div>
          <h2 className="section-title mb-4 flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-dj-primary" /> Announcements
          </h2>

          {/* Send announcement */}
          <div className="card p-3 mb-4">
            <textarea
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
              placeholder="Broadcast to the whole team..."
              className="input-field text-sm resize-none mb-2"
              rows={2}
            />
            <button
              onClick={sendAnnouncement}
              disabled={!announcement.trim() || sending}
              className="btn-primary w-full text-sm flex items-center justify-center gap-2"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Megaphone className="w-4 h-4" />}
              Announce
            </button>
          </div>

          {/* Announcement list */}
          <div className="space-y-2">
            {announcements.filter(m => m.type === "ANNOUNCEMENT").slice(0, 10).map((msg) => (
              <div key={msg.id} className="card p-3 border-dj-primary/20 bg-dj-primary/5">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="avatar w-5 h-5 bg-dj-primary/20 text-dj-primary-light text-xs">
                    {getInitials(msg.user.name)}
                  </div>
                  <span className="text-xs font-medium text-dj-primary-light">{msg.user.name}</span>
                  <span className="text-xs text-dj-muted ml-auto">
                    {new Date(msg.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <p className="text-sm text-dj-text">{msg.content}</p>
              </div>
            ))}
            {announcements.filter(m => m.type === "ANNOUNCEMENT").length === 0 && (
              <p className="text-xs text-dj-muted text-center py-4">No announcements yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
