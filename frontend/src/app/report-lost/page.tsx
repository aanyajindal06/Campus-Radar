"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import {
  PlusCircle,
  Camera,
  Upload,
  MapPin,
  Calendar,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRight,
  ArrowLeft
} from "lucide-react";
import { api } from "../../lib/api";
import { Location } from "../../lib/types";
import { useAuth } from "../../lib/authContext";

export default function ReportLostPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [locations, setLocations] = useState<Location[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [name, setName] = useState("");
  const [category, setCategory] = useState("Electronics");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [weight, setWeight] = useState("");
  const [material, setMaterial] = useState("");
  const [distinguishingFeatures, setDistinguishingFeatures] = useState("");
  
  const [locationId, setLocationId] = useState<number | "">("");
  const [buildingRoom, setBuildingRoom] = useState("");
  const [dateEvent, setDateEvent] = useState("2026-11-21");
  const [timeEvent, setTimeEvent] = useState("14:00");
  const [contactPreference, setContactPreference] = useState("in_app");

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.getLocations().then(setLocations).catch(() => {});
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    const newFiles = [...selectedFiles, ...files];
    setSelectedFiles(newFiles);

    const newPreviews = files.map((f) => URL.createObjectURL(f));
    setPreviewUrls((prev) => [...prev, ...newPreviews]);
  };

  const removeFile = (idx: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== idx));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!name.trim() || !category || !description.trim()) {
        setErrorMsg("Please provide an item name, category, and description.");
        return;
      }
    } else if (currentStep === 2) {
      if (!locationId || !dateEvent) {
        setErrorMsg("Please select the campus building and the date lost.");
        return;
      }
    }
    setErrorMsg("");
    setCurrentStep((s) => s + 1);
  };

  const handleBack = () => {
    setErrorMsg("");
    setCurrentStep((s) => s - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const formData = new FormData();
      formData.append("type", "lost");
      formData.append("name", name.trim());
      formData.append("category", category);
      formData.append("description", description.trim());
      if (color.trim()) formData.append("color", color.trim());
      if (brand.trim()) formData.append("brand", brand.trim());
      if (model.trim()) formData.append("model", model.trim());
      if (weight.trim()) formData.append("weight", weight.trim());
      if (material.trim()) formData.append("material", material.trim());
      if (distinguishingFeatures.trim()) {
        formData.append("distinguishing_features", distinguishingFeatures.trim());
      }
      if (locationId) formData.append("location_id", locationId.toString());
      if (buildingRoom.trim()) formData.append("building_room", buildingRoom.trim());
      formData.append("date_event", dateEvent);
      if (timeEvent.trim()) formData.append("time_event", timeEvent.trim());
      formData.append("contact_preference", contactPreference);

      selectedFiles.forEach((file) => {
        formData.append("images", file);
      });

      const created = await api.createItem(formData);
      router.push(`/items/${created.id}?created=true`);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to submit lost report");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 w-full flex-1">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold uppercase tracking-wider mb-2">
            <PlusCircle className="w-3.5 h-3.5" /> File Lost Report
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Report a Lost Belonging
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
            Provide details and photos. Our hybrid AI matcher will compare against incoming found items 24/7 and notify you.
          </p>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
            <span className={currentStep >= 1 ? "text-rose-600 font-extrabold" : ""}>
              1. Item Specs
            </span>
            <span className={currentStep >= 2 ? "text-rose-600 font-extrabold" : ""}>
              2. Location & Date
            </span>
            <span className={currentStep >= 3 ? "text-rose-600 font-extrabold" : ""}>
              3. Visuals & Details
            </span>
            <span className={currentStep >= 4 ? "text-rose-600 font-extrabold" : ""}>
              4. Review & Submit
            </span>
          </div>
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div
              className="bg-rose-600 h-full transition-all duration-300 rounded-full"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          {errorMsg && (
            <div className="p-3 mb-6 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
                Step 1: Item Description & Category
              </h2>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Item Name / Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dell XPS 15 Laptop, Navy Blue Hydro Flask, Brown Fossil Wallet"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-hidden"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 font-medium focus:border-rose-500 outline-hidden"
                  >
                    <option value="Electronics">Electronics (Laptop, Phone, Headphones)</option>
                    <option value="Wallets & Cards">Wallets, Student IDs & Cards</option>
                    <option value="Keys">Keys & Keychains</option>
                    <option value="Accessories">Accessories & Water Bottles</option>
                    <option value="Books & Notes">Books, Notebooks & Calculators</option>
                    <option value="Clothing">Clothing & Jackets</option>
                    <option value="Others">Others</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Primary Color
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Space Gray, Matte Black, Cobalt Blue"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-rose-500 outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Brand / Manufacturer
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Apple, Sony, Dell, Hydro Flask"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-rose-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Model / Generation (if known)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. MacBook Pro 14 M2, WH-1000XM5"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-rose-500 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Detailed Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  placeholder="Describe your item in detail: what does it look like, stickers, case color, scratches, contents..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-hidden placeholder:text-slate-400"
                  required
                />
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
                Step 2: Last-Seen Campus Location & Date
              </h2>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Campus Building / Zone <span className="text-rose-500">*</span>
                </label>
                <select
                  value={locationId}
                  onChange={(e) => setLocationId(Number(e.target.value))}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 font-medium focus:border-rose-500 outline-hidden"
                  required
                >
                  <option value="">-- Choose Campus Building --</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} ({loc.building})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Specific Floor, Room, or Landmark
                </label>
                <input
                  type="text"
                  placeholder="e.g. 3rd Floor quiet study area, Room 302 Desk 14, Food Court"
                  value={buildingRoom}
                  onChange={(e) => setBuildingRoom(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-rose-500 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Date Lost <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={dateEvent}
                    onChange={(e) => setDateEvent(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-rose-500 outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Approximate Time
                  </label>
                  <input
                    type="time"
                    value={timeEvent}
                    onChange={(e) => setTimeEvent(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-rose-500 outline-hidden"
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4 animate-in fade-in">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
                Step 3: Photographs & Distinguishing Traits
              </h2>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Upload Photos of the Item (Existing Photos or Similar Stock Picture)
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-rose-400 bg-slate-50 p-6 rounded-xl text-center cursor-pointer transition-colors"
                >
                  <Camera className="w-8 h-8 text-rose-500 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-800">
                    Click to select photos from device or camera
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Upload multiple angles (JPG, PNG, WebP)
                  </p>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    multiple
                    className="hidden"
                  />
                </div>

                {previewUrls.length > 0 && (
                  <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {previewUrls.map((url, i) => (
                      <div key={i} className="relative h-24 rounded-xl overflow-hidden border border-slate-200 group">
                        <img src={url} alt={`Upload preview ${i}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeFile(i)}
                          className="absolute top-1 right-1 bg-rose-600 text-white rounded-full p-1 opacity-90 hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Distinguishing Features & Marks
                </label>
                <textarea
                  placeholder="e.g. Stickers (GitHub Octocat), cracked corner on case, initial engraving, keychain attached..."
                  value={distinguishingFeatures}
                  onChange={(e) => setDistinguishingFeatures(e.target.value)}
                  rows={3}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-rose-500 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Material
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Aluminum, Leather, Plastic, Stainless Steel"
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-rose-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Weight / Size
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1.6 kg, 32 oz, Size Medium"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-rose-500 outline-hidden"
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4 animate-in fade-in">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
                Step 4: Contact Preference & Review
              </h2>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  How should Campus Safety or Finders notify you?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setContactPreference("in_app")}
                    className={`p-3 rounded-xl border text-xs font-semibold text-center transition-colors ${
                      contactPreference === "in_app"
                        ? "border-rose-500 bg-rose-50 text-rose-800"
                        : "border-slate-200 bg-slate-50 text-slate-700"
                    }`}
                  >
                    In-App Alerts
                  </button>
                  <button
                    type="button"
                    onClick={() => setContactPreference("email")}
                    className={`p-3 rounded-xl border text-xs font-semibold text-center transition-colors ${
                      contactPreference === "email"
                        ? "border-rose-500 bg-rose-50 text-rose-800"
                        : "border-slate-200 bg-slate-50 text-slate-700"
                    }`}
                  >
                    College Email
                  </button>
                  <button
                    type="button"
                    onClick={() => setContactPreference("phone")}
                    className={`p-3 rounded-xl border text-xs font-semibold text-center transition-colors ${
                      contactPreference === "phone"
                        ? "border-rose-500 bg-rose-50 text-rose-800"
                        : "border-slate-200 bg-slate-50 text-slate-700"
                    }`}
                  >
                    Phone Call
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Item:</span>
                  <strong className="text-slate-800">{name}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Category:</span>
                  <span className="text-slate-800 font-medium">{category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Location:</span>
                  <span className="text-slate-800 font-medium">
                    {locations.find((l) => l.id === Number(locationId))?.name || "Campus"} ({buildingRoom || "General"})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date Lost:</span>
                  <span className="text-slate-800 font-medium">{dateEvent} at {timeEvent}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Photos attached:</span>
                  <span className="text-slate-800 font-medium">{selectedFiles.length} file(s)</span>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-blue-900">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p>
                  Upon submission, CampusRadar immediately runs the 5-pillar hybrid matching engine against all found items in campus storage vaults.
                </p>
              </div>
            </div>
          )}

          <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl flex items-center gap-1 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
            ) : <div />}

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 transition-all"
              >
                Continue <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-700 hover:to-indigo-700 text-white rounded-xl text-xs font-extrabold shadow-md flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                {isSubmitting ? "Generating AI Embeddings..." : "Submit Lost Item Report"}
              </button>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
