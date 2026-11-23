import React from "react";
import Link from "next/link";
import { Compass, ShieldAlert, Phone, Mail, MapPin, Sparkles, CheckCircle2 } from "lucide-react";

const LINKS = [
  ["/search?type=found", "Search Found Belongings"],
  ["/search?type=lost", "View Lost Reports"],
  ["/report-lost", "Report a Lost Item"],
  ["/report-found", "Report a Found Item (+10 pts)"],
  ["/leaderboard", "Reward Points & Leaderboard"],
];
const CONTACTS = [
  [MapPin, "Proctorial Board Office, Ramanujan Block / Main Gate Post, ABES EC Ghaziabad"],
  [Phone, "Control Room: +91 120 7135112 / +91 98991 00223"],
  [Mail, "lostandfound@abes.ac.in"],
] as const;
const TAGS = ["Visual Embeddings", "Staff QR Vault", "Leaflet GIS"];
const H = "text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-1.5";

export default function Footer() {
  return (
    <footer className="mt-auto px-3 pb-3">
      <div className="max-w-7xl mx-auto footer-glow rounded-3xl px-6 lg:px-10 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Compass className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold">CampusRadar</span>
            </div>
            <p className="text-xs text-white/80 leading-relaxed">
              Official lost and found recovery platform for ABES Engineering College, Ghaziabad. Connecting students, faculty, and campus security through visual image matching and QR verification.
            </p>
            <div className="flex items-center gap-2 text-xs font-semibold bg-black/25 px-3 py-1.5 rounded-full w-fit">
              <CheckCircle2 className="w-4 h-4" />
              <span>ABES EC Security Network</span>
            </div>
          </div>

          <div>
            <h3 className={H}>Explore & Recover</h3>
            <ul className="space-y-2 text-xs text-white/80">
              {LINKS.map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="hover:text-white hover:underline">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className={H}>
              <ShieldAlert className="w-3.5 h-3.5" /> Campus Safety Desks
            </h3>
            <ul className="space-y-2.5 text-xs text-white/80">
              {CONTACTS.map(([Icon, text]) => (
                <li key={text} className="flex items-start gap-2">
                  <Icon className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className={H}>
              <Sparkles className="w-3.5 h-3.5" /> Hybrid Matching Engine
            </h3>
            <p className="text-xs text-white/80 leading-relaxed mb-3">
              CampusRadar uses a 5-pillar similarity formula: Image Visuals (40%), Descriptions (25%), Structured Specs (15%), Location Proximity (10%), and Date Proximity (10%).
            </p>
            <div className="flex flex-wrap gap-1.5">
              {TAGS.map((t) => (
                <span key={t} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-black/25">{t}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-white/25 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-white/80 gap-4">
          <p>© 2026 CampusRadar — ABES Engineering College, Ghaziabad. All rights reserved.</p>
          <div className="flex items-center gap-4">
            {["Student Privacy Protocol", "Terms of Safe Return", "Security Audits"].map((t, i) => (
              <React.Fragment key={t}>
                {i > 0 && <span>•</span>}
                <span className="hover:text-white cursor-pointer">{t}</span>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
