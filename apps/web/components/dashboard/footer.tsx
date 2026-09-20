import { Heart, Code, MessageCircle } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto px-4 pb-5 pt-8 sm:px-6">
      <div className="glass flex flex-col items-center justify-between gap-3 rounded-2xl px-5 py-4 text-xs text-muted-foreground sm:flex-row">
        <p className="flex items-center gap-1.5">
          <span className="font-display font-semibold text-foreground">
            Grimoire
          </span>
          <span className="text-muted-foreground/60">·</span>
          Crafted with
          <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500" />
          for manga & anime lovers
        </p>
        <div className="flex items-center gap-4">
          <span className="hidden sm:inline">© {new Date().getFullYear()}</span>
          <a
            href="#"
            className="transition hover:text-foreground"
            aria-label="GitHub"
          >
            <Code className="h-4 w-4" />
          </a>
          <a
            href="#"
            className="transition hover:text-foreground"
            aria-label="Twitter"
          >
            <MessageCircle className="h-4 w-4" />
          </a>
          <span className="flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            All systems operational
          </span>
        </div>
      </div>
    </footer>
  );
}
