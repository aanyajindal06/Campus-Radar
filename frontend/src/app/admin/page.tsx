"use client";

import React, { useState, useEffect } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import CampusMap from "../../components/CampusMap";
import {
  ShieldAlert,
  Users,
  Package,
  TrendingUp,
  Award,
  MapPin,
  BarChart3,
  Flame,
  CheckCircle2,
  Clock,
  Building2,
  Lock,
  ArrowUpRight
} from "lucide-react";
import { api, API_BASE } from "../../lib/api";
import { AdminStats, HeatmapPoint, User, Location } from "../../lib/types";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [heatmap, setHeatmap] = useState<HeatmapPoint[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [newLocName, setNewLocName] = useState("");
  const [newLocBuilding, setNewLocBuilding] = useState("");
  const [newLocLat, setNewLocLat] = useState("42.3600");
  const [newLocLon, setNewLocLon] = useState("-71.0940");
  const [locAdding, setLocAdding] = useState(false);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [s, h, u, l, a] = await Promise.all([
        api.getAdminStats(),
        api.getHeatmapData(),
        api.getUsers(),
        api.getLocations(),
        api.getAuditLogs()
      ]);
      setStats(s);
      setHeatmap(h);
      setUsers(u);
      setLocations(l);
      setAuditLogs(a);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocName || !newLocBuilding) return;
    setLocAdding(true);
    try {
      const response = await fetch(`${API_BASE}/locations/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("cf_token")}`
        },
        body: JSON.stringify({
          name: newLocName.trim(),
          building: newLocBuilding.trim(),
          latitude: parseFloat(newLocLat),
          longitude: parseFloat(newLocLon),
          description: "University facility"
        })
      });
      if (!response.ok) throw new Error("Failed to add location");
      setNewLocName("");
      setNewLocBuilding("");
      loadAdminData();
    } catch (err: any) {
      alert("Failed to add location");
    } finally {
      setLocAdding(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldAlert className="w-3.5 h-3.5 text-purple-600" />
            Dean of Operations & Security Command
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Campus Administration & Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time loss recovery rates, location heatmap intensity, user permissions, and audit logs.
          </p>
        </div>

        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
                <span>Total Reports</span>
                <Package className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-3xl font-black text-slate-900 mt-2">
                {stats.total_lost_reports + stats.total_found_reports}
              </p>
              <span className="text-[11px] text-slate-500 mt-1 block">
                {stats.total_lost_reports} lost • {stats.total_found_reports} found
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
                <span>Successful Recoveries</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-3xl font-black text-emerald-600 mt-2">
                {stats.successful_recoveries}
              </p>
              <span className="text-[11px] text-emerald-700 font-semibold mt-1 block">
                {stats.recovery_rate}% Recovery Success Rate
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
                <span>Registered Users</span>
                <Users className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-3xl font-black text-purple-600 mt-2">
                {stats.total_users}
              </p>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Students, staff & administrators
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
                <span>Reward Points Issued</span>
                <Award className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-3xl font-black text-amber-500 mt-2">
                {stats.reward_points_issued}
              </p>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Incentives distributed to finders
              </span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
          <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Flame className="w-5 h-5 text-rose-500" /> Campus Lost-Item Geospatial Heatmap
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  High-frequency loss hotspots across campus facilities.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {heatmap.slice(0, 4).map((h) => (
                <div key={h.location_id} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs font-bold text-slate-800 block truncate">{h.name.split(" ")[0]}</span>
                  <div className="flex items-center justify-between mt-1 text-[11px]">
                    <span className="text-slate-500">{h.total_items} items</span>
                    <span className="font-extrabold text-rose-600">
                      {(h.intensity * 100).toFixed(0)}% Hot
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <CampusMap locations={locations} height="380px" />
          </div>

          <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" /> Category Breakdown
            </h2>

            {stats && (
              <div className="space-y-3 pt-2">
                {Object.entries(stats.category_distribution).map(([cat, count]) => {
                  const total = stats.total_lost_reports + stats.total_found_reports || 1;
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-700">{cat}</span>
                        <span className="text-slate-900">{count} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-600 h-full rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
          <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" /> Campus Buildings Manager
              </h2>
              <span className="text-xs text-slate-400 font-bold">{locations.length} Locations</span>
            </div>

            <form onSubmit={handleAddLocation} className="grid grid-cols-2 gap-2 text-xs">
              <input
                type="text"
                placeholder="Building Name (e.g. Life Sciences Hall)"
                value={newLocName}
                onChange={(e) => setNewLocName(e.target.value)}
                className="col-span-2 p-2 rounded-xl border border-slate-200"
                required
              />
              <input
                type="text"
                placeholder="Zone / Complex"
                value={newLocBuilding}
                onChange={(e) => setNewLocBuilding(e.target.value)}
                className="p-2 rounded-xl border border-slate-200"
                required
              />
              <button
                type="submit"
                disabled={locAdding}
                className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors"
              >
                {locAdding ? "Adding..." : "+ Add Location"}
              </button>
            </form>

            <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 text-xs">
              {locations.map((loc) => (
                <div key={loc.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <strong className="text-slate-800">{loc.name}</strong>
                    <span className="text-slate-400 block text-[10px]">{loc.building} • {loc.code || "CAMPUS"}</span>
                  </div>
                  <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-bold">
                    Active
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Lock className="w-5 h-5 text-slate-700" /> Security Audit Log
              </h2>
              <span className="text-xs text-slate-400 font-bold">Staff Actions</span>
            </div>

            <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 text-xs">
              {auditLogs.length === 0 ? (
                <p className="text-slate-400 italic py-4">No audit logs recorded yet.</p>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="py-2.5 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-blue-700 uppercase">{log.action}</span>
                      <span className="text-slate-400">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">{log.details}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8">
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-slate-700" /> University User Directory ({users.length})
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 uppercase text-[10px] font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Department / ID</th>
                  <th className="py-3 px-4">Points & Tier</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{u.full_name}</div>
                      <div className="text-[11px] text-slate-400">{u.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        u.role === "admin"
                          ? "bg-purple-100 text-purple-800"
                          : u.role === "staff"
                          ? "bg-indigo-100 text-indigo-800"
                          : "bg-blue-100 text-blue-800"
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div>{u.department || "General"}</div>
                      <div className="text-[11px] text-slate-400">{u.student_id || "N/A"}</div>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">
                      🪙 {u.total_points} pts • {u.badge_tier}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-emerald-600 font-bold">Active</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
