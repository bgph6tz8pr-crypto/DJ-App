"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { Users, Plus, Loader2, X, Trash2, Edit2, Check, Search } from "lucide-react";
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

interface SiteUser {
  id: string;
  name?: string | null;
  email: string;
  role: string;
}

const EVENT_ROLES = ["ORGANIZER", "DJ", "PHOTOGRAPHER", "MARKETING", "STAFF"];

export default function TeamPage() {
  const { id } = useParams<{ id: string }>();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteRole, setInviteRole] = useState("STAFF");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");
  const [editingMember, setEditingMember] = useState<{ id: string; role: string } | null>(null);

  // User picker state
  const [siteUsers, setSiteUsers] = useState<SiteUser[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<SiteUser | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchTeam = useCallback(async () => {
    const [teamRes, usersRes] = await Promise.all([
      fetch(`/api/events/${id}/team`),
      fetch(`/api/users?eventId=${id}`),
    ]);
    if (teamRes.ok) setMembers(await teamRes.json());
    if (usersRes.ok) setSiteUsers(await usersRes.json());
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchTeam(); }, [fetchTeam]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleInvite() {
    if (!selectedUser) return;
    setInviteLoading(true);
    setInviteError("");
    setInviteSuccess("");

    const res = await fetch(`/api/events/${id}/team`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: selectedUser.email, role: inviteRole }),
    });

    const data = await res.json();
    if (!res.ok) {
      setInviteError(data.error || "Failed to add member.");
    } else {
      setInviteSuccess(`${selectedUser.name ?? selectedUser.email} added as ${inviteRole}.`);
      setSelectedUser(null);
      setUserSearch("");
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
          <h3 className="font-semibold text-white mb-1 flex items-center gap-2">
            <Users className="w-4 h-4 text-dj-primary" /> Add Team Member
          </h3>
          <p className="text-xs text-dj-muted mb-4">
            Select a member from the site to add them to this event.
          </p>
          {inviteError && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-3 py-2 rounded-lg mb-3">{inviteError}</div>}
          {inviteSuccess && <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm px-3 py-2 rounded-lg mb-3">{inviteSuccess}</div>}

          <div className="flex flex-col sm:flex-row gap-3">
            {/* User picker */}
            <div className="relative flex-1" ref={dropdownRef}>
              <div className={`input-field flex items-center gap-2 cursor-text ${selectedUser ? "border-dj-primary/40" : ""}`}
                onClick={() => { setShowDropdown(true); }}>
                <Search className="w-4 h-4 text-dj-muted flex-shrink-0" />
                {selectedUser ? (
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="avatar w-5 h-5 bg-dj-primary/20 text-dj-primary-light text-xs flex-shrink-0">
                      {getInitials(selectedUser.name)}
                    </div>
                    <span className="text-sm text-white truncate">{selectedUser.name ?? selectedUser.email}</span>
                    <span className="text-xs text-dj-muted truncate">{selectedUser.name ? selectedUser.email : ""}</span>
                    <button onClick={(e) => { e.stopPropagation(); setSelectedUser(null); setUserSearch(""); }}
                      className="ml-auto text-dj-muted hover:text-dj-text flex-shrink-0">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <input
                    type="text"
                    value={userSearch}
                    onChange={e => { setUserSearch(e.target.value); setShowDropdown(true); }}
                    onFocus={() => setShowDropdown(true)}
                    placeholder="Search by name or email..."
                    className="flex-1 bg-transparent outline-none text-sm text-dj-text placeholder-dj-muted"
                  />
                )}
              </div>

              {showDropdown && !selectedUser && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-dj-800 border border-dj-border rounded-xl shadow-xl z-30 max-h-56 overflow-y-auto">
                  {(() => {
                    const filtered = siteUsers.filter(u =>
                      !userSearch ||
                      u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
                      u.email.toLowerCase().includes(userSearch.toLowerCase())
                    );
                    if (filtered.length === 0) return (
                      <div className="px-4 py-3 text-sm text-dj-muted text-center">
                        {siteUsers.length === 0 ? "No other users on this site yet." : "No users match your search."}
                      </div>
                    );
                    return filtered.map(u => (
                      <button key={u.id}
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => { setSelectedUser(u); setUserSearch(""); setShowDropdown(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-dj-700 transition-colors text-left">
                        <div className="avatar w-8 h-8 bg-dj-primary/20 text-dj-primary-light text-xs flex-shrink-0">
                          {getInitials(u.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-dj-text truncate">{u.name ?? "Unnamed"}</p>
                          <p className="text-xs text-dj-muted truncate">{u.email}</p>
                        </div>
                        <span className="text-xs text-dj-muted flex-shrink-0">{u.role}</span>
                      </button>
                    ));
                  })()}
                </div>
              )}
            </div>

            <select value={inviteRole} onChange={e => setInviteRole(e.target.value)} className="input-field sm:w-40">
              {EVENT_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>

            <button onClick={handleInvite} disabled={inviteLoading || !selectedUser}
              className="btn-primary flex items-center gap-2 justify-center disabled:opacity-50">
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
