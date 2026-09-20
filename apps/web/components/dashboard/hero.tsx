"use client";

import { motion } from "framer-motion";
import { Play, Plus, Star, Clock, BookOpen } from "lucide-react";
import { FEATURED_ITEM, STATUS_META, TYPE_META, ACCENT_CLASSES } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function Hero() {
  const item = FEATURED_ITEM;
  const status = STATUS_META[item.status];
  const type = TYPE_META[item.type];
  const accent = ACCENT_CLASSES[item.accent];

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative"
    >
      <div className="group relative overflow-hidden rounded-3xl border border-white/10">
        {/* Background image */}
        <div className="absolute inset-0">
          <img
            src={item.cover}
            alt={item.title}
            className="h-full w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105"
          />
          {/* Gradient overlays for readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/20" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/40 to-transparent" />
          <div
            className={`absolute inset-0 bg-gradient-to-tr ${accent.from} ${accent.to} opacity-50 mix-blend-soft-light`}
          />
        </div>

        {/* Content */}
        <div className="relative flex min-h-[340px] flex-col justify-end gap-5 p-6 sm:min-h-[400px] sm:p-10 lg:min-h-[440px]">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className={`border-white/10 bg-black/40 backdrop-blur-md ${type.className}`}
            >
              {type.label}
            </Badge>
            <Badge
              variant="outline"
              className="border-white/10 bg-black/40 font-medium text-white backdrop-blur-md"
            >
              <Star className="h-3 w-3 fill-amber-300 text-amber-300" />
              {item.rating.toFixed(1)}
            </Badge>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-2.5 py-0.5 text-xs font-medium backdrop-blur-md ${status.textClass}`}
            >
              <span
                className={`relative h-1.5 w-1.5 rounded-full ${status.dotClass} ${status.ringClass}`}
              />
              {status.label}
            </span>
          </div>

          <div className="max-w-2xl">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-violet-300/90">
              Featured Masterpiece
            </p>
            <h2 className="font-display text-4xl font-bold leading-[1.05] tracking-tight text-white text-glow sm:text-5xl lg:text-6xl">
              {item.title}
            </h2>
            <p className="mt-3 line-clamp-2 max-w-xl text-sm leading-relaxed text-white/70 sm:text-base">
              {item.synopsis}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/60">
              <span className="flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" /> Ch. {item.currentChapter}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> {item.lastUpdated}
              </span>
              <span className="text-white/40">·</span>
              {item.genres.map((g) => (
                <span key={g} className="text-white/60">
                  {g}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              size="lg"
              className="h-12 gap-2 rounded-xl bg-white px-6 text-sm font-semibold text-black shadow-[0_10px_30px_-8px_oklch(0.62_0.24_295_/_0.5)] transition hover:bg-white/90 hover:shadow-[0_14px_40px_-8px_oklch(0.62_0.24_295_/_0.65)]"
            >
              <Play className="h-4 w-4 fill-black" />
              Continue Reading
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 gap-2 rounded-xl border-white/20 bg-white/5 px-6 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/10"
            >
              <Plus className="h-4 w-4" />
              Add to Library
            </Button>
          </div>

          {/* Progress at the very bottom */}
          <div className="mt-2 flex items-center gap-3">
            <div className="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${accent.bar}`}
                style={{ width: `${item.progress}%` }}
              />
            </div>
            <span className="text-xs font-medium tabular-nums text-white/70">
              {item.progress}% · Ch. {item.currentChapter}
            </span>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
