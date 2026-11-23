import type { Metadata } from "next";
import "./globals.css";
import Providers from "../components/Providers";

export const metadata: Metadata = {
  title: "CampusRadar | Smart Lost & Found for Colleges",
  description: "AI-Powered Lost & Found Management System for University Campuses with Visual Image Matching, Leaflet GPS Tracking, and Staff QR Vaults.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body className="min-h-full flex flex-col text-slate-900 font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
