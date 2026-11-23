"use client";

import React, { useState, useEffect } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import CampusMap from "../../components/CampusMap";
import { MapPin, Building2, Search, Filter, ArrowRight } from "lucide-react";
import { api } from "../../lib/api";
import { Location, Item } from "../../lib/types";
import Link from "next/link";

export default function CampusMapPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [selectedLocId, setSelectedLocId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getLocations(), api.getItems()])
      .then(([locs, its]) => {
        setLocations(locs);
        setItems(its);
      })
      .finally(() => setLoading(false));
  }, []);

  const selectedLoc = locations.find((l) => l.id === selectedLocId);
  const itemsInSelectedLoc = items.filter((i) => i.location_id === selectedLocId);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              University GIS Directory
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Interactive Campus Lost & Found Map
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Select any building on the map to inspect reported belongings, recovery desks, and security drop-offs.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/report-lost"
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs"
            >
              Report Lost Here
            </Link>
            <Link
              href="/report-found"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs"
            >
              Report Found Here
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            <CampusMap
              locations={locations}
              items={items}
              selectedLocationId={selectedLocId}
              onSelectLocation={(loc) => setSelectedLocId(loc.id)}
              height="620px"
            />
          </div>

          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-blue-600" />
                {selectedLoc ? selectedLoc.name : "Select a Campus Building"}
              </h2>

              {selectedLoc ? (
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Complex / Hall</span>
                    <p className="font-semibold text-slate-800">{selectedLoc.building}</p>
                    <p className="text-slate-500 text-[11px] mt-1">{selectedLoc.description}</p>
                  </div>

                  <div className="flex justify-between p-2 rounded-lg bg-slate-50 text-[11px]">
                    <span className="text-slate-500">Active Floors:</span>
                    <strong className="text-slate-700">{selectedLoc.floors || "1-3"}</strong>
                  </div>

                  <div className="flex justify-between p-2 rounded-lg bg-slate-50 text-[11px]">
                    <span className="text-slate-500">Total Belongings:</span>
                    <strong className="text-blue-700">{itemsInSelectedLoc.length} reported</strong>
                  </div>

                  <h3 className="font-bold text-slate-800 text-xs pt-2">Belongings in this Building:</h3>
                  {itemsInSelectedLoc.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic py-2">No active items reported at this location.</p>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {itemsInSelectedLoc.map((it) => (
                        <div key={it.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                          <div>
                            <strong className="text-slate-800 block">{it.name}</strong>
                            <span className="text-[10px] text-slate-400 capitalize">{it.type} • {it.category}</span>
                          </div>
                          <Link
                            href={`/items/${it.id}`}
                            className="text-[11px] font-bold text-blue-600 hover:text-blue-800"
                          >
                            View &rarr;
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-xs text-slate-400">
                  <MapPin className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p>Click any map marker to see floor details, security lockers, and reported items.</p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                All Campus Buildings
              </h3>
              <div className="space-y-1.5 max-h-52 overflow-y-auto">
                {locations.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => setSelectedLocId(l.id)}
                    className={`w-full text-left p-2 rounded-xl text-xs transition-colors flex items-center justify-between ${
                      selectedLocId === l.id
                        ? "bg-blue-50 text-blue-700 font-bold"
                        : "hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <span className="truncate">{l.name}</span>
                    <span className="text-[10px] text-slate-400 shrink-0">{l.code}</span>
                  </button>
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
