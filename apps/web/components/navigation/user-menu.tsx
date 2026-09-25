"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  BookOpen,
  LogOut,
  Sparkles,
  ChevronDown,
  LogIn,
  UserPlus,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";

export function UserMenu() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  if (isLoading) {
    return (
      <div className="h-8 w-8 rounded-full border border-white/10 bg-white/5 animate-pulse" />
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/login"
          className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-white/90 hover:border-violet-500/50 hover:bg-violet-600/10 hover:text-white transition-all shadow-sm cursor-pointer"
        >
          <LogIn className="h-3.5 w-3.5 text-violet-400" />
          <span>Sign In</span>
        </Link>
        <Link
          href="/signup"
          className="hidden sm:flex items-center gap-1.5 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-violet-600/25 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
        >
          <UserPlus className="h-3.5 w-3.5" />
          <span>Sign Up</span>
        </Link>
      </div>
    );
  }

  const initial = user?.username ? user.username[0]?.toUpperCase() : "U";

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 p-1 pr-2.5 text-xs text-white hover:border-violet-500/40 hover:bg-white/10 transition-all cursor-pointer shadow"
      >
        <div className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-xs font-extrabold text-white shadow-inner">
          {initial}
        </div>
        <span className="hidden sm:inline font-semibold max-w-[100px] truncate text-white/90">
          {user.username}
        </span>
        <ChevronDown
          className={cn(
            "h-3 w-3 text-white/50 transition-transform duration-200",
            open && "rotate-180 text-white"
          )}
        />
      </button>

      {/* Floating Dropdown Menu */}
      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-white/10 bg-[#121420]/95 p-2 shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150 z-50">
          {/* User Info Header */}
          <div className="px-3 py-2.5 border-b border-white/10 mb-1">
            <p className="text-xs font-bold text-white truncate flex items-center gap-1.5">
              <span>{user.username}</span>
              <Sparkles className="h-3 w-3 text-violet-400" />
            </p>
            <p className="text-[11px] text-white/50 truncate mt-0.5">{user.email}</p>
          </div>

          {/* Links */}
          <div className="space-y-0.5">
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-white/80 hover:bg-violet-600/20 hover:text-violet-200 transition-colors cursor-pointer"
            >
              <BookOpen className="h-4 w-4 text-violet-400" />
              <span>My Library</span>
            </Link>
          </div>

          <div className="h-px bg-white/10 my-1" />

          {/* Sign Out */}
          <button
            onClick={() => {
              logout();
              setOpen(false);
              router.refresh();
            }}
            className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4 text-red-400" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
}
