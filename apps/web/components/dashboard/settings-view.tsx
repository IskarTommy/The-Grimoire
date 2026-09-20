"use client";

import { Bell, Palette, Globe, Shield, Download, Moon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SectionHeader } from "./section-header";

function Row({
  icon: Icon,
  title,
  desc,
  children,
}: {
  icon: typeof Bell;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/[0.04] text-violet-300 ring-1 ring-inset ring-white/10">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export function SettingsView() {
  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <SectionHeader
          title="Preferences"
          subtitle="Customize your Grimoire experience"
          accent="text-violet-300"
          actionLabel=""
          onAction={() => {}}
        />
        <div className="glass divide-y divide-white/[0.06] rounded-3xl px-5">
          <Row
            icon={Moon}
            title="Dark appearance"
            desc="Use the obsidian dark theme (recommended)"
          >
            <Switch defaultChecked />
          </Row>
          <Row
            icon={Palette}
            title="Accent color"
            desc="Choose your ambient glow"
          >
            <Select defaultValue="violet">
              <SelectTrigger className="h-9 w-32 rounded-lg border-white/10 bg-white/[0.04] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-popover/95 backdrop-blur-xl">
                <SelectItem value="violet" className="text-xs">Violet</SelectItem>
                <SelectItem value="crimson" className="text-xs">Crimson</SelectItem>
                <SelectItem value="amber" className="text-xs">Amber</SelectItem>
                <SelectItem value="teal" className="text-xs">Teal</SelectItem>
              </SelectContent>
            </Select>
          </Row>
          <Row
            icon={Globe}
            title="Language"
            desc="Interface language"
          >
            <Select defaultValue="en">
              <SelectTrigger className="h-9 w-32 rounded-lg border-white/10 bg-white/[0.04] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-popover/95 backdrop-blur-xl">
                <SelectItem value="en" className="text-xs">English</SelectItem>
                <SelectItem value="ja" className="text-xs">日本語</SelectItem>
                <SelectItem value="ko" className="text-xs">한국어</SelectItem>
                <SelectItem value="zh" className="text-xs">中文</SelectItem>
              </SelectContent>
            </Select>
          </Row>
          <Row
            icon={Bell}
            title="New chapter alerts"
            desc="Get notified when a tracked series updates"
          >
            <Switch defaultChecked />
          </Row>
          <Row
            icon={Shield}
            title="Hide adult content"
            desc="Blur mature covers in your library"
          >
            <Switch />
          </Row>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="Data"
          subtitle="Sync and backup your library"
          accent="text-teal-300"
          actionLabel=""
          onAction={() => {}}
        />
        <div className="glass divide-y divide-white/[0.06] rounded-3xl px-5">
          <Row
            icon={Download}
            title="Export library"
            desc="Download your collection as JSON / CSV"
          >
            <button className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-white/[0.08]">
              Export
            </button>
          </Row>
          <Row
            icon={Shield}
            title="Cloud sync"
            desc="Back up to your NestJS backend"
          >
            <Switch defaultChecked />
          </Row>
        </div>
      </section>
    </div>
  );
}
