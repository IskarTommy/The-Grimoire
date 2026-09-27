"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  Sparkles,
  AlertCircle,
  Loader2,
  CheckCircle2,
  BookOpen,
  Compass,
  BookmarkCheck,
  Flame,
  Shield,
  Layers,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { GrimoireLogo } from "@/components/ui/grimoire-logo";
import { GrimoireBrand } from "@/components/ui/grimoire-brand";
import { cn } from "@/lib/utils";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/";

  const { login } = useAuth();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setError("Please provide both your username/email and password.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await login(identifier, password);
      setSuccess(true);
      setTimeout(() => {
        router.push(redirectUrl);
      }, 500);
    } catch (err: any) {
      setError(err?.message || "Invalid credentials. Please verify your details.");
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Top Back Navigation */}
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-white/60 hover:text-white transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span>Back to Grimoire Home</span>
        </Link>
      </div>

      {/* Brand Header */}
      <div className="mb-8">
        <div className="mb-6">
          <GrimoireBrand
            href="/"
            size="md"
            subscriptText="グリモワール • READER SANCTUARY"
          />
        </div>

        <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
          Welcome back
        </h1>
        <p className="mt-2 text-sm text-white/60 leading-relaxed">
          Sign in to access your personal reading library, track chapters, and sync your bookmarks.
        </p>
      </div>

      {/* Error Notification */}
      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-200 animate-in fade-in slide-in-from-top-2 duration-200">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
          <p className="leading-tight flex-1 font-medium">{error}</p>
        </div>
      )}

      {/* Success Notification */}
      {success && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-200 animate-in fade-in duration-200">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          <p className="leading-tight font-medium">Credentials verified! Opening your Grimoire...</p>
        </div>
      )}

      {/* Form Fields */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-white/80 mb-1.5 ml-1">
            Username or Email
          </label>
          <div className="relative flex items-center">
            <User className="absolute left-3.5 h-4 w-4 text-white/40 pointer-events-none" />
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="e.g. shadow_reader or email"
              autoComplete="username"
              disabled={loading || success}
              className="w-full rounded-2xl border border-white/10 bg-white/[0.04] py-3.5 pl-10 pr-4 text-sm text-white placeholder-white/30 transition-all focus:border-violet-500 focus:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-violet-500/20 disabled:opacity-50"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5 ml-1">
            <label className="block text-xs font-semibold text-white/80">
              Password
            </label>
          </div>
          <div className="relative flex items-center">
            <Lock className="absolute left-3.5 h-4 w-4 text-white/40 pointer-events-none" />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              autoComplete="current-password"
              disabled={loading || success}
              className="w-full rounded-2xl border border-white/10 bg-white/[0.04] py-3.5 pl-10 pr-11 text-sm text-white placeholder-white/30 transition-all focus:border-violet-500 focus:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-violet-500/20 disabled:opacity-50"
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
        </div>

        {/* Remember Me */}
        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-white/5 text-violet-600 focus:ring-violet-500/30 focus:ring-offset-0"
            />
            <span className="text-xs text-white/60 hover:text-white/80 transition-colors">
              Remember me
            </span>
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || success}
          className="w-full mt-3 cursor-pointer rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-600/30 transition-all hover:brightness-110 hover:shadow-violet-600/40 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Opening Grimoire...</span>
            </>
          ) : success ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              <span>Redirecting...</span>
            </>
          ) : (
            <span>Sign In to Sanctuary</span>
          )}
        </button>
      </form>

      {/* Switch to Sign Up */}
      <div className="mt-8 text-center pt-6 border-t border-white/10">
        <p className="text-xs text-white/60">
          Don't have an account yet?{" "}
          <Link
            href={`/signup${redirectUrl !== "/" ? `?redirect=${encodeURIComponent(redirectUrl)}` : ""}`}
            className="font-semibold text-violet-400 hover:text-violet-300 transition-colors underline underline-offset-4 ml-1"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="relative min-h-screen w-full grid grid-cols-1 lg:grid-cols-2 bg-[#06070b] text-foreground overflow-hidden">
      {/* Unified Atmospheric Glows bridging across both halves seamlessly */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[850px] rounded-full bg-violet-600/[0.10] blur-[180px]" />
      <div className="pointer-events-none absolute -top-40 right-0 w-[600px] h-[600px] rounded-full bg-fuchsia-600/[0.08] blur-[160px]" />
      <div className="pointer-events-none absolute -bottom-40 left-0 w-[600px] h-[600px] rounded-full bg-indigo-600/[0.08] blur-[160px]" />

      {/* Left Column: Form */}
      <div className="relative flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16 xl:px-24 z-10">
        <Suspense fallback={<div className="text-white/60 text-sm">Loading...</div>}>
          <LoginForm />
        </Suspense>
      </div>

      {/* Right Column: Seamless Info Showcase (Blended smoothly with left canvas) */}
      <div className="hidden lg:flex relative flex-col justify-between p-12 xl:p-16 z-10 overflow-hidden bg-gradient-to-l from-violet-950/25 via-white/[0.01] to-transparent">
        {/* Soft subtle ambient accent */}
        <div className="pointer-events-none absolute top-1/4 right-0 h-96 w-96 rounded-full bg-violet-500/[0.12] blur-[140px]" />

        {/* Top Feature Pill */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/25 bg-violet-500/10 px-3.5 py-1.5 text-xs font-semibold text-violet-300 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-fuchsia-400" />
            <span>The Reader's Digital Sanctuary</span>
          </div>
          <span className="text-xs text-white/40 font-mono">v1.2 Discovery Engine</span>
        </div>

        {/* Center Showcase Content */}
        <div className="relative z-10 my-auto max-w-lg">
          {/* Hero Open Grimoire Emblem (floating seamlessly without box clipping) */}
          <div className="mb-7 relative inline-flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-violet-500/25 blur-3xl animate-pulse" />
            <GrimoireLogo size={88} className="relative drop-shadow-[0_0_35px_rgba(168,85,247,0.45)]" />
          </div>

          <h2 className="font-display text-3xl xl:text-4xl font-extrabold text-white leading-tight">
            Unveil The Secret Lore of Endless Worlds.
          </h2>
          <p className="mt-4 text-sm text-white/60 leading-relaxed">
            Grimoire brings together authentic Japanese Manga, Korean Manhwa, and Chinese Manhua into a singular, fluid sanctuary.
          </p>

          {/* 3 Value Highlights with smooth glassmorphism */}
          <div className="mt-8 space-y-3.5">
            <div className="flex items-start gap-3.5 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 backdrop-blur-md transition-all duration-300 hover:bg-white/[0.04] hover:border-violet-500/20 hover:translate-x-1">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
                <BookmarkCheck className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Cloud Library & Chapter Progress</h4>
                <p className="text-[11px] text-white/50 mt-0.5 leading-normal">
                  Inscribe your reading progress down to the chapter with custom ongoing, completed, and backlog lists.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 backdrop-blur-md transition-all duration-300 hover:bg-white/[0.04] hover:border-violet-500/20 hover:translate-x-1">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20">
                <Compass className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Direct Anime Source Adaptations</h4>
                <p className="text-[11px] text-white/50 mt-0.5 leading-normal">
                  Instant discovery of the original source manga behind currently airing and upcoming Fall 2026 anime.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 backdrop-blur-md transition-all duration-300 hover:bg-white/[0.04] hover:border-violet-500/20 hover:translate-x-1">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Flame className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">100% Free & Open Access</h4>
                <p className="text-[11px] text-white/50 mt-0.5 leading-normal">
                  No paywalls or subscription gates. Browse rankings, explore new releases, and discover stories without limits.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Reader Note */}
        <div className="relative z-10 pt-6 border-t border-white/[0.06] flex items-center justify-between text-xs text-white/40">
          <p className="italic">"A sanctuary for those who wander through endless pages."</p>
          <span className="font-semibold text-white/60">Grimoire Sanctuary</span>
        </div>
      </div>
    </div>
  );
}
