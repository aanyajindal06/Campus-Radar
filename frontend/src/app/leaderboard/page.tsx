"use client";

import React, { useState, useEffect } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { Award, Trophy, Sparkles, CheckCircle2, ShieldCheck, Heart, ArrowRight } from "lucide-react";
import { api } from "../../lib/api";
import { LeaderboardUser } from "../../lib/types";
import { useAuth } from "../../lib/authContext";
import Link from "next/link";

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getLeaderboard().then(setLeaderboard).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const pointRules = [
    { title: "Report a Found Item", points: "+10 Points", desc: "Submit a found belonging with clear photos and confidential marks." },
    { title: "Verified Safe Return", points: "+50 Points", desc: "Awarded automatically once security confirms owner handover." },
    { title: "Help Verify an AI Match", points: "+10 Points", desc: "Assist peers in confirming location or item identification." },
    { title: "Report Duplicate or Spam", points: "+5 Points", desc: "Help keep the campus lost & found directory accurate and safe." },
  ];

  const tiers = [
    { name: "Bronze Contributor", range: "0 - 49 pts", badge: "🥉", color: "border-amber-200 bg-amber-50/50" },
    { name: "Silver Guardian", range: "50 - 149 pts", badge: "🥈", color: "border-slate-300 bg-slate-50" },
    { name: "Gold Campus Hero", range: "150+ pts", badge: "🥇", color: "border-yellow-300 bg-yellow-50/60" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wider mb-2">
            <Trophy className="w-3.5 h-3.5 text-amber-600" />
            Campus Good Samaritan League
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900">
            Reward Points & Leaderboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
            Every found report and verified return earns points. Climb the monthly leaderboard, unlock badge tiers, and foster a safer university community.
          </p>
        </div>

        {leaderboard.length >= 3 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12 items-end">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 text-center shadow-xs order-2 md:order-1 relative">
              <div className="w-10 h-10 bg-slate-100 text-slate-700 font-black rounded-full flex items-center justify-center mx-auto text-sm border-2 border-slate-300 mb-3">
                🥈 2
              </div>
              <div className="w-16 h-16 rounded-full mx-auto mb-3 overflow-hidden border-2 border-slate-200">
                <img src={leaderboard[1].avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"} alt={leaderboard[1].full_name} className="w-full h-full object-cover" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">{leaderboard[1].full_name}</h3>
              <p className="text-[11px] text-slate-400">{leaderboard[1].department}</p>
              <div className="mt-3 py-1.5 px-3 bg-slate-100 rounded-xl inline-block font-black text-sm text-slate-800">
                🪙 {leaderboard[1].total_points} pts
              </div>
            </div>

            <div className="bg-gradient-to-b from-yellow-50 to-white p-8 rounded-3xl border-2 border-yellow-300 text-center shadow-lg order-1 md:order-2 relative -translate-y-2">
              <div className="w-12 h-12 bg-amber-400 text-white font-black rounded-full flex items-center justify-center mx-auto text-lg shadow-md mb-3">
                🥇 1
              </div>
              <div className="w-20 h-20 rounded-full mx-auto mb-3 overflow-hidden border-4 border-amber-300 shadow-md">
                <img src={leaderboard[0].avatar_url || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80"} alt={leaderboard[0].full_name} className="w-full h-full object-cover" />
              </div>
              <h3 className="font-black text-slate-900 text-base">{leaderboard[0].full_name}</h3>
              <p className="text-xs text-amber-700 font-bold">{leaderboard[0].department}</p>
              <div className="mt-3 py-2 px-4 bg-amber-400 text-slate-950 rounded-xl inline-block font-black text-base shadow-xs">
                🪙 {leaderboard[0].total_points} pts • Gold Hero
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 text-center shadow-xs order-3 relative">
              <div className="w-10 h-10 bg-amber-100 text-amber-800 font-black rounded-full flex items-center justify-center mx-auto text-sm border-2 border-amber-300 mb-3">
                🥉 3
              </div>
              <div className="w-16 h-16 rounded-full mx-auto mb-3 overflow-hidden border-2 border-slate-200">
                <img src={leaderboard[2]?.avatar_url || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"} alt={leaderboard[2]?.full_name} className="w-full h-full object-cover" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">{leaderboard[2]?.full_name}</h3>
              <p className="text-[11px] text-slate-400">{leaderboard[2]?.department}</p>
              <div className="mt-3 py-1.5 px-3 bg-slate-100 rounded-xl inline-block font-black text-sm text-slate-800">
                🪙 {leaderboard[2]?.total_points} pts
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              Full Campus Standings
            </h2>

            <div className="divide-y divide-slate-100">
              {leaderboard.map((u, idx) => (
                <div key={u.id} className="py-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-center text-xs font-black text-slate-400">
                      #{idx + 1}
                    </span>
                    <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                      <img src={u.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"} alt={u.full_name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{u.full_name}</h4>
                      <span className="text-[10px] text-slate-400">{u.department}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-right">
                    <div>
                      <span className="text-xs font-black text-slate-900 block">
                        🪙 {u.total_points}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {u.recovered_count} returned
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      u.badge_tier === "Gold"
                        ? "bg-yellow-100 text-yellow-800"
                        : u.badge_tier === "Silver"
                        ? "bg-slate-200 text-slate-800"
                        : "bg-amber-100 text-amber-800"
                    }`}>
                      {u.badge_tier}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                How to Earn Points
              </h3>
              <div className="space-y-2.5">
                {pointRules.map((r, i) => (
                  <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start justify-between gap-3 text-xs">
                    <div>
                      <strong className="text-slate-800 block">{r.title}</strong>
                      <span className="text-[11px] text-slate-500">{r.desc}</span>
                    </div>
                    <span className="text-xs font-extrabold text-emerald-600 shrink-0 bg-emerald-50 px-2 py-0.5 rounded">
                      {r.points}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Achievement Levels
              </h3>
              <div className="space-y-2.5 text-xs">
                {tiers.map((t, idx) => (
                  <div key={idx} className={`p-3 rounded-xl border flex items-center justify-between ${t.color}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{t.badge}</span>
                      <div>
                        <strong className="text-slate-900 block">{t.name}</strong>
                        <span className="text-[10px] text-slate-500">{t.range}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-600 bg-white/80 px-2 py-0.5 rounded">
                      Tier {idx + 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
