"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  Plus,
  Loader2,
  Music2,
  Calendar,
  MapPin,
  Trash2,
  Edit2,
  GripVertical,
  Instagram,
  X,
  Check,
} from "lucide-react";
import { formatDateTime, formatTime, DJ_GENRES } from "@/lib/utils";

interface EventDJ {
  id: string;
  name: string;
  bio?: string | null;
  image?: string | null;
  instagramHandle?: string | null;
  setTime?: string | null;
  setDuration?: number | null;
  genres?: string | null;
  order: number;
  featured: boolean;
}

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

interface EventDetails {
  id: string;
  name: string;
  venue?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  startDate: string;
  endDate?: string | null;
  doorsOpen?: string | null;
  status: string;
  capacity?: number | null;
  dresscode?: string | null;
  ageLimit?: string | null;
  genres: { id: string; genre: string }[];
  djs: EventDJ[];
  scheduleItems: ScheduleItem[];
}

const SCHEDULE_COLORS = [
  "#7c3aed", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#ef4444", "#64748b",
];

const SCHEDULE_TYPES = ["DJ_SET", "BREAK", "SETUP", "DOORS", "GENERAL"];

export default function PlanningPage() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<EventDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"lineup" | "schedule" | "venue">("lineup");

  // DJ form
  const [showDJForm, setShowDJForm] = useState(false);
  const [editingDJ, setEditingDJ] = useState<EventDJ | null>(null);
  const [djForm, setDJForm] = useState({
    name: "", bio: "", instagramHandle: "", setTime: "",
    setDuration: "", genres: [] as string[], featured: false,
  });
  const [djLoading, setDJLoading] = useState(false);

  // Schedule form
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [schedForm, setSchedForm] = useState({
    title: "", description: "", type: "DJ_SET",
    startDate: "", startTime: "", endTime: "",
    assignee: "", color: SCHEDULE_COLORS[0],
  });
  const [schedLoading, setSchedLoading] = useState(false);

  // Venue form
  const [showVenueForm, setShowVenueForm] = useState(false);
  const [venueForm, setVenueForm] = useState({
    venue: "", address: "", city: "", state: "",
    capacity: "", dresscode: "", ageLimit: "",
  });
  const [venueLoading, setVenueLoading] = useState(false);

  const fetchEvent = useCallback(async () => {
    const res = await fetch(`/api/events/${id}`);
    if (res.ok) setEvent(await res.json());
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchEvent(); }, [fetchEvent]);

  function openDJForm(dj?: EventDJ) {
    if (dj) {
      setEditingDJ(dj);
      setDJForm({
        name: dj.name,
        bio: dj.bio ?? "",
        instagramHandle: dj.instagramHandle ?? "",
        setTime: dj.setTime ?? "",
        setDuration: dj.setDuration?.toString() ?? "",
        genres: dj.genres ? JSON.parse(dj.genres) : [],
        featured: dj.featured,
      });
    } else {
      setEditingDJ(null);
      setDJForm({ name: "", bio: "", instagramHandle: "", setTime: "", setDuration: "", genres: [], featured: false });
    }
    setShowDJForm(true);
  }

  async function saveDJ() {
    if (!djForm.name.trim()) return;
    setDJLoading(true);
    try {
      const payload = {
        ...djForm,
        setDuration: djForm.setDuration ? parseInt(djForm.setDuration) : null,
        genres: JSON.stringify(djForm.genres),
        order: editingDJ?.order ?? (event?.djs.length ?? 0),
      };

      if (editingDJ) {
        await fetch(`/api/events/${id}/djs/${editingDJ.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch(`/api/events/${id}/djs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      setShowDJForm(false);
      fetchEvent();
    } finally {
      setDJLoading(false);
    }
  }

  async function deleteDJ(djId: string) {
    if (!confirm("Remove this DJ from the lineup?")) return;
    await fetch(`/api/events/${id}/djs/${djId}`, { method: "DELETE" });
    fetchEvent();
  }

  async function saveScheduleItem() {
    if (!schedForm.title.trim() || !schedForm.startDate || !schedForm.startTime) return;
    setSchedLoading(true);
    try {
      const startTime = `${schedForm.startDate}T${schedForm.startTime}:00.000Z`;
      const endTime = schedForm.endTime
        ? `${schedForm.startDate}T${schedForm.endTime}:00.000Z`
        : null;

      await fetch(`/api/events/${id}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...schedForm, startTime, endTime }),
      });
      setShowScheduleForm(false);
      setSchedForm({ title: "", description: "", type: "DJ_SET", startDate: "", startTime: "", endTime: "", assignee: "", color: SCHEDULE_COLORS[0] });
      fetchEvent();
    } finally {
      setSchedLoading(false);
    }
  }

  async function deleteScheduleItem(itemId: string) {
    await fetch(`/api/events/${id}/schedule/${itemId}`, { method: "DELETE" });
    fetchEvent();
  }

  function openVenueForm() {
    if (!event) return;
    setVenueForm({
      venue:     event.venue     ?? "",
      address:   event.address   ?? "",
      city:      event.city      ?? "",
      state:     event.state     ?? "",
      capacity:  event.capacity  != null ? event.capacity.toString() : "",
      dresscode: event.dresscode ?? "",
      ageLimit:  event.ageLimit  ?? "",
    });
    setShowVenueForm(true);
  }

  async function saveVenue() {
    setVenueLoading(true);
    try {
      await fetch(`/api/events/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          venue:     venueForm.venue     || null,
          address:   venueForm.address   || null,
          city:      venueForm.city      || null,
          state:     venueForm.state     || null,
          capacity:  venueForm.capacity  ? parseInt(venueForm.capacity)  : null,
          dresscode: venueForm.dresscode || null,
          ageLimit:  venueForm.ageLimit  || null,
        }),
      });
      setShowVenueForm(false);
      fetchEvent();
    } finally {
      setVenueLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-dj-muted" />
      </div>
    );
  }

  if (!event) return null;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <Music2 className="w-5 h-5 text-dj-primary" /> Event Planning
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-dj-border mb-6">
        {(["lineup", "schedule", "venue"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-all -mb-px ${
              activeTab === t
                ? "border-dj-primary text-dj-primary-light"
                : "border-transparent text-dj-muted hover:text-dj-text"
            }`}
          >
            {t === "lineup" ? "DJ Lineup" : t === "schedule" ? "Schedule" : "Venue & Details"}
          </button>
        ))}
      </div>

      {/* DJ Lineup */}
      {activeTab === "lineup" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">DJ Lineup ({event.djs.length})</h2>
            <button onClick={() => openDJForm()} className="btn-primary text-sm flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> Add DJ
            </button>
          </div>

          {event.djs.length === 0 ? (
            <div className="card p-10 text-center">
              <Music2 className="w-10 h-10 text-dj-muted mx-auto mb-3" />
              <p className="text-dj-muted text-sm mb-4">No DJs added yet.</p>
              <button onClick={() => openDJForm()} className="btn-primary text-sm">
                Add first DJ
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {event.djs.map((dj) => (
                <div key={dj.id} className="card p-4 flex items-start gap-4">
                  <GripVertical className="w-4 h-4 text-dj-muted mt-1 flex-shrink-0 cursor-grab" />
                  <div className="w-14 h-14 rounded-xl bg-dj-700 overflow-hidden flex-shrink-0">
                    {dj.image ? (
                      <img src={dj.image} alt={dj.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music2 className="w-6 h-6 text-dj-muted" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-white">{dj.name}</span>
                      {dj.featured && (
                        <span className="text-xs bg-dj-secondary/10 text-dj-secondary border border-dj-secondary/20 px-1.5 py-0.5 rounded">
                          HEADLINER
                        </span>
                      )}
                    </div>
                    {dj.instagramHandle && (
                      <p className="text-xs text-dj-muted flex items-center gap-1 mt-0.5">
                        <Instagram className="w-3 h-3" /> {dj.instagramHandle}
                      </p>
                    )}
                    {dj.bio && <p className="text-xs text-dj-muted mt-1 line-clamp-2">{dj.bio}</p>}
                    {dj.genres && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {JSON.parse(dj.genres).map((g: string) => (
                          <span key={g} className="text-xs bg-dj-primary/10 text-dj-primary-light border border-dj-primary/20 px-1.5 py-0.5 rounded">
                            {g}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {dj.setTime && (
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-semibold text-dj-secondary">{dj.setTime}</div>
                      {dj.setDuration && (
                        <div className="text-xs text-dj-muted">{dj.setDuration}min</div>
                      )}
                    </div>
                  )}
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => openDJForm(dj)}
                      className="p-2 text-dj-muted hover:text-dj-text hover:bg-dj-700 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteDJ(dj.id)}
                      className="p-2 text-dj-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* DJ Form modal */}
          {showDJForm && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
              <div className="bg-dj-800 border border-dj-border rounded-xl w-full max-w-lg p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-semibold text-white">{editingDJ ? "Edit DJ" : "Add DJ to Lineup"}</h3>
                  <button onClick={() => setShowDJForm(false)} className="text-dj-muted hover:text-dj-text">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="label">DJ / Artist Name *</label>
                    <input type="text" value={djForm.name} onChange={(e) => setDJForm(f => ({ ...f, name: e.target.value }))} className="input-field" placeholder="DJ Nexus" />
                  </div>
                  <div>
                    <label className="label">Instagram Handle</label>
                    <input type="text" value={djForm.instagramHandle} onChange={(e) => setDJForm(f => ({ ...f, instagramHandle: e.target.value }))} className="input-field" placeholder="@djnexus" />
                  </div>
                  <div>
                    <label className="label">Bio</label>
                    <textarea value={djForm.bio} onChange={(e) => setDJForm(f => ({ ...f, bio: e.target.value }))} className="input-field" rows={2} placeholder="Short bio..." />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Set Time</label>
                      <input type="text" value={djForm.setTime} onChange={(e) => setDJForm(f => ({ ...f, setTime: e.target.value }))} className="input-field" placeholder="11:00 PM" />
                    </div>
                    <div>
                      <label className="label">Duration (min)</label>
                      <input type="number" value={djForm.setDuration} onChange={(e) => setDJForm(f => ({ ...f, setDuration: e.target.value }))} className="input-field" placeholder="90" />
                    </div>
                  </div>
                  <div>
                    <label className="label">Genres</label>
                    <div className="flex flex-wrap gap-1.5 mt-1 max-h-32 overflow-y-auto">
                      {DJ_GENRES.map((g) => (
                        <button key={g} type="button"
                          onClick={() => setDJForm(f => ({ ...f, genres: f.genres.includes(g) ? f.genres.filter(x => x !== g) : [...f.genres, g] }))}
                          className={`text-xs px-2 py-1 rounded-full border transition-all ${djForm.genres.includes(g) ? "bg-dj-primary border-dj-primary text-white" : "bg-dj-900 border-dj-border text-dj-muted"}`}>
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={djForm.featured} onChange={(e) => setDJForm(f => ({ ...f, featured: e.target.checked }))} className="accent-dj-primary" />
                    <span className="text-sm text-dj-text">Headliner / Featured</span>
                  </label>
                </div>
                <div className="flex gap-3 mt-5">
                  <button onClick={() => setShowDJForm(false)} className="btn-secondary flex-1">Cancel</button>
                  <button onClick={saveDJ} disabled={djLoading} className="btn-primary flex-1 flex items-center justify-center gap-2">
                    {djLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    {editingDJ ? "Save" : "Add DJ"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Schedule */}
      {activeTab === "schedule" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Event Schedule</h2>
            <button onClick={() => setShowScheduleForm(true)} className="btn-primary text-sm flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> Add Item
            </button>
          </div>

          {event.scheduleItems.length === 0 ? (
            <div className="card p-10 text-center">
              <Calendar className="w-10 h-10 text-dj-muted mx-auto mb-3" />
              <p className="text-dj-muted text-sm mb-4">No schedule items yet.</p>
              <button onClick={() => setShowScheduleForm(true)} className="btn-primary text-sm">
                Add first item
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {[...event.scheduleItems].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()).map((item) => (
                <div key={item.id} className="card p-4 flex items-center gap-4">
                  <div className="w-1 h-12 rounded-full flex-shrink-0" style={{ backgroundColor: item.color ?? "#7c3aed" }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium text-sm ${item.completed ? "line-through text-dj-muted" : "text-white"}`}>{item.title}</span>
                      <span className="text-xs text-dj-muted bg-dj-700 px-1.5 py-0.5 rounded">{item.type}</span>
                    </div>
                    {item.assignee && <p className="text-xs text-dj-muted mt-0.5">→ {item.assignee}</p>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-semibold text-dj-secondary">{formatTime(item.startTime)}</div>
                    {item.endTime && <div className="text-xs text-dj-muted">→ {formatTime(item.endTime)}</div>}
                  </div>
                  <button onClick={() => deleteScheduleItem(item.id)} className="p-2 text-dj-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex-shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Schedule form modal */}
          {showScheduleForm && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
              <div className="bg-dj-800 border border-dj-border rounded-xl w-full max-w-md p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-semibold text-white">Add Schedule Item</h3>
                  <button onClick={() => setShowScheduleForm(false)} className="text-dj-muted hover:text-dj-text"><X className="w-5 h-5" /></button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="label">Title *</label>
                    <input type="text" value={schedForm.title} onChange={(e) => setSchedForm(f => ({ ...f, title: e.target.value }))} className="input-field" placeholder="Opening Set - DJ Name" />
                  </div>
                  <div>
                    <label className="label">Type</label>
                    <select value={schedForm.type} onChange={(e) => setSchedForm(f => ({ ...f, type: e.target.value }))} className="input-field">
                      {SCHEDULE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Date</label>
                    <input type="date" value={schedForm.startDate} onChange={(e) => setSchedForm(f => ({ ...f, startDate: e.target.value }))} className="input-field" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Start Time *</label>
                      <input type="time" value={schedForm.startTime} onChange={(e) => setSchedForm(f => ({ ...f, startTime: e.target.value }))} className="input-field" />
                    </div>
                    <div>
                      <label className="label">End Time</label>
                      <input type="time" value={schedForm.endTime} onChange={(e) => setSchedForm(f => ({ ...f, endTime: e.target.value }))} className="input-field" />
                    </div>
                  </div>
                  <div>
                    <label className="label">Assigned To</label>
                    <input type="text" value={schedForm.assignee} onChange={(e) => setSchedForm(f => ({ ...f, assignee: e.target.value }))} className="input-field" placeholder="DJ Name or Team Member" />
                  </div>
                  <div>
                    <label className="label">Color</label>
                    <div className="flex gap-2 mt-1">
                      {SCHEDULE_COLORS.map(c => (
                        <button key={c} type="button" onClick={() => setSchedForm(f => ({ ...f, color: c }))}
                          className={`w-7 h-7 rounded-full border-2 transition-all ${schedForm.color === c ? "border-white scale-110" : "border-transparent"}`}
                          style={{ backgroundColor: c }} />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 mt-5">
                  <button onClick={() => setShowScheduleForm(false)} className="btn-secondary flex-1">Cancel</button>
                  <button onClick={saveScheduleItem} disabled={schedLoading} className="btn-primary flex-1 flex items-center justify-center gap-2">
                    {schedLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Item"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Venue */}
      {activeTab === "venue" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Venue &amp; Details</h2>
            <button onClick={openVenueForm} className="btn-primary text-sm flex items-center gap-1.5">
              <Edit2 className="w-4 h-4" /> Edit Details
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card p-5">
              <h3 className="section-title flex items-center gap-2 mb-4">
                <MapPin className="w-4 h-4 text-dj-primary" /> Venue
              </h3>
              <div className="space-y-2 text-sm">
                {event.venue && <div><span className="text-dj-muted">Name:</span> <span className="text-white ml-2">{event.venue}</span></div>}
                {event.address && <div><span className="text-dj-muted">Address:</span> <span className="text-white ml-2">{event.address}</span></div>}
                {event.city && <div><span className="text-dj-muted">City:</span> <span className="text-white ml-2">{event.city}{event.state && `, ${event.state}`}</span></div>}
                {!event.venue && !event.address && (
                  <div className="text-center py-4">
                    <p className="text-dj-muted text-sm mb-2">No venue details set.</p>
                    <button onClick={openVenueForm} className="btn-secondary text-xs">Add Venue</button>
                  </div>
                )}
              </div>
            </div>
            <div className="card p-5">
              <h3 className="section-title flex items-center gap-2 mb-4">
                <Calendar className="w-4 h-4 text-dj-primary" /> Event Details
              </h3>
              <div className="space-y-2 text-sm">
                <div><span className="text-dj-muted">Start:</span> <span className="text-white ml-2">{formatDateTime(event.startDate)}</span></div>
                {event.endDate && <div><span className="text-dj-muted">End:</span> <span className="text-white ml-2">{formatDateTime(event.endDate)}</span></div>}
                {event.doorsOpen && <div><span className="text-dj-muted">Doors:</span> <span className="text-white ml-2">{formatTime(event.doorsOpen)}</span></div>}
                {event.capacity && <div><span className="text-dj-muted">Capacity:</span> <span className="text-white ml-2">{event.capacity.toLocaleString()}</span></div>}
                {event.dresscode && <div><span className="text-dj-muted">Dress code:</span> <span className="text-white ml-2">{event.dresscode}</span></div>}
                {event.ageLimit && <div><span className="text-dj-muted">Age:</span> <span className="text-white ml-2">{event.ageLimit}</span></div>}
              </div>
            </div>
            <div className="card p-5">
              <h3 className="section-title mb-3">Music Genres</h3>
              {event.genres.length === 0 ? (
                <p className="text-dj-muted text-sm">No genres set.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {event.genres.map(g => (
                    <span key={g.id} className="badge bg-dj-primary/10 text-dj-primary-light border-dj-primary/20">{g.genre}</span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Venue edit modal */}
          {showVenueForm && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
              <div className="bg-dj-800 border border-dj-border rounded-xl w-full max-w-lg p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-semibold text-white flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-dj-primary" /> Edit Venue &amp; Details
                  </h3>
                  <button onClick={() => setShowVenueForm(false)} className="text-dj-muted hover:text-dj-text">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="label">Venue Name</label>
                    <input type="text" value={venueForm.venue}
                      onChange={e => setVenueForm(f => ({ ...f, venue: e.target.value }))}
                      className="input-field" placeholder="Club XYZ, Warehouse 23..." />
                  </div>
                  <div>
                    <label className="label">Street Address</label>
                    <input type="text" value={venueForm.address}
                      onChange={e => setVenueForm(f => ({ ...f, address: e.target.value }))}
                      className="input-field" placeholder="123 Main St" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">City</label>
                      <input type="text" value={venueForm.city}
                        onChange={e => setVenueForm(f => ({ ...f, city: e.target.value }))}
                        className="input-field" placeholder="Miami" />
                    </div>
                    <div>
                      <label className="label">State</label>
                      <input type="text" value={venueForm.state}
                        onChange={e => setVenueForm(f => ({ ...f, state: e.target.value }))}
                        className="input-field" placeholder="FL" />
                    </div>
                  </div>
                  <div>
                    <label className="label">Capacity</label>
                    <input type="number" value={venueForm.capacity}
                      onChange={e => setVenueForm(f => ({ ...f, capacity: e.target.value }))}
                      className="input-field" placeholder="500" min="0" />
                  </div>
                  <div>
                    <label className="label">Dress Code</label>
                    <input type="text" value={venueForm.dresscode}
                      onChange={e => setVenueForm(f => ({ ...f, dresscode: e.target.value }))}
                      className="input-field" placeholder="Smart casual, All black..." />
                  </div>
                  <div>
                    <label className="label">Age Restriction</label>
                    <input type="text" value={venueForm.ageLimit}
                      onChange={e => setVenueForm(f => ({ ...f, ageLimit: e.target.value }))}
                      className="input-field" placeholder="21+, 18+, All ages..." />
                  </div>
                </div>
                <div className="flex gap-3 mt-5">
                  <button onClick={() => setShowVenueForm(false)} className="btn-secondary flex-1">Cancel</button>
                  <button onClick={saveVenue} disabled={venueLoading}
                    className="btn-primary flex-1 flex items-center justify-center gap-2">
                    {venueLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Save Details
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
