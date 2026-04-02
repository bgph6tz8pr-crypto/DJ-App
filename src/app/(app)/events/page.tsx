import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatEventDate, getStatusColor, getInitials } from "@/lib/utils";
import {
  Plus,
  Calendar,
  MapPin,
  Users,
  CheckSquare,
  Search,
} from "lucide-react";

export const metadata = { title: "My Events" };

export default async function EventsPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;

  const memberships = await prisma.eventMember.findMany({
    where: { userId },
    include: {
      event: {
        include: {
          _count: {
            select: { members: true, tasks: true, mediaItems: true },
          },
          members: {
            take: 4,
            include: { user: { select: { id: true, name: true, image: true } } },
          },
          genres: { take: 4 },
          djs: { take: 3, orderBy: { order: "asc" } },
        },
      },
    },
    orderBy: { event: { startDate: "desc" } },
  });

  const events = memberships.map((m) => ({ ...m.event, myRole: m.role }));

  const upcoming = events.filter(
    (e) => !["COMPLETED", "CANCELLED"].includes(e.status)
  );
  const past = events.filter((e) => ["COMPLETED", "CANCELLED"].includes(e.status));

  function EventCard({ event }: { event: typeof events[0] }) {
    return (
      <Link
        href={`/events/${event.id}`}
        className="card-hover flex flex-col overflow-hidden group"
      >
        {/* Cover */}
        <div className="h-28 bg-gradient-to-br from-dj-800 to-dj-700 relative overflow-hidden flex-shrink-0">
          {event.coverImage ? (
            <img
              src={event.coverImage}
              alt={event.name}
              className="w-full h-full object-cover opacity-60"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="w-full h-full opacity-20"
                style={{
                  backgroundImage: `repeating-linear-gradient(
                    45deg,
                    transparent,
                    transparent 10px,
                    rgba(124,58,237,0.3) 10px,
                    rgba(124,58,237,0.3) 11px
                  )`,
                }}
              />
            </div>
          )}
          <div className="absolute top-3 left-3">
            <span className={`badge text-xs ${getStatusColor(event.status)}`}>
              {event.status}
            </span>
          </div>
          <div className="absolute top-3 right-3">
            <span className="text-xs bg-dj-900/60 text-dj-muted px-2 py-0.5 rounded-full">
              {event.myRole}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 flex-1 flex flex-col">
          <h3 className="font-semibold text-white group-hover:text-dj-primary-light transition-colors leading-tight">
            {event.name}
          </h3>
          {event.tagline && (
            <p className="text-xs text-dj-muted mt-0.5">{event.tagline}</p>
          )}

          <div className="mt-3 space-y-1.5 flex-1">
            <div className="flex items-center gap-1.5 text-xs text-dj-muted">
              <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
              {formatEventDate(event.startDate)}
            </div>
            {(event.venue || event.city) && (
              <div className="flex items-center gap-1.5 text-xs text-dj-muted">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                {[event.venue, event.city].filter(Boolean).join(", ")}
              </div>
            )}
          </div>

          {event.genres.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {event.genres.slice(0, 3).map((g) => (
                <span
                  key={g.id}
                  className="text-xs bg-dj-primary/10 text-dj-primary-light border border-dj-primary/20 px-2 py-0.5 rounded-full"
                >
                  {g.genre}
                </span>
              ))}
              {event.genres.length > 3 && (
                <span className="text-xs text-dj-muted">+{event.genres.length - 3}</span>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-dj-border/50">
            <div className="flex items-center gap-3 text-xs text-dj-muted">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {event._count.members}
              </span>
              <span className="flex items-center gap-1">
                <CheckSquare className="w-3 h-3" />
                {event._count.tasks}
              </span>
            </div>
            <div className="flex -space-x-2">
              {event.members.slice(0, 3).map((m) => (
                <div
                  key={m.id}
                  className="avatar w-6 h-6 bg-dj-primary/20 text-dj-primary-light text-xs border border-dj-800"
                  title={m.user.name ?? ""}
                >
                  {getInitials(m.user.name)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">My Events</h1>
          <p className="page-subtitle">
            {events.length} event{events.length !== 1 ? "s" : ""} you&apos;re part of
          </p>
        </div>
        <Link href="/events/new" className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" />
          New Event
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="card p-16 text-center">
          <Calendar className="w-12 h-12 text-dj-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No events yet</h3>
          <p className="text-dj-muted text-sm mb-6">
            Create your first event or ask an organizer to add you to their team.
          </p>
          <Link href="/events/new" className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create an event
          </Link>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <section className="mb-8">
              <h2 className="text-sm font-semibold text-dj-muted uppercase tracking-wider mb-4">
                Upcoming & Active ({upcoming.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {upcoming.map((e) => (
                  <EventCard key={e.id} event={e} />
                ))}
                <Link
                  href="/events/new"
                  className="card border-dashed border-dj-border/50 hover:border-dj-primary/40 flex flex-col items-center justify-center p-8 text-dj-muted hover:text-dj-primary-light transition-all group min-h-[220px]"
                >
                  <Plus className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium">New Event</span>
                </Link>
              </div>
            </section>
          )}

          {past.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-dj-muted uppercase tracking-wider mb-4">
                Past Events ({past.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 opacity-70">
                {past.map((e) => (
                  <EventCard key={e.id} event={e} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
