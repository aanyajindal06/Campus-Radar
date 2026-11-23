"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import {
  Sparkles,
  Camera,
  Upload,
  Lock,
  QrCode,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRight,
  ArrowLeft,
  Award
} from "lucide-react";
import { api, getMediaUrl } from "../../lib/api";
import { Location } from "../../lib/types";
import { useAuth } from "../../lib/authContext";
import confetti from "canvas-confetti";

export default function ReportFoundPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [locations, setLocations] = useState<Location[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successData, setSuccessData] = useState<any>(null);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("Electronics");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [weight, setWeight] = useState("");
  const [material, setMaterial] = useState("");
  const [distinguishingFeatures, setDistinguishingFeatures] = useState("");
  const [privateDetails, setPrivateDetails] = useState("");
  
  const [locationId, setLocationId] = useState<number | "">("");
  const [buildingRoom, setBuildingRoom] = useState("");
  const [storageLocation, setStorageLocation] = useState("Security Office Main Desk");
  const [dateEvent, setDateEvent] = useState("2026-11-21");
  const [timeEvent, setTimeEvent] = useState("12:00");
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
        setErrorMsg("Please provide an item name, category, and public description.");
        return;
      }
    } else if (currentStep === 2) {
      if (!locationId || !dateEvent) {
        setErrorMsg("Please select the campus building where found and the date.");
        return;
      }
    } else if (currentStep === 3) {
      if (!privateDetails.trim()) {
        setErrorMsg("Please enter private identifying details (hidden scratches, stickers, or marks) for verification security.");
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
      formData.append("type", "found");
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
      formData.append("private_details", privateDetails.trim());
      if (locationId) formData.append("location_id", locationId.toString());
      if (buildingRoom.trim()) formData.append("building_room", buildingRoom.trim());
      if (storageLocation.trim()) formData.append("storage_location", storageLocation.trim());
      formData.append("date_event", dateEvent);
      if (timeEvent.trim()) formData.append("time_event", timeEvent.trim());
      formData.append("contact_preference", contactPreference);

      selectedFiles.forEach((file) => {
        formData.append("images", file);
      });

      const created = await api.createItem(formData);
      
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      refreshUser();
      setSuccessData(created);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to submit found report");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 w-full flex-1">
        {successData ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8 text-center space-y-6 animate-in fade-in">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold uppercase">
                <Award className="w-4 h-4 text-amber-600" /> +10 Reward Points Added!
              </div>
              <h1 className="text-2xl font-black text-slate-900">Found Item Successfully Logged</h1>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Thank you for contributing to campus safety. Your found report is now live, and the item has been assigned a secure staff verification QR code.
              </p>
            </div>

            <div className="max-w-xs mx-auto bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 block mb-2 uppercase tracking-wider">
                Staff Item Vault QR
              </span>
              {successData.qr_image_url ? (
                <div className="p-3 bg-white rounded-xl shadow-xs border border-slate-200 inline-block">
                  <img
                    src={getMediaUrl(successData.qr_image_url)}
                    alt="Generated Item QR"
                    className="w-44 h-44 object-contain mx-auto"
                  />
                </div>
              ) : (
                <div className="w-44 h-44 bg-slate-200 rounded-xl flex items-center justify-center mx-auto">
                  <QrCode className="w-12 h-12 text-slate-400" />
                </div>
              )}
              <div className="mt-3">
                <p className="font-mono text-sm font-bold text-blue-700">{successData.tracking_code}</p>
                <p className="text-[11px] text-slate-400">Attach label or show QR at security desk</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={() => router.push(`/items/${successData.id}`)}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-all"
              >
                View Item Listing
              </button>
              <button
                onClick={() => router.push("/dashboard")}
                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
              >
                Go to My Dashboard
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-8 text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Earn +10 Reward Points
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                Report a Found Belonging
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
                Help reunite a fellow campus member with their lost belongings. An official QR tracking code is automatically created.
              </p>
            </div>

            <div className="mb-8">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
                <span className={currentStep >= 1 ? "text-emerald-600 font-extrabold" : ""}>
                  1. Public Details
                </span>
                <span className={currentStep >= 2 ? "text-emerald-600 font-extrabold" : ""}>
                  2. Found Location
                </span>
                <span className={currentStep >= 3 ? "text-emerald-600 font-extrabold" : ""}>
                  3. Hidden Evidence
                </span>
                <span className={currentStep >= 4 ? "text-emerald-600 font-extrabold" : ""}>
                  4. Storage & Submit
                </span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-600 h-full transition-all duration-300 rounded-full"
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
                    Step 1: Public Listing Information
                  </h2>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Item Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Apple MacBook Pro 14 Space Gray, Cobalt Hydro Flask, Car Keys"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-hidden"
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
                        className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 font-medium focus:border-emerald-500 outline-hidden"
                      >
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
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Color
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Black, Blue, Silver"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-emerald-500 outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Brand
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Apple, Sony, Nike"
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-emerald-500 outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Model (if visible)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. WH-1000XM5, TI-84 Plus CE"
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-emerald-500 outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Public Description <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      placeholder="General description visible on the public board (e.g. 'Found under a desk on 3rd floor...'). Do NOT include private serial numbers or unique stickers here!"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-hidden"
                      required
                    />
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-4 animate-in fade-in">
                  <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
                    Step 2: Campus Location & Finding Time
                  </h2>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Campus Building Where Found <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={locationId}
                      onChange={(e) => setLocationId(Number(e.target.value))}
                      className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 font-medium focus:border-emerald-500 outline-hidden"
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
                      Specific Location / Room
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Room 302 Desk 14, Near vending machine, Basketball court bench"
                      value={buildingRoom}
                      onChange={(e) => setBuildingRoom(e.target.value)}
                      className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-emerald-500 outline-hidden"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Date Found <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={dateEvent}
                        onChange={(e) => setDateEvent(e.target.value)}
                        className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-emerald-500 outline-hidden"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Exact Time Found
                      </label>
                      <input
                        type="time"
                        value={timeEvent}
                        onChange={(e) => setTimeEvent(e.target.value)}
                        className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-emerald-500 outline-hidden"
                      />
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-4 animate-in fade-in">
                  <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
                    Step 3: Private Ownership Evidence & Photographs
                  </h2>

                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-900">
                    <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Confidential Security Gate:</strong>
                      <p className="mt-0.5 leading-relaxed">
                        These details will <strong>NEVER</strong> be displayed publicly. Only authorized college staff can view this when verifying an owner's claim.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Private Identifying Marks / Evidence <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      placeholder="List confidential traits: e.g. 'Octocat sticker on lower right, small scratch near port, lock screen emergency contact initials A.R., specific key attached to ring...'"
                      value={privateDetails}
                      onChange={(e) => setPrivateDetails(e.target.value)}
                      rows={4}
                      className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-hidden"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Photographs of the Item (For AI Visual Embedding Extraction)
                    </label>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-300 hover:border-emerald-400 bg-slate-50 p-6 rounded-xl text-center cursor-pointer transition-colors"
                    >
                      <Camera className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-800">
                        Take or upload photo of the found item
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
                          <div key={i} className="relative h-24 rounded-xl overflow-hidden border border-slate-200">
                            <img src={url} alt={`Upload ${i}`} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => removeFile(i)}
                              className="absolute top-1 right-1 bg-rose-600 text-white rounded-full p-1 opacity-90"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-4 animate-in fade-in">
                  <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
                    Step 4: Current Storage Location & Submit
                  </h2>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Current Physical Storage Location <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Deposited at Security Office Locker B-14, Library Help Desk Shelf 2"
                      value={storageLocation}
                      onChange={(e) => setStorageLocation(e.target.value)}
                      className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-emerald-500 outline-hidden"
                      required
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Where is the item currently safely kept so campus staff can manage it?
                    </span>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Item:</span>
                      <strong className="text-slate-800">{name}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Building:</span>
                      <span className="text-slate-800 font-medium">
                        {locations.find((l) => l.id === Number(locationId))?.name || "Campus"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Storage Desk:</span>
                      <span className="text-slate-800 font-medium">{storageLocation}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Reward Reward:</span>
                      <strong className="text-emerald-700">+10 Points on Submit, +50 on Verified Return</strong>
                    </div>
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
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 transition-all"
                  >
                    Continue <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl text-xs font-extrabold shadow-md flex items-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? "Generating QR & Storing..." : "Submit Report & Generate QR Code"}
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
