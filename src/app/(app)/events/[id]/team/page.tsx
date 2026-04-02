"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Users, Plus, Loader2, X, Trash2, Edit2, Check, Mail } from "lucide-react";
import { getInitials, getRoleColor } from "@/lib/utils";

interface TeamMember {
  id: string;
  role: string;
  user: {
    id: string;
    name?: string | null;
    email: string;
    image?: string | null;
    role: string;
    bio?: string | null;
    instagram?: string | null;
  };
}

const EVENT_ROLES = ["ORGANIZER", "DJ", "PHOTOGRAPHER", "MARKETING", "STAFF"];

export default function TeamPage() {
  const { id } = useParams<{ id: string }>();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("STAFF");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");
  const [editingMember, setEditingMember] = useState<{ id: string; role: string } | null>(null);

  const fetchTeam = useCallback(async () => {
    const res = await fetch(`/api/events/${id}/team`);
    if (res.ok) setMembers(await res.json());
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchTeam(); }, [fetchTeam]);

  async function handleInvite() {
    if (!inviteEmail.trim()) return;
    setInviteLoading(true);
    setInviteError("");
    setInviteSuccess("");

    const res = await fetch(`/api/events/${id}/team`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
    });

    const data = await res.json();
    if (!res.ok) {
      setInviteError(data.error || "Failed to add member.");
    } else {
      setInviteSuccess(`${inviteEmail} added to the team as ${inviteRole}.`);
      setInviteEmail("");
      fetchTeam();
    }
    setInviteLoading(false);
  }

  async function updateRole(memberId: string, newRole: string) {
    await fetch(`/api/events/${id}/team/${memberId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    setEditingMember(null);
    fetchTeam();
  }

  async function removeMember(memberId: string) {
    if (!confirm("Remove this member from the event?")) return;
    await fetch(`/api/events/${id}/team/${memberId}`, { method: "DELETE" });
    fetchTeam();
  }

  const byRole = EVENT_ROLES.reduce<Record<string, TeamMember[]>>((acc, role) => {
    acc[role] = members.filter((m) => m.role === role);
    return acc;
  }, {});

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-dj-muted" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Users className="w-5 h-5 text-dj-primary" /> Team
          </h1>
          <p className="page-subtitle">{members.length} member{members.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => { setShowInvite(!showInvite); setInviteError(""); setInviteSuccess(""); }}
          className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> Add Member
        </button>
      </div>

      {/* Invite panel */}
      {showInvite && (
        <div className="card p-5 mb-6">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Mail className="w-4 h-4 text-dj-primary" /> Add Team Member
          </h3>
          <p className="text-xs text-dj-muted mb-4">
            The person must already have a DJ Event Hub account. Enter their email address to add them.
          </p>
          {inviteError && <div className="alert-error mb-3">{inviteError}</div>}
          {inviteSuccess && <div className="alert-success mb-3">{inviteSuccess}</div>}
          <div className="flex flex-col sm:flex-row gap-3">
            <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="team@example.com" className="input-field flex-1" onKeyDown={(e) => e.key === "Enter" && handleInvite()} />
            <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} className="input-field sm:w-44">
              {EVENT_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <button onClick={handleInvite} disabled={inviteLoading}
              className="btn-primary flex items-center gap-2 justify-center">
              {inviteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Add
            </button>
          </div>
        </div>
      )}

      {/* Members by role */}
      {members.length === 0 ? (
        <div className="card p-10 text-center">
          <Users className="w-10 h-10 text-dj-muted mx-auto mb-3" />
          <p className="text-dj-muted text-sm mb-4">No team members yet.</p>
          <button onClick={() => setShowInvite(true)} className="btn-primary text-sm">Add first member</button>
        </div>
      ) : (
        <div className="space-y-6">
          {EVENT_ROLES.map((role) => {
            const roleMembers = byRole[role] ?? [];
            if (roleMembers.length === 0) return null;
            return (
              <div key={role}>
                <h2 className="text-xs font-semibold text-dj-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span className={`badge ${getRoleColor(role)}`}>{role}</span>
                  <span className="text-dj-border">({roleMembers.length})</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {roleMembers.map((m) => (
                    <div key={m.id} className="card p-4 flex items-start gap-3">
                      <div className="avatar w-10 h-10 bg-dj-primary/20 text-dj-primary-light flex-shrink-0">
                        {getInitials(m.user.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-white">{m.user.name ?? "Unnamed"}</span>
                        </div>
                        <p className="text-xs text-dj-muted">{m.user.email}</p>
                        {m.user.bio && <p className="text-xs text-dj-muted mt-1 line-clamp-2">{m.user.bio}</p>}
                        {m.user.instagram && <p className="text-xs text-dj-muted mt-0.5">📸 {m.user.instagram}</p>}
                      </div>
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        {editingMember?.id === m.id ? (
                          <div className="flex gap-1">
                            <select
                              value={editingMember.role}
                              onChange={(e) => setEditingMember({ id: m.id, role: e.target.value })}
                              className="input-field py-1 text-xs w-28"
                            >
                              {EVENT_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                            <button onClick={() => updateRole(m.id, editingMember.role)} className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded">
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setEditingMember(null)} className="p-1.5 text-dj-muted hover:bg-dj-700 rounded">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => setEditingMember({ id: m.id, role: m.role })}
                            className="p-1.5 text-dj-muted hover:text-dj-text hover:bg-dj-700 rounded transition-colors">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button onClick={() => removeMember(m.id)}
                          className="p-1.5 text-dj-muted hover:text-red-400 hover:bg-red-500/10 rounded transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
