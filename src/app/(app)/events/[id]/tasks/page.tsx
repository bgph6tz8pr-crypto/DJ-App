"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  CheckSquare,
  Plus,
  Loader2,
  X,
  Trash2,
  ChevronDown,
  Circle,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { getInitials, getPriorityColor, TASK_CATEGORIES } from "@/lib/utils";
import { formatDate } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  category?: string | null;
  assigneeId?: string | null;
  dueDate?: string | null;
  assignee?: { id: string; name?: string | null; email: string } | null;
}

interface TeamMember {
  id: string;
  role: string;
  user: { id: string; name?: string | null; email: string };
}

const STATUS_COLUMNS = [
  { key: "TODO", label: "To Do", icon: Circle, color: "text-slate-400" },
  { key: "IN_PROGRESS", label: "In Progress", icon: Clock, color: "text-blue-400" },
  { key: "DONE", label: "Done", icon: CheckCircle2, color: "text-emerald-400" },
  { key: "BLOCKED", label: "Blocked", icon: XCircle, color: "text-red-400" },
];

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

export default function TasksPage() {
  const { id } = useParams<{ id: string }>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
    category: "",
    assigneeId: "",
    dueDate: "",
    status: "TODO",
  });

  const fetchData = useCallback(async () => {
    const [tasksRes, teamRes] = await Promise.all([
      fetch(`/api/events/${id}/tasks`),
      fetch(`/api/events/${id}/team`),
    ]);
    if (tasksRes.ok) setTasks(await tasksRes.json());
    if (teamRes.ok) setTeam(await teamRes.json());
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function createTask() {
    if (!form.title.trim()) return;
    setFormLoading(true);
    try {
      await fetch(`/api/events/${id}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          assigneeId: form.assigneeId || null,
          dueDate: form.dueDate || null,
          category: form.category || null,
        }),
      });
      setShowForm(false);
      setForm({ title: "", description: "", priority: "MEDIUM", category: "", assigneeId: "", dueDate: "", status: "TODO" });
      fetchData();
    } finally {
      setFormLoading(false);
    }
  }

  async function updateStatus(taskId: string, newStatus: string) {
    await fetch(`/api/events/${id}/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
  }

  async function deleteTask(taskId: string) {
    await fetch(`/api/events/${id}/tasks/${taskId}`, { method: "DELETE" });
    setTasks(tasks.filter(t => t.id !== taskId));
  }

  const filtered = filter === "all" ? tasks : tasks.filter(t => t.assigneeId === filter);

  const priorityOrder: Record<string, number> = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-dj-muted" /></div>;
  }

  return (
    <div className="max-w-full">
      <div className="page-header flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-dj-primary" /> Tasks
          </h1>
          <p className="page-subtitle">
            {tasks.filter(t => t.status === "DONE").length}/{tasks.length} completed
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Filter by person */}
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="input-field py-1.5 text-sm w-auto">
            <option value="all">All members</option>
            {team.map(m => (
              <option key={m.user.id} value={m.user.id}>{m.user.name ?? m.user.email}</option>
            ))}
          </select>
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-1.5 text-sm">
            <Plus className="w-4 h-4" /> New Task
          </button>
        </div>
      </div>

      {/* Progress bar */}
      {tasks.length > 0 && (
        <div className="mb-5">
          <div className="h-1.5 bg-dj-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-dj-primary to-emerald-500 rounded-full transition-all"
              style={{ width: `${(tasks.filter(t => t.status === "DONE").length / tasks.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Kanban board */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {STATUS_COLUMNS.map((col) => {
          const colTasks = filtered
            .filter(t => t.status === col.key)
            .sort((a, b) => (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9));

          return (
            <div key={col.key} className="flex flex-col">
              {/* Column header */}
              <div className="flex items-center gap-2 mb-3 px-1">
                <col.icon className={`w-4 h-4 ${col.color}`} />
                <span className="text-sm font-medium text-dj-text">{col.label}</span>
                <span className="text-xs text-dj-muted bg-dj-800 px-1.5 py-0.5 rounded-full ml-auto">
                  {colTasks.length}
                </span>
              </div>

              {/* Tasks */}
              <div className="space-y-2 flex-1">
                {colTasks.map((task) => (
                  <div key={task.id} className="card p-3 group">
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap mb-1">
                          {(task.priority === "URGENT" || task.priority === "HIGH") && (
                            <AlertCircle className={`w-3 h-3 flex-shrink-0 ${getPriorityColor(task.priority)}`} />
                          )}
                          <span className={`text-sm font-medium leading-tight ${task.status === "DONE" ? "line-through text-dj-muted" : "text-white"}`}>
                            {task.title}
                          </span>
                        </div>

                        {task.description && (
                          <p className="text-xs text-dj-muted line-clamp-2 mb-1.5">{task.description}</p>
                        )}

                        <div className="flex items-center gap-2 flex-wrap">
                          {task.category && (
                            <span className="text-xs bg-dj-700 text-dj-muted px-1.5 py-0.5 rounded">
                              {task.category}
                            </span>
                          )}
                          <span className={`text-xs font-medium ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                          {task.dueDate && (
                            <span className="text-xs text-dj-muted">
                              📅 {formatDate(task.dueDate, "MMM d")}
                            </span>
                          )}
                        </div>

                        {task.assignee && (
                          <div className="flex items-center gap-1 mt-1.5">
                            <div className="avatar w-5 h-5 bg-dj-primary/20 text-dj-primary-light text-xs">
                              {getInitials(task.assignee.name)}
                            </div>
                            <span className="text-xs text-dj-muted">{task.assignee.name ?? task.assignee.email}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quick actions */}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-dj-border/30 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="relative group/menu">
                        <button className="text-xs text-dj-muted hover:text-dj-text flex items-center gap-0.5">
                          Move <ChevronDown className="w-3 h-3" />
                        </button>
                        <div className="absolute bottom-full left-0 mb-1 bg-dj-800 border border-dj-border rounded-lg overflow-hidden shadow-lg z-10 hidden group-hover/menu:block min-w-max">
                          {STATUS_COLUMNS.filter(c => c.key !== col.key).map(c => (
                            <button key={c.key} onClick={() => updateStatus(task.id, c.key)}
                              className="flex items-center gap-1.5 px-3 py-2 text-xs text-dj-muted hover:bg-dj-700 hover:text-dj-text w-full whitespace-nowrap">
                              <c.icon className={`w-3 h-3 ${c.color}`} />
                              {c.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <button onClick={() => deleteTask(task.id)}
                        className="text-dj-muted hover:text-red-400 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {colTasks.length === 0 && (
                  <div className="border border-dashed border-dj-border/30 rounded-xl p-4 text-center text-xs text-dj-muted">
                    No tasks
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* New task form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-dj-800 border border-dj-border rounded-xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-white">New Task</h3>
              <button onClick={() => setShowForm(false)} className="text-dj-muted hover:text-dj-text"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="label">Title *</label>
                <input type="text" value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                  className="input-field" placeholder="What needs to be done?" autoFocus />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                  className="input-field" rows={2} placeholder="Optional details..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Priority</label>
                  <select value={form.priority} onChange={(e) => setForm(f => ({ ...f, priority: e.target.value }))} className="input-field">
                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Category</label>
                  <select value={form.category} onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))} className="input-field">
                    <option value="">None</option>
                    {TASK_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Assign To</label>
                <select value={form.assigneeId} onChange={(e) => setForm(f => ({ ...f, assigneeId: e.target.value }))} className="input-field">
                  <option value="">Unassigned</option>
                  {team.map(m => <option key={m.user.id} value={m.user.id}>{m.user.name ?? m.user.email} ({m.role})</option>)}
                </select>
              </div>
              <div>
                <label className="label">Due Date</label>
                <input type="date" value={form.dueDate} onChange={(e) => setForm(f => ({ ...f, dueDate: e.target.value }))} className="input-field" />
              </div>
              <div>
                <label className="label">Initial Status</label>
                <select value={form.status} onChange={(e) => setForm(f => ({ ...f, status: e.target.value }))} className="input-field">
                  {STATUS_COLUMNS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={createTask} disabled={formLoading} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Create Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
