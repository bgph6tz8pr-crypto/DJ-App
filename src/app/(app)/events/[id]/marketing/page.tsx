"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  Plus,
  Loader2,
  Upload,
  Image,
  Instagram,
  Facebook,
  Twitter,
  X,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  Megaphone,
} from "lucide-react";

interface FlyerAsset {
  id: string;
  name: string;
  url: string;
  type: string;
  description?: string | null;
  createdAt: string;
}

interface MarketingPost {
  id: string;
  platform: string;
  content: string;
  imageUrl?: string | null;
  hashtags?: string | null;
  status: string;
  notes?: string | null;
  createdAt: string;
}

interface EventBasic {
  id: string;
  name: string;
  tagline?: string | null;
  description?: string | null;
  startDate: string;
  venue?: string | null;
  city?: string | null;
  ticketUrl?: string | null;
  genres: { genre: string }[];
  djs: { name: string; instagramHandle?: string | null }[];
}

const ASSET_TYPES = ["DJ_PHOTO", "DJ_LOGO", "VENUE_PHOTO", "BACKGROUND", "OTHER"];
const PLATFORMS = ["INSTAGRAM", "FACEBOOK", "TWITTER", "TIKTOK"];

const PlatformIcon = ({ platform }: { platform: string }) => {
  if (platform === "INSTAGRAM") return <Instagram className="w-4 h-4" />;
  if (platform === "FACEBOOK") return <Facebook className="w-4 h-4" />;
  if (platform === "TWITTER") return <Twitter className="w-4 h-4" />;
  return <Megaphone className="w-4 h-4" />;
};

const platformColors: Record<string, string> = {
  INSTAGRAM: "text-pink-400 bg-pink-400/10 border-pink-400/20",
  FACEBOOK: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  TWITTER: "text-sky-400 bg-sky-400/10 border-sky-400/20",
  TIKTOK: "text-white bg-white/10 border-white/20",
};

export default function MarketingPage() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<"assets" | "posts">("assets");
  const [assets, setAssets] = useState<FlyerAsset[]>([]);
  const [posts, setPosts] = useState<MarketingPost[]>([]);
  const [event, setEvent] = useState<EventBasic | null>(null);
  const [loading, setLoading] = useState(true);

  // Asset upload
  const [showAssetForm, setShowAssetForm] = useState(false);
  const [assetForm, setAssetForm] = useState({ name: "", url: "", type: "DJ_PHOTO", description: "" });
  const [assetUploading, setAssetUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  // Post form
  const [showPostForm, setShowPostForm] = useState(false);
  const [postForm, setPostForm] = useState({ platform: "INSTAGRAM", content: "", hashtags: "", imageUrl: "", notes: "", status: "DRAFT" });
  const [postLoading, setPostLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const [eventRes, assetsRes, postsRes] = await Promise.all([
      fetch(`/api/events/${id}`),
      fetch(`/api/events/${id}/flyer-assets`),
      fetch(`/api/events/${id}/marketing-posts`),
    ]);
    if (eventRes.ok) setEvent(await eventRes.json());
    if (assetsRes.ok) setAssets(await assetsRes.json());
    if (postsRes.ok) setPosts(await postsRes.json());
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleAssetUpload(file: File): Promise<string | null> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("eventId", id);
    formData.append("type", "asset");

    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (res.ok) {
      const data = await res.json();
      return data.url;
    }
    return null;
  }

  async function saveAsset() {
    if (!assetForm.name.trim()) return;
    setAssetUploading(true);
    try {
      let url = assetForm.url;
      if (uploadFile) {
        const uploaded = await handleAssetUpload(uploadFile);
        if (uploaded) url = uploaded;
      }
      if (!url) { alert("Please provide an image URL or upload a file."); return; }

      await fetch(`/api/events/${id}/flyer-assets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...assetForm, url }),
      });
      setShowAssetForm(false);
      setAssetForm({ name: "", url: "", type: "DJ_PHOTO", description: "" });
      setUploadFile(null);
      fetchData();
    } finally {
      setAssetUploading(false);
    }
  }

  async function deleteAsset(assetId: string) {
    await fetch(`/api/events/${id}/flyer-assets/${assetId}`, { method: "DELETE" });
    fetchData();
  }

  async function savePost() {
    if (!postForm.content.trim()) return;
    setPostLoading(true);
    try {
      await fetch(`/api/events/${id}/marketing-posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postForm),
      });
      setShowPostForm(false);
      setPostForm({ platform: "INSTAGRAM", content: "", hashtags: "", imageUrl: "", notes: "", status: "DRAFT" });
      fetchData();
    } finally {
      setPostLoading(false);
    }
  }

  async function updatePostStatus(postId: string, status: string) {
    await fetch(`/api/events/${id}/marketing-posts/${postId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
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

  function generatePostCaption() {
    if (!event) return "";
    const djNames = event.djs.map(d => d.name).join(", ");
    const djHandles = event.djs.filter(d => d.instagramHandle).map(d => d.instagramHandle).join(" ");
    const genres = event.genres.map(g => g.genre).join(", ");
    const date = new Date(event.startDate).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

    return `${event.name}\n${event.tagline ? event.tagline + "\n" : ""}\n${date} — ${event.venue ?? ""}${event.city ? `, ${event.city}` : ""}\n\nFeaturing: ${djNames || "TBA"}\n${genres ? `Music: ${genres}\n` : ""}${event.ticketUrl ? `\n🎟 Tickets: ${event.ticketUrl}` : ""}\n\n${djHandles}`;
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-dj-muted" /></div>;
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-dj-primary" /> Marketing
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-dj-border mb-6">
        {(["assets", "posts"] as const).map((t) => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-all -mb-px ${activeTab === t ? "border-dj-primary text-dj-primary-light" : "border-transparent text-dj-muted hover:text-dj-text"}`}>
            {t === "assets" ? "Flyer Assets" : "Social Posts"}
          </button>
        ))}
      </div>

      {/* Flyer Assets */}
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
              <p className="text-dj-muted text-sm mb-4">No flyer assets yet. Upload DJ photos and logos for your flyer designer.</p>
              <button onClick={() => setShowAssetForm(true)} className="btn-primary text-sm">Add first asset</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {assets.map((asset) => (
                <div key={asset.id} className="card overflow-hidden group">
                  <div className="aspect-square bg-dj-700 relative">
                    <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
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
                      {asset.type.replace("_", " ")}
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
                <Upload className="w-8 h-8 mb-1" />
                <span className="text-xs">Add Asset</span>
              </button>
            </div>
          )}

          {/* Asset form modal */}
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
                    <input type="text" value={assetForm.name} onChange={(e) => setAssetForm(f => ({ ...f, name: e.target.value }))} className="input-field" placeholder="DJ Nexus - Press Photo" />
                  </div>
                  <div>
                    <label className="label">Type</label>
                    <select value={assetForm.type} onChange={(e) => setAssetForm(f => ({ ...f, type: e.target.value }))} className="input-field">
                      {ASSET_TYPES.map(t => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Upload File</label>
                    <input type="file" accept="image/*" onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                      className="input-field py-1.5 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-dj-primary file:text-white" />
                  </div>
                  <div>
                    <label className="label">Or Image URL</label>
                    <input type="url" value={assetForm.url} onChange={(e) => setAssetForm(f => ({ ...f, url: e.target.value }))} className="input-field" placeholder="https://..." />
                  </div>
                  <div>
                    <label className="label">Description</label>
                    <input type="text" value={assetForm.description} onChange={(e) => setAssetForm(f => ({ ...f, description: e.target.value }))} className="input-field" placeholder="e.g. High-res press photo for flyers" />
                  </div>
                </div>
                <div className="flex gap-3 mt-5">
                  <button onClick={() => setShowAssetForm(false)} className="btn-secondary flex-1">Cancel</button>
                  <button onClick={saveAsset} disabled={assetUploading} className="btn-primary flex-1 flex items-center justify-center gap-2">
                    {assetUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    Upload
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Social Posts */}
      {activeTab === "posts" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="section-title">Social Media Posts</h2>
              <p className="text-xs text-dj-muted mt-0.5">Draft and track posts across platforms</p>
            </div>
            <button onClick={() => setShowPostForm(true)} className="btn-primary text-sm flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> New Post
            </button>
          </div>

          {/* Caption generator */}
          {event && (
            <div className="card p-4 mb-5 border-dj-primary/20">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-dj-primary-light">Auto-Generated Caption</h3>
                <button onClick={() => copyToClipboard(generatePostCaption(), "caption")}
                  className="text-xs flex items-center gap-1.5 text-dj-muted hover:text-dj-text">
                  {copied === "caption" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied === "caption" ? "Copied!" : "Copy"}
                </button>
              </div>
              <pre className="text-xs text-dj-muted whitespace-pre-wrap font-mono bg-dj-900 p-3 rounded-lg leading-relaxed">
                {generatePostCaption()}
              </pre>
            </div>
          )}

          {posts.length === 0 ? (
            <div className="card p-10 text-center">
              <Instagram className="w-10 h-10 text-dj-muted mx-auto mb-3" />
              <p className="text-dj-muted text-sm mb-4">No social posts drafted yet.</p>
              <button onClick={() => setShowPostForm(true)} className="btn-primary text-sm">Create first post</button>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => (
                <div key={post.id} className="card p-4">
                  <div className="flex items-start gap-3">
                    <div className={`badge flex-shrink-0 mt-0.5 ${platformColors[post.platform] ?? "text-dj-muted bg-dj-700 border-dj-border"}`}>
                      <PlatformIcon platform={post.platform} />
                      {post.platform}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-dj-text">{post.content}</p>
                      {post.hashtags && (
                        <p className="text-xs text-dj-primary-light mt-1">{post.hashtags}</p>
                      )}
                      {post.notes && (
                        <p className="text-xs text-dj-muted mt-1 italic">{post.notes}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <span className={`badge text-xs ${
                        post.status === "POSTED" ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" :
                        post.status === "READY" ? "text-blue-400 bg-blue-400/10 border-blue-400/20" :
                        "text-dj-muted bg-dj-700 border-dj-border"}`}>
                        {post.status}
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

          {/* Post form modal */}
          {showPostForm && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
              <div className="bg-dj-800 border border-dj-border rounded-xl w-full max-w-lg p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-semibold text-white">New Social Post</h3>
                  <button onClick={() => setShowPostForm(false)} className="text-dj-muted hover:text-dj-text"><X className="w-5 h-5" /></button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="label">Platform</label>
                    <div className="flex gap-2">
                      {PLATFORMS.map(p => (
                        <button key={p} type="button" onClick={() => setPostForm(f => ({ ...f, platform: p }))}
                          className={`flex-1 py-2 text-xs rounded-lg border transition-all ${postForm.platform === p ? platformColors[p] + " border-current" : "border-dj-border text-dj-muted hover:border-dj-border/80"}`}>
                          <PlatformIcon platform={p} />
                          <span className="block mt-0.5">{p}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="label">Caption / Content *</label>
                    <textarea value={postForm.content} onChange={(e) => setPostForm(f => ({ ...f, content: e.target.value }))} className="input-field" rows={5} placeholder="Write your post..." />
                  </div>
                  <div>
                    <label className="label">Hashtags</label>
                    <input type="text" value={postForm.hashtags} onChange={(e) => setPostForm(f => ({ ...f, hashtags: e.target.value }))} className="input-field" placeholder="#housemusic #techno #underground" />
                  </div>
                  <div>
                    <label className="label">Image URL</label>
                    <input type="url" value={postForm.imageUrl} onChange={(e) => setPostForm(f => ({ ...f, imageUrl: e.target.value }))} className="input-field" placeholder="Link to flyer or image" />
                  </div>
                  <div>
                    <label className="label">Notes</label>
                    <input type="text" value={postForm.notes} onChange={(e) => setPostForm(f => ({ ...f, notes: e.target.value }))} className="input-field" placeholder="Post at 6 PM on Friday..." />
                  </div>
                  <div>
                    <label className="label">Status</label>
                    <select value={postForm.status} onChange={(e) => setPostForm(f => ({ ...f, status: e.target.value }))} className="input-field">
                      <option value="DRAFT">Draft</option>
                      <option value="READY">Ready to Post</option>
                      <option value="POSTED">Already Posted</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 mt-5">
                  <button onClick={() => setShowPostForm(false)} className="btn-secondary flex-1">Cancel</button>
                  <button onClick={savePost} disabled={postLoading} className="btn-primary flex-1 flex items-center justify-center gap-2">
                    {postLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Post"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
