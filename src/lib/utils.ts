import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, isToday, isTomorrow } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string, fmt = "MMM d, yyyy") {
  return format(new Date(date), fmt);
}

export function formatTime(date: Date | string) {
  return format(new Date(date), "h:mm a");
}

export function formatDateTime(date: Date | string) {
  return format(new Date(date), "MMM d, yyyy 'at' h:mm a");
}

export function timeAgo(date: Date | string) {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function formatEventDate(date: Date | string) {
  const d = new Date(date);
  if (isToday(d)) return `Today at ${formatTime(d)}`;
  if (isTomorrow(d)) return `Tomorrow at ${formatTime(d)}`;
  return format(d, "EEE, MMM d 'at' h:mm a");
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    PLANNING: "text-blue-400 bg-blue-400/10 border-blue-400/20",
    MARKETING: "text-purple-400 bg-purple-400/10 border-purple-400/20",
    CONFIRMED: "text-green-400 bg-green-400/10 border-green-400/20",
    ACTIVE: "text-pink-400 bg-pink-400/10 border-pink-400/20 animate-pulse",
    COMPLETED: "text-slate-400 bg-slate-400/10 border-slate-400/20",
    CANCELLED: "text-red-400 bg-red-400/10 border-red-400/20",
  };
  return map[status] ?? "text-slate-400 bg-slate-400/10 border-slate-400/20";
}

export function getTaskStatusColor(status: string): string {
  const map: Record<string, string> = {
    TODO: "text-slate-400 bg-slate-700 border-slate-600",
    IN_PROGRESS: "text-blue-400 bg-blue-400/10 border-blue-400/20",
    DONE: "text-green-400 bg-green-400/10 border-green-400/20",
    BLOCKED: "text-red-400 bg-red-400/10 border-red-400/20",
  };
  return map[status] ?? "text-slate-400 bg-slate-700 border-slate-600";
}

export function getPriorityColor(priority: string): string {
  const map: Record<string, string> = {
    LOW: "text-slate-400",
    MEDIUM: "text-blue-400",
    HIGH: "text-amber-400",
    URGENT: "text-red-400",
  };
  return map[priority] ?? "text-slate-400";
}

export function getRoleColor(role: string): string {
  const map: Record<string, string> = {
    ORGANIZER: "text-purple-400 bg-purple-400/10 border-purple-400/20",
    DJ: "text-pink-400 bg-pink-400/10 border-pink-400/20",
    PHOTOGRAPHER: "text-amber-400 bg-amber-400/10 border-amber-400/20",
    MARKETING: "text-blue-400 bg-blue-400/10 border-blue-400/20",
    STAFF: "text-slate-400 bg-slate-400/10 border-slate-400/20",
  };
  return map[role] ?? "text-slate-400 bg-slate-400/10 border-slate-400/20";
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const EVENT_STATUSES = [
  "PLANNING",
  "MARKETING",
  "CONFIRMED",
  "ACTIVE",
  "COMPLETED",
  "CANCELLED",
] as const;

export const TASK_CATEGORIES = [
  "MARKETING",
  "LOGISTICS",
  "TECHNICAL",
  "VENUE",
  "CREATIVE",
  "OTHER",
] as const;

export const PLATFORMS = [
  "INSTAGRAM",
  "FACEBOOK",
  "TWITTER",
  "TIKTOK",
] as const;

export const DJ_GENRES = [
  "House",
  "Tech House",
  "Deep House",
  "Techno",
  "Industrial Techno",
  "Minimal",
  "Melodic House",
  "Afro House",
  "Progressive House",
  "Trance",
  "Drum & Bass",
  "Jungle",
  "Dubstep",
  "UK Garage",
  "Breakbeat",
  "Ambient",
  "Hip Hop",
  "R&B",
  "Reggaeton",
  "Latin",
  "EDM",
  "Commercial",
] as const;
