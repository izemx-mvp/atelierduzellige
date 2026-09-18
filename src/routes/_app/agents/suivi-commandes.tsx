import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Radar, AlertTriangle, Send, Pencil, CheckSquare, StickyNote, Check, Loader2, Sparkles, RefreshCw } from "lucide-react";
import { useStore, useHydrated, fmtDate, fmtDateTime, isOrderLate, orderProgress } from "@/lib/store";
import { computeInsights } from "@/lib/agents";
import type { OrderInsight } from "@/lib/types";
import { PageHeader, LoadingBlock, StatusBadge, Section, KpiCard, EmptyState, Field } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/agents/suivi-commandes")({
  head: () => ({ meta: [{ title: "Agent Suivi des commandes — Atelier du Zellige" }, { name: "description", content: "Order Control Center : détection des retards, blocages et étapes manquantes, actions correctives." }, { property: "og:title", content: "Agent Suivi des commandes" }, { property: "og:description", content: "Surveillance des commandes par IA." }] }),
  component: OrderControlPage,
});

function OrderControlPage() {
  const hydrated = useHydrated();
  const s = useStore();
  const [sev, setSev] = useState("all");
  const [showResolved, setShowResolved] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [note, setNote] = useState<{ i: OrderInsight; text: string } | null>(null);
  const list = useMemo(() => s.insights.filter((i) => (showResolved || !i.resolved) && (sev === "all" || i.severity === sev)).sort((a, b) => ["Haute", "Moyenne", "Faible"].indexOf(a.severity) - ["Haute", "Moyenne", "Faible"].indexOf(b.severity)), [s.insights, sev, showResolved]);
  if (!hydrated) return <LoadingBlock />;

  const scan = async () => { setScanning(true); await new Promise((r) => setTimeout(r, 1200)); const st = useStore.getState(); const fresh = computeInsights(st).map((i) => ({ ...i, resolved: st.insights.find((x) => x.id === i.id)?.resolved ?? false })); st.setInsights(fresh); setScanning(false); st.log({ agent: "Suivi des commandes", action: "Analyse des commandes", target: `${st.orders.length} commandes`, result: `${fresh.filter((i) => !i.resolved).length} insight(s) actif(s)`, status: "Succès", link: "/agents/suivi-commandes" }); toast.success("Analyse terminée."); };
  const order = (i: OrderInsight) => s.orders.find((o) => o.id === i.orderId);
  const relance = (i: OrderInsight) => { const o = order(i); if (!o) return; const c = s.clients.find((x) => x.id === o.clientId); s.addMessage({ direction: "out", channel: "Email", contactType: "client", contactId: o.clientId, fromName: s.settings.profile.name, fromEmail: s.settings.profile.email, subject: `Point d'avancement — ${o.number}`, body: `Bonjour ${c?.name.split(" ")[0] ?? ""},\n\nNous vous informons que votre commande ${o.number} (${o.projectName}) est actuellement en phase « ${o.status} ». ${i.type === "Retard" ? "Un léger décalage est à prévoir ; nous vous confirmons la nouvelle date sous 48h." : "Nous revenons vers vous très rapidement avec les prochaines étapes."}\n\nBien cordialement,\n${s.settings.profile.name}` }); s.log({ agent: "Suivi des commandes", action: "Relance", target: o.number, result: `Message envoyé à ${c?.name}`, status: "Succès", link: `/commandes/${o.id}` }); toast.success("Relance envoyée (simulé)."); };
  const task = (i: OrderInsight) => { const o = order(i); if (!o) return; s.addTask({ title: `${i.type} — ${o.number} : ${i.recommendation}`, dueDate: new Date(Date.now() + 2 * 86400000).toISOString(), relatedType: "order", relatedId: o.id, agent: "Suivi des commandes" }); s.log({ agent: "Suivi des commandes", action: "Tâche corrective", target: o.number, result: i.recommendation, status: "Succès", link: `/commandes/${o.id}` }); toast.success("Tâche corrective créée."); };
  const resolve = (i: OrderInsight) => { s.resolveInsight(i.id); const o = order(i); s.log({ agent: "Suivi des commandes", action: "Problème traité", target: o?.number ?? "", result: i.type, status: "Succès", link: `/commandes/${i.orderId}` }); toast.success("Problème marqué comme traité."); };
  const saveNote = () => { if (!note || !note.text.trim()) return; s.addOrderNote(note.i.orderId, `[Agent] ${note.text.trim()}`); toast.success("Note ajoutée à la commande."); setNote(null); };

  const active = s.insights.filter((i) => !i.resolved);
  const watched = s.orders.filter((o) => !["Livrée", "Annulée"].includes(o.status));

  return (
    <div>
      <PageHeader eyebrow="Agent IA" title="Suivi des commandes" description="Order Control Center — surveillance continue et actions correctives."
        actions={<Button className="bg-gold text-gold-foreground hover:bg-gold/90" onClick={scan} disabled={scanning}>{scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Relancer l'analyse</Button>} />
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-5">
        <KpiCard label="Commandes surveillées" value={watched.length} icon={Radar} accent />
        <KpiCard label="Insights actifs" value={active.length} icon={Sparkles} />
        <KpiCard label="Sévérité haute" value={active.filter((i) => i.severity === "Haute").length} icon={AlertTriangle} onClick={() => setSev("Haute")} />
        <KpiCard label="En retard" value={s.orders.filter((o) => isOrderLate(o)).length} />
        <KpiCard label="Traités" value={s.insights.filter((i) => i.resolved).length} icon={Check} onClick={() => setShowResolved(true)} />
      </div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Select value={sev} onValueChange={setSev}><SelectTrigger className="w-44 bg-card"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Toutes sévérités</SelectItem>{["Haute", "Moyenne", "Faible"].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select>
        <Button size="sm" variant={showResolved ? "secondary" : "outline"} className={cn(showResolved && "border-gold")} onClick={() => setShowResolved(!showResolved)}>Afficher les traités</Button>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="space-y-3">
          {list.length === 0 ? <EmptyState icon={Radar} title="Aucun insight" description="Toutes les commandes sont dans les délais. L'agent continue de surveiller." /> : list.map((i) => { const o = order(i); if (!o) return null; const c = s.clients.find((x) => x.id === o.clientId); return (
            <div key={i.id} className={cn("surface p-4", i.resolved && "opacity-60", i.severity === "Haute" && !i.resolved && "border-destructive/40")}>
              <div className="flex flex-wrap items-start gap-3">
                <span className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md", i.severity === "Haute" ? "bg-destructive/10 text-destructive" : i.severity === "Moyenne" ? "bg-warning/15 text-warning" : "bg-secondary text-muted-foreground")}><AlertTriangle className="h-4 w-4" /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><span className="font-semibold">{i.type}</span><StatusBadge status={i.severity} /><Link to="/commandes/$id" params={{ id: o.id }} className="text-sm text-gold hover:underline">{o.number}</Link><span className="text-xs text-muted-foreground">{c?.name} · {o.projectName}</span>{i.resolved && <StatusBadge status="Succès" />}</div>
                  <p className="mt-1 text-sm">{i.message}</p>
                  <p className="mt-1 text-sm text-muted-foreground"><Sparkles className="mr-1 inline h-3.5 w-3.5 text-gold" />Recommandation : {i.recommendation}</p>
                  <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground"><StatusBadge status={o.status} /><Progress value={orderProgress(o)} className="h-1 w-32" /><span>Livraison {fmtDate(o.dueDate)}</span><span>{o.owner}</span></div>
                </div>
              </div>
              {!i.resolved && <div className="mt-3 flex flex-wrap gap-1.5 border-t pt-3">
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => relance(i)}><Send className="h-3.5 w-3.5" /> Relancer</Button>
                <Button size="sm" variant="outline" className="h-7 text-xs" asChild><Link to="/commandes/$id" params={{ id: o.id }}><Pencil className="h-3.5 w-3.5" /> Modifier la commande</Link></Button>
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => task(i)}><CheckSquare className="h-3.5 w-3.5" /> Tâche corrective</Button>
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setNote({ i, text: "" })}><StickyNote className="h-3.5 w-3.5" /> Note</Button>
                <Button size="sm" className="ml-auto h-7 bg-gold text-xs text-gold-foreground hover:bg-gold/90" onClick={() => resolve(i)}><Check className="h-3.5 w-3.5" /> Marquer traité</Button>
              </div>}
            </div>
          ); })}
        </div>
        <div className="space-y-4">
          <Section title="Commandes surveillées" noPadding>
            <ul className="divide-y">{watched.map((o) => <li key={o.id} className="px-4 py-2.5"><div className="flex items-center justify-between gap-2"><Link to="/commandes/$id" params={{ id: o.id }} className="text-sm font-medium hover:text-gold">{o.number}</Link><StatusBadge status={o.status} /></div><div className="mt-1 flex items-center gap-2"><Progress value={orderProgress(o)} className="h-1" /><span className={cn("text-[11px]", isOrderLate(o) ? "text-destructive" : "text-muted-foreground")}>{fmtDate(o.dueDate)}</span></div></li>)}</ul>
          </Section>
          <Section title="Journal de l'agent" noPadding>
            <ul className="divide-y">{s.activities.filter((a) => a.agent === "Suivi des commandes").slice(0, 8).map((l) => <li key={l.id} className="px-4 py-2.5 text-sm"><div className="flex justify-between gap-2"><span className="font-medium">{l.action}</span><span className="text-[11px] text-muted-foreground">{fmtDateTime(l.date)}</span></div><div className="truncate text-xs text-muted-foreground">{l.target} — {l.result}</div></li>)}</ul>
          </Section>
        </div>
      </div>
      <Dialog open={!!note} onOpenChange={(o) => !o && setNote(null)}><DialogContent className="max-w-md"><DialogHeader><DialogTitle>Ajouter une note — {note && order(note.i)?.number}</DialogTitle></DialogHeader><Field label="Note interne"><Textarea rows={4} value={note?.text ?? ""} onChange={(e) => note && setNote({ ...note, text: e.target.value })} /></Field><DialogFooter><Button variant="outline" onClick={() => setNote(null)}>Annuler</Button><Button className="bg-gold text-gold-foreground hover:bg-gold/90" onClick={saveNote}>Ajouter</Button></DialogFooter></DialogContent></Dialog>
    </div>
  );
}
