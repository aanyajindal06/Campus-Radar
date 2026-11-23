"use client";

import React, { useState, useEffect } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import QRScannerModal from "../../components/QRScannerModal";
import {
  QrCode,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Package,
  Clock,
  Lock,
  ArrowRight,
  Eye,
  Camera,
  Check
} from "lucide-react";
import { api } from "../../lib/api";
import { Claim, Item } from "../../lib/types";
import { useAuth } from "../../lib/authContext";
import confetti from "canvas-confetti";

export default function StaffDashboardPage() {
  const { user } = useAuth();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterClaimStatus, setFilterClaimStatus] = useState("pending");
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState<Record<number, string>>({});
  const [processingClaimId, setProcessingClaimId] = useState<number | null>(null);

  useEffect(() => {
    loadStaffData();
  }, []);

  const loadStaffData = async () => {
    setLoading(true);
    try {
      const allClaims = await api.getClaims();
      setClaims(allClaims);
      const allItems = await api.getItems({ type: "found" });
      setItems(allItems);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewAction = async (claimId: number, status: "approved" | "rejected" | "returned") => {
    setProcessingClaimId(claimId);
    try {
      const notes = reviewNotes[claimId] || "";
      await api.reviewClaim(claimId, status, notes);

      if (status === "returned") {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 }
        });
      }

      await loadStaffData();
    } catch (err: any) {
      alert(err.message || "Action failed");
    } finally {
      setProcessingClaimId(null);
    }
  };

  const filteredClaims = claims.filter((c) => {
    if (filterClaimStatus === "all") return true;
    return c.status === filterClaimStatus;
  });

  const storedCount = items.filter((i) => i.status === "stored").length;
  const pendingClaimsCount = claims.filter((c) => c.status === "pending").length;
  const returnedCount = items.filter((i) => i.status === "returned").length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />

      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onItemFound={(item) => {
          window.location.href = `/items/${item.id}`;
        }}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 text-xs font-bold uppercase tracking-wider mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              Campus Operations & Security Desk
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Staff Verification & Vault Desk
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Verify claimant proof against confidential finder records, scan QR codes, and confirm returns.
            </p>
          </div>

          <button
            onClick={() => setIsScannerOpen(true)}
            className="px-5 py-3 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-700/20 flex items-center gap-2 self-start sm:self-auto transition-transform active:scale-95"
          >
            <Camera className="w-4 h-4" />
            <span>Open QR Camera Scanner</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-slate-400 text-xs font-bold uppercase">Pending Ownership Claims</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-amber-600">{pendingClaimsCount}</span>
              <span className="text-xs text-slate-500">awaiting review</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-slate-400 text-xs font-bold uppercase">Vault Storage Inventory</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-blue-600">{storedCount}</span>
              <span className="text-xs text-slate-500">items in lockers</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-slate-400 text-xs font-bold uppercase">Successful Recoveries</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-emerald-600">{returnedCount}</span>
              <span className="text-xs text-slate-500">verified returns</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Ownership Claims Verification Queue</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Compare claimant's submitted proof with the confidential hidden marks stored by the finder.
              </p>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
              {["pending", "approved", "returned", "rejected", "all"].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterClaimStatus(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors ${
                    filterClaimStatus === st
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500">Loading claims queue...</div>
          ) : filteredClaims.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500">
              No claims match the filter "{filterClaimStatus}".
            </div>
          ) : (
            <div className="space-y-6">
              {filteredClaims.map((claim) => (
                <div
                  key={claim.id}
                  className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        Claim #{claim.id}
                      </span>
                      <span className="text-xs font-bold text-slate-900">
                        {claim.item?.name} ({claim.item?.tracking_code})
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          claim.status === "approved"
                            ? "bg-emerald-100 text-emerald-800"
                            : claim.status === "returned"
                            ? "bg-blue-100 text-blue-800"
                            : claim.status === "rejected"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        Status: {claim.status}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(claim.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                          Claimant's Submitted Proof
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {claim.claimant?.full_name} ({claim.claimant?.email})
                        </span>
                      </div>
                      <p className="text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100 font-mono text-[11px]">
                        "{claim.proof_description}"
                      </p>
                      {claim.proof_image_url && (
                        <div className="pt-1">
                          <a
                            href={claim.proof_image_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] font-bold text-blue-600 hover:underline"
                          >
                            View Claimant Attached Receipt / Photo &rarr;
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-900 uppercase tracking-wider text-[10px] flex items-center gap-1">
                          <Lock className="w-3 h-3 text-amber-700" /> Finder's Hidden Marks
                        </span>
                        <span className="text-[11px] text-amber-800">
                          Locker: {claim.item?.storage_location || "Vault Desk"}
                        </span>
                      </div>
                      <p className="text-amber-900 leading-relaxed bg-white/80 p-3 rounded-lg border border-amber-200 font-mono text-[11px]">
                        "{claim.item?.private_details || "No private details logged."}"
                      </p>
                      <span className="text-[10px] text-amber-700 block">
                        Verify if claimant's proof matches these hidden physical traits.
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                      Staff Verification Notes:
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Verified student ID card and matched scratch pattern on underside."
                      defaultValue={claim.staff_notes || ""}
                      onChange={(e) => {
                        setReviewNotes({ ...reviewNotes, [claim.id]: e.target.value });
                      }}
                      className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white outline-hidden focus:border-blue-500"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-200/60">
                    <button
                      onClick={() => handleReviewAction(claim.id, "rejected")}
                      disabled={processingClaimId === claim.id}
                      className="px-3.5 py-1.5 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Reject Claim
                    </button>

                    <button
                      onClick={() => handleReviewAction(claim.id, "approved")}
                      disabled={processingClaimId === claim.id}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" /> Approve Proof
                    </button>

                    <button
                      onClick={() => handleReviewAction(claim.id, "returned")}
                      disabled={processingClaimId === claim.id}
                      className="px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-lg text-xs font-extrabold flex items-center gap-1 shadow-md transition-all"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Confirm Physical Handover (+50 pts to Finder)
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Current Vault Inventory</h2>
              <p className="text-xs text-slate-500">Physical belongings deposited across campus storage desks.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Item Code</th>
                  <th className="py-3 px-4">Name & Category</th>
                  <th className="py-3 px-4">Storage Locker</th>
                  <th className="py-3 px-4">Found Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.slice(0, 10).map((it) => (
                  <tr key={it.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-700">{it.tracking_code}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{it.name}</td>
                    <td className="py-3 px-4">{it.storage_location || "Central Desk"}</td>
                    <td className="py-3 px-4">{it.date_event}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                        {it.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <a
                        href={`/items/${it.id}`}
                        className="font-bold text-blue-600 hover:text-blue-800"
                      >
                        Inspect &rarr;
                      </a>
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
