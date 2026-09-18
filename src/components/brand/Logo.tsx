import { cn } from "@/lib/utils";

/** Zellige eight-pointed star mark. */
export function LogoMark({ className, size = 32 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={cn("shrink-0", className)} aria-hidden>
      <rect x="10" y="10" width="44" height="44" rx="4" fill="currentColor" opacity="0.12" />
      <g fill="none" stroke="currentColor" strokeWidth="2.2">
        <polygon points="32,6 38.5,25.5 58,32 38.5,38.5 32,58 25.5,38.5 6,32 25.5,25.5" />
        <polygon points="32,14 36.5,27.5 50,32 36.5,36.5 32,50 27.5,36.5 14,32 27.5,27.5" opacity="0.6" />
        <circle cx="32" cy="32" r="4" fill="currentColor" stroke="none" />
      </g>
    </svg>
  );
}

export function Logo({ className, compact = false, tone = "light" }: { className?: string; compact?: boolean; tone?: "light" | "dark" }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <LogoMark className="text-gold" size={compact ? 30 : 36} />
      {!compact && (
        <div className="leading-tight">
          <div className={cn("text-[13px] font-semibold tracking-[0.18em] uppercase", tone === "light" ? "text-sidebar-accent-foreground" : "text-foreground")}>Atelier</div>
          <div className={cn("text-[13px] font-light tracking-[0.18em] uppercase", tone === "light" ? "text-sidebar-foreground" : "text-muted-foreground")}>du Zellige</div>
        </div>
      )}
    </div>
  );
}
