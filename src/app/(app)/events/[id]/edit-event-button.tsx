"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, X, Check } from "lucide-react";
import { EVENT_STATUSES } from "@/lib/utils";

interface EventEditData {
  id: string;
  name: string;
  tagline?: string | null;
  description?: string | null;
  status: string;
  startDate: string;
  endDate?: string | null;
  doorsOpen?: string | null;
  ticketUrl?: string | null;
  price?: number | null;
  isPublic: boolean;
}

function toDateStr(iso: string) {
  return iso.split("T")[0];
}

function toTimeStr(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function EditEventButton({ event }: { event: EventEditData }) {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name:         event.name,
    tagline:      event.tagline      ?? "",
    description:  event.description  ?? "",
    status:       event.status,
    startDate:    toDateStr(event.startDate),
    startTime:    toTimeStr(event.startDate),
    endDate:      event.endDate    ? toDateStr(event.endDate)    : "",
    endTime:      event.endDate    ? toTimeStr(event.endDate)    : "",
    doorsOpenTime:event.doorsOpen  ? toTimeStr(event.doorsOpen)  : "",
    ticketUrl:    event.ticketUrl   ?? "",
    price:        event.price != null ? String(event.price)      : "",
    isPublic:     event.isPublic,
  });

  async function save() {
    if (!form.name.trim() || !form.startDate || !form.startTime) return;
    setLoading(true);
    try {
      const startDate  = new Date(`${form.startDate}T${form.startTime}`).toISOString();
      const endDate    = form.endDate && form.endTime
        ? new Date(`${form.endDate}T${form.endTime}`).toISOString()
        : null;
      const doorsOpen  = form.doorsOpenTime
        ? new Date(`${form.startDate}T${form.doorsOpenTime}`).toISOString()
        : null;

      const res = await fetch(`/api/events/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:        form.name.trim(),
          tagline:     form.tagline.trim()     || null,
          description: form.description.trim() || null,
          status:      form.status,
          startDate,
          endDate,
          doorsOpen,
          ticketUrl:   form.ticketUrl.trim()   || null,
          price:       form.price ? parseFloat(form.price) : null,
          isPublic:    form.isPublic,
        }),
      });

      if (res.ok) {
        setShow(false);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setShow(true)}
        className="flex items-center gap-1.5 text-xs text-dj-muted hover:text-dj-text border border-dj-border hover:border-dj-primary/30 rounded-lg px-3 py-1.5 transition-all"
      >
        <Pencil className="w-3.5 h-3.5" /> Edit Event
      </button>

      {show && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-dj-800 border border-dj-border rounded-xl w-full max-w-lg p-6 shadow-2xl my-4">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-white">Edit Event Details</h3>
              <button onClick={() => setShow(false)} className="text-dj-muted hover:text-dj-text">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="label">Event Name *</label>
                <input type="text" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="input-field" autoFocus />
              </div>

              <div>
                <label className="label">Tagline</label>
                <input type="text" value={form.tagline}
                  onChange={e => setForm(f => ({ ...f, tagline: e.target.value }))}
                  className="input-field" placeholder="Short one-line description" />
              </div>

              <div>
                <label className="label">Description</label>
                <textarea value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="input-field" rows={2} />
              </div>

              <div>
                <label className="label">Status</label>
                <select value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                  className="input-field">
                  {EVENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Start Date *</label>
                  <input type="date" value={form.startDate}
                    onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                    className="input-field" />
                </div>
                <div>
                  <label className="label">Start Time *</label>
                  <input type="time" value={form.startTime}
                    onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                    className="input-field" />
                </div>
              </div>

              <div>
                <label className="label">Doors Open Time</label>
                <input type="time" value={form.doorsOpenTime}
                  onChange={e => setForm(f => ({ ...f, doorsOpenTime: e.target.value }))}
                  className="input-field" placeholder="Leave blank to remove" />
                <p className="text-xs text-dj-muted mt-1">Clear this field to remove the doors time</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">End Date</label>
                  <input type="date" value={form.endDate}
                    onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                    className="input-field" />
                </div>
                <div>
                  <label className="label">End Time</label>
                  <input type="time" value={form.endTime}
                    onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                    className="input-field" />
                </div>
              </div>

              <div>
                <label className="label">Ticket URL</label>
                <input type="url" value={form.ticketUrl}
                  onChange={e => setForm(f => ({ ...f, ticketUrl: e.target.value }))}
                  className="input-field" placeholder="https://..." />
              </div>

              <div>
                <label className="label">Ticket Price ($)</label>
                <input type="number" value={form.price}
                  onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                  className="input-field" placeholder="0" min="0" step="0.01" />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isPublic}
                  onChange={e => setForm(f => ({ ...f, isPublic: e.target.checked }))}
                  className="accent-dj-primary" />
                <span className="text-sm text-dj-text">Public event page (shareable link)</span>
              </label>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setShow(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={save} disabled={loading || !form.name.trim()}
                className="btn-primary flex-1 flex items-center justify-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
