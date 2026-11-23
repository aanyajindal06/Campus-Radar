"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Search, MapPin, Award, Bell, PlusCircle, ShieldCheck, UserCheck, CheckCheck, LogOut, ChevronDown, Sparkles, QrCode } from "lucide-react";
import { useAuth } from "../lib/authContext";
import { api } from "../lib/api";

const ROLES = [
  ["student", "Student"],
  ["staff", "Staff"],
  ["admin", "Admin"],
] as const;

export default function Navbar() {
  const pathname = usePathname();
  const { user, notifications, unreadCount, logout, demoLogin, refreshNotifications } = useAuth();
  const [menu, setMenu] = useState<"" | "notifs" | "user">("");
  const toggle = (m: "notifs" | "user") => setMenu(menu === m ? "" : m);

  const links = [
    { href: "/search", label: "Browse & Search", icon: Search, show: true },
    { href: "/map", label: "Campus Map", icon: MapPin, show: true },
    { href: "/leaderboard", label: "Rewards", icon: Award, show: true },
    { href: "/dashboard", label: "My Activity", show: !!user },
    { href: "/staff", label: "Staff Desk", icon: QrCode, show: user?.role === "staff" || user?.role === "admin" },
    { href: "/admin", label: "Admin", icon: ShieldCheck, show: user?.role === "admin" },
  ];

  return (
    <header className="sticky top-0 z-50 px-3 pt-3">
      <div className="max-w-7xl mx-auto glass rounded-full bg-black/40 px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-full glow-btn flex items-center justify-center group-hover:scale-105 transition-transform">
                <Compass className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-semibold tracking-tight text-white leading-none">CampusRadar</span>
                <span className="text-[9px] font-semibold text-slate-500 tracking-wider uppercase truncate max-w-[200px] sm:max-w-none">
                  ABES Engineering College, Ghaziabad
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {links.filter((l) => l.show).map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors flex items-center gap-1.5 ${
                    pathname === href ? "bg-blue-500/20 text-blue-300 font-semibold" : "text-slate-600 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {Icon && <Icon className="w-4 h-4 text-blue-400" />}
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <Link href="/report-lost" className="ghost-btn inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold">
                <PlusCircle className="w-3.5 h-3.5" /> Lost Item
              </Link>
              <Link href="/report-found" className="glow-btn inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" /> Found Item (+10pts)
              </Link>
            </div>

            <div className="relative">
              <button onClick={() => toggle("notifs")} className="relative p-2 text-slate-600 hover:text-white hover:bg-white/10 rounded-full transition-colors focus:outline-hidden" aria-label="Notifications">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {menu === "notifs" && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl bg-[#1d110a] shadow-xl z-50 overflow-hidden border border-slate-200">
                  <div className="p-3 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-slate-800">Notifications</span>
                      {unreadCount > 0 && <span className="text-[10px] bg-blue-500/20 text-blue-300 font-bold px-1.5 py-0.5 rounded-full">{unreadCount} new</span>}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={async () => {
                          await api.markAllNotificationsRead();
                          refreshNotifications();
                        }}
                        className="text-[11px] font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1"
                      >
                        <CheckCheck className="w-3 h-3" /> Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-200">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-500">No notifications yet. You'll be alerted when an AI match or claim update occurs.</div>
                    ) : (
                      notifications.slice(0, 10).map((n) => (
                        <div key={n.id} className={`p-3 text-xs transition-colors hover:bg-white/5 ${!n.is_read ? "bg-blue-500/10" : ""}`}>
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-semibold text-slate-800">{n.title}</span>
                            <span className="text-[10px] text-slate-400 shrink-0">{new Date(n.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                          </div>
                          <p className="text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                          {n.link && (
                            <Link href={n.link} onClick={() => setMenu("")} className="inline-block mt-1.5 font-medium text-blue-400 hover:underline text-[11px]">
                              View details &rarr;
                            </Link>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {user ? (
              <div className="relative">
                <button onClick={() => toggle("user")} className="flex items-center gap-2 p-1 pl-2 pr-3 rounded-full hover:bg-white/10 transition-colors border border-slate-200">
                  <div className="w-7 h-7 rounded-full glow-btn flex items-center justify-center font-bold text-xs uppercase overflow-hidden">
                    {user.avatar_url ? <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" /> : user.full_name[0]}
                  </div>
                  <div className="flex flex-col text-left hidden sm:block">
                    <span className="text-xs font-semibold text-slate-800 leading-tight">{user.full_name.split(" ")[0]}</span>
                    <span className="text-[10px] text-blue-300 font-semibold -mt-0.5 capitalize">🪙 {user.total_points} pts</span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {menu === "user" && (
                  <div className="absolute right-0 mt-3 w-72 rounded-2xl bg-[#1d110a] shadow-xl z-50 overflow-hidden border border-slate-200 p-2">
                    <div className="px-3 py-2 bg-white/5 rounded-xl mb-2">
                      <p className="text-xs font-bold text-slate-800">{user.full_name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-500/20 text-blue-300">{user.role}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">{user.badge_tier} Tier</span>
                      </div>
                    </div>

                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase text-slate-400 tracking-wider">Switch Demo Role</div>
                    <div className="grid grid-cols-3 gap-1 mb-2">
                      {ROLES.map(([role, label]) => (
                        <button
                          key={role}
                          onClick={() => {
                            demoLogin(role);
                            setMenu("");
                          }}
                          className={`px-2 py-1.5 rounded-lg text-xs text-center transition-colors ${user.role === role ? "glow-btn font-bold" : "bg-white/5 text-slate-700 hover:bg-white/10 font-medium"}`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>

                    <div className="border-t border-slate-200 pt-1">
                      <Link href="/dashboard" onClick={() => setMenu("")} className="flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-white/5 rounded-lg">
                        <UserCheck className="w-3.5 h-3.5 text-blue-400" /> My Reports & Claims
                      </Link>
                      <button
                        onClick={() => {
                          logout();
                          setMenu("");
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-700 hover:bg-rose-50 rounded-lg text-left"
                      >
                        <LogOut className="w-3.5 h-3.5" /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className="glow-btn px-4 py-2 rounded-full text-xs font-semibold">Sign In</Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
