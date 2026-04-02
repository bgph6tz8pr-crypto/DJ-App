import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Music2,
  Calendar,
  Users,
  Image,
  MessageSquare,
  Megaphone,
  CheckSquare,
  Clock,
  ArrowRight,
} from "lucide-react";

export default async function LandingPage() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/dashboard");

  const features = [
    {
      icon: Calendar,
      title: "Event Planning",
      desc: "Venue, lineup, schedule — everything in one place from day one.",
      color: "text-dj-primary-light",
      bg: "bg-dj-primary/10",
    },
    {
      icon: Megaphone,
      title: "Marketing Tools",
      desc: "Build flyers with DJ assets, draft social posts, track promotion.",
      color: "text-dj-accent",
      bg: "bg-dj-accent/10",
    },
    {
      icon: Users,
      title: "Team Collaboration",
      desc: "Organizers, DJs, photographers, marketers — all on one platform.",
      color: "text-dj-secondary",
      bg: "bg-dj-secondary/10",
    },
    {
      icon: MessageSquare,
      title: "Team Chat",
      desc: "Real-time messaging channels per event with announcement support.",
      color: "text-blue-400",
      bg: "bg-blue-400/10",
    },
    {
      icon: CheckSquare,
      title: "Task Management",
      desc: "Kanban board to keep every task on track and assigned.",
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
    },
    {
      icon: Clock,
      title: "Day-Of Management",
      desc: "Live timeline, schedule tracking, and crew coordination.",
      color: "text-pink-400",
      bg: "bg-pink-400/10",
    },
    {
      icon: Image,
      title: "Post-Event Media",
      desc: "Upload photos and videos, mark them for Instagram posting.",
      color: "text-amber-400",
      bg: "bg-amber-400/10",
    },
    {
      icon: Music2,
      title: "DJ Profiles",
      desc: "Manage DJ lineup, bios, photos, and set times for every show.",
      color: "text-purple-300",
      bg: "bg-purple-400/10",
    },
  ];

  return (
    <div className="min-h-screen bg-dj-950">
      {/* Nav */}
      <nav className="border-b border-dj-border/50 glass sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-dj-primary flex items-center justify-center">
              <Music2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-white">DJ Event Hub</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-ghost text-sm">
              Sign in
            </Link>
            <Link href="/register" className="btn-primary text-sm">
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 bg-dj-primary/10 border border-dj-primary/20 rounded-full px-4 py-1.5 text-sm text-dj-primary-light mb-8">
          <span className="w-2 h-2 rounded-full bg-dj-primary animate-pulse" />
          Now in beta — full event lifecycle management
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-tight mb-6">
          Run your events
          <br />
          <span className="gradient-text">like a pro.</span>
        </h1>
        <p className="text-xl text-dj-muted max-w-2xl mx-auto mb-10">
          The all-in-one platform for DJ event teams — plan the show, market it,
          coordinate on the night, and capture the aftermath.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/register"
            className="btn-primary text-base px-8 py-3 flex items-center gap-2 justify-center"
          >
            Start for free
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="btn-secondary text-base px-8 py-3 justify-center"
          >
            Sign in with demo account
          </Link>
        </div>
        <p className="text-xs text-dj-muted mt-4">
          Demo: organizer@demo.com / demo1234
        </p>
      </section>

      {/* Features grid */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-3">
            Everything your team needs
          </h2>
          <p className="text-dj-muted">
            Built for the entire crew — not just the organizer.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f) => (
            <div key={f.title} className="card p-5 hover:border-dj-border transition-colors">
              <div className={`w-10 h-10 rounded-xl ${f.bg} flex items-center justify-center mb-3`}>
                <f.icon className={`w-5 h-5 ${f.color}`} />
              </div>
              <h3 className="font-semibold text-white mb-1">{f.title}</h3>
              <p className="text-sm text-dj-muted leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-dj-border/50">
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to elevate your events?
          </h2>
          <p className="text-dj-muted mb-8">
            Join event organizers who use DJ Event Hub to put on better shows.
          </p>
          <Link
            href="/register"
            className="btn-primary text-base px-8 py-3 inline-flex items-center gap-2"
          >
            Create your account
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-dj-border/30 py-8 text-center text-dj-muted text-sm">
        <div className="flex items-center justify-center gap-2">
          <Music2 className="w-4 h-4 text-dj-primary" />
          <span>DJ Event Hub — Built for the underground</span>
        </div>
      </footer>
    </div>
  );
}
