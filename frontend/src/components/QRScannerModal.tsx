"use client";

import React, { useState, useEffect, useRef } from "react";
import { QrCode, Camera, AlertCircle, Search, CheckCircle2 } from "lucide-react";
import { api } from "../lib/api";
import { Item } from "../lib/types";
import { useRouter } from "next/navigation";

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onItemFound?: (item: Item) => void;
}

export default function QRScannerModal({
  isOpen,
  onClose,
  onItemFound
}: QRScannerModalProps) {
  const router = useRouter();
  const [manualCode, setManualCode] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [scannerActive, setScannerActive] = useState(false);
  const scannerContainerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<any>(null);

  useEffect(() => {
    if (!isOpen) {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {}).finally(() => {
          html5QrCodeRef.current.clear();
        });
      }
      return;
    }

    let scanner: any = null;
    import("html5-qrcode").then(({ Html5Qrcode }) => {
      if (!scannerContainerRef.current) return;
      try {
        scanner = new Html5Qrcode("staff-qr-reader");
        html5QrCodeRef.current = scanner;

        scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (decodedText: string) => {
            handleScanSuccess(decodedText);
          },
          () => {}
        ).then(() => {
          setScannerActive(true);
        }).catch((err: any) => {
          console.warn("Camera start warning:", err);
          setScannerActive(false);
        });
      } catch (e) {
        setScannerActive(false);
      }
    });

    return () => {
      if (scanner) {
        scanner.stop().catch(() => {}).finally(() => {
          try { scanner.clear(); } catch {}
        });
      }
    };
  }, [isOpen]);

  const handleScanSuccess = async (scannedText: string) => {
    try {
      let token = scannedText;
      if (scannedText.startsWith("CAMPUSFIND-ITEM:")) {
        const parts = scannedText.split(":");
        token = parts[2] || parts[1];
      }

      const item = await api.lookupByQrToken(token);
      if (onItemFound) {
        onItemFound(item);
      } else {
        router.push(`/items/${item.id}`);
      }
      onClose();
    } catch (e: any) {
      setErrorMsg(e.message || "Failed to locate item from QR code");
    }
  };

  const handleManualSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;

    setIsSearching(true);
    setErrorMsg("");
    try {
      const item = await api.lookupByQrToken(manualCode.trim());
      if (onItemFound) {
        onItemFound(item);
      } else {
        router.push(`/items/${item.id}`);
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "No item matches that tracking code or QR token");
    } finally {
      setIsSearching(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="p-5 bg-gradient-to-r from-blue-700 to-indigo-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold">Staff QR Code Scanner</h3>
              <p className="text-xs text-blue-100">Scan item label or enter tracking ID</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white text-lg font-bold p-1 rounded-lg hover:bg-white/10"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="relative rounded-2xl overflow-hidden bg-slate-900 border-2 border-dashed border-slate-300 min-h-[240px] flex items-center justify-center">
            <div id="staff-qr-reader" ref={scannerContainerRef} className="w-full h-full" />
            {!scannerActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-slate-400 bg-slate-900/90 z-10">
                <QrCode className="w-12 h-12 mb-2 text-slate-500 animate-pulse" />
                <p className="text-xs font-medium text-slate-300">Position QR code in view</p>
                <p className="text-[11px] text-slate-500 mt-1">Or use manual tracking ID below</p>
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 pt-4">
            <span className="block text-xs font-bold text-slate-700 mb-2">
              Or Lookup by Item Tracking Code:
            </span>
            <form onSubmit={handleManualSearch} className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. CF-2026-MCB401"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                className="flex-1 text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-hidden font-mono uppercase"
              />
              <button
                type="submit"
                disabled={isSearching}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Search className="w-3.5 h-3.5" />
                {isSearching ? "Searching..." : "Lookup"}
              </button>
            </form>
          </div>
        </div>

        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
