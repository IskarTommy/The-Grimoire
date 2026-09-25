"use client";

import { useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  Sparkles,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  BookmarkCheck,
  Compass,
  Trophy,
  Zap,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { GrimoireLogo } from "@/components/ui/grimoire-logo";
import { cn } from "@/lib/utils";

function getPasswordStrength(pass: string): { score: number; label: string; color: string } {
  if (!pass) return { score: 0, label: "", color: "" };
  let score = 0;
  if (pass.length >= 6) score += 1;
  if (pass.length >= 10) score += 1;
  if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
  if (/[0-9]/.test(pass)) score += 1;
  if (/[^A-Za-z0-9]/.test(pass)) score += 1;

  if (score <= 1) return { score: 1, label: "Weak", color: "bg-red-500" };
  if (score <= 3) return { score: 2, label: "Fair", color: "bg-amber-500" };
  if (score === 4) return { score: 3, label: "Good", color: "bg-emerald-500" };
  return { score: 4, label: "Strong", color: "bg-gradient-to-r from-violet-500 to-fuchsia-500" };
}

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/";

  const { signup } = useAuth();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!username.trim() || username.length < 3) {
      setError("Username must be at least 3 characters long.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Please provide a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await signup(username, email, password);
      setSuccess(true);
      setTimeout(() => {
        router.push(redirectUrl);
      }, 500);
    } catch (err: any) {
      setError(err?.message || "Sign-up failed. Please check your information.");
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Top Back Navigation */}
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-white/60 hover:text-white transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span>Back to Grimoire Home</span>
        </Link>
      </div>

      {/* Brand Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <GrimoireLogo size={44} />
          <div>
            <span className="font-display text-xl font-bold tracking-tight text-white block">
              Grimoire
            </span>
            <span className="text-[11px] font-semibold text-fuchsia-400 tracking-wider uppercase">
              Begin Your Journey
            </span>
          </div>
        </div>

        <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
          Create Account
        </h1>
        <p className="mt-2 text-sm text-white/60 leading-relaxed">
          Inscribe your name into the Grimoire to unlock your personal library and sync reading milestones.
        </p>
      </div>

      {/* Error Notification */}
      {error && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-200 animate-in fade-in slide-in-from-top-2 duration-200">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
          <p className="leading-tight flex-1 font-medium">{error}</p>
        </div>
      )}

      {/* Success Notification */}
      {success && (
        <div className="mb-5 flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-200 animate-in fade-in duration-200">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          <p className="leading-tight font-medium">Grimoire inscribed! Preparing your sanctuary...</p>
        </div>
      )}

      {/* Form Fields */}
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Username */}
        <div>
          <label className="block text-xs font-semibold text-white/80 mb-1 ml-1">
            Username
          </label>
          <div className="relative flex items-center">
            <User className="absolute left-3.5 h-4 w-4 text-white/40 pointer-events-none" />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. shadow_mage"
              autoComplete="username"
              disabled={loading || success}
              className="w-full rounded-2xl border border-white/10 bg-white/[0.04] py-3 pl-10 pr-4 text-sm text-white placeholder-white/30 transition-all focus:border-fuchsia-500 focus:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 disabled:opacity-50"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-semibold text-white/80 mb-1 ml-1">
            Email Address
          </label>
          <div className="relative flex items-center">
            <Mail className="absolute left-3.5 h-4 w-4 text-white/40 pointer-events-none" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="reader@grimoire.app"
              autoComplete="email"
              disabled={loading || success}
              className="w-full rounded-2xl border border-white/10 bg-white/[0.04] py-3 pl-10 pr-4 text-sm text-white placeholder-white/30 transition-all focus:border-fuchsia-500 focus:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 disabled:opacity-50"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-semibold text-white/80 mb-1 ml-1">
            Password
          </label>
          <div className="relative flex items-center">
            <Lock className="absolute left-3.5 h-4 w-4 text-white/40 pointer-events-none" />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              autoComplete="new-password"
              disabled={loading || success}
              className="w-full rounded-2xl border border-white/10 bg-white/[0.04] py-3 pl-10 pr-11 text-sm text-white placeholder-white/30 transition-all focus:border-fuchsia-500 focus:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              className="absolute right-3.5 text-white/40 hover:text-white transition-colors cursor-pointer"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Dynamic Password Strength Indicator */}
          {password && (
            <div className="mt-1.5 space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-white/50 flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" /> Strength:
                </span>
                <span className="font-semibold text-white/80">{passwordStrength.label}</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 h-1">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={cn(
                      "rounded-full transition-all duration-300",
                      step <= passwordStrength.score ? passwordStrength.color : "bg-white/10"
                    )}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-xs font-semibold text-white/80 mb-1 ml-1">
            Confirm Password
          </label>
          <div className="relative flex items-center">
            <Lock className="absolute left-3.5 h-4 w-4 text-white/40 pointer-events-none" />
            <input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••••••"
              autoComplete="new-password"
              disabled={loading || success}
              className={cn(
                "w-full rounded-2xl border bg-white/[0.04] py-3 pl-10 pr-10 text-sm text-white placeholder-white/30 transition-all focus:outline-none focus:ring-2 disabled:opacity-50",
                passwordsMismatch
                  ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/20"
                  : passwordsMatch
                  ? "border-emerald-500/50 focus:border-emerald-500 focus:ring-emerald-500/20"
                  : "border-white/10 focus:border-fuchsia-500 focus:bg-white/[0.07] focus:ring-fuchsia-500/20"
              )}
            />
            {passwordsMatch && (
              <CheckCircle2 className="absolute right-3.5 h-4 w-4 text-emerald-400" />
            )}
          </div>
          {passwordsMismatch && (
            <p className="mt-1 text-[11px] text-red-400 ml-1">Passwords do not match</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || success}
          className="w-full mt-2 cursor-pointer rounded-2xl bg-gradient-to-r from-fuchsia-600 to-violet-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-fuchsia-600/30 transition-all hover:brightness-110 hover:shadow-fuchsia-600/40 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Inscribing Grimoire...</span>
            </>
          ) : success ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              <span>Sanctuary Ready!</span>
            </>
          ) : (
            <span>Create Sanctuary Account</span>
          )}
        </button>
      </form>

      {/* Switch to Sign In */}
      <div className="mt-6 text-center pt-5 border-t border-white/10">
        <p className="text-xs text-white/60">
          Already have an account?{" "}
          <Link
            href={`/login${redirectUrl !== "/" ? `?redirect=${encodeURIComponent(redirectUrl)}` : ""}`}
            className="font-semibold text-fuchsia-400 hover:text-fuchsia-300 transition-colors underline underline-offset-4 ml-1"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <div className="relative min-h-screen w-full grid grid-cols-1 lg:grid-cols-2 bg-[#06070b] text-foreground overflow-hidden">
      {/* Unified Atmospheric Glows bridging across both halves seamlessly */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[850px] rounded-full bg-fuchsia-600/[0.10] blur-[180px]" />
      <div className="pointer-events-none absolute -top-40 right-0 w-[600px] h-[600px] rounded-full bg-violet-600/[0.08] blur-[160px]" />
      <div className="pointer-events-none absolute -bottom-40 left-0 w-[600px] h-[600px] rounded-full bg-indigo-600/[0.08] blur-[160px]" />

      {/* Left Column: Form */}
      <div className="relative flex flex-col justify-center px-6 py-10 sm:px-12 lg:px-16 xl:px-24 z-10">
        <Suspense fallback={<div className="text-white/60 text-sm">Loading...</div>}>
          <SignupForm />
        </Suspense>
      </div>

      {/* Right Column: Seamless Info Showcase (Blended smoothly with left canvas) */}
      <div className="hidden lg:flex relative flex-col justify-between p-12 xl:p-16 z-10 overflow-hidden bg-gradient-to-l from-fuchsia-950/20 via-white/[0.01] to-transparent">
        {/* Soft subtle ambient accent */}
        <div className="pointer-events-none absolute top-1/4 right-0 h-96 w-96 rounded-full bg-fuchsia-500/[0.12] blur-[140px]" />

        {/* Top Feature Pill */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-500/25 bg-fuchsia-500/10 px-3.5 py-1.5 text-xs font-semibold text-fuchsia-300 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-violet-400" />
            <span>Join 50,000+ Readers</span>
          </div>
          <span className="text-xs text-white/40 font-mono">100% Free Sanctuary</span>
        </div>

        {/* Center Showcase Content */}
        <div className="relative z-10 my-auto max-w-lg">
          {/* Hero Open Grimoire Emblem (floating seamlessly without box clipping) */}
          <div className="mb-7 relative inline-flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-fuchsia-500/25 blur-3xl animate-pulse" />
            <GrimoireLogo size={88} className="relative drop-shadow-[0_0_35px_rgba(217,70,239,0.45)]" />
          </div>

          <h2 className="font-display text-3xl xl:text-4xl font-extrabold text-white leading-tight">
            One Account. Infinite Manga Realms.
          </h2>
          <p className="mt-4 text-sm text-white/60 leading-relaxed">
            Never lose your place again. Sync your reading lists, track releases as chapters drop, and curate your top-tier collection.
          </p>

          {/* 3 Value Highlights with smooth glassmorphism */}
          <div className="mt-8 space-y-3.5">
            <div className="flex items-start gap-3.5 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 backdrop-blur-md transition-all duration-300 hover:bg-white/[0.04] hover:border-fuchsia-500/20 hover:translate-x-1">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20">
                <BookmarkCheck className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Instant Cross-Device Sync</h4>
                <p className="text-[11px] text-white/50 mt-0.5 leading-normal">
                  Your bookmarks and reading history follow you seamlessly across desktop, tablet, and mobile.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 backdrop-blur-md transition-all duration-300 hover:bg-white/[0.04] hover:border-violet-500/20 hover:translate-x-1">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
                <Trophy className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Curated Rankings & Clean Data</h4>
                <p className="text-[11px] text-white/50 mt-0.5 leading-normal">
                  Zero adult content in public feeds, authentic manga priority, and accurate AniList community ratings.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 backdrop-blur-md transition-all duration-300 hover:bg-white/[0.04] hover:border-amber-500/20 hover:translate-x-1">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Zap className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Fast & Responsive Architecture</h4>
                <p className="text-[11px] text-white/50 mt-0.5 leading-normal">
                  Lightweight caching layer delivers search results and page navigation in under 15ms.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Reader Note */}
        <div className="relative z-10 pt-6 border-t border-white/[0.06] flex items-center justify-between text-xs text-white/40">
          <p className="italic">"The true magic lies in the stories we remember."</p>
          <span className="font-semibold text-white/60">Grimoire Sanctuary</span>
        </div>
      </div>
    </div>
  );
}
