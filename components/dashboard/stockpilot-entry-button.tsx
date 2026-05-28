"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";

type StockPilotEntryButtonProps = Readonly<{
  href?: string;
}>;

export function StockPilotEntryButton({
  href = "/stockpilot",
}: StockPilotEntryButtonProps) {
  return (
    <Link
      href={href}
      aria-label="Open StockPilot"
      title="StockPilot"
      className="group relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/35 bg-white/20 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_8px_24px_rgba(0,88,190,0.35)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-white/50 hover:bg-white/30 hover:shadow-[0_0_20px_rgba(96,165,250,0.45),0_12px_28px_rgba(0,88,190,0.4)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/35"
    >
      <span
        className="pointer-events-none absolute inset-0 rounded-full bg-linear-to-br from-white/25 via-transparent to-blue-300/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        aria-hidden
      />
      <Sparkles className="relative h-[18px] w-[18px] transition-transform duration-300 group-hover:scale-110" />
    </Link>
  );
}
