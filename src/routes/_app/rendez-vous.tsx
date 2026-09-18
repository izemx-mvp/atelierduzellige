import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, CalendarDays, ChevronLeft, ChevronRight, Check, X, Pencil, Trash2, Bell, Users } from "lucide-react";
import { useStore, useHydrated, fmtDateTime, contactName } from "@/lib/store";
import type { Appointment } from "@/lib/types";
import { PageHeader, LoadingBlock, StatusBadge, ConfirmDialog, EmptyState, Section } from "@/components/shared";
import { AppointmentDialog } from "@/components/appointments/AppointmentDialog";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/rendez-vous")({
  head: () => ({ meta: [{ title: "Rendez-vous — Atelier du Zellige" }, { name: "description", content: "Calendrier interactif : vues mois, semaine, jour et liste, rappels et participants." }, { property: "og:title", content: "Rendez-vous — Atelier du Zellige" }, { property: "og:description", content: "Calendrier des rendez-vous clients et prospects." }] }),
  component: CalendarPage,
});

type View = "month" | "week" | "day" | "list";
const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const startOfWeek = (d: Date) => { const x = new Date(d); const day = (x.getDay() + 6) % 7; x.setDate(x.getDate() - day); x.setHours(0, 0, 0, 0); return x; };
const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
const TYPE_TONE: Record<string, string> = { "Visite showroom": "bg-gold-soft text-gold-foreground border-gold/40 dark:text-gold", Visio: "bg-info/12 text-info border-info/25", Appel: "bg-secondary text-foreground border-border", "Sur site": "bg-success/12 text-success border-success/25" };

function CalendarPage() {
  const hydrated = useHydrated();
  const s = useStore();
  const [view, setView] = useState<View>("month");
  const [cursor, setCursor] = useState(() => new Date());
  const [dialog, setDialog] = useState<{ open: boolean; a?: Appointment | null; start?: string }>({ open: false });
  const [del, setDel] = useState<Appointment | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  const appts = useMemo(() => [...s.appointments].sort((a, b) => a.start.localeCompare(b.start)), [s.appointments]);
  if (!hydrated) return <LoadingBlock />;

  const nav = (dir: number) => { const d = new Date(cursor); if (view === "month") d.setMonth(d.getMonth() + dir); else if (view === "week") d.setDate(d.getDate() + 7 * dir); else d.setDate(d.getDate() + dir); setCursor(d); };
  const title = view === "month" ? cursor.toLocaleDateString("fr-FR", { month: "long", year: "numeric" }) : view === "week" ? `Semaine du ${startOfWeek(cursor).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}` : view === "day" ? cursor.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }) : "Tous les rendez-vous";
  const forDay = (d: Date) => appts.filter((a) => sameDay(new Date(a.start), d));
  const moveTo = (a: Appointment, day: Date, hour?: number) => {
    const st = new Date(a.start); const en = new Date(a.end); const dur = en.getTime() - st.getTime();
    const ns = new Date(day); ns.setHours(hour ?? st.getHours(), st.getMinutes(), 0, 0);
    s.updateAppointment(a.id, { start: ns.toISOString(), end: new Date(ns.getTime() + dur).toISOString(), reminders: a.reminders.map((r) => ({ ...r, sent: false })) });
    s.log({ agent: "Utilisateur", action: "Déplacement rendez-vous", target: a.title, result: fmtDateTime(ns.toISOString()), status: "Succès", link: "/rendez-vous" });
    toast.success("Rendez-vous déplacé.");
  };
  const setStatus = (a: Appointment, st: Appointment["status"]) => { s.updateAppointment(a.id, { status: st }); s.log({ agent: "Utilisateur", action: st === "Confirmé" ? "Confirmation rendez-vous" : "Annulation rendez-vous", target: a.title, result: st, status: "Succès", link: "/rendez-vous" }); toast.success(st === "Confirmé" ? "Rendez-vous confirmé." : st === "Annulé" ? "Rendez-vous annulé." : "Statut mis à jour."); };

  const Chip = ({ a, compact }: { a: Appointment; compact?: boolean }) => (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" draggable onDragStart={(e) => { e.stopPropagation(); setDragId(a.id); }} onDragEnd={() => setDragId(null)} className={cn("w-full truncate rounded border px-1.5 py-0.5 text-left text-[11px] leading-tight", TYPE_TONE[a.type], a.status === "Annulé" && "line-through opacity-50", dragId === a.id && "opacity-40")}>
          {!compact && <span className="font-medium">{new Date(a.start).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} </span>}{a.title}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="flex items-start justify-between gap-2"><div><div className="font-medium">{a.title}</div><div className="text-xs text-muted-foreground">{a.type} · {fmtDateTime(a.start)} → {new Date(a.end).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</div></div><StatusBadge status={a.status} /></div>
        {a.contactType && <div className="mt-2 text-sm">{contactName(s, a.contactType, a.contactId)}</div>}
        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Users className="h-3 w-3" />{a.participants.join(", ")}</div>
        {a.notes && <p className="mt-2 text-xs text-muted-foreground">{a.notes}</p>}
        <div className="mt-2 flex flex-wrap gap-1 text-[11px] text-muted-foreground">{a.reminders.map((r) => <span key={r.at} className={cn("inline-flex items-center gap-1 rounded border px-1.5 py-0.5", r.sent && "text-success border-success/30")}><Bell className="h-3 w-3" /> {r.at} {r.sent ? "envoyé" : "programmé"}</span>)}</div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {a.status === "Proposé" && <Button size="sm" className="h-7 bg-gold text-gold-foreground hover:bg-gold/90" onClick={() => setStatus(a, "Confirmé")}><Check className="h-3.5 w-3.5" /> Confirmer</Button>}
          {a.status === "Confirmé" && new Date(a.end) < new Date() && <Button size="sm" variant="outline" className="h-7" onClick={() => setStatus(a, "Terminé")}>Terminer</Button>}
          <Button size="sm" variant="outline" className="h-7" onClick={() => setDialog({ open: true, a })}><Pencil className="h-3.5 w-3.5" /> Modifier</Button>
          {a.status !== "Annulé" && <Button size="sm" variant="outline" className="h-7 text-destructive" onClick={() => setStatus(a, "Annulé")}><X className="h-3.5 w-3.5" /> Annuler</Button>}
          <Button size="sm" variant="ghost" className="h-7 text-destructive" onClick={() => setDel(a)}><Trash2 className="h-3.5 w-3.5" /></Button>
        </div>
      </PopoverContent>
    </Popover>
  );

  const DropCell = ({ day, hour, children, className, onCreate }: { day: Date; hour?: number; children: React.ReactNode; className?: string; onCreate: () => void }) => (
    <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const a = appts.find((x) => x.id === dragId); if (a) moveTo(a, day, hour); setDragId(null); }} onDoubleClick={onCreate} className={className}>{children}</div>
  );

  const renderMonth = () => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1); const start = startOfWeek(first);
    const cells = Array.from({ length: 42 }).map((_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
    return (
      <div className="surface overflow-hidden">
        <div className="grid grid-cols-7 border-b bg-secondary/50 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{DAYS.map((d) => <div key={d} className="px-2 py-2">{d}</div>)}</div>
        <div className="grid grid-cols-7">
          {cells.map((d, i) => { const items = forDay(d); const today = sameDay(d, new Date()); const other = d.getMonth() !== cursor.getMonth(); const dd = new Date(d); dd.setHours(10, 0, 0, 0); return (
            <DropCell key={i} day={d} onCreate={() => setDialog({ open: true, a: null, start: dd.toISOString() })} className={cn("min-h-28 border-b border-r p-1.5 [&:nth-child(7n)]:border-r-0", other && "bg-secondary/30 text-muted-foreground")}>
              <div className="mb-1 flex items-center justify-between"><span className={cn("flex h-6 w-6 items-center justify-center rounded-full text-xs", today && "bg-gold font-semibold text-gold-foreground")}>{d.getDate()}</span>{items.length > 0 && <span className="text-[10px] text-muted-foreground">{items.length}</span>}</div>
              <div className="space-y-1">{items.slice(0, 3).map((a) => <Chip key={a.id} a={a} />)}{items.length > 3 && <button type="button" className="text-[11px] text-muted-foreground hover:text-foreground" onClick={() => { setCursor(d); setView("day"); }}>+{items.length - 3} autres</button>}</div>
            </DropCell>
          ); })}
        </div>
      </div>
    );
  };

  const renderWeek = (days: Date[]) => {
    const hours = Array.from({ length: 12 }).map((_, i) => 8 + i);
    return (
      <div className="surface overflow-x-auto">
        <div className="grid min-w-[700px]" style={{ gridTemplateColumns: `60px repeat(${days.length}, 1fr)` }}>
          <div className="border-b border-r bg-secondary/50" />
          {days.map((d) => <div key={d.toISOString()} className={cn("border-b border-r bg-secondary/50 px-2 py-2 text-center text-xs font-medium", sameDay(d, new Date()) && "text-gold")}>{d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" })}</div>)}
          {hours.map((h) => (<div key={h} className="contents">
            <div className="border-b border-r px-2 py-1 text-[11px] text-muted-foreground">{String(h).padStart(2, "0")}:00</div>
            {days.map((d) => { const items = appts.filter((a) => sameDay(new Date(a.start), d) && new Date(a.start).getHours() === h); const dd = new Date(d); dd.setHours(h, 0, 0, 0); return (
              <DropCell key={d.toISOString() + h} day={d} hour={h} onCreate={() => setDialog({ open: true, a: null, start: dd.toISOString() })} className="min-h-12 space-y-1 border-b border-r p-1 hover:bg-accent/40">{items.map((a) => <Chip key={a.id} a={a} />)}</DropCell>
            ); })}
          </div>))}
        </div>
      </div>
    );
  };

  const weekDays = Array.from({ length: 7 }).map((_, i) => { const d = startOfWeek(cursor); d.setDate(d.getDate() + i); return d; });
  const upcoming = appts.filter((a) => new Date(a.end) >= new Date() && a.status !== "Annulé");

  return (
    <div>
      <PageHeader eyebrow="Agenda" title="Rendez-vous" description={`${upcoming.length} à venir · ${appts.filter((a) => a.status === "Proposé").length} à confirmer`}
        actions={<>
          <div className="flex rounded-md border bg-card p-0.5">{(["month", "week", "day", "list"] as View[]).map((v) => <Button key={v} variant={view === v ? "secondary" : "ghost"} size="sm" onClick={() => setView(v)}>{{ month: "Mois", week: "Semaine", day: "Jour", list: "Liste" }[v]}</Button>)}</div>
          <Button className="bg-gold text-gold-foreground hover:bg-gold/90" onClick={() => setDialog({ open: true, a: null })}><Plus className="h-4 w-4" /> Nouveau rendez-vous</Button>
        </>} />
      {view !== "list" && (
        <div className="mb-3 flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => nav(-1)}><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => nav(1)}><ChevronRight className="h-4 w-4" /></Button>
          <Button variant="ghost" size="sm" onClick={() => setCursor(new Date())}>Aujourd'hui</Button>
          <h2 className="ml-2 text-base font-semibold capitalize">{title}</h2>
          <span className="ml-auto hidden text-xs text-muted-foreground md:block">Glissez un rendez-vous pour le déplacer · Double-clic pour créer</span>
        </div>
      )}
      {appts.length === 0 && view === "list" ? <EmptyState icon={CalendarDays} title="Aucun rendez-vous" description="Planifiez votre premier rendez-vous." action={<Button className="bg-gold text-gold-foreground hover:bg-gold/90" onClick={() => setDialog({ open: true, a: null })}><Plus className="h-4 w-4" /> Créer</Button>} />
        : view === "month" ? renderMonth() : view === "week" ? renderWeek(weekDays) : view === "day" ? renderWeek([cursor]) : (
          <Section noPadding>
            <ul className="divide-y">
              {appts.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                  <div className="w-36 text-sm"><div className="font-medium">{new Date(a.start).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}</div><div className="text-xs text-muted-foreground">{new Date(a.start).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} – {new Date(a.end).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</div></div>
                  <div className="min-w-0 flex-1"><div className={cn("font-medium", a.status === "Annulé" && "line-through text-muted-foreground")}>{a.title}</div><div className="truncate text-xs text-muted-foreground">{a.type}{a.contactType ? ` · ${contactName(s, a.contactType, a.contactId)}` : ""} · {a.participants.join(", ")}</div></div>
                  <StatusBadge status={a.status} />
                  <div className="flex gap-1">
                    {a.status === "Proposé" && <Button size="sm" variant="outline" className="h-7 text-success" onClick={() => setStatus(a, "Confirmé")}><Check className="h-3.5 w-3.5" /></Button>}
                    <Button size="sm" variant="outline" className="h-7" onClick={() => setDialog({ open: true, a })}><Pencil className="h-3.5 w-3.5" /></Button>
                    {a.status !== "Annulé" && <Button size="sm" variant="outline" className="h-7 text-destructive" onClick={() => setStatus(a, "Annulé")}><X className="h-3.5 w-3.5" /></Button>}
                    <Button size="sm" variant="ghost" className="h-7 text-destructive" onClick={() => setDel(a)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </li>
              ))}
            </ul>
          </Section>
        )}
      <AppointmentDialog open={dialog.open} onOpenChange={(o) => setDialog((d) => ({ ...d, open: o }))} appointment={dialog.a} initialStart={dialog.start} />
      <ConfirmDialog open={!!del} onOpenChange={(o) => !o && setDel(null)} title={`Supprimer « ${del?.title} » ?`} onConfirm={() => { if (del) { s.deleteAppointment(del.id); toast.success("Élément supprimé."); setDel(null); } }} />
    </div>
  );
}
