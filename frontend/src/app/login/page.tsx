"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Compass, AlertCircle, Sparkles } from "lucide-react";
import { useAuth } from "../../lib/authContext";

type Role = "student" | "staff" | "admin";
const DEMOS: [Role, string, string][] = [
  ["student", "🎒 Student", "Aarav Sharma"],
  ["staff", "🛡️ Proctor / Staff", "Vikram Singh"],
  ["admin", "⚡ Director", "Dr. Rajesh Gupta"],
];
const HOME: Record<Role, string> = { student: "/dashboard", staff: "/staff", admin: "/admin" };
const INPUT = "w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30 outline-hidden font-medium";

export default function LoginPage() {
  const router = useRouter();
  const { login, demoLogin } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const run = async (action: () => Promise<unknown>, to: string, fallback: string) => {
    setIsSubmitting(true);
    setErrorMsg("");
    try {
      await action();
      router.push(to);
    } catch (err: any) {
      setErrorMsg(err.message || fallback);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) run(() => login(email, password), "/dashboard", "Invalid email or password");
  };
  const handleQuickDemo = (role: Role) => run(() => demoLogin(role), HOME[role], `Failed to switch to ${role}`);

  return (
    <div className="hero-glow min-h-screen flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-full glow-btn flex items-center justify-center">
              <Compass className="w-6 h-6" />
            </div>
            <span className="text-2xl font-semibold text-white">CampusRadar</span>
          </Link>
          <h1 className="thin-title text-2xl text-white">ABES EC Portal Sign In</h1>
          <p className="text-xs text-slate-500 mt-1">ABES Engineering College, Ghaziabad — Lost & Found Management System</p>
        </div>

        <div className="glass rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-200 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Instant Evaluator Demo Accounts (1-Click):</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {DEMOS.map(([role, label, name]) => (
              <button
                key={role}
                onClick={() => handleQuickDemo(role)}
                disabled={isSubmitting}
                className="p-2.5 rounded-xl ghost-btn hover:bg-blue-500/30 text-xs font-bold transition-all text-center flex flex-col items-center gap-1"
              >
                <span>{label}</span>
                <span className="text-[10px] text-slate-400">{name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="glass rounded-3xl p-6 sm:p-8 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              ["College Email", "email", "aarav.sharma@abes.ac.in", email, setEmail],
              ["Password", "password", "••••••••", password, setPassword],
            ].map(([label, type, placeholder, value, set]: any) => (
              <div key={label}>
                <label className="block text-xs font-bold text-slate-700 mb-1">{label}</label>
                <input type={type} placeholder={placeholder} value={value} onChange={(e) => set(e.target.value)} className={INPUT} required />
              </div>
            ))}
            <button type="submit" disabled={isSubmitting} className="glow-btn w-full py-3 rounded-full text-xs font-semibold flex items-center justify-center gap-2">
              {isSubmitting ? "Authenticating..." : "Sign In to CampusRadar"}
            </button>
          </form>

          <div className="pt-2 text-center text-xs text-slate-500 border-t border-slate-200">
            <span>Don&apos;t have an account yet? </span>
            <span className="font-bold text-blue-400 cursor-pointer hover:underline" onClick={() => handleQuickDemo("student")}>
              Use 1-click student demo above
            </span>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link href="/" className="text-xs font-semibold text-slate-500 hover:text-white">&larr; Back to CampusRadar Home</Link>
        </div>
      </div>
    </div>
  );
}
