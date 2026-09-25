"use client";

import { Search, Bell, Menu, Command, Plus, Flame } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { UserMenu } from "@/components/navigation/user-menu";

type HeaderProps = {
  query: string;
  onQueryChange: (v: string) => void;
  onOpenMobileNav: () => void;
  title: string;
  subtitle: string;
};

export function Header({
  query,
  onQueryChange,
  onOpenMobileNav,
  title,
  subtitle,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 px-4 pt-4 sm:px-6">
      <div className="glass-strong flex items-center gap-3 rounded-2xl px-3 py-2.5 sm:gap-4 sm:px-4">
        {/* Mobile nav trigger */}
        <button
          type="button"
          onClick={onOpenMobileNav}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-muted-foreground transition hover:bg-white/5 hover:text-foreground lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Title block (hidden on small screens to save room for search) */}
        <div className="hidden min-w-0 flex-col leading-tight md:flex">
          <h1 className="truncate font-display text-lg font-bold tracking-tight text-foreground">
            {title}
          </h1>
          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
        </div>

        {/* Search */}
        <div className="relative ml-auto flex-1 md:max-w-md md:ml-4">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search manga, anime, characters…"
            className="h-11 rounded-xl border-white/10 bg-white/[0.04] pl-10 pr-16 text-sm text-foreground placeholder:text-muted-foreground/70 focus-visible:border-violet-400/40 focus-visible:ring-violet-400/20"
          />
          <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 select-none items-center gap-1 rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:flex">
            <Command className="h-3 w-3" />K
          </kbd>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="hidden h-11 w-11 rounded-xl text-muted-foreground hover:bg-white/5 hover:text-foreground sm:inline-flex"
            aria-label="Add new"
          >
            <Plus className="h-5 w-5" />
          </Button>

          <button
            type="button"
            className="relative grid h-11 w-11 shrink-0 place-items-center rounded-xl text-muted-foreground transition hover:bg-white/5 hover:text-foreground"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-2.5 top-2.5 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
            </span>
          </button>

          <div className="hidden h-8 w-px bg-white/10 sm:block" />

          <UserMenu />
        </div>
      </div>

      {/* Mobile title under header */}
      <div className="mt-3 flex items-center justify-between px-1 md:hidden">
        <div className="min-w-0">
          <h1 className="truncate font-display text-xl font-bold tracking-tight text-foreground">
            {title}
          </h1>
          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <Badge
          variant="outline"
          className="border-violet-400/30 bg-violet-500/10 text-violet-200"
        >
          <span className="mr-1 h-1.5 w-1.5 rounded-full bg-violet-400" />
          Live
        </Badge>
      </div>
    </header>
  );
}
