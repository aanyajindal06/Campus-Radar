"use client";

import React, { useEffect, useRef, useState } from "react";
import { Location, Item } from "../lib/types";
import { MapPin, Building2, Search, ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";

interface CampusMapProps {
  locations: Location[];
  items?: Item[];
  selectedLocationId?: number | null;
  onSelectLocation?: (loc: Location) => void;
  height?: string;
  interactive?: boolean;
}

export default function CampusMap({
  locations,
  items = [],
  selectedLocationId,
  onSelectLocation,
  height = "500px",
  interactive = true,
}: CampusMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [activeLoc, setActiveLoc] = useState<Location | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    import("leaflet").then((L) => {
      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current!).setView([28.6339, 77.4468], 17);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | ABES EC, Ghaziabad',
          maxZoom: 19,
        }).addTo(map);

        mapInstanceRef.current = map;
      }

      const map = mapInstanceRef.current;

      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      locations.forEach((loc) => {
        const locLostCount = items.filter((i) => i.location_id === loc.id && i.type === "lost").length;
        const locFoundCount = items.filter((i) => i.location_id === loc.id && i.type === "found").length;
        const total = locLostCount + locFoundCount;

        const isSelected = selectedLocationId === loc.id;

        const customIcon = L.divIcon({
          className: "custom-leaflet-marker",
          html: `
            <div style="
              background: ${isSelected ? '#2563eb' : total > 0 ? '#1e293b' : '#64748b'};
              color: white;
              padding: 4px 8px;
              border-radius: 9999px;
              font-size: 11px;
              font-weight: 700;
              box-shadow: 0 4px 12px rgba(0,0,0,0.25);
              border: 2px solid white;
              display: flex;
              align-items: center;
              gap: 4px;
              white-space: nowrap;
              cursor: pointer;
              transform: translate(-50%, -100%);
            ">
              <span>📍 ${loc.name.split(" ")[0]}</span>
              ${total > 0 ? `<span style="background:#10b981; color:white; border-radius:9999px; padding:1px 5px; font-size:10px;">${total}</span>` : ''}
            </div>
          `,
          iconSize: [80, 30],
          iconAnchor: [40, 30],
        });

        const marker = L.marker([loc.latitude, loc.longitude], { icon: customIcon }).addTo(map);

        marker.on("click", () => {
          setActiveLoc(loc);
          if (onSelectLocation) {
            onSelectLocation(loc);
          }
        });

        markersRef.current.push(marker);
      });
    });

    return () => {
    };
  }, [locations, items, selectedLocationId]);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-md bg-white">
      <div ref={mapContainerRef} style={{ height }} className="w-full z-10" />

      <div className="absolute top-4 left-4 z-20 bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-200 shadow-lg hidden sm:flex items-center gap-2 text-xs">
        <Building2 className="w-4 h-4 text-blue-600" />
        <span className="font-bold text-slate-800">ABES Campus Hotspots:</span>
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-lg py-0.5">
          {locations.slice(0, 7).map((loc) => (
            <button
              key={loc.id}
              onClick={() => {
                setActiveLoc(loc);
                if (mapInstanceRef.current) {
                  mapInstanceRef.current.flyTo([loc.latitude, loc.longitude], 18);
                }
                if (onSelectLocation) onSelectLocation(loc);
              }}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors whitespace-nowrap ${
                selectedLocationId === loc.id
                  ? "bg-blue-600 text-white font-bold"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {loc.name}
            </button>
          ))}
        </div>
      </div>

      {activeLoc && (
        <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-20 bg-white rounded-xl shadow-2xl border border-slate-200 p-4 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                {activeLoc.code || "CAMPUS"} • {activeLoc.building}
              </span>
              <h4 className="font-bold text-slate-900 text-sm mt-0.5">{activeLoc.name}</h4>
            </div>
            <button
              onClick={() => setActiveLoc(null)}
              className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
            >
              ✕
            </button>
          </div>

          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            {activeLoc.description || "Active university zone with secure lost & found deposit point."}
          </p>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 text-[11px]">
              Floors: <strong className="text-slate-700">{activeLoc.floors || "1-3"}</strong>
            </span>
            <Link
              href={`/search?location_id=${activeLoc.id}`}
              className="font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 text-[11px]"
            >
              View Items Here <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
