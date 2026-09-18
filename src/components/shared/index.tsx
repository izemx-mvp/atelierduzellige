import { type ReactNode, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, type LucideIcon, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";

/* ---------- Page header ---------- */
export function PageHeader({ title, description, actions, eyebrow }: { title: string; description?: string; actions?: ReactNode; eyebrow?: string }) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow && <div className="mb-1 text-[11px] font-medium uppercase tracking-[0.16em] text-gold">{eyebrow}</div>}
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/* ---------- Empty state ---------- */
export function EmptyState({ icon: Icon, title, description, action }: { icon: LucideIcon; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="surface flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gold-soft text-gold">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* ---------- Loading ---------- */
export function LoadingBlock({ rows = 5 }: { rows?: number }) {
  return (
    <div className="surface p-4 space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}

/* ---------- Status badge ---------- */
const TONES: Record<string, string> = {
  // generic
  "Actif": "success", "VIP": "gold", "Inactif": "muted",
  "Nouveau": "info", "Contacté": "info", "Qualifié": "gold", "Échantillon": "warning", "Devis": "warning", "Négociation": "warning", "Gagné": "success", "Perdu": "destructive",
  "Rupture": "destructive", "Archivé": "muted", "Nouveauté": "gold",
  "Demandé": "info", "En préparation": "warning", "Envoyé": "info", "En attente de validation": "warning", "Validé": "success", "Refusé": "destructive",
  "Brouillon": "muted", "En attente": "warning", "Expiré": "muted",
  "Confirmée": "info", "Production": "warning", "Préparation": "warning", "Contrôle qualité": "gold", "Emballage": "gold", "Expédiée": "info", "Livrée": "success", "Annulée": "destructive",
  "Prêt à expédier": "gold", "Expédié": "info", "En transit": "info", "Arrivé": "success", "Livré": "success",
  "Retard": "destructive", "Bloquée": "destructive", "Blocage douane": "destructive", "Problème transporteur": "destructive",
  "Proposé": "warning", "Confirmé": "success", "Annulé": "destructive", "Terminé": "muted",
  "Généré": "info", "Planifié": "gold", "Publié": "success",
  "Succès": "success", "Erreur": "destructive",
  "À traiter": "warning", "Planifiée": "gold", "Envoyée": "success", "Ignorée": "muted",
  "Haute": "destructive", "Moyenne": "warning", "Faible": "muted",
  "Instagram": "gold", "Facebook": "info", "TikTok": "muted",
};
const TONE_CLASS: Record<string, string> = {
  success: "bg-success/12 text-success border-success/25",
  gold: "bg-gold-soft text-gold-foreground border-gold/40 dark:text-gold",
  info: "bg-info/12 text-info border-info/25",
  warning: "bg-warning/15 text-warning-foreground border-warning/40 dark:text-warning",
  destructive: "bg-destructive/10 text-destructive border-destructive/25",
  muted: "bg-muted text-muted-foreground border-border",
};
export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const tone = TONES[status] ?? "muted";
  return (
    <Badge variant="outline" className={cn("rounded-md font-medium whitespace-nowrap", TONE_CLASS[tone], className)}>
      {status}
    </Badge>
  );
}

/* ---------- Confirm dialog ---------- */
export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel = "Supprimer", destructive = true, onConfirm }: {
  open: boolean; onOpenChange: (o: boolean) => void; title: string; description?: string; confirmLabel?: string; destructive?: boolean; onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description ?? "Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible."}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction className={destructive ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : undefined} onClick={onConfirm}>
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/* ---------- KPI card ---------- */
export function KpiCard({ label, value, hint, icon: Icon, trend, onClick, accent }: { label: string; value: ReactNode; hint?: string; icon?: LucideIcon; trend?: { value: number; label?: string }; onClick?: () => void; accent?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={!onClick} className={cn("surface group flex w-full flex-col items-start p-5 text-left transition-all", onClick && "hover:shadow-elevated hover:border-gold/50 cursor-pointer", !onClick && "cursor-default")}>
      <div className="flex w-full items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
        {Icon && <span className={cn("flex h-8 w-8 items-center justify-center rounded-md", accent ? "bg-gold text-gold-foreground" : "bg-secondary text-muted-foreground")}><Icon className="h-4 w-4" /></span>}
      </div>
      <div className="mt-3 text-2xl font-semibold tracking-tight text-foreground">{value}</div>
      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
        {trend && (
          <span className={cn("inline-flex items-center gap-0.5 font-medium", trend.value >= 0 ? "text-success" : "text-destructive")}>
            {trend.value >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
            {Math.abs(trend.value)}%
          </span>
        )}
        {hint && <span>{hint}</span>}
      </div>
    </button>
  );
}

/* ---------- Search input ---------- */
export function SearchInput({ value, onChange, placeholder = "Rechercher…", className }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) {
  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="pl-9 bg-card" />
    </div>
  );
}

/* ---------- Sortable header ---------- */
export function SortHeader<T extends string>({ label, field, sort, onSort, className }: { label: string; field: T; sort: { field: T; dir: "asc" | "desc" }; onSort: (f: T) => void; className?: string }) {
  const active = sort.field === field;
  return (
    <button type="button" onClick={() => onSort(field)} className={cn("inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wider hover:text-foreground", active ? "text-foreground" : "text-muted-foreground", className)}>
      {label}
      {active ? (sort.dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-50" />}
    </button>
  );
}

export function useSort<T extends string>(initial: T, initialDir: "asc" | "desc" = "desc") {
  const [sort, setSort] = useState<{ field: T; dir: "asc" | "desc" }>({ field: initial, dir: initialDir });
  const onSort = (field: T) => setSort((s) => (s.field === field ? { field, dir: s.dir === "asc" ? "desc" : "asc" } : { field, dir: "asc" }));
  const sortFn = <R,>(rows: R[], get: (r: R, f: T) => string | number | undefined | null) =>
    [...rows].sort((a, b) => {
      const va = get(a, sort.field) ?? ""; const vb = get(b, sort.field) ?? "";
      const cmp = typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb), "fr");
      return sort.dir === "asc" ? cmp : -cmp;
    });
  return { sort, onSort, sortFn };
}

/* ---------- Product swatch ---------- */
export function ProductSwatch({ hue, className, size = "md" }: { hue: number; className?: string; size?: "sm" | "md" | "lg" }) {
  const dim = size === "sm" ? "h-8 w-8" : size === "lg" ? "h-40 w-full" : "h-12 w-12";
  const l = hue === 0 ? 22 : 62; const c = hue === 0 ? 0.01 : 0.11;
  return (
    <div className={cn(dim, "relative overflow-hidden rounded-md border", className)} style={{ background: `oklch(${l}% ${c} ${hue})` }}>
      <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(135deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 45%, rgba(0,0,0,0.12) 100%)" }} />
      <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent 0 calc(25% - 1px), rgba(255,255,255,0.5) calc(25% - 1px) 25%), repeating-linear-gradient(90deg, transparent 0 calc(25% - 1px), rgba(255,255,255,0.5) calc(25% - 1px) 25%)" }} />
    </div>
  );
}

/* ---------- Section card ---------- */
export function Section({ title, description, actions, children, className, noPadding }: { title?: string; description?: string; actions?: ReactNode; children: ReactNode; className?: string; noPadding?: boolean }) {
  return (
    <section className={cn("surface", className)}>
      {(title || actions) && (
        <div className="flex items-center justify-between gap-3 border-b px-5 py-3.5">
          <div>
            {title && <h3 className="text-sm font-semibold text-foreground">{title}</h3>}
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      <div className={noPadding ? "" : "p-5"}>{children}</div>
    </section>
  );
}

export function Field({ label, children, hint, className }: { label: string; children: ReactNode; hint?: string; className?: string }) {
  return (
    <label className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
      {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
    </label>
  );
}

export function DefinitionList({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
      {items.map((it) => (
        <div key={it.label} className="flex flex-col">
          <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{it.label}</dt>
          <dd className="mt-0.5 text-sm text-foreground">{it.value || "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

export { Button };
