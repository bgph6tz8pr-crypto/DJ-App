import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatDate, formatTime } from "@/lib/utils";
import { Calendar, MapPin, Music2, Ticket, Users, Clock, DollarSign } from "lucide-react";
import type { Metadata } from "next";
import ShareButton from "./share-button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const event = await prisma.event.findUnique({
    where: { id, isPublic: true },
    select: { name: true, tagline: true, coverImage: true },
  });
  if (!event) return { title: "Event Not Found" };
  return {
    title: event.name,
    description: event.tagline ?? undefined,
    openGraph: {
      title: event.name,
      description: event.tagline ?? undefined,
      images: event.coverImage ? [event.coverImage] : [],
    },
  };
}

export default async function PublicEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const event = await prisma.event.findUnique({
    where: { id, isPublic: true },
    include: {
      genres: true,
      djs: { orderBy: { order: "asc" } },
    },
  });

  if (!event) notFound();

  const venueCity = [event.venue, event.city, event.state].filter(Boolean).join(", ");

  return (
    <div className="min-h-screen bg-dj-950 text-dj-text">
      {/* Hero */}
      <div className="relative overflow-hidden">
        {/* Background cover image */}
        {event.coverImage && (
          <div className="absolute inset-0">
            <img
              src={event.coverImage}
              alt=""
              className="w-full h-full object-cover opacity-15 scale-105 blur-sm"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-dj-950/60 via-dj-950/80 to-dj-950" />
          </div>
        )}

        {/* Gradient mesh if no cover */}
        {!event.coverImage && (
          <div className="absolute inset-0 bg-gradient-to-br from-dj-primary/10 via-transparent to-dj-accent/5" />
        )}

        <div className="relative max-w-2xl mx-auto px-6 pt-12 pb-12 text-center">
          {/* Brand */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-7 h-7 rounded-lg bg-dj-primary flex items-center justify-center">
              <Music2 className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm text-dj-muted font-medium">DJ Event Hub</span>
          </div>

          {/* Event name */}
          <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight mb-3">
            {event.name}
          </h1>

          {event.tagline && (
            <p className="text-lg text-dj-muted mb-6 max-w-lg mx-auto">{event.tagline}</p>
          )}

          {/* Date + Venue */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm mb-8">
            <span className="flex items-center gap-1.5 text-dj-text">
              <Calendar className="w-4 h-4 text-dj-primary" />
              {formatDate(event.startDate, "EEEE, MMMM d, yyyy")}
            </span>
            {event.doorsOpen && (
              <span className="flex items-center gap-1.5 text-dj-muted">
                <Clock className="w-4 h-4" />
                Doors {formatTime(event.doorsOpen)}
              </span>
            )}
            {venueCity && (
              <span className="flex items-center gap-1.5 text-dj-text">
                <MapPin className="w-4 h-4 text-dj-primary" />
                {venueCity}
              </span>
            )}
          </div>

          {/* CTAs */}
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {event.ticketUrl && (
              <a
                href={event.ticketUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-dj-primary hover:bg-dj-primary-hover text-white font-semibold px-6 py-3 rounded-lg transition-colors text-sm"
              >
                <Ticket className="w-4 h-4" /> Get Tickets
              </a>
            )}
            <ShareButton />
          </div>
        </div>
      </div>

      {/* Genre tags */}
      {event.genres.length > 0 && (
        <div className="max-w-2xl mx-auto px-6 pb-6 flex flex-wrap justify-center gap-2">
          {event.genres.map((g) => (
            <span
              key={g.id}
              className="px-3 py-1 text-xs font-medium rounded-full bg-dj-primary/10 text-dj-primary-light border border-dj-primary/20"
            >
              {g.genre}
            </span>
          ))}
        </div>
      )}

      {/* DJ Lineup */}
      {event.djs.length > 0 && (
        <section className="max-w-2xl mx-auto px-6 py-8">
          <h2 className="text-xs font-semibold text-dj-muted uppercase tracking-widest text-center mb-8 flex items-center justify-center gap-2">
            <Users className="w-3.5 h-3.5" /> Lineup
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
            {event.djs.map((dj) => (
              <div key={dj.id} className="text-center group">
                {dj.image ? (
                  <img
                    src={dj.image}
                    alt={dj.name}
                    className="w-24 h-24 rounded-full mx-auto mb-3 object-cover ring-2 ring-dj-border group-hover:ring-dj-primary/50 transition-all"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full mx-auto mb-3 bg-dj-800 border-2 border-dj-border flex items-center justify-center group-hover:border-dj-primary/30 transition-all">
                    <span className="text-2xl font-bold text-dj-muted">
                      {dj.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <p className="font-semibold text-white text-sm">{dj.name}</p>
                {dj.setTime && (
                  <p className="text-xs text-dj-muted mt-0.5">{dj.setTime}</p>
                )}
                {dj.instagramHandle && (
                  <a
                    href={`https://instagram.com/${dj.instagramHandle.replace("@", "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-dj-primary-light hover:underline mt-0.5 inline-block"
                  >
                    @{dj.instagramHandle.replace("@", "")}
                  </a>
                )}
                {dj.genres && (
                  <p className="text-xs text-dj-muted mt-1 italic">{dj.genres}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Description */}
      {event.description && (
        <section className="max-w-2xl mx-auto px-6 py-4">
          <div className="border border-dj-border rounded-xl p-6 bg-dj-900/50">
            <p className="text-dj-muted leading-relaxed whitespace-pre-line">{event.description}</p>
          </div>
        </section>
      )}

      {/* Event details grid */}
      {(event.dresscode || event.ageLimit || event.capacity || event.price != null) && (
        <section className="max-w-2xl mx-auto px-6 py-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {event.dresscode && (
              <div className="border border-dj-border rounded-xl p-4 bg-dj-900/30 text-center">
                <p className="text-xs text-dj-muted mb-1">Dress Code</p>
                <p className="text-sm text-dj-text font-medium">{event.dresscode}</p>
              </div>
            )}
            {event.ageLimit && (
              <div className="border border-dj-border rounded-xl p-4 bg-dj-900/30 text-center">
                <p className="text-xs text-dj-muted mb-1">Age</p>
                <p className="text-sm text-dj-text font-medium">{event.ageLimit}</p>
              </div>
            )}
            {event.capacity && (
              <div className="border border-dj-border rounded-xl p-4 bg-dj-900/30 text-center">
                <p className="text-xs text-dj-muted mb-1">Capacity</p>
                <p className="text-sm text-dj-text font-medium">
                  {event.capacity.toLocaleString()}
                </p>
              </div>
            )}
            {event.price != null && (
              <div className="border border-dj-border rounded-xl p-4 bg-dj-900/30 text-center">
                <p className="text-xs text-dj-muted mb-1">Tickets</p>
                <p className="text-sm text-dj-text font-medium flex items-center justify-center gap-1">
                  {event.price === 0 ? (
                    "Free"
                  ) : (
                    <>
                      <DollarSign className="w-3 h-3" />
                      {event.price} {event.currency}
                    </>
                  )}
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Bottom ticket CTA */}
      {event.ticketUrl && (
        <section className="max-w-2xl mx-auto px-6 py-10 text-center">
          <a
            href={event.ticketUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-dj-primary hover:bg-dj-primary-hover text-white font-bold px-8 py-4 rounded-xl transition-colors text-base"
          >
            <Ticket className="w-5 h-5" /> Get Tickets Now
          </a>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-dj-border py-8 mt-4">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <div className="w-5 h-5 rounded bg-dj-primary flex items-center justify-center">
              <Music2 className="w-3 h-3 text-white" />
            </div>
            <span className="text-xs text-dj-muted">DJ Event Hub</span>
          </div>
          <p className="text-xs text-dj-muted/50">Event management for the culture</p>
        </div>
      </footer>
    </div>
  );
}
