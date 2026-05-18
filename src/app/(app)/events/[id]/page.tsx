import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  MapPin,
  Users,
  CheckSquare,
  MessageSquare,
  Image,
  Ticket,
  Clock,
  DollarSign,
  ExternalLink,
  Pencil,
  Music2,
  Megaphone,
  Share2,
} from "lucide-react";
import {
  formatDateTime,
  formatTime,
  getStatusColor,
  getRoleColor,
  getInitials,
  timeAgo,
} from "@/lib/utils";
import EditEventButton from "./edit-event-button";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EventOverviewPage({ params }: Props) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      genres: true,
      djs: { orderBy: { order: "asc" } },
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, image: true, role: true } },
        },
      },
      _count: {
        select: {
          tasks: true,
          messages: true,
          mediaItems: true,
          scheduleItems: true,
        },
      },
      tasks: {
        where: { status: { in: ["TODO", "IN_PROGRESS", "BLOCKED"] } },
        take: 5,
        orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
      },
      messages: {
        take: 3,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true, image: true } } },
      },
    },
  });

  if (!event) notFound();

  const myMembership = event.members.find((m) => m.userId === userId);

  const quickLinks = [
    { href: "planning", label: "Planning", icon: Pencil, color: "bg-blue-500/10 text-blue-400" },
    { href: "marketing", label: "Marketing", icon: Megaphone, color: "bg-purple-500/10 text-purple-400" },
    { href: "team", label: "Team", icon: Users, color: "bg-emerald-500/10 text-emerald-400" },
    { href: "tasks", label: "Tasks", icon: CheckSquare, color: "bg-amber-500/10 text-amber-400" },
    { href: "chat", label: "Chat", icon: MessageSquare, color: "bg-pink-500/10 text-pink-400" },
    { href: "day-of", label: "Day-Of", icon: Clock, color: "bg-orange-500/10 text-orange-400" },
    { href: "post-event", label: "Post-Event", icon: Image, color: "bg-teal-500/10 text-teal-400" },
  ];

  const doneTasks = event._count.tasks;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Event header */}
      <div className="card p-6">
        <div className="flex flex-col md:flex-row gap-5">
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-3 flex-wrap">
              <div>
                <h1 className="text-2xl font-bold text-white">{event.name}</h1>
                {event.tagline && (
                  <p className="text-dj-muted text-sm mt-0.5">{event.tagline}</p>
                )}
              </div>
              <span className={`badge mt-1 ${getStatusColor(event.status)}`}>
                {event.status}
              </span>
            </div>

            {event.description && (
              <p className="text-sm text-dj-muted mt-3 leading-relaxed max-w-2xl">
                {event.description}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              <div className="flex items-center gap-2 text-sm text-dj-muted">
                <Calendar className="w-4 h-4 text-dj-primary flex-shrink-0" />
                <span>{formatDateTime(event.startDate)}</span>
              </div>
              {event.doorsOpen && (
                <div className="flex items-center gap-2 text-sm text-dj-muted">
                  <Clock className="w-4 h-4 text-dj-primary flex-shrink-0" />
                  <span>Doors: {formatTime(event.doorsOpen)}</span>
                </div>
              )}
              {event.venue && (
                <div className="flex items-center gap-2 text-sm text-dj-muted">
                  <MapPin className="w-4 h-4 text-dj-primary flex-shrink-0" />
                  <span>
                    {event.venue}
                    {event.city && `, ${event.city}`}
                    {event.state && ` ${event.state}`}
                  </span>
                </div>
              )}
              {event.price != null && (
                <div className="flex items-center gap-2 text-sm text-dj-muted">
                  <DollarSign className="w-4 h-4 text-dj-primary flex-shrink-0" />
                  <span>
                    ${event.price} {event.ageLimit && `· ${event.ageLimit}`}
                  </span>
                </div>
              )}
              {event.capacity && (
                <div className="flex items-center gap-2 text-sm text-dj-muted">
                  <Users className="w-4 h-4 text-dj-primary flex-shrink-0" />
                  <span>Capacity: {event.capacity.toLocaleString()}</span>
                </div>
              )}
              {event.ticketUrl && (
                <a
                  href={event.ticketUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-dj-primary-light hover:text-dj-primary"
                >
                  <Ticket className="w-4 h-4 flex-shrink-0" />
                  Tickets
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            {event.genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-4">
                {event.genres.map((g) => (
                  <span
                    key={g.id}
                    className="text-xs bg-dj-primary/10 text-dj-primary-light border border-dj-primary/20 px-2.5 py-0.5 rounded-full"
                  >
                    {g.genre}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Right column: role + share */}
          <div className="flex-shrink-0 flex flex-col items-end gap-3">
            {myMembership && (
              <div className={`badge ${getRoleColor(myMembership.role)}`}>
                My role: {myMembership.role}
              </div>
            )}
            {myMembership?.role === "ORGANIZER" && (
              <EditEventButton event={{
                id:          event.id,
                name:        event.name,
                tagline:     event.tagline     ?? null,
                description: event.description ?? null,
                status:      event.status,
                startDate:   event.startDate instanceof Date ? event.startDate.toISOString() : String(event.startDate),
                endDate:     event.endDate   ? (event.endDate   instanceof Date ? event.endDate.toISOString()   : String(event.endDate))   : null,
                doorsOpen:   event.doorsOpen ? (event.doorsOpen instanceof Date ? event.doorsOpen.toISOString() : String(event.doorsOpen)) : null,
                ticketUrl:   event.ticketUrl  ?? null,
                price:       event.price      ?? null,
                isPublic:    event.isPublic,
              }} />
            )}
            {event.isPublic && (
              <Link
                href={`/e/${event.id}`}
                target="_blank"
                className="flex items-center gap-1.5 text-xs text-dj-muted hover:text-dj-primary-light border border-dj-border hover:border-dj-primary/30 rounded-lg px-3 py-1.5 transition-all"
              >
                <Share2 className="w-3.5 h-3.5" />
                Public Page
                <ExternalLink className="w-3 h-3" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Quick nav */}
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={`/events/${id}/${link.href}`}
            className="card-hover p-4 flex flex-col items-center gap-2 text-center group"
          >
            <div className={`w-10 h-10 rounded-xl ${link.color} flex items-center justify-center`}>
              <link.icon className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-dj-muted group-hover:text-dj-text">
              {link.label}
            </span>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* DJ Lineup */}
        {event.djs.length > 0 && (
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="section-title flex items-center gap-2">
                <Music2 className="w-4 h-4 text-dj-primary" />
                DJ Lineup
              </h2>
              <Link
                href={`/events/${id}/planning`}
                className="text-xs text-dj-primary-light hover:text-dj-primary"
              >
                Manage →
              </Link>
            </div>
            <div className="space-y-3">
              {event.djs.map((dj) => (
                <div key={dj.id} className="card p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-dj-700 overflow-hidden flex-shrink-0">
                    {dj.image ? (
                      <img src={dj.image} alt={dj.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music2 className="w-5 h-5 text-dj-muted" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{dj.name}</span>
                      {dj.featured && (
                        <span className="text-xs bg-dj-secondary/10 text-dj-secondary border border-dj-secondary/20 px-1.5 py-0.5 rounded-full">
                          HEADLINER
                        </span>
                      )}
                    </div>
                    {dj.instagramHandle && (
                      <p className="text-xs text-dj-muted">{dj.instagramHandle}</p>
                    )}
                  </div>
                  {dj.setTime && (
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-medium text-dj-secondary">{dj.setTime}</div>
                      {dj.setDuration && (
                        <div className="text-xs text-dj-muted">{dj.setDuration}min</div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sidebar stats */}
        <div className="space-y-4">
          {/* Stats */}
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-dj-muted uppercase tracking-wide mb-3">
              At a Glance
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-dj-muted flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" /> Team
                </span>
                <span className="text-sm font-medium text-white">{event.members.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-dj-muted flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5" /> Tasks
                </span>
                <span className="text-sm font-medium text-white">{event._count.tasks}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-dj-muted flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" /> Messages
                </span>
                <span className="text-sm font-medium text-white">{event._count.messages}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-dj-muted flex items-center gap-1.5">
                  <Image className="w-3.5 h-3.5" /> Media
                </span>
                <span className="text-sm font-medium text-white">{event._count.mediaItems}</span>
              </div>
            </div>
          </div>

          {/* Team */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-dj-muted uppercase tracking-wide">
                Team
              </h3>
              <Link
                href={`/events/${id}/team`}
                className="text-xs text-dj-primary-light hover:text-dj-primary"
              >
                Manage →
              </Link>
            </div>
            <div className="space-y-2">
              {event.members.map((m) => (
                <div key={m.id} className="flex items-center gap-2.5">
                  <div className="avatar w-7 h-7 bg-dj-primary/20 text-dj-primary-light text-xs flex-shrink-0">
                    {getInitials(m.user.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-dj-text truncate">
                      {m.user.name ?? m.user.email}
                      {m.userId === userId && (
                        <span className="text-dj-muted ml-1">(you)</span>
                      )}
                    </p>
                  </div>
                  <span className={`badge text-xs ${getRoleColor(m.role)}`}>
                    {m.role}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent chat */}
          {event.messages.length > 0 && (
            <div className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-dj-muted uppercase tracking-wide">
                  Recent Chat
                </h3>
                <Link
                  href={`/events/${id}/chat`}
                  className="text-xs text-dj-primary-light hover:text-dj-primary"
                >
                  Open →
                </Link>
              </div>
              <div className="space-y-2">
                {[...event.messages].reverse().map((msg) => (
                  <div key={msg.id} className="flex gap-2">
                    <div className="avatar w-6 h-6 bg-dj-primary/20 text-dj-primary-light text-xs flex-shrink-0 mt-0.5">
                      {getInitials(msg.user.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-dj-text truncate">
                        {msg.user.name}
                      </p>
                      <p className="text-xs text-dj-muted leading-relaxed">{msg.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
