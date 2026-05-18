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
            Search for a registered user to add them to this event.
          </p>
          {inviteError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-3 py-2 rounded-lg mb-3">{inviteError}</div>
          )}
          {inviteSuccess && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm px-3 py-2 rounded-lg mb-3">{inviteSuccess}</div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 items-start">
            {/* Searchable user picker */}
            <div className="relative flex-1 w-full" ref={dropdownRef}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dj-muted pointer-events-none" />
                <input
                  type="text"
                  autoComplete="off"
                  placeholder="Search by name or email..."
                  value={selectedUser ? (selectedUser.name ?? selectedUser.email) : userSearch}
                  onChange={e => {
                    setSelectedUser(null);
                    setUserSearch(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  className={`input-field pl-9 ${selectedUser ? "pr-9 border-dj-primary/50 bg-dj-primary/5" : ""}`}
                  readOnly={!!selectedUser}
                />
                {selectedUser && (
                  <button
                    type="button"
                    onClick={() => { setSelectedUser(null); setUserSearch(""); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-dj-muted hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {showDropdown && !selectedUser && (() => {
                const filtered = siteUsers.filter(u =>
                  !userSearch ||
                  (u.name ?? "").toLowerCase().includes(userSearch.toLowerCase()) ||
                  u.email.toLowerCase().includes(userSearch.toLowerCase())
                );
                return (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-dj-800 border border-dj-border rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto">
                    {filtered.length === 0 ? (
                      <p className="px-4 py-3 text-sm text-dj-muted text-center">
                        {siteUsers.length === 0 ? "No other users on the site yet." : "No users match your search."}
                      </p>
                    ) : (
                      filtered.map(u => (
                        <button
                          key={u.id}
                          type="button"
                          onMouseDown={e => e.preventDefault()}
                          onClick={() => { setSelectedUser(u); setShowDropdown(false); setUserSearch(""); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-dj-700 transition-colors text-left first:rounded-t-xl last:rounded-b-xl"
                        >
                          <div className="avatar w-8 h-8 bg-dj-primary/20 text-dj-primary-light text-xs flex-shrink-0">
                            {getInitials(u.name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{u.name ?? "Unnamed"}</p>
                            <p className="text-xs text-dj-muted truncate">{u.email}</p>
                          </div>
                          <span className="text-xs text-dj-muted bg-dj-700 px-2 py-0.5 rounded flex-shrink-0">{u.role}</span>
                        </button>
                      ))
                    )}
                  </div>
                );
              })()}
            </div>

            <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
              className="input-field sm:w-40 flex-shrink-0">
              {EVENT_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>

            <button onClick={handleInvite} disabled={inviteLoading || !selectedUser}
              className="btn-primary flex items-center gap-2 justify-center flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed">
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
