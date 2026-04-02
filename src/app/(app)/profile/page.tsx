"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Loader2, User, Save } from "lucide-react";
import { getInitials } from "@/lib/utils";

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name: "",
    bio: "",
    phone: "",
    instagram: "",
  });

  const user = session?.user as { id?: string; name?: string; email?: string; role?: string } | undefined;

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name ?? "",
        bio: "",
        phone: "",
        instagram: "",
      });
    }
  }, [session]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        await update({ name: form.name });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="page-title mb-6">My Profile</h1>

      <div className="card p-6">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-dj-border">
          <div className="avatar w-16 h-16 bg-dj-primary/20 text-dj-primary-light text-xl">
            {getInitials(user?.name)}
          </div>
          <div>
            <h2 className="font-semibold text-white">{user?.name || "Your Name"}</h2>
            <p className="text-dj-muted text-sm">{user?.email}</p>
            <span className="text-xs text-dj-primary-light bg-dj-primary/10 border border-dj-primary/20 px-2 py-0.5 rounded-full mt-1 inline-block">
              {user?.role}
            </span>
          </div>
        </div>

        {saved && <div className="alert-success mb-4">Profile saved successfully!</div>}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label">Display Name</label>
            <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="input-field" placeholder="Your name" />
          </div>
          <div>
            <label className="label">Bio</label>
            <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
              className="input-field" rows={3} placeholder="Tell your team about yourself..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Phone</label>
              <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className="input-field" placeholder="+1 (555) 000-0000" />
            </div>
            <div>
              <label className="label">Instagram</label>
              <input type="text" value={form.instagram} onChange={e => setForm(f => ({ ...f, instagram: e.target.value }))}
                className="input-field" placeholder="@handle" />
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Profile
          </button>
        </form>
      </div>
    </div>
  );
}
