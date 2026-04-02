"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Loader2, Calendar, MapPin, Music2, DollarSign } from "lucide-react";
import { DJ_GENRES } from "@/lib/utils";

const STEPS = ["basics", "venue", "details"] as const;
type Step = typeof STEPS[number];

export default function NewEventPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("basics");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    tagline: "",
    description: "",
    startDate: "",
    startTime: "21:00",
    endDate: "",
    endTime: "03:00",
    doorsOpenTime: "20:00",
    venue: "",
    address: "",
    city: "",
    state: "",
    ticketUrl: "",
    capacity: "",
    price: "",
    dresscode: "",
    ageLimit: "",
    genres: [] as string[],
    status: "PLANNING",
  });

  function update(key: string, value: string | string[]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleGenre(genre: string) {
    setForm((f) => ({
      ...f,
      genres: f.genres.includes(genre)
        ? f.genres.filter((g) => g !== genre)
        : [...f.genres, genre],
    }));
  }

  async function handleSubmit() {
    if (!form.name || !form.startDate) {
      setError("Event name and start date are required.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const startDate = new Date(`${form.startDate}T${form.startTime}`);
      const endDate = form.endDate
        ? new Date(`${form.endDate}T${form.endTime}`)
        : null;
      const doorsOpen = form.startDate
        ? new Date(`${form.startDate}T${form.doorsOpenTime}`)
        : null;

      // strip time-only fields that don't exist in the DB schema
      const { startTime: _st, endTime: _et, doorsOpenTime: _dot, ...formData } = form;

      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          startDate,
          endDate,
          doorsOpen,
          capacity: form.capacity ? parseInt(form.capacity) : null,
          price: form.price ? parseFloat(form.price) : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create event.");
        return;
      }

      router.push(`/events/${data.id}`);
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const stepIndex = STEPS.indexOf(step);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/events" className="btn-ghost p-2">
          <ChevronLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="page-title">Create New Event</h1>
          <p className="page-subtitle">Step {stepIndex + 1} of {STEPS.length}</p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i <= stepIndex ? "bg-dj-primary" : "bg-dj-700"
            }`}
          />
        ))}
      </div>

      {error && <div className="alert-error mb-6">{error}</div>}

      {/* Step 1: Basics */}
      {step === "basics" && (
        <div className="space-y-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-dj-primary" />
            <h2 className="text-lg font-semibold text-white">Event Basics</h2>
          </div>

          <div>
            <label className="label">Event Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              className="input-field"
              placeholder="NEON NIGHTS Vol. 4"
              required
            />
          </div>

          <div>
            <label className="label">Tagline</label>
            <input
              type="text"
              value={form.tagline}
              onChange={(e) => update("tagline", e.target.value)}
              className="input-field"
              placeholder="The underground returns"
            />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              className="input-field"
              rows={4}
              placeholder="Tell people what to expect at this event..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Start Date *</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => update("startDate", e.target.value)}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="label">Start Time</label>
              <input
                type="time"
                value={form.startTime}
                onChange={(e) => update("startTime", e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">End Date</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => update("endDate", e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="label">End Time</label>
              <input
                type="time"
                value={form.endTime}
                onChange={(e) => update("endTime", e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="label">Doors Open Time</label>
            <input
              type="time"
              value={form.doorsOpenTime}
              onChange={(e) => update("doorsOpenTime", e.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label className="label">Music Genres</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {DJ_GENRES.map((genre) => (
                <button
                  key={genre}
                  type="button"
                  onClick={() => toggleGenre(genre)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                    form.genres.includes(genre)
                      ? "bg-dj-primary border-dj-primary text-white"
                      : "bg-dj-900 border-dj-border text-dj-muted hover:border-dj-border/80"
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (!form.name || !form.startDate) {
                setError("Event name and start date are required.");
                return;
              }
              setError("");
              setStep("venue");
            }}
            className="btn-primary w-full py-2.5"
          >
            Continue to Venue →
          </button>
        </div>
      )}

      {/* Step 2: Venue */}
      {step === "venue" && (
        <div className="space-y-5">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-dj-primary" />
            <h2 className="text-lg font-semibold text-white">Venue Details</h2>
          </div>

          <div>
            <label className="label">Venue Name</label>
            <input
              type="text"
              value={form.venue}
              onChange={(e) => update("venue", e.target.value)}
              className="input-field"
              placeholder="Club Vortex"
            />
          </div>

          <div>
            <label className="label">Street Address</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => update("address", e.target.value)}
              className="input-field"
              placeholder="420 Industrial Blvd"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">City</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => update("city", e.target.value)}
                className="input-field"
                placeholder="Los Angeles"
              />
            </div>
            <div>
              <label className="label">State / Region</label>
              <input
                type="text"
                value={form.state}
                onChange={(e) => update("state", e.target.value)}
                className="input-field"
                placeholder="CA"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep("basics")}
              className="btn-secondary flex-1 py-2.5"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={() => setStep("details")}
              className="btn-primary flex-1 py-2.5"
            >
              Continue →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Details */}
      {step === "details" && (
        <div className="space-y-5">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-dj-primary" />
            <h2 className="text-lg font-semibold text-white">Event Details</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Capacity</label>
              <input
                type="number"
                value={form.capacity}
                onChange={(e) => update("capacity", e.target.value)}
                className="input-field"
                placeholder="500"
                min="0"
              />
            </div>
            <div>
              <label className="label">Ticket Price (USD)</label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => update("price", e.target.value)}
                className="input-field"
                placeholder="25"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div>
            <label className="label">Ticket URL</label>
            <input
              type="url"
              value={form.ticketUrl}
              onChange={(e) => update("ticketUrl", e.target.value)}
              className="input-field"
              placeholder="https://eventbrite.com/..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Dress Code</label>
              <input
                type="text"
                value={form.dresscode}
                onChange={(e) => update("dresscode", e.target.value)}
                className="input-field"
                placeholder="All black"
              />
            </div>
            <div>
              <label className="label">Age Limit</label>
              <select
                value={form.ageLimit}
                onChange={(e) => update("ageLimit", e.target.value)}
                className="input-field"
              >
                <option value="">All ages</option>
                <option value="18+">18+</option>
                <option value="21+">21+</option>
                <option value="25+">25+</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">Initial Status</label>
            <select
              value={form.status}
              onChange={(e) => update("status", e.target.value)}
              className="input-field"
            >
              <option value="PLANNING">Planning</option>
              <option value="MARKETING">Marketing</option>
              <option value="CONFIRMED">Confirmed</option>
            </select>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep("venue")}
              className="btn-secondary flex-1 py-2.5"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="btn-primary flex-1 py-2.5 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Music2 className="w-4 h-4" />
                  Create Event
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
