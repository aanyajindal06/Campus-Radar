"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";
import ClaimModal from "../../../components/ClaimModal";
import MatchBreakdownModal from "../../../components/MatchBreakdownModal";
import {
  MapPin,
  Calendar,
  Clock,
  ShieldCheck,
  Sparkles,
  QrCode,
  Download,
  AlertCircle,
  Tag,
  ArrowRight,
  Sliders,
  ChevronLeft,
  CheckCircle2,
  Lock,
  UserCheck
} from "lucide-react";
import { api, getMediaUrl } from "../../../lib/api";
import { Item, MatchResult, ScoreBreakdown } from "../../../lib/types";
import { useAuth } from "../../../lib/authContext";

function ItemDetailsPageContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const itemId = Number(params?.id);

  const [item, setItem] = useState<Item | null>(null);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [activeBreakdown, setActiveBreakdown] = useState<{
    scores: ScoreBreakdown;
    item: Item;
  } | null>(null);

  const [isStaffUpdating, setIsStaffUpdating] = useState(false);
  const [editStatus, setEditStatus] = useState("");
  const [editStorage, setEditStorage] = useState("");

  useEffect(() => {
    if (!itemId) return;
    loadItemData();
  }, [itemId]);

  const loadItemData = async () => {
    setLoading(true);
    try {
      const data = await api.getItemById(itemId);
      setItem(data);
      setEditStatus(data.status);
      setEditStorage(data.storage_location || "");

      api.getItemMatches(itemId).then(setMatches).catch(() => {});
    } catch (e: any) {
      setErrorMsg(e.message || "Item not found");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!item) return;
    setIsStaffUpdating(true);
    try {
      const updated = await api.updateItemStatus(item.id, editStatus, editStorage);
      setItem(updated);
      alert("Item status updated successfully!");
    } catch (err: any) {
      alert(err.message || "Update failed");
    } finally {
      setIsStaffUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 py-16 flex-1 text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xs font-bold text-slate-500">Loading item specifications & AI similarity matches...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (errorMsg || !item) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        <Navbar />
        <div className="max-w-md mx-auto px-4 py-16 flex-1 text-center">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-800">Item Listing Not Found</h2>
          <p className="text-xs text-slate-500 mt-1">{errorMsg || "The requested item report does not exist."}</p>
          <Link
            href="/search"
            className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold"
          >
            Return to Search
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const isFound = item.type === "found";
  const isOwner = user && user.id === item.owner_id;
  const isStaffOrAdmin = user && (user.role === "staff" || user.role === "admin");

  const imagesList = item.images && item.images.length > 0
    ? item.images.map((img) => getMediaUrl(img.file_url))
    : ["https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80"];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />

      <ClaimModal
        isOpen={isClaimModalOpen}
        onClose={() => setIsClaimModalOpen(false)}
        item={item}
        onClaimSubmitted={() => {
          loadItemData();
        }}
      />

      {activeBreakdown && (
        <MatchBreakdownModal
          isOpen={true}
          onClose={() => setActiveBreakdown(null)}
          scores={activeBreakdown.scores}
          item={activeBreakdown.item}
        />
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back to listings
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="relative h-80 sm:h-96 bg-slate-100 flex items-center justify-center overflow-hidden">
                <img
                  src={imagesList[selectedImageIndex]}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase shadow-sm ${
                      isFound ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
                    }`}
                  >
                    {isFound ? "Found Item" : "Lost Report"}
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-white/95 text-slate-800 shadow-sm">
                    {item.category}
                  </span>
                </div>
              </div>

              {imagesList.length > 1 && (
                <div className="p-3 bg-slate-50 flex items-center gap-2 overflow-x-auto border-t border-slate-100">
                  {imagesList.map((url, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`w-14 h-14 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                        selectedImageIndex === idx ? "border-blue-600 shadow-xs" : "border-transparent opacity-70"
                      }`}
                    >
                      <img src={url} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {isFound && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-blue-600" />
                    <span className="text-xs font-bold text-slate-900">Physical Staff Vault QR</span>
                  </div>
                  <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                    {item.tracking_code}
                  </span>
                </div>

                <div className="flex items-center gap-4 pt-1">
                  {item.qr_image_url ? (
                    <img
                      src={getMediaUrl(item.qr_image_url)}
                      alt="Item QR Code"
                      className="w-24 h-24 object-contain border border-slate-200 rounded-xl p-1 bg-white"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-slate-100 rounded-xl flex items-center justify-center">
                      <QrCode className="w-8 h-8 text-slate-400" />
                    </div>
                  )}

                  <div className="flex-1 space-y-1.5 text-xs text-slate-500">
                    <p className="leading-snug">
                      Authorized security staff scan this code to review intake, verify ownership proof, and record handovers.
                    </p>
                    {item.qr_image_url && (
                      <a
                        href={getMediaUrl(item.qr_image_url)}
                        download={`${item.tracking_code}_qr.png`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-bold text-blue-600 hover:text-blue-800 text-[11px]"
                      >
                        <Download className="w-3.5 h-3.5" /> Download Printable Label
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <span className="font-mono text-xs text-slate-400 font-bold">
                  Tracking ID: <span className="text-slate-800">{item.tracking_code}</span>
                </span>
                <span
                  className={`px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
                    item.status === "returned"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                      : item.status === "verified"
                      ? "bg-blue-50 text-blue-800 border-blue-300"
                      : item.status === "stored"
                      ? "bg-indigo-50 text-indigo-800 border-indigo-300"
                      : "bg-amber-50 text-amber-800 border-amber-300"
                  }`}
                >
                  Status: {item.status.replace("_", " ")}
                </span>
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{item.name}</h1>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed whitespace-pre-line">
                  {item.description}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Location</span>
                    <strong className="text-slate-800">{item.location?.name || "Campus Ground"}</strong>
                    {item.building_room && (
                      <span className="text-slate-500 block text-[11px]">{item.building_room}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Date & Time</span>
                    <strong className="text-slate-800">{item.date_event}</strong>
                    {item.time_event && (
                      <span className="text-slate-500 block text-[11px]">at {item.time_event}</span>
                    )}
                  </div>
                </div>
              </div>

              {isFound && item.storage_location && (
                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs flex items-center justify-between">
                  <span className="text-blue-900 font-semibold">
                    📍 Current Storage Vault: <strong>{item.storage_location}</strong>
                  </span>
                  <span className="text-[10px] text-blue-600 font-bold bg-white px-2 py-0.5 rounded shadow-2xs">
                    Campus Security
                  </span>
                </div>
              )}

              <div className="border-t border-slate-100 pt-4">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                  Structured Specifications
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Color</span>
                    <span className="font-semibold text-slate-800">{item.color || "Not specified"}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Brand</span>
                    <span className="font-semibold text-slate-800">{item.brand || "Not specified"}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Model</span>
                    <span className="font-semibold text-slate-800">{item.model || "Not specified"}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Material</span>
                    <span className="font-semibold text-slate-800">{item.material || "Not specified"}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Weight / Size</span>
                    <span className="font-semibold text-slate-800">{item.weight || "Not specified"}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Contact Pref</span>
                    <span className="font-semibold text-slate-800 capitalize">{item.contact_preference}</span>
                  </div>
                </div>

                {item.distinguishing_features && (
                  <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                    <span className="text-slate-400 block text-[10px] font-bold uppercase mb-0.5">
                      Distinguishing Features
                    </span>
                    <p className="text-slate-700 leading-relaxed">{item.distinguishing_features}</p>
                  </div>
                )}
              </div>

              {item.private_details && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900">
                    <Lock className="w-3.5 h-3.5 text-amber-700" />
                    <span>Confidential Ownership Evidence (Staff / Finder View Only)</span>
                  </div>
                  <p className="text-amber-800 font-mono text-[11px] leading-relaxed bg-white/70 p-2 rounded border border-amber-200">
                    {item.private_details}
                  </p>
                </div>
              )}

              {isFound && item.status !== "returned" && !isOwner && (
                <div className="pt-2">
                  <button
                    onClick={() => setIsClaimModalOpen(true)}
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl text-xs sm:text-sm font-extrabold shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4 text-white" />
                    Claim This Belonging (Verify Ownership)
                  </button>
                  <p className="text-center text-[10px] text-slate-400 mt-2">
                    Security will verify your description of unique private marks before physical release.
                  </p>
                </div>
              )}
            </div>

            {isStaffOrAdmin && (
              <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-indigo-600" /> Staff Storage & Status Controls
                  </span>
                  <span className="text-[10px] bg-indigo-200 text-indigo-800 font-bold px-2 py-0.5 rounded">
                    Staff Privileges
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                      Update Item Status
                    </label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="w-full p-2 bg-white rounded-xl border border-indigo-200 font-medium"
                    >
                      <option value="reported">Reported</option>
                      <option value="stored">Stored in Security Desk</option>
                      <option value="claim_pending">Claim Pending</option>
                      <option value="verified">Verified</option>
                      <option value="returned">Returned to Owner</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                      Storage Locker / Room
                    </label>
                    <input
                      type="text"
                      value={editStorage}
                      onChange={(e) => setEditStorage(e.target.value)}
                      placeholder="e.g. Locker B-04"
                      className="w-full p-2 bg-white rounded-xl border border-indigo-200 font-medium"
                    />
                  </div>
                </div>

                <button
                  onClick={handleUpdateStatus}
                  disabled={isStaffUpdating}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                >
                  {isStaffUpdating ? "Updating..." : "Save Status Changes"}
                </button>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                    AI Potential Matches ({matches.length})
                  </h3>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">
                  Ranked by 5-Pillar Hybrid Matching
                </span>
              </div>

              {matches.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-2 text-center">
                  No counterparts meet the 50% hybrid similarity threshold yet. The engine continues to monitor new submissions.
                </p>
              ) : (
                <div className="space-y-3">
                  {matches.slice(0, 5).map((m) => (
                    <div
                      key={m.item.id}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-blue-300 transition-colors flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={getMediaUrl(m.item.images?.[0]?.file_url || "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=100&auto=format&fit=crop&q=80")}
                          alt={m.item.name}
                          className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 truncate">{m.item.name}</h4>
                          <span className="text-[10px] text-slate-500 block truncate">
                            {m.item.location?.name || "Campus"} • {m.item.date_event}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => setActiveBreakdown({ scores: m.scores, item: m.item })}
                          className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-blue-100 hover:bg-blue-200 text-blue-800 transition-colors flex items-center gap-1 cursor-pointer"
                          title="Click to view 5-Pillar Hybrid Score Breakdown"
                        >
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          <span>{m.scores.overall_similarity}%</span>
                        </button>

                        <Link
                          href={`/items/${m.item.id}`}
                          className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function ItemDetailsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading item specifications...</div>}>
      <ItemDetailsPageContent />
    </Suspense>
  );
}
