"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  Music2,
  LayoutDashboard,
  Calendar,
  Plus,
  LogOut,
  User,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { getInitials } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/events", label: "My Events", icon: Calendar },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const user = session?.user as
    | { name?: string; email?: string; image?: string; role?: string }
    | undefined;

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-dj-border/50">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 group"
          onClick={() => setMobileOpen(false)}
        >
          <div className="w-8 h-8 rounded-lg bg-dj-primary flex items-center justify-center flex-shrink-0">
            <Music2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-white text-sm leading-none block">
              DJ Event Hub
            </span>
            <span className="text-dj-muted text-xs">Event Management</span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={active ? "nav-link-active" : "nav-link-inactive"}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}

        <div className="pt-3 mt-3 border-t border-dj-border/50">
          <Link
            href="/events/new"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-dj-secondary hover:text-dj-secondary/80 hover:bg-dj-secondary/5 transition-all duration-150"
          >
            <Plus className="w-4 h-4 flex-shrink-0" />
            New Event
          </Link>
        </div>
      </nav>

      {/* User menu */}
      <div className="border-t border-dj-border/50 p-3">
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-dj-700/50 transition-colors"
          >
            <div className="avatar w-8 h-8 bg-dj-primary/20 text-dj-primary-light text-xs flex-shrink-0">
              {user?.name ? getInitials(user.name) : <User className="w-4 h-4" />}
            </div>
            <div className="flex-1 text-left min-w-0">
              <div className="text-sm font-medium text-dj-text truncate">
                {user?.name || "User"}
              </div>
              <div className="text-xs text-dj-muted truncate">{user?.email}</div>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-dj-muted flex-shrink-0 transition-transform ${userMenuOpen ? "rotate-180" : ""}`}
            />
          </button>

          {userMenuOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-1 bg-dj-800 border border-dj-border rounded-lg overflow-hidden shadow-xl z-50">
              <Link
                href="/profile"
                onClick={() => {
                  setUserMenuOpen(false);
                  setMobileOpen(false);
                }}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-dj-text hover:bg-dj-700 transition-colors"
              >
                <User className="w-4 h-4" />
                Profile
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors border-t border-dj-border/50"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden flex items-center justify-between px-4 h-14 bg-dj-900 border-b border-dj-border fixed top-0 left-0 right-0 z-40">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-dj-primary flex items-center justify-center">
            <Music2 className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white text-sm">DJ Event Hub</span>
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 text-dj-muted hover:text-dj-text"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-30 top-14"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div
        className={`lg:hidden fixed top-14 left-0 bottom-0 w-72 bg-dj-900 border-r border-dj-border z-40 transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-dj-900 border-r border-dj-border fixed top-0 bottom-0 left-0 z-30">
        {sidebarContent}
      </aside>
    </>
  );
}
