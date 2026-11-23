"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import MatchBreakdownModal from "../../components/MatchBreakdownModal";
import {
  Search,
  Upload,
  Camera,
  X,
  SlidersHorizontal,
  MapPin,
  Calendar,
  Sparkles,
  ArrowRight,
  Filter,
  CheckCircle2,
  ChevronDown
} from "lucide-react";
import { api, assetUrl, onImgError } from "../../lib/api";
import { Item, Location, MatchResult, ScoreBreakdown } from "../../lib/types";
import Link from "next/link";

function SearchPageContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const initialType = searchParams.get("type") || "all";
  const initialCategory = searchParams.get("category") || "all";
  const initialLocation = searchParams.get("location_id") || "";
  const initialMode = searchParams.get("mode") || "text";

  const [query, setQuery] = useState(initialQuery);
  const [itemType, setItemType] = useState(initialType);
  const [category, setCategory] = useState(initialCategory);
  const [locationId, setLocationId] = useState(initialLocation);
  const [colorFilter, setColorFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");

  const [searchMode, setSearchMode] = useState<"text" | "image">(initialMode === "image" ? "image" : "text");
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [items, setItems] = useState<Item[]>([]);
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);

  const [activeBreakdown, setActiveBreakdown] = useState<{
    scores: ScoreBreakdown;
    item: Item;
  } | null>(null);

  useEffect(() => {
    api.getLocations().then(setLocations).catch(() => {});
  }, []);

  useEffect(() => {
    if (searchMode === "text") {
      performTextSearch();
    }
  }, [itemType, category, locationId, colorFilter, statusFilter, sortBy]);

  const performTextSearch = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        sort_by: sortBy,
      };
      if (query.trim()) params.q = query.trim();
      if (itemType !== "all") params.type = itemType;
      if (category !== "all") params.category = category;
      if (locationId) params.location_id = locationId;
      if (colorFilter !== "all") params.color = colorFilter;
      if (statusFilter !== "all") params.status = statusFilter;

      const data = await api.searchByText(params);
      setItems(data);
      setMatchResults([]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleImageFileChange = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setUploadedImage(file);
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    performImageSearch(file);
  };

  const performImageSearch = async (fileToSearch?: File) => {
    const file = fileToSearch || uploadedImage;
    if (!file) return;

    setLoading(true);
    try {
      const results = await api.searchByImage(file, category !== "all" ? category : undefined);
      setMatchResults(results);
      setItems(results.map((r) => r.item));
    } catch (e) {
      console.error("AI image search error:", e);
    } finally {
      setLoading(false);
    }
  };

  const clearImage = () => {
    setUploadedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    performTextSearch();
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />

      {activeBreakdown && (
        <MatchBreakdownModal
          isOpen={true}
          onClose={() => setActiveBreakdown(null)}
          scores={activeBreakdown.scores}
          item={activeBreakdown.item}
        />
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Campus Belongings Directory
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Search by item name, visual image similarity, campus building, or specifications.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs self-start md:self-auto">
            <button
              onClick={() => {
                setSearchMode("text");
                performTextSearch();
              }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                searchMode === "text"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              Text Search
            </button>
            <button
              onClick={() => setSearchMode("image")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                searchMode === "image"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              AI Image Match
            </button>
          </div>
        </div>

        {searchMode === "image" && (
          <div className="mb-8 bg-white p-6 rounded-2xl border-2 border-dashed border-blue-300 shadow-sm transition-all animate-in fade-in">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  if (e.dataTransfer.files?.[0]) {
                    handleImageFileChange(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`relative w-full sm:w-64 h-48 rounded-xl border-2 border-dashed cursor-pointer flex flex-col items-center justify-center p-4 text-center transition-all overflow-hidden ${
                  isDragOver
                    ? "border-blue-600 bg-blue-50"
                    : "border-slate-300 hover:border-blue-400 bg-slate-50"
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleImageFileChange(e.target.files[0]);
                  }}
                  accept="image/*"
                  className="hidden"
                />

                {imagePreview ? (
                  <div className="relative w-full h-full group">
                    <img
                      src={imagePreview}
                      alt="Query preview"
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-semibold transition-opacity">
                      Click to change photo
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-2">
                      <Camera className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-slate-800">
                      Drop photo here, or browse
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Works with phone photos, gallery, or screenshots
                    </p>
                  </>
                )}
              </div>

              <div className="flex-1 space-y-3">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>OpenCLIP / Visual Embedding Vector Matching</span>
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Upload an image of what you lost to find matches
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Our system converts the image into a 128-dimensional perceptual embedding, analyzing color gradients, geometries, and textures to compare against all stored found items using cosine similarity.
                </p>

                {imagePreview && (
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => performImageSearch()}
                      disabled={loading}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      {loading ? "Matching Visual Embeddings..." : "Run AI Image Match"}
                    </button>
                    <button
                      onClick={clearImage}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition-colors"
                    >
                      Clear Image
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {searchMode === "text" && (
          <div className="mb-6 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
            <Search className="w-5 h-5 text-slate-400 ml-2 shrink-0" />
            <input
              type="text"
              placeholder="Search by keywords (e.g. 'MacBook Pro', 'Navy Nike Jacket', 'Subaru key', 'hydro flask')..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") performTextSearch();
              }}
              className="flex-1 text-xs sm:text-sm bg-transparent outline-hidden font-medium"
            />
            {query && (
              <button
                onClick={() => {
                  setQuery("");
                  performTextSearch();
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => performTextSearch()}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors shrink-0"
            >
              Search
            </button>
          </div>
        )}

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs mb-8">
          <div className="flex items-center gap-2 mb-3 text-xs font-bold text-slate-700">
            <SlidersHorizontal className="w-4 h-4 text-blue-600" />
            <span>Filter Catalog</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                Report Type
              </label>
              <select
                value={itemType}
                onChange={(e) => setItemType(e.target.value)}
                className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 font-medium focus:border-blue-500 outline-hidden"
              >
                <option value="all">All Types</option>
                <option value="found">Found Items</option>
                <option value="lost">Lost Reports</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 font-medium focus:border-blue-500 outline-hidden"
              >
                <option value="all">All Categories</option>
                <option value="Electronics">Electronics</option>
                <option value="Wallets & Cards">Wallets & Cards</option>
                <option value="Keys">Keys</option>
                <option value="Accessories">Accessories</option>
                <option value="Books & Notes">Books & Notes</option>
                <option value="Clothing">Clothing</option>
                <option value="Others">Others</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                Campus Location
              </label>
              <select
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 font-medium focus:border-blue-500 outline-hidden"
              >
                <option value="">All Locations</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                Color
              </label>
              <select
                value={colorFilter}
                onChange={(e) => setColorFilter(e.target.value)}
                className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 font-medium focus:border-blue-500 outline-hidden"
              >
                <option value="all">All Colors</option>
                <option value="Black">Black</option>
                <option value="Blue">Blue / Navy</option>
                <option value="Gray">Gray / Space Gray</option>
                <option value="Brown">Brown</option>
                <option value="Teal">Teal / Mint</option>
                <option value="White">White</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 font-medium focus:border-blue-500 outline-hidden"
              >
                <option value="all">All Statuses</option>
                <option value="reported">Reported</option>
                <option value="stored">Stored in Security</option>
                <option value="claim_pending">Claim Pending</option>
                <option value="verified">Verified</option>
                <option value="returned">Returned / Recovered</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 font-medium focus:border-blue-500 outline-hidden"
              >
                <option value="recent">Recently Added</option>
                <option value="location">Campus Location</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-bold text-slate-600">
            Showing <span className="text-slate-900">{items.length}</span> belongings
            {matchResults.length > 0 && " ranked by AI visual embedding cosine similarity"}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="bg-white rounded-2xl h-80 animate-pulse border border-slate-200 p-4">
                <div className="w-full h-44 bg-slate-200 rounded-xl mb-4" />
                <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-slate-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto my-8">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">No Matching Belongings Found</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Try adjusting your search terms or filters. If you recently lost this item, create a lost report so the AI engine alerts you when it is handed in.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link
                href="/report-lost"
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold"
              >
                File Lost Report
              </Link>
              <button
                onClick={() => {
                  setQuery("");
                  setItemType("all");
                  setCategory("all");
                  setLocationId("");
                  setColorFilter("all");
                  setStatusFilter("all");
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium"
              >
                Reset Filters
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item, idx) => {
              const primaryImg = assetUrl(item.images?.[0]?.file_url) || "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&auto=format&fit=crop&q=80";
              const isFound = item.type === "found";
              const match = matchResults.find((m) => m.item.id === item.id);

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col group"
                >
                  <div className="relative h-48 bg-slate-100 overflow-hidden">
                    <img
                      src={primaryImg}
                      alt={item.name}
                      onError={onImgError}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold shadow-xs uppercase tracking-wider ${
                          isFound
                            ? "bg-emerald-600 text-white"
                            : "bg-rose-600 text-white"
                        }`}
                      >
                        {isFound ? "Found" : "Lost"}
                      </span>
                      <span className="px-2 py-1 rounded-full text-[10px] font-semibold bg-white/90 backdrop-blur-xs text-slate-800 shadow-2xs">
                        {item.category}
                      </span>
                    </div>

                    {match && (
                      <button
                        onClick={() => setActiveBreakdown({ scores: match.scores, item })}
                        className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-black bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md hover:scale-105 transition-transform flex items-center gap-1 cursor-pointer"
                        title="Click to view 5-pillar hybrid score breakdown"
                      >
                        <Sparkles className="w-3 h-3 text-amber-300" />
                        <span>{match.scores.overall_similarity}% Sim</span>
                      </button>
                    )}

                    <div className="absolute bottom-3 right-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border backdrop-blur-md ${
                          item.status === "returned"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                            : item.status === "stored"
                            ? "bg-blue-50 text-blue-800 border-blue-300"
                            : "bg-amber-50 text-amber-800 border-amber-300"
                        }`}
                      >
                        {item.status.replace("_", " ").toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium mb-1">
                        <span className="font-mono text-slate-500">{item.tracking_code}</span>
                        <span>{item.date_event}</span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors line-clamp-1">
                        {item.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {item.color && (
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-medium text-slate-600">
                            🎨 {item.color}
                          </span>
                        )}
                        {item.brand && (
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-medium text-slate-600">
                            🏷️ {item.brand}
                          </span>
                        )}
                        {item.model && (
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-medium text-slate-600">
                            ⚙️ {item.model}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium truncate max-w-[180px]">
                        <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className="truncate">{item.location?.name || "Campus Ground"}</span>
                      </div>

                      <Link
                        href={`/items/${item.id}`}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 shrink-0"
                      >
                        View & Claim <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading catalog search...</div>}>
      <SearchPageContent />
    </Suspense>
  );
}
