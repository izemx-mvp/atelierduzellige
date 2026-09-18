import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Factory, AlertTriangle, ArrowRight, Lock, Plus, CheckSquare } from "lucide-react";
import { useStore, useHydrated, fmtDate, isOrderLate, orderProgress, daysUntil } from "@/lib/store";
import { ORDER_STATUSES, type Order, type OrderStatus } from "@/lib/types";
import { PageHeader, LoadingBlock, StatusBadge, Section, KpiCard, EmptyState } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/production")({
  head: () => ({ meta: [{ title: "Production / Préparation — Atelier du Zellige" }, { name: "description", content: "Suivi de l'atelier : commandes par étape de production, charge, retards et tâches." }, { property: "og:title", content: "Production — Atelier du Zellige" }, { property: "og:description", content: "Suivi de la production et de la préparation des commandes." }] }),
  component: ProductionPage,
});

const PROD_STEPS: OrderStatus[] = ["Confirmée", "Production", "Préparation", "Contrôle qualité", "Emballage"];

function ProductionPage() {
  const hydrated = useHydrated();
  const s = useStore();
  const [owner, setOwner] = useState("all");
  const [task, setTask] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);

  const active = useMemo(() => s.orders.filter((o) => PROD_STEPS.includes(o.status) && (owner === "all" || o.owner === owner)), [s.orders, owner]);
  const owners = useMemo(() => Array.from(new Set(s.orders.map((o) => o.owner))), [s.orders]);
  if (!hydrated) return <LoadingBlock />;

  const m2 = active.reduce((a, o) => a + o.lines.reduce((b, l) => b + l.quantity, 0), 0);
  const late = active.filter((o) => isOrderLate(o)).length;
  const blocked = active.filter((o) => o.blocked).length;
  const dueSoon = active.filter((o) => daysUntil(o.dueDate) >= 0 && daysUntil(o.dueDate) <= 7).length;
  const openTasks = s.tasks.filter((t) => !t.done && t.relatedType === "order");
  const move = (o: Order, st: OrderStatus) => { if (o.status === st) return; if (o.blocked) return toast.error(`${o.number} est bloquée. Débloquez-la avant de l'avancer.`); s.setOrderStatus(o.id, st); toast.success(`${o.number} → ${st}.`); };

  return (
    <div>
      <PageHeader eyebrow="Atelier" title="Production / Préparation" description={`${active.length} commandes en atelier · ${m2.toLocaleString("fr-FR")} m² en cours`}
        actions={<Select value={owner} onValueChange={setOwner}><SelectTrigger className="w-48 bg-card"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Tous les responsables</SelectItem>{owners.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select>} />
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label="En atelier" value={active.length} icon={Factory} accent />
        <KpiCard label="Livraison < 7 j" value={dueSoon} hint="à prioriser" />
        <KpiCard label="En retard" value={late} icon={AlertTriangle} />
        <KpiCard label="Bloquées" value={blocked} icon={Lock} />
      </div>

      {active.length === 0 ? <EmptyState icon={Factory} title="Atelier vide" description="Aucune commande en production. Validez un devis pour lancer une commande." action={<Button asChild variant="outline"><Link to="/devis">Voir les devis</Link></Button>} /> : (
        <div className="scrollbar-thin flex gap-3 overflow-x-auto pb-4">
          {PROD_STEPS.map((st) => { const items = active.filter((o) => o.status === st); return (
            <div key={st} onDragOver={(e) => { e.preventDefault(); setOver(st); }} onDragLeave={() => setOver(null)} onDrop={() => { const o = s.orders.find((x) => x.id === dragId); if (o) move(o, st); setDragId(null); setOver(null); }} className={cn("flex w-72 shrink-0 flex-col rounded-lg border bg-secondary/50", over === st && "border-gold bg-gold-soft/40")}>
              <div className="flex items-center justify-between px-3 py-2.5"><span className="text-xs font-semibold uppercase tracking-wider">{st}</span><span className="rounded bg-card px-1.5 text-[11px] text-muted-foreground">{items.length}</span></div>
              <div className="flex min-h-24 flex-1 flex-col gap-2 px-2 pb-2">
                {items.map((o) => { const c = s.clients.find((cc) => cc.id === o.clientId); const late = isOrderLate(o); const step = o.steps.find((x) => x.name === st); const next = ORDER_STATUSES[ORDER_STATUSES.indexOf(st) + 1]; return (
                  <div key={o.id} draggable onDragStart={() => setDragId(o.id)} onDragEnd={() => setDragId(null)} className={cn("surface cursor-grab p-3 active:cursor-grabbing", dragId === o.id && "opacity-50", o.blocked && "border-destructive/40")}>
                    <div className="flex items-start justify-between gap-2"><Link to="/commandes/$id" params={{ id: o.id }} className="text-sm font-medium hover:text-gold">{o.number}</Link>{o.blocked ? <Lock className="h-3.5 w-3.5 text-destructive" /> : late ? <AlertTriangle className="h-3.5 w-3.5 text-destructive" /> : null}</div>
                    <div className="truncate text-xs text-muted-foreground">{o.projectName}</div>
                    <div className="mt-0.5 truncate text-xs text-muted-foreground">{c?.name} · {o.deliveryCountry}</div>
                    <div className="mt-2 flex items-center gap-2"><Progress value={orderProgress(o)} className="h-1" /><span className="text-[11px] text-muted-foreground">{orderProgress(o)}%</span></div>
                    <div className="mt-2 flex items-center justify-between text-[11px]"><span className="text-muted-foreground">Étape prévue {fmtDate(step?.plannedDate)}</span><span className={cn(late ? "text-destructive font-medium" : "text-muted-foreground")}>Liv. {fmtDate(o.dueDate)}</span></div>
                    <div className="mt-1 text-[11px] text-muted-foreground">{o.owner} · {o.lines.reduce((b, l) => b + l.quantity, 0)} m²</div>
                    {next && <Button size="sm" variant="outline" className="mt-2 h-7 w-full text-xs" disabled={o.blocked} onClick={() => move(o, next)}>{next} <ArrowRight className="h-3 w-3" /></Button>}
                  </div>
                ); })}
                {items.length === 0 && <div className="flex flex-1 items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">Déposer ici</div>}
              </div>
            </div>
          ); })}
        </div>
      )}

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Section title="Tâches atelier" description={`${openTasks.length} ouverte(s)`}>
          <ul className="space-y-2">
            {s.tasks.filter((t) => t.relatedType === "order").slice(0, 8).map((t) => { const o = s.orders.find((x) => x.id === t.relatedId); return <li key={t.id} className="flex items-center gap-2 text-sm"><Checkbox checked={t.done} onCheckedChange={() => s.toggleTask(t.id)} /><span className={cn("flex-1", t.done && "line-through text-muted-foreground")}>{t.title}</span>{o && <Link to="/commandes/$id" params={{ id: o.id }} className="text-xs text-gold hover:underline">{o.number}</Link>}{t.dueDate && <span className="text-xs text-muted-foreground">{fmtDate(t.dueDate)}</span>}</li>; })}
            {s.tasks.filter((t) => t.relatedType === "order").length === 0 && <li className="text-sm text-muted-foreground">Aucune tâche.</li>}
          </ul>
          <div className="mt-3 flex gap-2"><Input placeholder="Tâche générale atelier…" value={task} onChange={(e) => setTask(e.target.value)} /><Button size="icon" variant="outline" disabled={!task.trim() || active.length === 0} onClick={() => { s.addTask({ title: task.trim(), relatedType: "order", relatedId: active[0].id }); setTask(""); toast.success("Tâche ajoutée."); }}><Plus className="h-4 w-4" /></Button></div>
        </Section>
        <Section title="Étapes en retard" description="Dates prévues dépassées sans date réelle" noPadding>
          <ul className="divide-y">
            {active.flatMap((o) => o.steps.filter((st) => !st.actualDate && new Date(st.plannedDate).getTime() < Date.now() && ORDER_STATUSES.indexOf(st.name) <= ORDER_STATUSES.indexOf(o.status)).map((st) => ({ o, st }))).map(({ o, st }) => (
              <li key={o.id + st.name} className="flex items-center gap-3 px-5 py-3 text-sm"><AlertTriangle className="h-4 w-4 text-destructive" /><Link to="/commandes/$id" params={{ id: o.id }} className="font-medium hover:text-gold">{o.number}</Link><span className="text-muted-foreground">{st.name}</span><span className="ml-auto text-xs text-destructive">prévu {fmtDate(st.plannedDate)}</span><StatusBadge status={o.status} /></li>
            ))}
            {active.every((o) => !o.steps.some((st) => !st.actualDate && new Date(st.plannedDate).getTime() < Date.now() && ORDER_STATUSES.indexOf(st.name) <= ORDER_STATUSES.indexOf(o.status))) && <li className="flex items-center gap-2 px-5 py-6 text-sm text-muted-foreground"><CheckSquare className="h-4 w-4 text-success" /> Aucune étape en retard.</li>}
          </ul>
        </Section>
      </div>
    </div>
  );
}
