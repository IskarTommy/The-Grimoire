import {
  Library,
  CirclePlay,
  CheckCircle2,
  Bookmark,
  Tv,
  Compass,
  BarChart3,
  Settings,
  type LucideIcon,
} from "lucide-react";
import type { NavKey } from "@/lib/types";

export type NavItem = {
  key: NavKey;
  label: string;
  icon: LucideIcon;
  hint?: string;
};

export const PRIMARY_NAV: NavItem[] = [
  { key: "library", label: "My Library", icon: Library },
  { key: "ongoing", label: "Ongoing", icon: CirclePlay },
  { key: "completed", label: "Completed", icon: CheckCircle2 },
  { key: "planned", label: "Plan to Read", icon: Bookmark },
  { key: "anime", label: "Anime", icon: Tv },
];

export const SECONDARY_NAV: NavItem[] = [
  { key: "discover", label: "Discover", icon: Compass },
  { key: "stats", label: "Statistics", icon: BarChart3 },
  { key: "settings", label: "Settings", icon: Settings },
];
