"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Pencil,
  Megaphone,
  Users,
  CheckSquare,
  MessageSquare,
  Clock,
  ImageIcon,
  ChevronLeft,
} from "lucide-react";
import ExportForClaudeButton from "@/app/(app)/events/[id]/export-for-claude-button";

interface EventNavProps {
  eventId: string;
  eventName: string;
  eventStatus: string;
}

const navItems = [
  { label: "Overview", icon: LayoutDashboard, segment: "" },
  { label: "Planning", icon: Pencil, segment: "planning" },
  { label: "Marketing", icon: Megaphone, segment: "marketing" },
  { label: "Team", icon: Users, segment: "team" },
  { label: "Tasks", icon: CheckSquare, segment: "tasks" },
  { label: "Chat", icon: MessageSquare, segment: "chat" },
  { label: "Day-Of", icon: Clock, segment: "day-of" },
  { label: "Post-Event", icon: ImageIcon, segment: "post-event" },
];

export function EventNav({ eventId, eventName, eventStatus }: EventNavProps) {
  const pathname = usePathname();
  const base = `/events/${eventId}`;

  function isActive(segment: string) {
    if (segment === "") return pathname === base;
    return pathname.startsWith(`${base}/${segment}`);
  }

  const statusColors: Record<string, string> = {
    PLANNING: "bg-blue-500",
    MARKETING: "bg-purple-500",
    CONFIRMED: "bg-green-500",
    ACTIVE: "bg-pink-500 animate-pulse",
    COMPLETED: "bg-slate-500",
    CANCELLED: "bg-red-500",
  };

  return (
    <div className="bg-dj-900 border-b border-dj-border sticky top-0 z-20">
      {/* Event breadcrumb */}
      <div className="px-4 md:px-6 pt-3 pb-0">
        <div className="flex items-center gap-2">
          <Link
            href="/events"
            className="text-dj-muted hover:text-dj-text text-xs flex items-center gap-1 transition-colors"
          >
            <ChevronLeft className="w-3 h-3" />
            Events
          </Link>
          <span className="text-dj-border text-xs">/</span>
          <span className="text-dj-text text-xs font-medium truncate max-w-[200px]">
            {eventName}
          </span>
          <span
            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusColors[eventStatus] ?? "bg-slate-500"}`}
          />
          <span className="text-dj-muted text-xs">{eventStatus}</span>
          <div className="ml-auto flex-shrink-0">
            <ExportForClaudeButton eventId={eventId} eventName={eventName} />
          </div>
        </div>
      </div>

      {/* Nav tabs */}
      <nav className="flex gap-1 px-4 md:px-6 overflow-x-auto scrollbar-hide pb-0 mt-2">
        {navItems.map((item) => {
          const href = item.segment ? `${base}/${item.segment}` : base;
          const active = isActive(item.segment);
          return (
            <Link
              key={item.segment}
              href={href}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium whitespace-nowrap border-b-2 transition-all duration-150 ${
                active
                  ? "border-dj-primary text-dj-primary-light"
                  : "border-transparent text-dj-muted hover:text-dj-text hover:border-dj-border"
              }`}
            >
              <item.icon className="w-3.5 h-3.5 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
