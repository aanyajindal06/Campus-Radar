"use client";

import React from "react";
import { ScoreBreakdown, Item } from "../lib/types";
import { Sparkles, Image as ImageIcon, FileText, Sliders, MapPin, Calendar, AlertCircle } from "lucide-react";

interface MatchBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  scores: ScoreBreakdown;
  item: Item;
  counterpartItemName?: string;
}

export default function MatchBreakdownModal({
  isOpen,
  onClose,
  scores,
  item,
  counterpartItemName
}: MatchBreakdownModalProps) {
  if (!isOpen) return null;

  const components = [
    {
      label: "Visual Image Similarity",
      score: scores.image_score,
      weight: "40%",
      icon: <ImageIcon className="w-4 h-4 text-blue-600" />,
      desc: "Color histogram distribution, spatial blocks, and edge gradient analysis."
    },
    {
      label: "Description & Name Match",
      score: scores.description_score,
      weight: "25%",
      icon: <FileText className="w-4 h-4 text-indigo-600" />,
      desc: "Token overlap and fuzzy semantic sequence matching."
    },
    {
      label: "Structured Attributes",
      score: scores.attribute_score,
      weight: "15%",
      icon: <Sliders className="w-4 h-4 text-emerald-600" />,
      desc: "Exact category match, color, brand, model, material, and unique features."
    },
    {
      label: "Campus Location Proximity",
      score: scores.location_score,
      weight: "10%",
      icon: <MapPin className="w-4 h-4 text-amber-600" />,
      desc: "Building zone alignment and GPS geodesic proximity on campus."
    },
    {
      label: "Date & Time Proximity",
      score: scores.date_score,
      weight: "10%",
      icon: <Calendar className="w-4 h-4 text-purple-600" />,
      desc: "Temporal delta between when item was lost and discovered."
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="p-5 bg-gradient-to-r from-blue-700 to-indigo-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base font-bold">Hybrid AI Match Breakdown</h3>
              <p className="text-xs text-blue-100">
                Confidence ranking for {counterpartItemName ? `"${counterpartItemName}"` : item.name}
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

        <div className="p-6 bg-slate-50 border-b border-slate-200 text-center">
          <div className="inline-flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-blue-700">
              {scores.overall_similarity}%
            </span>
            <span className="text-sm font-bold text-slate-600 uppercase tracking-wider">
              Overall Similarity Score
            </span>
          </div>
          <div className="w-full bg-slate-200 h-2.5 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                scores.overall_similarity >= 80
                  ? "bg-emerald-500"
                  : scores.overall_similarity >= 60
                  ? "bg-blue-600"
                  : "bg-amber-500"
              }`}
              style={{ width: `${scores.overall_similarity}%` }}
            />
          </div>
        </div>

        <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
          {components.map((c, idx) => (
            <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  {c.icon}
                  <span className="text-xs font-bold text-slate-800">{c.label}</span>
                  <span className="text-[10px] text-slate-400 font-semibold bg-slate-100 px-1.5 py-0.5 rounded">
                    Weight: {c.weight}
                  </span>
                </div>
                <span className="text-xs font-bold text-blue-700">{c.score}%</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-tight mb-2">{c.desc}</p>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full"
                  style={{ width: `${c.score}%` }}
                />
              </div>
            </div>
          ))}

          <div className="bg-amber-50 rounded-xl p-3 border border-amber-200 flex items-start gap-2 text-xs text-amber-800">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Important Notice:</strong> This score represents an algorithmic similarity ranking, not a guaranteed proof of ownership. Official return requires staff verification of hidden private details.
            </p>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold shadow-xs"
          >
            Close Breakdown
          </button>
        </div>
      </div>
    </div>
  );
}
