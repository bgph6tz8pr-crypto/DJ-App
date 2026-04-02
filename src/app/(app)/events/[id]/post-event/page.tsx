"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  Image,
  Upload,
  Loader2,
  X,
  Instagram,
  Star,
  Trash2,
  CheckCircle2,
  Video,
  Plus,
  Copy,
  Check,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface MediaItem {
  id: string;
  url: string;
  thumbnailUrl?: string | null;
  type: string;
  caption?: string | null;
  featured: boolean;
  instagramPosted: boolean;
  instagramCaption?: string | null;
  tags?: string | null;
  createdAt: string;
}

interface EventBasic {
  id: string;
  name: string;
  startDate: string;
}

export default function PostEventPage() {
  const { id } = useParams<{ id: string }>();
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [event, setEvent] = useState<EventBasic | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [filter, setFilter] = useState<"all" | "photos" | "videos" | "instagram">("all");
  const [instagramCaption, setInstagramCaption] = useState("");
  const [captionCopied, setCaptionCopied] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadForm, setUploadForm] = useState({ url: "", type: "PHOTO", caption: "", tags: "" });
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const fetchData = useCallback(async () => {
    const [eventRes, mediaRes] = await Promise.all([
      fetch(`/api/events/${id}`),
      fetch(`/api/events/${id}/media`),
    ]);
    if (eventRes.ok) setEvent(await eventRes.json());
    if (mediaRes.ok) setMedia(await mediaRes.json());
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleFileUpload(files: FileList) {
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("eventId", id);
        formData.append("type", "media");

        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
        if (uploadRes.ok) {
          const { url } = await uploadRes.json();
          const type = file.type.startsWith("video/") ? "VIDEO" : "PHOTO";
          await fetch(`/api/events/${id}/media`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url, type, caption: "" }),
          });
        }
      }
      fetchData();
    } finally {
      setUploading(false);
    }
  }

  async function addByUrl() {
    if (!uploadForm.url) return;
    setUploading(true);
    try {
      let url = uploadForm.url;
      if (uploadFile) {
        const formData = new FormData();
        formData.append("file", uploadFile);
        formData.append("eventId", id);
        formData.append("type", "media");
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        if (res.ok) ({ url } = await res.json());
      }
      await fetch(`/api/events/${id}/media`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(uploadForm),
      });
      setShowUploadForm(false);
      setUploadForm({ url: "", type: "PHOTO", caption: "", tags: "" });
      setUploadFile(null);
      fetchData();
    } finally {
      setUploading(false);
    }
  }

  async function toggleFeatured(item: MediaItem) {
    await fetch(`/api/events/${id}/media/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ featured: !item.featured }),
    });
    fetchData();
  }

  async function markInstagramPosted(item: MediaItem) {
    await fetch(`/api/events/${id}/media/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ instagramPosted: !item.instagramPosted, instagramCaption }),
    });
    setSelectedItem(null);
    fetchData();
  }

  async function deleteMedia(itemId: string) {
    await fetch(`/api/events/${id}/media/${itemId}`, { method: "DELETE" });
    setSelectedItem(null);
    fetchData();
  }

  const filtered = media.filter(m => {
    if (filter === "photos") return m.type === "PHOTO";
    if (filter === "videos") return m.type === "VIDEO";
    if (filter === "instagram") return !m.instagramPosted;
    return true;
  });

  const stats = {
    total: media.length,
    photos: media.filter(m => m.type === "PHOTO").length,
    videos: media.filter(m => m.type === "VIDEO").length,
    posted: media.filter(m => m.instagramPosted).length,
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-dj-muted" /></div>;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="page-header flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Image className="w-5 h-5 text-dj-primary" /> Post-Event Media
          </h1>
          <p className="page-subtitle">Upload, organize, and post to Instagram</p>
        </div>
        <div className="flex gap-2">
          <label className={`btn-secondary text-sm cursor-pointer flex items-center gap-2 ${uploading ? "opacity-50" : ""}`}>
            <Upload className="w-4 h-4" />
            {uploading ? "Uploading..." : "Upload Files"}
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              className="hidden"
              onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
              disabled={uploading}
            />
          </label>
          <button onClick={() => setShowUploadForm(true)} className="btn-primary text-sm flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add by URL
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: "Total", value: stats.total, icon: Image },
          { label: "Photos", value: stats.photos, icon: Image },
          { label: "Videos", value: stats.videos, icon: Video },
          { label: "Posted", value: stats.posted, icon: Instagram },
        ].map(s => (
          <div key={s.label} className="card p-3 text-center">
            <div className="text-xl font-bold text-white">{s.value}</div>
            <div className="text-xs text-dj-muted">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-5">
        {(["all", "photos", "videos", "instagram"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-all capitalize ${
              filter === f ? "bg-dj-primary/15 text-dj-primary-light border-dj-primary/30" : "border-dj-border text-dj-muted hover:border-dj-border/80"
            }`}>
            {f === "instagram" ? "Not Posted" : f}
          </button>
        ))}
      </div>

      {/* Upload dropzone */}
      <label className="block w-full border-2 border-dashed border-dj-border/40 hover:border-dj-primary/30 rounded-xl p-6 text-center cursor-pointer mb-5 transition-all group">
        <Upload className="w-8 h-8 text-dj-muted group-hover:text-dj-primary-light mx-auto mb-2 transition-colors" />
        <p className="text-sm text-dj-muted group-hover:text-dj-text">
          Drag & drop photos/videos here, or click to browse
        </p>
        <input type="file" multiple accept="image/*,video/*" className="hidden"
          onChange={(e) => e.target.files && handleFileUpload(e.target.files)} />
      </label>

      {/* Media grid */}
      {filtered.length === 0 ? (
        <div className="card p-10 text-center">
          <Image className="w-10 h-10 text-dj-muted mx-auto mb-3" />
          <p className="text-dj-muted text-sm">No media uploaded yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filtered.map(item => (
            <div key={item.id} className="relative group aspect-square rounded-xl overflow-hidden bg-dj-800 cursor-pointer"
              onClick={() => { setSelectedItem(item); setInstagramCaption(item.instagramCaption ?? item.caption ?? ""); }}>
              {item.type === "VIDEO" ? (
                <div className="w-full h-full flex items-center justify-center bg-dj-700">
                  <Video className="w-8 h-8 text-dj-muted" />
                  <span className="absolute bottom-2 left-2 text-xs bg-dj-900/80 text-dj-muted px-1.5 rounded">VIDEO</span>
                </div>
              ) : (
                <img src={item.url} alt={item.caption ?? ""} className="w-full h-full object-cover" />
              )}

              {/* Status badges */}
              <div className="absolute top-2 right-2 flex flex-col gap-1">
                {item.featured && <Star className="w-4 h-4 text-dj-secondary fill-current" />}
                {item.instagramPosted && <CheckCircle2 className="w-4 h-4 text-pink-400" />}
              </div>

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Instagram className="w-6 h-6 text-white" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Media detail modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setSelectedItem(null)}>
          <div className="bg-dj-800 border border-dj-border rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-dj-border">
              <h3 className="font-semibold text-white">Media Details</h3>
              <button onClick={() => setSelectedItem(null)} className="text-dj-muted hover:text-dj-text">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* Preview */}
              <div className="bg-black flex items-center justify-center min-h-48">
                {selectedItem.type === "VIDEO" ? (
                  <video src={selectedItem.url} controls className="max-h-64 w-full" />
                ) : (
                  <img src={selectedItem.url} alt="" className="max-h-64 w-full object-contain" />
                )}
              </div>

              {/* Details */}
              <div className="p-4 space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-dj-muted">{selectedItem.type} · {formatDate(selectedItem.createdAt)}</span>
                    {selectedItem.instagramPosted && (
                      <span className="badge text-xs text-pink-400 bg-pink-400/10 border-pink-400/20">
                        <Instagram className="w-3 h-3" /> Posted
                      </span>
                    )}
                  </div>
                  {selectedItem.caption && (
                    <p className="text-sm text-dj-text">{selectedItem.caption}</p>
                  )}
                </div>

                {/* Instagram caption */}
                <div>
                  <label className="label flex items-center gap-1.5">
                    <Instagram className="w-3.5 h-3.5 text-pink-400" /> Instagram Caption
                  </label>
                  <textarea
                    value={instagramCaption}
                    onChange={e => setInstagramCaption(e.target.value)}
                    className="input-field text-sm resize-none"
                    rows={4}
                    placeholder="Write your Instagram caption..."
                  />
                  <button
                    onClick={() => { navigator.clipboard.writeText(instagramCaption); setCaptionCopied(true); setTimeout(() => setCaptionCopied(false), 2000); }}
                    className="text-xs flex items-center gap-1 text-dj-muted hover:text-dj-text mt-1">
                    {captionCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {captionCopied ? "Copied!" : "Copy caption"}
                  </button>
                </div>

                <div className="flex flex-col gap-2">
                  <button onClick={() => toggleFeatured(selectedItem)}
                    className={`btn-secondary text-sm flex items-center gap-2 ${selectedItem.featured ? "text-dj-secondary border-dj-secondary/30" : ""}`}>
                    <Star className={`w-4 h-4 ${selectedItem.featured ? "fill-current text-dj-secondary" : ""}`} />
                    {selectedItem.featured ? "Unfeature" : "Feature"}
                  </button>
                  <button onClick={() => markInstagramPosted(selectedItem)}
                    className={`text-sm flex items-center gap-2 justify-center px-4 py-2 rounded-lg border transition-all ${
                      selectedItem.instagramPosted
                        ? "bg-pink-500/10 text-pink-400 border-pink-500/20"
                        : "btn-secondary"
                    }`}>
                    <Instagram className="w-4 h-4" />
                    {selectedItem.instagramPosted ? "Mark as Not Posted" : "Mark as Posted on Instagram"}
                  </button>
                  <button onClick={() => deleteMedia(selectedItem.id)} className="btn-danger text-sm flex items-center gap-2">
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add by URL modal */}
      {showUploadForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-dj-800 border border-dj-border rounded-xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-white">Add Media</h3>
              <button onClick={() => setShowUploadForm(false)} className="text-dj-muted hover:text-dj-text"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="label">Upload File</label>
                <input type="file" accept="image/*,video/*" onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                  className="input-field py-1.5 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-dj-primary file:text-white" />
              </div>
              <div>
                <label className="label">Or Image/Video URL</label>
                <input type="url" value={uploadForm.url} onChange={(e) => setUploadForm(f => ({ ...f, url: e.target.value }))}
                  className="input-field" placeholder="https://..." />
              </div>
              <div>
                <label className="label">Type</label>
                <select value={uploadForm.type} onChange={(e) => setUploadForm(f => ({ ...f, type: e.target.value }))} className="input-field">
                  <option value="PHOTO">Photo</option>
                  <option value="VIDEO">Video</option>
                </select>
              </div>
              <div>
                <label className="label">Caption</label>
                <input type="text" value={uploadForm.caption} onChange={(e) => setUploadForm(f => ({ ...f, caption: e.target.value }))}
                  className="input-field" placeholder="Optional caption" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowUploadForm(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={addByUrl} disabled={uploading} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
