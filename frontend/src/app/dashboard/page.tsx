"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import {
  UserCheck,
  Award,
  Clock,
  Sparkles,
  ShieldCheck,
  FileText,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  ArrowRight,
  TrendingUp,
  Archive,
  Eye,
  Settings
} from "lucide-react";
import { api } from "../../lib/api";
import { Item, Claim, RewardLedgerEntry, Notification } from "../../lib/types";
import { useAuth } from "../../lib/authContext";

export default function UserDashboardPage() {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<"lost" | "found" | "claims" | "rewards" | "profile">("lost");
  
  const [myItems, setMyItems] = useState<Item[]>([]);
  const [myClaims, setMyClaims] = useState<Claim[]>([]);
  const [myRewards, setMyRewards] = useState<RewardLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [studentId, setStudentId] = useState("");
  const [profileSaved, setProfileSaved] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;
    setLoading(true);
    setFullName(user.full_name || "");
    setPhone(user.phone || "");
    setDepartment(user.department || "");
    setStudentId(user.student_id || "");

    try {
      const allItems = await api.getItems();
      const userItems = allItems.filter((i) => i.owner_id === user.id);
      setMyItems(userItems);

      const claims = await api.getClaims();
      setMyClaims(claims);

      const rewards = await api.getMyRewards();
      setMyRewards(rewards);
    } catch (e) {
      console.error("Dashboard load error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateMe({
        full_name: fullName,
        phone,
        department,
        student_id: studentId
      });
      setProfileSaved(true);
      refreshUser();
      setTimeout(() => setProfileSaved(false), 3000);
    } catch (err: any) {
      alert(err.message || "Failed to update profile");
    }
  };

  const handleArchiveReport = async (itemId: number) => {
    if (!confirm("Are you sure you want to archive this report?")) return;
    try {
      await api.deleteItem(itemId);
      loadDashboardData();
    } catch (e: any) {
      alert(e.message || "Archive failed");
    }
  };

  const lostReports = myItems.filter((i) => i.type === "lost");
  const foundReports = myItems.filter((i) => i.type === "found");

  const totalPoints = user?.total_points || 0;
  const currentTier = user?.badge_tier || "Bronze";
  const nextTierPoints = currentTier === "Bronze" ? 50 : currentTier === "Silver" ? 150 : 250;
  const tierProgress = Math.min(100, Math.round((totalPoints / nextTierPoints) * 100));

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl mb-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center font-bold text-2xl uppercase shadow-md overflow-hidden shrink-0">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
              ) : (
                user?.full_name[0]
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                <h1 className="text-xl sm:text-2xl font-black">{user?.full_name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-blue-500/30 border border-blue-400 text-blue-100">
                  {user?.role}
                </span>
              </div>
              <p className="text-xs text-blue-200 mt-1">
                {user?.department || "Campus Member"} • {user?.email}
              </p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 w-full sm:w-72 text-center sm:text-left">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-blue-200 font-semibold flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-300" /> Reward Tier
              </span>
              <span className="text-xs font-black text-amber-300 uppercase tracking-wider">
                {currentTier}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white">{totalPoints}</span>
              <span className="text-xs text-blue-200 font-bold">points</span>
            </div>
            <div className="w-full bg-white/20 h-2 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-400 to-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${tierProgress}%` }}
              />
            </div>
            <span className="text-[10px] text-blue-200 mt-1 block text-right font-medium">
              {currentTier === "Gold" ? "Max Level Reached" : `${totalPoints}/${nextTierPoints} pts to next tier`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 border-b border-slate-200">
          <button
            onClick={() => setActiveTab("lost")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === "lost"
                ? "bg-rose-600 text-white shadow-xs"
                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <span>My Lost Reports</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
              activeTab === "lost" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
            }`}>
              {lostReports.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("found")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === "found"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <span>My Found Reports</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
              activeTab === "found" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
            }`}>
              {foundReports.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("claims")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === "claims"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Active Claims</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
              activeTab === "claims" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
            }`}>
              {myClaims.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("rewards")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === "rewards"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Reward History</span>
          </button>

          <button
            onClick={() => setActiveTab("profile")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === "profile"
                ? "bg-slate-800 text-white shadow-xs"
                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Profile Settings</span>
          </button>
        </div>

        {activeTab === "lost" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Active Lost Items ({lostReports.length})
              </h2>
              <Link
                href="/report-lost"
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs"
              >
                <PlusCircle className="w-3.5 h-3.5" /> Report Lost Item
              </Link>
            </div>

            {lostReports.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
                You have not filed any lost item reports.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {lostReports.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-2">
                        <span className="font-mono text-slate-400 font-bold">{item.tracking_code}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-50 text-rose-700 border border-rose-200">
                          {item.status.replace("_", " ")}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm">{item.name}</h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.description}</p>
                      <div className="mt-3 text-[11px] text-slate-500">
                        <span>Lost at {item.location?.name || "Campus"} on {item.date_event}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <Link
                        href={`/items/${item.id}`}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Matches
                      </Link>
                      <button
                        onClick={() => handleArchiveReport(item.id)}
                        className="text-xs text-slate-400 hover:text-rose-600 flex items-center gap-1"
                      >
                        <Archive className="w-3.5 h-3.5" /> Archive
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "found" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Found Belongings Handed In ({foundReports.length})
              </h2>
              <Link
                href="/report-found"
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs"
              >
                <PlusCircle className="w-3.5 h-3.5" /> Report Found Item
              </Link>
            </div>

            {foundReports.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
                You haven't reported any found items yet. Report one to earn +10 points!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {foundReports.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-2">
                        <span className="font-mono text-slate-400 font-bold">{item.tracking_code}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {item.status.replace("_", " ")}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm">{item.name}</h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.description}</p>
                      <div className="mt-3 text-[11px] text-slate-500">
                        <span>Stored at: <strong>{item.storage_location || "Security Vault"}</strong></span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <Link
                        href={`/items/${item.id}`}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Details & QR
                      </Link>
                      <span className="text-[11px] font-bold text-emerald-600">+10 Pts Earned</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "claims" && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Ownership Claims Filed ({myClaims.length})
            </h2>

            {myClaims.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
                You have not filed any ownership claims.
              </div>
            ) : (
              <div className="space-y-3">
                {myClaims.map((c) => (
                  <div
                    key={c.id}
                    className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          c.status === "approved"
                            ? "bg-emerald-100 text-emerald-800"
                            : c.status === "returned"
                            ? "bg-blue-100 text-blue-800"
                            : c.status === "rejected"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-amber-100 text-amber-800"
                        }`}>
                          Claim {c.status}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Filed on {new Date(c.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm">
                        {c.item?.name || "Found Item"} ({c.item?.tracking_code})
                      </h3>
                      <p className="text-xs text-slate-600 mt-1 max-w-xl">
                        <strong>Submitted Proof:</strong> {c.proof_description}
                      </p>
                      {c.staff_notes && (
                        <div className="mt-2 text-xs bg-slate-50 p-2 rounded-lg border border-slate-200 text-slate-700">
                          <strong>Staff Review Notes:</strong> {c.staff_notes}
                        </div>
                      )}
                    </div>

                    <Link
                      href={`/items/${c.item_id}`}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold shrink-0 text-center"
                    >
                      View Item
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "rewards" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Reward Points Ledger ({myRewards.length} entries)
              </h2>
              <Link
                href="/leaderboard"
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                Campus Leaderboard <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {myRewards.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
                No points earned yet. Report found belongings or help verify matches to earn points!
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100 shadow-xs">
                {myRewards.map((r) => (
                  <div key={r.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800">{r.description || r.reason}</p>
                      <span className="text-[11px] text-slate-400">
                        {new Date(r.created_at).toLocaleDateString()} • Ref: {r.reference_id || "N/A"}
                      </span>
                    </div>
                    <span className="text-sm font-black text-emerald-600">+{r.points} pts</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "profile" && (
          <div className="max-w-xl bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
              University Profile Information
            </h2>

            {profileSaved && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Profile updated successfully!</span>
              </div>
            )}

            <form onSubmit={handleProfileSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-blue-500 outline-hidden font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">College Email (Read-Only)</label>
                <input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Academic Department</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Computer Science"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-blue-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Student / Staff ID</label>
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="e.g. CS-2024-8841"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-blue-500 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Emergency Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-blue-500 outline-hidden"
                />
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
              >
                Save Profile Changes
              </button>
            </form>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
