"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  Plus, Loader2, Upload, Image, Instagram, Facebook, Twitter, X, Trash2,
  ExternalLink, Copy, Check, Megaphone, Linkedin, Mail, MessageSquare,
  AtSign, Calendar, Clock, Zap, AlertCircle, Link, LayoutTemplate,
  CheckSquare, Circle, BookMarked, Edit2,
} from "lucide-react";
import { formatDate, formatTime, getPriorityColor } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

interface FlyerAsset {
  id: string; name: string; url: string; type: string;
  description?: string | null; createdAt: string;
}

interface CampaignTask {
  id: string; title: string; status: string;
  priority: string; dueDate?: string | null;
}

interface CustomMilestone {
  id: string; label: string; date: string; emoji: string; tip: string;
}

interface MarketingPost {
  id: string; platform: string; content: string;
  imageUrl?: string | null; hashtags?: string | null;
  status: string; scheduledAt?: string | null; postedAt?: string | null;
  notes?: string | null; createdAt: string;
}

interface EventBasic {
  id: string; name: string; tagline?: string | null;
  description?: string | null; startDate: string;
  doorsOpen?: string | null; venue?: string | null;
  city?: string | null; ticketUrl?: string | null;
  price?: number | null; currency?: string | null;
  genres: { genre: string }[];
  djs: { name: string; instagramHandle?: string | null; setTime?: string | null }[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

const ASSET_TYPES = ["DJ_PHOTO", "DJ_LOGO", "VENUE_PHOTO", "BACKGROUND", "OTHER"];

const ALL_PLATFORMS = [
  "INSTAGRAM", "FACEBOOK", "TWITTER", "TIKTOK",
  "LINKEDIN", "THREADS", "EMAIL", "SMS",
];

const CHAR_LIMITS: Record<string, number | null> = {
  INSTAGRAM: 2200, FACEBOOK: 63206, TWITTER: 280, TIKTOK: 2200,
  LINKEDIN: 3000, THREADS: 500, EMAIL: null, SMS: 160,
};

const PLATFORM_COLORS: Record<string, string> = {
  INSTAGRAM: "text-pink-400 bg-pink-400/10 border-pink-400/20",
  FACEBOOK:  "text-blue-400 bg-blue-400/10 border-blue-400/20",
  TWITTER:   "text-sky-400 bg-sky-400/10 border-sky-400/20",
  TIKTOK:    "text-white bg-white/10 border-white/20",
  LINKEDIN:  "text-blue-500 bg-blue-500/10 border-blue-500/20",
  THREADS:   "text-violet-400 bg-violet-400/10 border-violet-400/20",
  EMAIL:     "text-amber-400 bg-amber-400/10 border-amber-400/20",
  SMS:       "text-green-400 bg-green-400/10 border-green-400/20",
};

const HASHTAG_PRESETS = [
  { label: "House", tags: "#housemusic #deephouse #techhouse #housemusic" },
  { label: "Techno", tags: "#techno #darkrave #undergroundtechno #rave" },
  { label: "General", tags: "#djlife #nightlife #electronicmusic #partyvibes" },
  { label: "Hype", tags: "#cantwait #vibes #dancefloor #goodtimes" },
];

const POST_TEMPLATES = [
  { id: "ANNOUNCEMENT",  label: "Event Announcement", emoji: "🎉" },
  { id: "LINEUP_REVEAL", label: "Lineup Reveal",       emoji: "🎧" },
  { id: "TICKET_PUSH",   label: "Ticket Push",         emoji: "🎟" },
  { id: "COUNTDOWN_7",   label: "1 Week Away",         emoji: "⏳" },
  { id: "COUNTDOWN_3",   label: "3 Days Out",          emoji: "🔥" },
  { id: "TOMORROW",      label: "Tomorrow!",           emoji: "🚨" },
  { id: "TODAY",         label: "It's Tonight!",       emoji: "⚡" },
  { id: "RECAP",         label: "Post-Event Recap",    emoji: "🙏" },
];

const CAMPAIGN_MILESTONES = [
  { daysOffset: -30, label: "Event Announcement", templateId: "ANNOUNCEMENT",  tip: "Build anticipation early — first post gets the most organic reach" },
  { daysOffset: -21, label: "Lineup Reveal",       templateId: "LINEUP_REVEAL", tip: "Lineup reveals drive the most shares and tags" },
  { daysOffset: -14, label: "Ticket Push",         templateId: "TICKET_PUSH",   tip: "2-week push converts fence-sitters" },
  { daysOffset: -7,  label: "1 Week Warning",      templateId: "COUNTDOWN_7",   tip: "Last-chance urgency — highlight sold-out risk" },
  { daysOffset: -3,  label: "Weekend Hype",        templateId: "COUNTDOWN_3",   tip: "3-day sprint — post on all platforms" },
  { daysOffset: -1,  label: "Tomorrow!",           templateId: "TOMORROW",      tip: "Day-before excitement drives last-minute tickets" },
  { daysOffset:  0,  label: "It's Tonight!",       templateId: "TODAY",         tip: "Day-of posts peak engagement — tag venue and DJs" },
  { daysOffset:  1,  label: "Post-Event Recap",    templateId: "RECAP",         tip: "Recap posts build loyalty for your next event" },
];

// ── Icon helper ───────────────────────────────────────────────────────────────

function PlatformIcon({ platform, className = "w-4 h-4" }: { platform: string; className?: string }) {
  if (platform === "INSTAGRAM") return <Instagram className={className} />;
  if (platform === "FACEBOOK")  return <Facebook  className={className} />;
  if (platform === "TWITTER")   return <Twitter   className={className} />;
  if (platform === "LINKEDIN")  return <Linkedin  className={className} />;
  if (platform === "EMAIL")     return <Mail      className={className} />;
  if (platform === "SMS")       return <MessageSquare className={className} />;
  if (platform === "THREADS")   return <AtSign    className={className} />;
  return <Megaphone className={className} />;
}

// ── Template generator ────────────────────────────────────────────────────────

function generateTemplate(templateId: string, platform: string, event: EventBasic): { content: string; hashtags: string } {
  const djNames  = event.djs.map(d => d.name).join(", ") || "TBA";
  const djHandles = event.djs.filter(d => d.instagramHandle)
    .map(d => `@${d.instagramHandle!.replace("@", "")}`).join(" ");
  const genres   = event.genres.map(g => g.genre).join(" • ") || "";
  const date     = formatDate(event.startDate, "EEEE, MMMM d");
  const shortDate = formatDate(event.startDate, "MMM d");
  const venueCity = [event.venue, event.city].filter(Boolean).join(", ");
  const ticketLine = event.ticketUrl ? `\n🎟 Tickets: ${event.ticketUrl}` : "";
  const genreTags  = event.genres.slice(0, 3).map(g => `#${g.genre.replace(/\s+/g, "").toLowerCase()}`).join(" ");
  const baseTags   = "#djlife #nightlife #electronicmusic #partyvibes";
  const isShort = platform === "TWITTER" || platform === "SMS";
  const djLines = event.djs.map((d, i) =>
    `${i === 0 ? "🔥" : "▪️"} ${d.name}${d.setTime ? " — " + d.setTime : ""}${d.instagramHandle ? " (@" + d.instagramHandle.replace("@", "") + ")" : ""}`
  ).join("\n") || "• Lineup TBA";

  switch (templateId) {
    case "ANNOUNCEMENT":
      if (platform === "EMAIL")
        return { content: `Subject: You're invited — ${event.name}\n\n${event.tagline ? event.tagline + "\n\n" : ""}We're thrilled to announce ${event.name}!\n\n📅 ${date}\n📍 ${venueCity || "Venue TBA"}\n🎵 ${genres}\n\nFEATURED LINEUP:\n${djLines}\n\n${event.ticketUrl ? "🎟 Get your tickets now:\n" + event.ticketUrl : ""}`, hashtags: "" };
      if (platform === "SMS")
        return { content: `${event.name} - ${shortDate}${venueCity ? " @ " + venueCity : ""}. Feat: ${djNames}.${event.ticketUrl ? " Tickets: " + event.ticketUrl : ""}`, hashtags: "" };
      if (isShort)
        return { content: `🚨 ${event.name} — ${shortDate}\n📍 ${venueCity}\nFt. ${djNames}${event.ticketUrl ? "\n🎟 " + event.ticketUrl : ""}`, hashtags: `${genreTags} #djlife #rave` };
      return { content: `🎉 WE'RE MAKING IT OFFICIAL.\n\n${event.name} is happening.\n${event.tagline ? "\n" + event.tagline + "\n" : ""}\n📅 ${date}\n📍 ${venueCity || "Venue TBA"}\n🎵 ${genres}\n\nFeaturing: ${djNames}${ticketLine}${djHandles ? "\n\n" + djHandles : ""}`, hashtags: `${genreTags} ${baseTags} #rave` };

    case "LINEUP_REVEAL":
      if (isShort)
        return { content: `🎧 LINEUP REVEAL: ${event.name}\nFeaturing ${djNames}\n${shortDate}${event.ticketUrl ? "\n🎟 " + event.ticketUrl : ""}`, hashtags: `${genreTags} #lineupreveal` };
      return { content: `🎧 LINEUP REVEAL\n\n${event.name}\n\n${djLines}\n\n${date} | ${venueCity || "TBA"}${ticketLine}${djHandles ? "\n\n" + djHandles : ""}`, hashtags: `${genreTags} #lineupreveal #djlife #rave` };

    case "TICKET_PUSH":
      if (platform === "SMS")
        return { content: `Tickets LIVE for ${event.name} - ${shortDate}. ${event.ticketUrl || "Link in bio"}`, hashtags: "" };
      if (isShort)
        return { content: `🎟 Tickets are LIVE for ${event.name} — ${shortDate}\n${event.ticketUrl || "Link in bio"}`, hashtags: `${genreTags} #tickets` };
      return { content: `🎟 TICKETS ARE LIVE.\n\n${event.name}\n${date} | ${venueCity || "TBA"}\n\nFeaturing: ${djNames}\n${event.price != null && event.price > 0 ? `\nStarting at $${event.price}` : ""}\n\n${event.ticketUrl ? "👉 Grab yours before they sell out:\n" + event.ticketUrl : "Link in bio"}`, hashtags: `${genreTags} ${baseTags} #ticketsonsale` };

    case "COUNTDOWN_7":
      if (platform === "SMS")
        return { content: `7 DAYS. ${event.name} - ${shortDate} @ ${venueCity}. Feat: ${djNames}.${event.ticketUrl ? " " + event.ticketUrl : ""}`, hashtags: "" };
      if (isShort)
        return { content: `⏳ 7 DAYS. ${event.name} drops ${shortDate}. Ft: ${djNames}${event.ticketUrl ? "\n🎟 " + event.ticketUrl : ""}`, hashtags: `${genreTags} #countdown` };
      return { content: `⏳ ONE WEEK AWAY.\n\n${event.name} is 7 days out.\n\n${date}\n📍 ${venueCity || "TBA"}\n🎵 ${djNames}${ticketLine ? ticketLine + "\n\nFinal tickets going fast." : "\n\nSee you on the dancefloor."}`, hashtags: `${genreTags} ${baseTags} #countdown #7days` };

    case "COUNTDOWN_3":
      if (platform === "SMS")
        return { content: `3 DAYS. ${event.name}. ${date}. ${djNames}.${event.ticketUrl ? " " + event.ticketUrl : ""}`, hashtags: "" };
      if (isShort)
        return { content: `🔥 3 DAYS. ${event.name}. ${date}. ${djNames}.${event.ticketUrl ? "\n" + event.ticketUrl : ""}`, hashtags: `${genreTags} #countdown` };
      return { content: `🔥 3 DAYS.\n\n${event.name}\n${date} | ${venueCity || "TBA"}\n\nFt. ${djNames}${ticketLine || "\n\nAre you ready?"}`, hashtags: `${genreTags} ${baseTags} #3days #countdown` };

    case "TOMORROW":
      if (platform === "SMS")
        return { content: `TOMORROW. ${event.name} @ ${venueCity}. ${djNames}.${event.ticketUrl ? " " + event.ticketUrl : ""}`, hashtags: "" };
      if (isShort)
        return { content: `🚨 TOMORROW. ${event.name}. ${venueCity}. ${djNames}.${event.ticketUrl ? "\n" + event.ticketUrl : ""}`, hashtags: `${genreTags} #tomorrow` };
      return { content: `🚨 TOMORROW IS THE DAY.\n\n${event.name}\n\nTomorrow | ${venueCity || "TBA"}${event.doorsOpen ? "\n🚪 Doors open " + formatTime(event.doorsOpen) : ""}\n\nFeaturing: ${djNames}${ticketLine || "\n\nSee you there 🖤"}`, hashtags: `${genreTags} ${baseTags} #tomorrow #itsalmosttime` };

    case "TODAY":
      if (platform === "SMS")
        return { content: `TONIGHT. ${event.name} @ ${venueCity}. ${djNames}. See you there!`, hashtags: "" };
      if (isShort)
        return { content: `⚡ TONIGHT. ${event.name}. ${venueCity}. ${djNames}.${event.ticketUrl ? "\n" + event.ticketUrl : ""}`, hashtags: `${genreTags} #tonight` };
      return { content: `⚡ IT'S HAPPENING TONIGHT.\n\n${event.name}\n\nTONIGHT | ${venueCity || "TBA"}${event.doorsOpen ? "\n🚪 Doors: " + formatTime(event.doorsOpen) : ""}\n\n🎵 ${djNames}\n\nSee you on the dancefloor 🖤`, hashtags: `${genreTags} ${baseTags} #tonight #itstonight` };

    case "RECAP":
      if (platform === "SMS")
        return { content: `What a night! Thank you all for coming to ${event.name}. Photos/videos coming soon!`, hashtags: "" };
      if (isShort)
        return { content: `🙏 What a night. ${event.name} was incredible. Thank you all. ${djHandles}`, hashtags: `${genreTags} #recap` };
      return { content: `🙏 WHAT A NIGHT.\n\nThank you everyone who came out to ${event.name}. The energy was absolutely unreal.\n\nShoutout to ${djNames} — you crushed it.\n\n📸 Photos & videos coming soon. Follow for updates.\n\n🖤${djHandles ? " " + djHandles : ""}`, hashtags: `${genreTags} ${baseTags} #recap #thankyou` };

    default:
      return { content: "", hashtags: "" };
  }
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function MarketingPage() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<"assets" | "posts" | "campaign">("assets");
  const [assets, setAssets] = useState<FlyerAsset[]>([]);
  const [posts, setPosts]   = useState<MarketingPost[]>([]);
  const [event, setEvent]   = useState<EventBasic | null>(null);
  const [loading, setLoading] = useState(true);
  const [shareUrl, setShareUrl] = useState("");
  const [urlCopied, setUrlCopied] = useState(false);

  // Asset state
  const [showAssetForm, setShowAssetForm] = useState(false);
  const [assetForm, setAssetForm] = useState({ name: "", url: "", type: "DJ_PHOTO", description: "" });
  const [assetUploading, setAssetUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  // Post state
  const [showPostForm, setShowPostForm]       = useState(false);
  const [showTemplates, setShowTemplates]     = useState(false);
  const [postForm, setPostForm] = useState({
    platform: "INSTAGRAM", content: "", hashtags: "",
    imageUrl: "", notes: "", status: "DRAFT", scheduledAt: "",
  });
  const [postLoading, setPostLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  // Filter state
  const [platformFilter, setPlatformFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter]     = useState<string>("ALL");

  // Campaign milestone date overrides: key = daysOffset, value = ISO date string
  const [milestoneDates, setMilestoneDates] = useState<Record<number, string>>({});
  const [editingMilestone, setEditingMilestone] = useState<number | null>(null);

  // Custom milestones & tasks
  const [customMilestones, setCustomMilestones] = useState<CustomMilestone[]>([]);
  const [tasks, setTasks] = useState<CampaignTask[]>([]);
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [milestoneForm, setMilestoneForm] = useState({ label: "", date: "", emoji: "📌", tip: "" });
  const [editingCustomId, setEditingCustomId] = useState<string | null>(null);
  const [quickTaskFor, setQuickTaskFor] = useState<{ date: string; label: string } | null>(null);
  const [quickTaskTitle, setQuickTaskTitle] = useState("");
  const [quickTaskLoading, setQuickTaskLoading] = useState(false);
  const [quickTaskMode, setQuickTaskMode] = useState<"select" | "create">("select");
  const [taskSearch, setTaskSearch] = useState("");

  // ── Data fetching ────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    const [eRes, aRes, pRes, tRes] = await Promise.all([
      fetch(`/api/events/${id}`),
      fetch(`/api/events/${id}/flyer-assets`),
      fetch(`/api/events/${id}/marketing-posts`),
      fetch(`/api/events/${id}/tasks`),
    ]);
    if (eRes.ok) setEvent(await eRes.json());
    if (aRes.ok) setAssets(await aRes.json());
    if (pRes.ok) setPosts(await pRes.json());
    if (tRes.ok) setTasks(await tRes.json());
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setShareUrl(`${window.location.origin}/e/${id}`); }, [id]);

  // Persist custom milestones per event in localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`campaign_milestones_${id}`);
    if (saved) setCustomMilestones(JSON.parse(saved));
  }, [id]);
  useEffect(() => {
    localStorage.setItem(`campaign_milestones_${id}`, JSON.stringify(customMilestones));
  }, [id, customMilestones]);

  // ── Asset helpers ─────────────────────────────────────────────────────────────

  function handleAssetUpload(file: File): Promise<string | null> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  }

  async function saveAsset() {
    if (!assetForm.name.trim()) return;
    setAssetUploading(true);
    try {
      let url = assetForm.url;
      if (uploadFile) { const u = await handleAssetUpload(uploadFile); if (u) url = u; }
      if (!url) { alert("Please provide an image URL or upload a file."); return; }
      await fetch(`/api/events/${id}/flyer-assets`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...assetForm, url }),
      });
      setShowAssetForm(false);
      setAssetForm({ name: "", url: "", type: "DJ_PHOTO", description: "" });
      setUploadFile(null);
      fetchData();
    } finally { setAssetUploading(false); }
  }

  async function deleteAsset(assetId: string) {
    await fetch(`/api/events/${id}/flyer-assets/${assetId}`, { method: "DELETE" });
    fetchData();
  }

  // ── Post helpers ──────────────────────────────────────────────────────────────

  async function savePost() {
    if (!postForm.content.trim()) return;
    setPostLoading(true);
    try {
      const body = { ...postForm, scheduledAt: postForm.scheduledAt ? new Date(postForm.scheduledAt).toISOString() : null };
      await fetch(`/api/events/${id}/marketing-posts`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setShowPostForm(false);
      setPostForm({ platform: "INSTAGRAM", content: "", hashtags: "", imageUrl: "", notes: "", status: "DRAFT", scheduledAt: "" });
      fetchData();
    } finally { setPostLoading(false); }
  }

  async function updatePostStatus(postId: string, status: string) {
    await fetch(`/api/events/${id}/marketing-posts/${postId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, postedAt: status === "POSTED" ? new Date().toISOString() : null }),
    });
    fetchData();
  }

  async function deletePost(postId: string) {
    await fetch(`/api/events/${id}/marketing-posts/${postId}`, { method: "DELETE" });
    fetchData();
  }

  function copyToClipboard(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  function copyShareUrl() {
    navigator.clipboard.writeText(shareUrl);
    setUrlCopied(true);
    setTimeout(() => setUrlCopied(false), 2000);
  }

  function applyTemplate(templateId: string) {
    if (!event) return;
    const { content, hashtags } = generateTemplate(templateId, postForm.platform, event);
    setPostForm(f => ({ ...f, content, hashtags }));
    setShowTemplates(false);
  }

  function openPostFormWithTemplate(templateId: string) {
    if (!event) return;
    const { content, hashtags } = generateTemplate(templateId, "INSTAGRAM", event);
    setPostForm({ platform: "INSTAGRAM", content, hashtags, imageUrl: "", notes: "", status: "DRAFT", scheduledAt: "" });
    setShowPostForm(true);
  }

  // ── Campaign planner helpers ──────────────────────────────────────────────────

  function getMilestoneDate(daysOffset: number): Date {
    if (milestoneDates[daysOffset]) return new Date(milestoneDates[daysOffset]);
    const d = new Date(event!.startDate);
    d.setDate(d.getDate() + daysOffset);
    return d;
  }

  function getPostsNearMilestone(daysOffset: number): MarketingPost[] {
    const mid = getMilestoneDate(daysOffset).getTime();
    const TWO_DAYS = 2 * 24 * 60 * 60 * 1000;
    return posts.filter(p => {
      if (!p.scheduledAt) return false;
      const diff = Math.abs(new Date(p.scheduledAt).getTime() - mid);
      return diff <= TWO_DAYS;
    });
  }

  function getTasksNearDate(date: Date): CampaignTask[] {
    const mid = date.getTime();
    const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;
    return tasks.filter(t => {
      if (!t.dueDate) return false;
      return Math.abs(new Date(t.dueDate).getTime() - mid) <= THREE_DAYS;
    });
  }

  function openNewMilestone() {
    setEditingCustomId(null);
    setMilestoneForm({ label: "", date: "", emoji: "📌", tip: "" });
    setShowMilestoneForm(true);
  }

  function openEditMilestone(m: CustomMilestone) {
    setEditingCustomId(m.id);
    setMilestoneForm({ label: m.label, date: m.date, emoji: m.emoji, tip: m.tip });
    setShowMilestoneForm(true);
  }

  function saveMilestoneForm() {
    if (!milestoneForm.label.trim() || !milestoneForm.date) return;
    if (editingCustomId) {
      setCustomMilestones(ms => ms.map(m =>
        m.id === editingCustomId
          ? { ...m, label: milestoneForm.label.trim(), date: milestoneForm.date, emoji: milestoneForm.emoji || "📌", tip: milestoneForm.tip.trim() }
          : m
      ));
    } else {
      setCustomMilestones(ms => [...ms, {
        id: crypto.randomUUID(),
        label: milestoneForm.label.trim(),
        date:  milestoneForm.date,
        emoji: milestoneForm.emoji || "📌",
        tip:   milestoneForm.tip.trim(),
      }]);
    }
    setMilestoneForm({ label: "", date: "", emoji: "📌", tip: "" });
    setEditingCustomId(null);
    setShowMilestoneForm(false);
  }

  function deleteCustomMilestone(milestoneId: string) {
    setCustomMilestones(ms => ms.filter(m => m.id !== milestoneId));
  }

  async function createQuickTask() {
    if (!quickTaskTitle.trim() || !quickTaskFor) return;
    setQuickTaskLoading(true);
    try {
      await fetch(`/api/events/${id}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: quickTaskTitle.trim(),
          priority: "MEDIUM",
          status: "TODO",
          category: "MARKETING",
          dueDate: new Date(quickTaskFor.date).toISOString(),
        }),
      });
      setQuickTaskFor(null);
      setQuickTaskTitle("");
      fetchData();
    } finally { setQuickTaskLoading(false); }
  }

  async function linkTaskToMilestone(taskId: string, date: string) {
    await fetch(`/api/events/${id}/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dueDate: new Date(date).toISOString() }),
    });
    setQuickTaskFor(null);
    setTaskSearch("");
    fetchData();
  }

  function openQuickTask(date: string, key: string) {
    setQuickTaskFor({ date, label: key });
    setQuickTaskTitle("");
    setTaskSearch("");
    setQuickTaskMode(tasks.some(t => t.status !== "DONE") ? "select" : "create");
  }

  // ── Derived ───────────────────────────────────────────────────────────────────

  const filteredPosts = posts.filter(p => {
    if (platformFilter !== "ALL" && p.platform !== platformFilter) return false;
    if (statusFilter === "SCHEDULED") return !!p.scheduledAt && p.status !== "POSTED";
    if (statusFilter !== "ALL" && p.status !== statusFilter) return false;
    return true;
  });

  const charLimit = CHAR_LIMITS[postForm.platform];
  const charCount = postForm.content.length;
  const charOver  = charLimit !== null && charCount > charLimit;

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-dj-muted" /></div>;

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-5xl mx-auto">
      {/* Page header */}
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-dj-primary" /> Marketing
        </h1>
      </div>

      {/* Share event banner */}
      {shareUrl && (
        <div className="card p-4 mb-5 border-dj-primary/20 bg-dj-primary/5">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-sm text-dj-primary-light font-medium flex-shrink-0">
              <Link className="w-4 h-4" /> Public Event Page
            </div>
            <code className="flex-1 text-xs text-dj-muted bg-dj-900 px-3 py-1.5 rounded-lg truncate min-w-0">
              {shareUrl}
            </code>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={copyShareUrl}
                className="flex items-center gap-1.5 text-xs btn-secondary px-3 py-1.5">
                {urlCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {urlCopied ? "Copied!" : "Copy Link"}
              </button>
              <a href={shareUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs btn-ghost px-3 py-1.5">
                <ExternalLink className="w-3.5 h-3.5" /> Preview
              </a>
            </div>
          </div>
          <p className="text-xs text-dj-muted mt-2">Share this link on social media, via email, or SMS — anyone can view without an account.</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-dj-border mb-6">
        {([["assets","Flyer Assets"],["posts","Social Posts"],["campaign","Campaign Planner"]] as const).map(([t, label]) => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-all -mb-px ${activeTab === t ? "border-dj-primary text-dj-primary-light" : "border-transparent text-dj-muted hover:text-dj-text"}`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── FLYER ASSETS TAB ──────────────────────────────────────────────────── */}
      {activeTab === "assets" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="section-title">Flyer Assets</h2>
              <p className="text-xs text-dj-muted mt-0.5">Upload DJ photos, logos, venue shots for flyer design</p>
            </div>
            <button onClick={() => setShowAssetForm(true)} className="btn-primary text-sm flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> Add Asset
            </button>
          </div>

          {assets.length === 0 ? (
            <div className="card p-10 text-center">
              <Image className="w-10 h-10 text-dj-muted mx-auto mb-3" />
              <p className="text-dj-muted text-sm mb-4">No assets yet. Upload DJ photos and logos for your flyer designer.</p>
              <button onClick={() => setShowAssetForm(true)} className="btn-primary text-sm">Add first asset</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {assets.map((asset) => (
                <div key={asset.id} className="card overflow-hidden group">
                  <div className="aspect-square bg-dj-700 relative">
                    <img src={asset.url} alt={asset.name} className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <a href={asset.url} target="_blank" rel="noopener noreferrer"
                        className="p-2 bg-dj-800/80 rounded-lg text-white hover:bg-dj-700">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <button onClick={() => deleteAsset(asset.id)}
                        className="p-2 bg-red-500/20 rounded-lg text-red-400 hover:bg-red-500/40">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="absolute top-2 left-2 text-xs bg-dj-900/80 text-dj-muted px-1.5 py-0.5 rounded">
                      {asset.type.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-medium text-dj-text truncate">{asset.name}</p>
                    {asset.description && <p className="text-xs text-dj-muted truncate">{asset.description}</p>}
                  </div>
                </div>
              ))}
              <button onClick={() => setShowAssetForm(true)}
                className="card border-dashed border-dj-border/50 hover:border-dj-primary/40 flex flex-col items-center justify-center aspect-square text-dj-muted hover:text-dj-primary-light transition-all">
                <Upload className="w-8 h-8 mb-1" /><span className="text-xs">Add Asset</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── SOCIAL POSTS TAB ─────────────────────────────────────────────────── */}
      {activeTab === "posts" && (
        <div>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div>
              <h2 className="section-title">Social Posts</h2>
              <p className="text-xs text-dj-muted mt-0.5">
                {posts.length} post{posts.length !== 1 ? "s" : ""} across {[...new Set(posts.map(p => p.platform))].length} platform{[...new Set(posts.map(p => p.platform))].length !== 1 ? "s" : ""}
              </p>
            </div>
            <button onClick={() => setShowPostForm(true)} className="btn-primary text-sm flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> New Post
            </button>
          </div>

          {/* Platform filter */}
          <div className="flex gap-1.5 flex-wrap mb-3">
            {["ALL", ...ALL_PLATFORMS].map(p => (
              <button key={p} onClick={() => setPlatformFilter(p)}
                className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-all ${platformFilter === p ? (p === "ALL" ? "bg-dj-primary/20 border-dj-primary/40 text-dj-primary-light" : `${PLATFORM_COLORS[p]} border-current`) : "border-dj-border text-dj-muted hover:border-dj-border/80 hover:text-dj-text"}`}>
                {p !== "ALL" && <PlatformIcon platform={p} className="w-3 h-3" />}
                {p === "ALL" ? "All" : p.charAt(0) + p.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <div className="flex gap-1.5 flex-wrap mb-5">
            {[["ALL","All"],["DRAFT","Draft"],["SCHEDULED","Scheduled"],["READY","Ready"],["POSTED","Posted"]].map(([val, label]) => (
              <button key={val} onClick={() => setStatusFilter(val)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-all ${statusFilter === val ? "bg-dj-primary/20 border-dj-primary/40 text-dj-primary-light" : "border-dj-border text-dj-muted hover:text-dj-text"}`}>
                {label}
              </button>
            ))}
          </div>

          {filteredPosts.length === 0 ? (
            <div className="card p-10 text-center">
              <Instagram className="w-10 h-10 text-dj-muted mx-auto mb-3" />
              <p className="text-dj-muted text-sm mb-4">
                {posts.length === 0 ? "No social posts drafted yet." : "No posts match this filter."}
              </p>
              {posts.length === 0 && <button onClick={() => setShowPostForm(true)} className="btn-primary text-sm">Create first post</button>}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPosts.map((post) => (
                <div key={post.id} className="card p-4">
                  <div className="flex items-start gap-3">
                    <div className={`badge flex-shrink-0 mt-0.5 ${PLATFORM_COLORS[post.platform] ?? "text-dj-muted bg-dj-700 border-dj-border"}`}>
                      <PlatformIcon platform={post.platform} />{post.platform}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-dj-text whitespace-pre-line">{post.content}</p>
                      {post.hashtags && <p className="text-xs text-dj-primary-light mt-1">{post.hashtags}</p>}
                      <div className="flex flex-wrap gap-3 mt-2">
                        {post.scheduledAt && (
                          <span className="flex items-center gap-1 text-xs text-dj-muted">
                            <Calendar className="w-3 h-3" />
                            {formatDate(post.scheduledAt, "MMM d")} at {formatTime(post.scheduledAt)}
                          </span>
                        )}
                        {post.notes && <span className="text-xs text-dj-muted italic">{post.notes}</span>}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <span className={`badge text-xs ${
                        post.status === "POSTED"  ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" :
                        post.status === "READY"   ? "text-blue-400 bg-blue-400/10 border-blue-400/20" :
                        post.scheduledAt          ? "text-amber-400 bg-amber-400/10 border-amber-400/20" :
                        "text-dj-muted bg-dj-700 border-dj-border"}`}>
                        {post.scheduledAt && post.status === "DRAFT" ? "SCHEDULED" : post.status}
                      </span>
                      <div className="flex gap-1">
                        <button onClick={() => copyToClipboard(post.content + (post.hashtags ? "\n\n" + post.hashtags : ""), post.id)}
                          className="p-1.5 text-dj-muted hover:text-dj-text hover:bg-dj-700 rounded transition-colors">
                          {copied === post.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        {post.status !== "POSTED" && (
                          <button onClick={() => updatePostStatus(post.id, post.status === "DRAFT" ? "READY" : "POSTED")}
                            className="p-1.5 text-dj-muted hover:text-emerald-400 hover:bg-emerald-500/10 rounded transition-colors">
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button onClick={() => deletePost(post.id)}
                          className="p-1.5 text-dj-muted hover:text-red-400 hover:bg-red-500/10 rounded transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── CAMPAIGN PLANNER TAB ─────────────────────────────────────────────── */}
      {activeTab === "campaign" && event && (() => {
        // Combine built-in + custom milestones sorted by date
        const allMilestones = [
          ...CAMPAIGN_MILESTONES.map(m => ({
            key: `builtin-${m.daysOffset}`,
            label: m.label,
            date: getMilestoneDate(m.daysOffset),
            emoji: POST_TEMPLATES.find(t => t.id === m.templateId)?.emoji ?? "📌",
            tip: m.tip,
            templateId: m.templateId as string | null,
            daysOffset: m.daysOffset as number | null,
            isCustom: false,
          })),
          ...customMilestones.map(m => ({
            key: m.id,
            label: m.label,
            date: new Date(m.date),
            emoji: m.emoji,
            tip: m.tip,
            templateId: null,
            daysOffset: null,
            isCustom: true,
          })),
        ].sort((a, b) => a.date.getTime() - b.date.getTime());

        return (
        <div>
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div>
              <h2 className="section-title">Campaign Planner</h2>
              <p className="text-xs text-dj-muted mt-0.5">Timeline of posts and tasks leading up to your event</p>
            </div>
            <button onClick={openNewMilestone} className="btn-secondary text-sm flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> Add Milestone
            </button>
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            {[
              { label: "Milestones", value: allMilestones.length },
              { label: "Posts", value: posts.length },
              { label: "Scheduled", value: posts.filter(p => p.scheduledAt && p.status !== "POSTED").length },
              { label: "Tasks", value: tasks.filter(t => t.status !== "DONE").length + " open" },
            ].map(s => (
              <div key={s.label} className="card p-3 text-center">
                <p className="text-xl font-bold text-dj-primary-light">{s.value}</p>
                <p className="text-xs text-dj-muted mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Milestones */}
          <div className="space-y-3">
            {allMilestones.map((m) => {
              const now = new Date();
              const daysUntil = Math.round((m.date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              const isPast = m.date < now;
              const nearPosts = m.daysOffset !== null
                ? getPostsNearMilestone(m.daysOffset)
                : (() => { const mid = m.date.getTime(); const TWO = 2*86400000; return posts.filter(p => p.scheduledAt && Math.abs(new Date(p.scheduledAt).getTime()-mid) <= TWO); })();
              const nearTasks = getTasksNearDate(m.date);
              const isQuickTaskOpen = quickTaskFor?.label === m.key;

              return (
                <div key={m.key} className={`card p-4 border ${nearPosts.length > 0 || nearTasks.length > 0 ? "border-emerald-500/20" : isPast ? "border-red-500/10" : "border-dj-border"}`}>
                  <div className="flex items-start gap-4">
                    {/* Date column */}
                    <div className="flex-shrink-0 text-center w-20">
                      {editingMilestone === (m.daysOffset ?? -9999) ? (
                        <input type="date"
                          defaultValue={m.date.toISOString().split("T")[0]}
                          className="input-field text-xs px-1 py-1 w-full" autoFocus
                          onBlur={(e) => {
                            if (e.target.value && m.daysOffset !== null) setMilestoneDates(d => ({ ...d, [m.daysOffset!]: e.target.value }));
                            setEditingMilestone(null);
                          }}
                          onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); if (e.key === "Escape") setEditingMilestone(null); }}
                        />
                      ) : (
                        <button onClick={() => m.daysOffset !== null && setEditingMilestone(m.daysOffset)}
                          className={`group text-center w-full rounded-lg p-1 transition-colors ${m.daysOffset !== null ? "hover:bg-dj-700" : ""}`}>
                          <p className="text-xs text-dj-muted group-hover:text-dj-primary-light">{formatDate(m.date, "MMM d")}</p>
                          <p className={`text-xs font-medium mt-0.5 ${isPast ? "text-dj-muted" : daysUntil <= 3 ? "text-amber-400" : "text-dj-text"}`}>
                            {isPast ? `${Math.abs(daysUntil)}d ago` : daysUntil === 0 ? "Today!" : `${daysUntil}d away`}
                          </p>
                          {m.daysOffset !== null && <p className="text-xs text-dj-muted/50 group-hover:text-dj-muted mt-0.5">edit date</p>}
                        </button>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="text-base">{m.emoji}</span>
                        <p className="font-medium text-sm text-dj-text">{m.label}</p>
                        {nearPosts.length > 0 && (
                          <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full">
                            <Check className="w-3 h-3" /> {nearPosts.length} post{nearPosts.length !== 1 ? "s" : ""}
                          </span>
                        )}
                        {nearTasks.length > 0 && (
                          <span className="flex items-center gap-1 text-xs text-blue-400 bg-blue-400/10 border border-blue-400/20 px-2 py-0.5 rounded-full">
                            <CheckSquare className="w-3 h-3" /> {nearTasks.length} task{nearTasks.length !== 1 ? "s" : ""}
                          </span>
                        )}
                        {nearPosts.length === 0 && nearTasks.length === 0 && (
                          <span className="flex items-center gap-1 text-xs text-dj-muted bg-dj-700 border border-dj-border px-2 py-0.5 rounded-full">
                            <AlertCircle className="w-3 h-3" /> Nothing planned
                          </span>
                        )}
                      </div>
                      {m.tip && <p className="text-xs text-dj-muted mb-2">{m.tip}</p>}

                      {/* Linked posts */}
                      {nearPosts.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-1.5">
                          {nearPosts.map(p => (
                            <span key={p.id} className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${PLATFORM_COLORS[p.platform] ?? "text-dj-muted border-dj-border"}`}>
                              <PlatformIcon platform={p.platform} className="w-3 h-3" />{p.platform}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Linked tasks */}
                      {nearTasks.length > 0 && (
                        <div className="space-y-1 mb-1.5">
                          {nearTasks.map(t => (
                            <div key={t.id} className="flex items-center gap-2">
                              {t.status === "DONE"
                                ? <CheckSquare className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                                : <Circle className="w-3 h-3 text-dj-muted flex-shrink-0" />}
                              <span className={`text-xs ${t.status === "DONE" ? "line-through text-dj-muted" : "text-dj-text"}`}>{t.title}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Quick task panel */}
                      {isQuickTaskOpen && (
                        <div className="mt-3 border border-dj-border/40 rounded-xl bg-dj-900/60 p-3">
                          <div className="flex items-center gap-2 mb-3">
                            <button onClick={() => setQuickTaskMode("select")}
                              className={`text-xs px-3 py-1 rounded-full border transition-all ${quickTaskMode === "select" ? "bg-dj-primary/20 border-dj-primary/40 text-dj-primary-light" : "border-dj-border text-dj-muted hover:text-dj-text"}`}>
                              Link existing
                            </button>
                            <button onClick={() => setQuickTaskMode("create")}
                              className={`text-xs px-3 py-1 rounded-full border transition-all ${quickTaskMode === "create" ? "bg-dj-primary/20 border-dj-primary/40 text-dj-primary-light" : "border-dj-border text-dj-muted hover:text-dj-text"}`}>
                              Create new
                            </button>
                            <button onClick={() => setQuickTaskFor(null)} className="ml-auto text-dj-muted hover:text-dj-text p-0.5">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {quickTaskMode === "select" ? (
                            <div>
                              <input type="text" value={taskSearch}
                                onChange={e => setTaskSearch(e.target.value)}
                                placeholder="Search tasks..." className="input-field text-xs py-1 mb-2" autoFocus />
                              <div className="space-y-0.5 max-h-44 overflow-y-auto">
                                {(() => {
                                  const filtered = tasks.filter(t =>
                                    t.status !== "DONE" &&
                                    (!taskSearch || t.title.toLowerCase().includes(taskSearch.toLowerCase()))
                                  );
                                  if (filtered.length === 0) return (
                                    <div className="text-center py-3">
                                      <p className="text-xs text-dj-muted mb-2">
                                        {tasks.filter(t => t.status !== "DONE").length === 0 ? "No open tasks yet." : "No tasks match your search."}
                                      </p>
                                      <button onClick={() => setQuickTaskMode("create")} className="text-xs text-dj-primary-light hover:underline">
                                        Create a new task →
                                      </button>
                                    </div>
                                  );
                                  return filtered.map(t => (
                                    <button key={t.id} onClick={() => linkTaskToMilestone(t.id, quickTaskFor!.date)}
                                      className="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-dj-700 transition-colors group">
                                      <Circle className="w-3 h-3 text-dj-muted flex-shrink-0" />
                                      <span className="text-xs text-dj-text flex-1 truncate">{t.title}</span>
                                      <span className={`text-xs flex-shrink-0 ${getPriorityColor(t.priority)}`}>{t.priority}</span>
                                      <span className="text-xs text-dj-primary-light opacity-0 group-hover:opacity-100 flex-shrink-0 ml-1">Link →</span>
                                    </button>
                                  ));
                                })()}
                              </div>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <input autoFocus type="text" value={quickTaskTitle}
                                onChange={e => setQuickTaskTitle(e.target.value)}
                                onKeyDown={e => { if (e.key === "Enter") createQuickTask(); if (e.key === "Escape") setQuickTaskFor(null); }}
                                placeholder="Task title..." className="input-field text-xs py-1 flex-1" />
                              <button onClick={createQuickTask} disabled={quickTaskLoading} className="btn-primary text-xs px-3 py-1">
                                {quickTaskLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Add"}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1.5 flex-shrink-0">
                      {m.templateId && (
                        <button onClick={() => { openPostFormWithTemplate(m.templateId!); setActiveTab("posts"); }}
                          className="flex items-center gap-1.5 text-xs btn-secondary px-3 py-1.5">
                          <Zap className="w-3 h-3" /> Post
                        </button>
                      )}
                      <button onClick={() => openQuickTask(m.date.toISOString().split("T")[0], m.key)}
                        className="flex items-center gap-1.5 text-xs btn-secondary px-3 py-1.5">
                        <BookMarked className="w-3 h-3" /> Task
                      </button>
                      {m.isCustom && (
                        <>
                          <button onClick={() => { const cm = customMilestones.find(c => c.id === m.key); if (cm) openEditMilestone(cm); }}
                            className="flex items-center gap-1.5 text-xs btn-secondary px-3 py-1.5">
                            <Edit2 className="w-3 h-3" /> Edit
                          </button>
                          <button onClick={() => deleteCustomMilestone(m.key)}
                            className="flex items-center gap-1.5 text-xs text-red-400 hover:bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-1.5 transition-colors">
                            <Trash2 className="w-3 h-3" /> Remove
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Platform coverage */}
          <div className="card p-5 mt-6">
            <h3 className="text-sm font-semibold text-dj-text mb-3 flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-dj-primary" /> Platform Coverage
            </h3>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {ALL_PLATFORMS.map(platform => {
                const count = posts.filter(p => p.platform === platform).length;
                const posted = posts.filter(p => p.platform === platform && p.status === "POSTED").length;
                return (
                  <div key={platform} className="text-center">
                    <div className={`w-10 h-10 rounded-xl mx-auto flex items-center justify-center border mb-1 ${count > 0 ? PLATFORM_COLORS[platform] : "text-dj-muted bg-dj-700 border-dj-border opacity-40"}`}>
                      <PlatformIcon platform={platform} className="w-5 h-5" />
                    </div>
                    <p className="text-xs text-dj-muted">{count > 0 ? `${posted}/${count}` : "—"}</p>
                    <p className="text-xs text-dj-muted/60">{platform.charAt(0) + platform.slice(1).toLowerCase()}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        );
      })()}

      {activeTab === "campaign" && !event && (
        <div className="card p-10 text-center">
          <p className="text-dj-muted text-sm">Event data not available.</p>
        </div>
      )}

      {/* ── ADD / EDIT MILESTONE MODAL ──────────────────────────────────────── */}
      {showMilestoneForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-dj-800 border border-dj-border rounded-xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <BookMarked className="w-4 h-4 text-dj-primary" />
                {editingCustomId ? "Edit Milestone" : "Add Milestone"}
              </h3>
              <button onClick={() => { setShowMilestoneForm(false); setEditingCustomId(null); }} className="text-dj-muted hover:text-dj-text">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="label">Milestone Label *</label>
                <input type="text" value={milestoneForm.label}
                  onChange={e => setMilestoneForm(f => ({ ...f, label: e.target.value }))}
                  className="input-field" placeholder="e.g. Press Release, Flyer Drop, Radio Spot..."
                  autoFocus />
              </div>
              <div>
                <label className="label">Date *</label>
                <input type="date" value={milestoneForm.date}
                  onChange={e => setMilestoneForm(f => ({ ...f, date: e.target.value }))}
                  className="input-field" />
              </div>
              <div>
                <label className="label">Emoji</label>
                <input type="text" value={milestoneForm.emoji}
                  onChange={e => setMilestoneForm(f => ({ ...f, emoji: e.target.value }))}
                  className="input-field" placeholder="📌" maxLength={2} />
              </div>
              <div>
                <label className="label">Tip / Notes</label>
                <textarea value={milestoneForm.tip}
                  onChange={e => setMilestoneForm(f => ({ ...f, tip: e.target.value }))}
                  className="input-field" rows={2}
                  placeholder="What should happen at this milestone?" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => { setShowMilestoneForm(false); setEditingCustomId(null); }} className="btn-secondary flex-1">Cancel</button>
              <button onClick={saveMilestoneForm}
                disabled={!milestoneForm.label.trim() || !milestoneForm.date}
                className="btn-primary flex-1">
                {editingCustomId ? "Save Changes" : "Add Milestone"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ASSET FORM MODAL ─────────────────────────────────────────────────── */}
      {showAssetForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-dj-800 border border-dj-border rounded-xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-white">Add Flyer Asset</h3>
              <button onClick={() => setShowAssetForm(false)} className="text-dj-muted hover:text-dj-text"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="label">Asset Name *</label>
                <input type="text" value={assetForm.name} onChange={e => setAssetForm(f => ({ ...f, name: e.target.value }))} className="input-field" placeholder="DJ Nexus - Press Photo" />
              </div>
              <div>
                <label className="label">Type</label>
                <select value={assetForm.type} onChange={e => setAssetForm(f => ({ ...f, type: e.target.value }))} className="input-field">
                  {ASSET_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Upload File</label>
                <input type="file" accept="image/*" onChange={e => setUploadFile(e.target.files?.[0] ?? null)}
                  className="input-field py-1.5 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-dj-primary file:text-white" />
              </div>
              <div>
                <label className="label">Or Image URL</label>
                <input type="url" value={assetForm.url} onChange={e => setAssetForm(f => ({ ...f, url: e.target.value }))} className="input-field" placeholder="https://..." />
              </div>
              <div>
                <label className="label">Description</label>
                <input type="text" value={assetForm.description} onChange={e => setAssetForm(f => ({ ...f, description: e.target.value }))} className="input-field" placeholder="e.g. High-res press photo for flyers" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowAssetForm(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={saveAsset} disabled={assetUploading} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {assetUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Upload
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TEMPLATES MODAL ──────────────────────────────────────────────────── */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-dj-800 border border-dj-border rounded-xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-white flex items-center gap-2"><LayoutTemplate className="w-4 h-4 text-dj-primary" /> Post Templates</h3>
              <button onClick={() => setShowTemplates(false)} className="text-dj-muted hover:text-dj-text"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-xs text-dj-muted mb-4">Select a template to auto-fill your post for <span className={`font-medium ${PLATFORM_COLORS[postForm.platform]?.split(" ")[0]}`}>{postForm.platform}</span></p>
            <div className="space-y-2">
              {POST_TEMPLATES.map(t => (
                <button key={t.id} onClick={() => applyTemplate(t.id)}
                  className="w-full text-left flex items-center gap-3 p-3 rounded-lg hover:bg-dj-700 border border-transparent hover:border-dj-border transition-all">
                  <span className="text-xl">{t.emoji}</span>
                  <span className="text-sm text-dj-text">{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── POST FORM MODAL ───────────────────────────────────────────────────── */}
      {showPostForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-dj-800 border border-dj-border rounded-xl w-full max-w-lg p-6 shadow-2xl my-4">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-white">New Social Post</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowTemplates(true)}
                  className="flex items-center gap-1.5 text-xs btn-ghost px-2.5 py-1.5">
                  <LayoutTemplate className="w-3.5 h-3.5" /> Templates
                </button>
                <button onClick={() => setShowPostForm(false)} className="text-dj-muted hover:text-dj-text"><X className="w-5 h-5" /></button>
              </div>
            </div>
            <div className="space-y-3">
              {/* Platform selector */}
              <div>
                <label className="label">Platform</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {ALL_PLATFORMS.map(p => (
                    <button key={p} type="button" onClick={() => setPostForm(f => ({ ...f, platform: p }))}
                      className={`py-2 text-xs rounded-lg border transition-all flex flex-col items-center gap-1 ${postForm.platform === p ? `${PLATFORM_COLORS[p]} border-current` : "border-dj-border text-dj-muted hover:border-dj-border/80"}`}>
                      <PlatformIcon platform={p} className="w-4 h-4" />
                      <span>{p.charAt(0) + p.slice(1).toLowerCase()}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Content with char counter */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="label mb-0">Caption / Content *</label>
                  {charLimit !== null && (
                    <span className={`text-xs ${charOver ? "text-red-400" : charCount > charLimit * 0.85 ? "text-amber-400" : "text-dj-muted"}`}>
                      {charCount} / {charLimit}
                    </span>
                  )}
                </div>
                <textarea value={postForm.content} onChange={e => setPostForm(f => ({ ...f, content: e.target.value }))}
                  className={`input-field ${charOver ? "border-red-500/50 focus:ring-red-500/30" : ""}`}
                  rows={6} placeholder="Write your post..." />
              </div>

              {/* Hashtags with presets */}
              <div>
                <label className="label">Hashtags</label>
                <input type="text" value={postForm.hashtags} onChange={e => setPostForm(f => ({ ...f, hashtags: e.target.value }))}
                  className="input-field" placeholder="#housemusic #techno #underground" />
                <div className="flex gap-1.5 flex-wrap mt-2">
                  {HASHTAG_PRESETS.map(preset => (
                    <button key={preset.label} type="button"
                      onClick={() => setPostForm(f => ({ ...f, hashtags: f.hashtags ? f.hashtags + " " + preset.tags : preset.tags }))}
                      className="text-xs px-2 py-0.5 rounded-full bg-dj-700 text-dj-muted hover:text-dj-primary-light border border-dj-border hover:border-dj-primary/30 transition-all">
                      + {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Schedule */}
              <div>
                <label className="label flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Schedule Date & Time</label>
                <input type="datetime-local" value={postForm.scheduledAt}
                  onChange={e => setPostForm(f => ({ ...f, scheduledAt: e.target.value }))}
                  className="input-field" />
              </div>

              <div>
                <label className="label">Image URL</label>
                <input type="url" value={postForm.imageUrl} onChange={e => setPostForm(f => ({ ...f, imageUrl: e.target.value }))}
                  className="input-field" placeholder="Link to flyer or image" />
              </div>
              <div>
                <label className="label">Notes (internal)</label>
                <input type="text" value={postForm.notes} onChange={e => setPostForm(f => ({ ...f, notes: e.target.value }))}
                  className="input-field" placeholder="e.g. Post at 6 PM Friday" />
              </div>
              <div>
                <label className="label">Status</label>
                <select value={postForm.status} onChange={e => setPostForm(f => ({ ...f, status: e.target.value }))} className="input-field">
                  <option value="DRAFT">Draft</option>
                  <option value="READY">Ready to Post</option>
                  <option value="POSTED">Already Posted</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowPostForm(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={savePost} disabled={postLoading || charOver} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {postLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Post"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
