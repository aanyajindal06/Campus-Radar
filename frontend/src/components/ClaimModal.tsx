"use client";

import React, { useState } from "react";
import { Item } from "../lib/types";
import { api } from "../lib/api";
import { ShieldCheck, Lock, Upload, AlertCircle, CheckCircle2 } from "lucide-react";
import confetti from "canvas-confetti";

interface ClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: Item;
  onClaimSubmitted?: () => void;
}

export default function ClaimModal({
  isOpen,
  onClose,
  item,
  onClaimSubmitted
}: ClaimModalProps) {
  const [proofText, setProofText] = useState("");
  const [proofImageUrl, setProofImageUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofText.trim()) {
      setErrorMsg("Please describe specific identifying proof.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      await api.submitClaim({
        item_id: item.id,
        proof_description: proofText.trim(),
        proof_image_url: proofImageUrl.trim() || undefined,
      });

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 }
      });

      setSubmitted(true);
      if (onClaimSubmitted) onClaimSubmitted();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to file claim");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="p-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold">Ownership Claim Request</h3>
              <p className="text-xs text-emerald-100">
                Claiming: <span className="font-semibold">{item.name}</span> ({item.tracking_code})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white text-lg font-bold p-1 rounded-lg hover:bg-white/10"
          >
            ✕
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold text-slate-900">Claim Submitted for Verification!</h4>
            <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
              Your claim details have been routed to the campus security staff desk. They will cross-reference your identifying proof with the private marks provided by the finder.
            </p>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-left text-xs text-slate-600">
              <p><strong>Storage Desk:</strong> {item.storage_location || "Central Security Office (Room 102)"}</p>
              <p><strong>Next Step:</strong> You will receive an in-app & email notification once your claim is verified.</p>
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md transition-colors"
            >
              Done & Return
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-blue-900">
              <Lock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong>Anti-Fraud Protection:</strong> The finder documented confidential identifying traits (e.g. unique scratches, hidden stickers, serial digits). Please describe unique features only the genuine owner would know.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Identifying Ownership Evidence <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={proofText}
                onChange={(e) => setProofText(e.target.value)}
                placeholder="Example: 'There is a scratch near the lower left bezel. I can unlock the device passcode, and my student ID sticker is inside the rear pocket...'"
                rows={4}
                required
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-hidden transition-all placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Proof Image or Receipt Link (Optional)
              </label>
              <input
                type="url"
                value={proofImageUrl}
                onChange={(e) => setProofImageUrl(e.target.value)}
                placeholder="https://example.com/receipt-photo.jpg"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-hidden transition-all placeholder:text-slate-400"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Provide a photo of your purchase receipt, original packaging, or photo of you with the item.
              </span>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
              >
                {isSubmitting ? "Submitting Claim..." : "Submit Claim for Staff Verification"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
