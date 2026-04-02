import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  Calendar,
  CheckSquare,
  Users,
  Image,
  Plus,
  ArrowRight,
  TrendingUp,
  Clock,
  AlertCircle,
} from "lucide-react";
import { formatEventDate, getStatusColor, getPriorityColor, getInitials } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;

  // Get events user is a member of
  const memberships = await prisma.eventMember.findMany({
    where: { userId },
    include: {
      event: {
        include: {
          _count: {
            select: {
              members: true,
              tasks: true,
              mediaItems: true,
              messages: true,
            },
          },
          members: {
            take: 4,
            include: { user: { select: { id: true, name: true, image: true } } },
          },
        },
      },
    },
    orderBy: { event: { startDate: "asc" } },
  });

  const events = memberships.map((m) => m.event);
  const upcomingEvents = events.filter(
    (e) => !["COMPLETED", "CANCELLED"].includes(e.status) && new Date(e.startDate) >= new Date()
  );
  const recentEvents = events.filter((e) =>
    ["COMPLETED"].includes(e.status)
  ).slice(0, 3);

  // My assigned tasks across all events (not done)
  const myTasks = await prisma.task.findMany({
    where: {
      assigneeId: userId,
      status: { in: ["TODO", "IN_PROGRESS", "BLOCKED"] },
    },
    include: { event: { select: { id: true, name: true } } },
    orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
    take: 8,
  });

  // Stats
  const totalEvents = events.length;
  const activeEvents = events.filter((e) =>
    ["PLANNING", "MARKETING", "CONFIRMED", "ACTIVE"].includes(e.status)
  ).length;
  const totalTasks = myTasks.length;
  const urgentTasks = myTasks.filter((t) => t.priority === "URGENT" || t.priority === "HIGH").length;

  const stats = [
    { label: "Active Events", value: activeEvents, icon: Calendar, color: "text-dj-primary-light", bg: "bg-dj-primary/10" },
    { label: "My Tasks", value: totalTasks, icon: CheckSquare, color: "text-blue-400", bg: "bg-blue-400/10" },
    { label: "Total Events", value: totalEvents, icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-400/10" },
    { label: "Urgent / High", value: urgentTasks, icon: AlertCircle, color: "text-amber-400", bg: "bg-amber-400/10" },
  ];

  const priorityOrder: Record<string, number> = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="page-header flex items-start justify-between">
        <div>
          <h1 className="page-title">
            Hey, {(session?.user as { name?: string })?.name?.split(" ")[0] ?? "there"} 👋
          </h1>
          <p className="page-subtitle">Here&apos;s what&apos;s happening with your events.</p>
        </div>
        <Link href="/events/new" className="btn-primary flex items-center gap-2 text-sm hidden sm:flex">
          <Plus className="w-4 h-4" />
          New Event
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="stat-card">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
                <s.icon className={`w-4.5 h-4.5 ${s.color}`} />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{s.value}</div>
                <div className="text-xs text-dj-muted">{s.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Upcoming events */}
        <div className="xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Upcoming Events</h2>
            <Link href="/events" className="text-xs text-dj-primary-light hover:text-dj-primary flex items-center gap-1">
              All events <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {upcomingEvents.length === 0 ? (
            <div className="card p-8 text-center">
              <Calendar className="w-10 h-10 text-dj-muted mx-auto mb-3" />
              <p className="text-dj-muted text-sm">No upcoming events.</p>
              <Link href="/events/new" className="btn-primary text-sm mt-4 inline-flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Create your first event
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.slice(0, 5).map((event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="card-hover p-4 flex items-center gap-4 block group"
                >
                  {/* Color strip */}
                  <div className={`w-1 h-14 rounded-full flex-shrink-0 ${
                    event.status === "ACTIVE" ? "bg-dj-accent animate-pulse" :
                    event.status === "MARKETING" ? "bg-dj-primary" :
                    event.status === "CONFIRMED" ? "bg-emerald-500" : "bg-dj-muted"
                  }`} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-white truncate group-hover:text-dj-primary-light transition-colors">
                          {event.name}
                        </p>
                        <p className="text-xs text-dj-muted mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3 flex-shrink-0" />
                          {formatEventDate(event.startDate)}
                          {event.venue && ` · ${event.venue}`}
                        </p>
                      </div>
                      <span className={`badge flex-shrink-0 ${getStatusColor(event.status)}`}>
                        {event.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 mt-2 text-xs text-dj-muted">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {event._count.members}
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckSquare className="w-3 h-3" />
                        {event._count.tasks} tasks
                      </span>
                      <span className="flex items-center gap-1">
                        <Image className="w-3 h-3" />
                        {event._count.mediaItems} media
                      </span>
                    </div>
                  </div>

                  <div className="flex -space-x-2 flex-shrink-0">
                    {event.members.slice(0, 3).map((m) => (
                      <div
                        key={m.id}
                        className="avatar w-7 h-7 bg-dj-primary/20 text-dj-primary-light text-xs border-2 border-dj-800"
                        title={m.user.name ?? m.user.id}
                      >
                        {getInitials(m.user.name)}
                      </div>
                    ))}
                    {event._count.members > 3 && (
                      <div className="avatar w-7 h-7 bg-dj-700 text-dj-muted text-xs border-2 border-dj-800">
                        +{event._count.members - 3}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* My Tasks */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">My Tasks</h2>
          </div>

          {myTasks.length === 0 ? (
            <div className="card p-6 text-center">
              <CheckSquare className="w-8 h-8 text-dj-muted mx-auto mb-2" />
              <p className="text-dj-muted text-sm">No open tasks assigned to you.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {myTasks
                .sort((a, b) => (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9))
                .map((task) => (
                <Link
                  key={task.id}
                  href={`/events/${task.event.id}/tasks`}
                  className="card-hover p-3 flex items-start gap-3 block group"
                >
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                    task.status === "BLOCKED" ? "bg-red-400" :
                    task.status === "IN_PROGRESS" ? "bg-blue-400" : "bg-dj-muted"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-dj-text group-hover:text-white truncate">{task.title}</p>
                    <p className="text-xs text-dj-muted mt-0.5 truncate">{task.event.name}</p>
                  </div>
                  <span className={`text-xs font-medium flex-shrink-0 ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                </Link>
              ))}
            </div>
          )}

          {recentEvents.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-dj-muted mb-3 uppercase tracking-wide">
                Recent Completed
              </h3>
              <div className="space-y-2">
                {recentEvents.map((event) => (
                  <Link
                    key={event.id}
                    href={`/events/${event.id}/post-event`}
                    className="card p-3 flex items-center gap-3 hover:border-dj-border transition-colors block"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-dj-muted flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-dj-muted truncate">{event.name}</p>
                    </div>
                    <span className="text-xs text-dj-muted flex items-center gap-1">
                      <Image className="w-3 h-3" />
                      {event._count.mediaItems}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
