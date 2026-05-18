import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, isToday, isTomorrow } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const UTC_MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const UTC_MONTHS_LONG  = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const UTC_DAYS_SHORT   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const UTC_DAYS_LONG    = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

function utcTimeTo12h(d: Date): string {
  const h = d.getUTCHours(), m = d.getUTCMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ampm}`;
}

export function formatDate(date: Date | string, fmt = "MMM d, yyyy"): string {
  const d = new Date(date);
  const M = d.getUTCMonth(), D = d.getUTCDate(), Y = d.getUTCFullYear(), DOW = d.getUTCDay();
  return fmt
    .replace("EEEE", UTC_DAYS_LONG[DOW])
    .replace("EEE",  UTC_DAYS_SHORT[DOW])
    .replace("MMMM", UTC_MONTHS_LONG[M])
    .replace("MMM",  UTC_MONTHS_SHORT[M])
    .replace("MM",   String(M + 1).padStart(2, "0"))
    .replace(/\bd\b/, String(D))
    .replace("dd",   String(D).padStart(2, "0"))
    .replace("yyyy", String(Y))
    .replace("yy",   String(Y).slice(-2));
}

export function formatTime(date: Date | string): string {
  return utcTimeTo12h(new Date(date));
}

export function formatDateTime(date: Date | string): string {
  const d = new Date(date);
  return `${UTC_MONTHS_SHORT[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()} at ${utcTimeTo12h(d)}`;
}

export function timeAgo(date: Date | string) {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function formatEventDate(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const sameUTCDay = (a: Date, b: Date) =>
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth()    === b.getUTCMonth()    &&
    a.getUTCDate()     === b.getUTCDate();
  const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  if (sameUTCDay(d, now))      return `Today at ${utcTimeTo12h(d)}`;
  if (sameUTCDay(d, tomorrow)) return `Tomorrow at ${utcTimeTo12h(d)}`;
  return `${UTC_DAYS_SHORT[d.getUTCDay()]}, ${UTC_MONTHS_SHORT[d.getUTCMonth()]} ${d.getUTCDate()} at ${utcTimeTo12h(d)}`;
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
  "Funk",
  "Soul",
  "Disco",
  "Nu-Disco",
  "Boogie",
  "Gospel",
  "Jazz",
  "Neo Soul",
  "Afrobeats",
  "Dancehall",
  "Reggaeton",
  "Latin",
  "Salsa",
  "Cumbia",
  "Baile Funk",
  "Soca",
  "EDM",
  "Commercial",
  "Open Format",
  "80s",
  "90s",
  "2000s",
  "Pop",
  "Rock",
] as const;
