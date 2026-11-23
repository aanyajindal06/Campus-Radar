"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import CampusMap from "../components/CampusMap";
import { Search, Camera, PlusCircle, Sparkles, Clock, MapPin, ArrowRight } from "lucide-react";
import { api } from "../lib/api";
import { Item, Location } from "../lib/types";

const CATEGORIES = [
  ["Electronics", "💻"],
  ["Wallets & Cards", "💳"],
  ["Keys", "🔑"],
  ["Accessories", "🎒"],
  ["Books & Notes", "📚"],
  ["Clothing", "🧥"],
];
const COUNTS = [42, 28, 19, 31, 15, 12];
const STEPS = [
  ["Report Belonging", "Provide photos, attributes, and last-seen building. Finders document private identifying marks for fraud protection."],
  ["AI Hybrid Match", "5-Pillar AI analyzes image vectors, descriptions, specs, and GPS proximity to instantly notify matching owners."],
  ["Staff Verification", "Submit private identifying evidence (stickers, serials, password unlock). Security verifies proof before handover."],
  ["QR Return & Rewards", "Staff scans item QR code to finalize return. Finder earns +50 reward points on the campus leaderboard!"],
];
const STATUS_STYLE: Record<string, string> = {
  returned: "bg-emerald-50 text-emerald-800 border-emerald-300",
  stored: "bg-blue-50 text-blue-800 border-blue-300",
};
const FALLBACK_IMG = "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&auto=format&fit=crop&q=80";
const WRAP = "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8";
const PILL = "inline-block text-[11px] text-blue-300 border border-blue-400/30 bg-blue-500/10 px-3 py-0.5 rounded-full uppercase tracking-wider";

const Heading = ({ pill, title, text }: { pill: string; title: string; text?: string }) => (
  <div className="text-center max-w-2xl mx-auto mb-10">
    <span className={PILL}>{pill}</span>
    <h2 className="thin-title text-3xl sm:text-4xl text-white mt-3">{title}</h2>
    {text && <p className="text-xs sm:text-sm text-slate-500 mt-2">{text}</p>}
  </div>
);

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [recentItems, setRecentItems] = useState<Item[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [stats, setStats] = useState({ totalReports: 142, recoveredCount: 98, activeMatches: 34, successRate: 89 });

  useEffect(() => {
    api.getItems({ limit: "6" }).then(setRecentItems).catch(() => {});
    api.getLocations().then(setLocations).catch(() => {});
    api
      .getAdminStats()
      .then((s) =>
        setStats({
          totalReports: s.total_lost_reports + s.total_found_reports,
          recoveredCount: s.successful_recoveries,
          activeMatches: s.active_reports,
          successRate: Math.round(s.recovery_rate) || 88,
        })
      )
      .catch(() => {});
  }, []);

  const handleTextSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  };

  const metrics = [
    [`${stats.totalReports}+`, "Reports Processed", "text-white"],
    [stats.recoveredCount, "Belongings Recovered", "text-blue-300"],
    [`${stats.successRate}%`, "Recovery Success Rate", "text-sky-300"],
    ["5-Pillar AI", "Hybrid Matching", "text-blue-200"],
  ];

  return (
    <div className="min-h-screen flex flex-col text-slate-900">
      <Navbar />

      <section className="hero-glow relative overflow-hidden rounded-[2rem] mx-3 mt-3 text-white pt-20 pb-40 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass text-blue-200 text-xs font-medium mb-6 animate-subtle">
            <Sparkles className="w-4 h-4 text-sky-300" />
            <span>ABES Engineering College, Ghaziabad • AI Lost & Found Recovery</span>
          </div>

          <h1 className="thin-title text-4xl sm:text-5xl lg:text-6xl leading-tight">
            Lost something at ABES EC? <br />
            <span className="bg-gradient-to-r from-blue-300 via-blue-400 to-sky-300 bg-clip-text text-transparent">Let&apos;s help you find it.</span>
          </h1>

          <p className="mt-5 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            CampusRadar connects students and staff across Ramanujan Block, Aryabhatta Block, Library, Black Stone, and Hostels with visual AI image matching and QR security lockers.
          </p>

          <div className="mt-8 max-w-3xl mx-auto glass p-2 sm:p-2.5 rounded-full">
            <form onSubmit={handleTextSearch} className="flex flex-col sm:flex-row items-center gap-2">
              <div className="flex items-center gap-2 flex-1 px-4 w-full">
                <Search className="w-5 h-5 text-blue-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search by item name, model, color, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full py-2.5 text-xs sm:text-sm bg-transparent! border-0 outline-hidden font-medium"
                />
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => router.push("/search?mode=image")}
                  className="ghost-btn px-4 py-2.5 rounded-full text-xs font-semibold flex items-center gap-1.5 shrink-0"
                  title="Upload photo to search using AI image matching"
                >
                  <Camera className="w-4 h-4 text-blue-400" />
                  <span className="hidden sm:inline">Image Search</span>
                </button>
                <button type="submit" className="glow-btn px-6 py-2.5 rounded-full text-xs sm:text-sm font-semibold shrink-0">Search</button>
              </div>
            </form>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link href="/report-lost" className="glow-btn px-6 py-3 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-2 group">
              <PlusCircle className="w-4 h-4 group-hover:rotate-90 transition-transform" /> Report Lost Item
            </Link>
            <Link href="/report-found" className="ghost-btn px-6 py-3 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-300" /> Report Found Item (+10 pts)
            </Link>
          </div>
        </div>

        <div className="max-w-6xl mx-auto mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 px-2 relative z-10">
          {metrics.map(([value, label, color]) => (
            <div key={label} className="glass p-4 rounded-2xl text-center">
              <p className={`text-2xl sm:text-3xl font-light ${color}`}>{value}</p>
              <p className="text-xs text-blue-200/80 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-14">
        <div className={WRAP}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="thin-title text-2xl sm:text-3xl text-white">Explore by Category</h2>
              <p className="text-xs text-slate-500 mt-1">Quickly browse belongings reported across campus</p>
            </div>
            <Link href="/search" className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1">
              All Categories <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {CATEGORIES.map(([name, icon], i) => (
              <Link
                key={name}
                href={`/search?category=${encodeURIComponent(name)}`}
                className="glass p-4 rounded-2xl hover:border-blue-400/60 hover:shadow-[0_0_24px_rgb(59_130_246/.25)] transition-all text-center group"
              >
                <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">{icon}</div>
                <h3 className="text-xs font-semibold text-slate-800 group-hover:text-blue-300">{name}</h3>
                <span className="text-[10px] text-slate-400 mt-1 block">{COUNTS[i]} items</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14">
        <div className={WRAP}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <div className={`${PILL} mb-1`}>
                <Clock className="w-3 h-3 inline mr-1" /> Campus Feed
              </div>
              <h2 className="thin-title text-2xl sm:text-3xl text-white">Recently Reported Belongings</h2>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/search?type=found" className="ghost-btn px-4 py-2 rounded-full text-xs font-semibold">Found Items</Link>
              <Link href="/search?type=lost" className="ghost-btn px-4 py-2 rounded-full text-xs font-semibold">Lost Reports</Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentItems.slice(0, 6).map((item) => {
              const isFound = item.type === "found";
              return (
                <div key={item.id} className="glass rounded-3xl overflow-hidden hover:shadow-[0_0_30px_rgb(59_130_246/.25)] transition-all duration-300 flex flex-col group">
                  <div className="relative h-48 bg-slate-100 overflow-hidden">
                    <img src={item.images?.[0]?.file_url || FALLBACK_IMG} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider text-white ${isFound ? "bg-emerald-600" : "bg-rose-600"}`}>
                        {isFound ? "Found" : "Lost"}
                      </span>
                      <span className="px-2 py-1 rounded-full text-[10px] font-semibold bg-black/60 backdrop-blur-xs text-white">{item.category}</span>
                    </div>
                    <div className="absolute bottom-3 right-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border backdrop-blur-md ${STATUS_STYLE[item.status] || "bg-amber-50 text-amber-800 border-sky-300"}`}>
                        {item.status.replace("_", " ").toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium mb-1">
                        <span>{item.tracking_code}</span>
                        <span>{item.date_event}</span>
                      </div>
                      <h3 className="font-semibold text-white text-sm group-hover:text-blue-300 transition-colors line-clamp-1">{item.name}</h3>
                      <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">{item.description}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium truncate max-w-[200px]">
                        <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span className="truncate">{item.location?.name || "Campus Ground"}</span>
                      </div>
                      <Link href={`/items/${item.id}`} className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 shrink-0">
                        Details <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-10 text-center">
            <Link href="/search" className="ghost-btn inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-xs">
              Browse All Active Listings ({stats.totalReports}) <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-14">
        <div className={WRAP}>
          <Heading
            pill="ABES EC Geospatial Campus Directory"
            title="ABES Engineering College Campus Map"
            text="Navigate Ramanujan, Aryabhatta, Bhabha, Kalpana Chawla, Black Stone, Temple, and Hostels to locate reported items."
          />
          <CampusMap locations={locations} items={recentItems} height="520px" />
        </div>
      </section>

      <section className="py-16">
        <div className={WRAP}>
          <Heading pill="Simple 4-Step Process" title="How CampusRadar Works" text="From loss to recovery with artificial intelligence, QR tracking, and secure staff handovers." />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {STEPS.map(([title, text], i) => (
              <div key={title} className="glass p-6 rounded-3xl text-center">
                <div className="w-12 h-12 glow-btn rounded-full flex items-center justify-center font-semibold text-lg mx-auto mb-4">{i + 1}</div>
                <h3 className="font-semibold text-white text-sm">{title}</h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
