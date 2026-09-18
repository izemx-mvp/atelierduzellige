import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Pencil, Trash2, Check, Circle, Clock, AlertTriangle, Plus, Lock, Unlock, ShoppingCart, FileText, Ship, CheckSquare } from "lucide-react";
import { useStore, useHydrated, fmtDate, fmtDateTime, fmtMoney, fmtMoney2, isOrderLate, orderProgress, daysSince } from "@/lib/store";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/types";
import { PageHeader, LoadingBlock, StatusBadge, ConfirmDialog, Section, DefinitionList, EmptyState, Field } from "@/components/shared";
import { OrderDialog } from "@/components/orders/OrderDialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/commandes/$id")({
  head: () => ({ meta: [{ title: "Détail commande — Atelier du Zellige" }, { name: "description", content: "Timeline de production, progression, tâches et notes internes d'une commande." }, { property: "og:title", content: "Détail commande — Atelier du Zellige" }, { property: "og:description", content: "Suivi détaillé d'une commande." }] }),
  component: OrderDetail,
});

function OrderDetail() {
  const { id } = Route.useParams();
  const hydrated = useHydrated();
  const navigate = useNavigate();
  const s = useStore();
  const o = s.orders.find((x) => x.id === id);
  const [edit, setEdit] = useState(false);
  const [del, setDel] = useState(false);
  const [note, setNote] = useState("");
  const [task, setTask] = useState("");
  const [blockDlg, setBlockDlg] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const [stepDlg, setStepDlg] = useState<{ name: OrderStatus; planned: string; owner: string } | null>(null);

  if (!hydrated) return <LoadingBlock />;
  if (!o) return <EmptyState icon={ShoppingCart} title="Commande introuvable" action={<Button asChild variant="outline"><Link to="/commandes"><ArrowLeft className="h-4 w-4" /> Retour</Link></Button>} />;

  const client = s.clients.find((c) => c.id === o.clientId);
  const quote = s.quotes.find((q) => q.id === o.quoteId);
  const shipment = s.shipments.find((sh) => sh.orderId === o.id);
  const tasks = s.tasks.filter((t) => t.relatedType === "order" && t.relatedId === o.id);
  const insights = s.insights.filter((i) => i.orderId === o.id && !i.resolved);
  const idx = ORDER_STATUSES.indexOf(o.status);
  const late = isOrderLate(o);

  const advance = (st: OrderStatus) => { s.setOrderStatus(o.id, st); toast.success(`Commande passée à « ${st} ».`); };
  const toggleBlock = () => { if (o.blocked) { s.updateOrder(o.id, { blocked: false, blockReason: undefined }); s.log({ agent: "Utilisateur", action: "Déblocage commande", target: o.number, result: "Débloquée", status: "Succès", link: `/commandes/${o.id}` }); toast.success("Commande débloquée."); } else setBlockDlg(true); };
  const block = () => { if (!blockReason.trim()) return toast.error("Précisez la raison du blocage."); s.updateOrder(o.id, { blocked: true, blockReason: blockReason.trim() }); s.notify({ title: "Commande bloquée", description: `${o.number} : ${blockReason.trim()}`, link: `/commandes/${o.id}`, severity: "error" }); s.log({ agent: "Utilisateur", action: "Blocage commande", target: o.number, result: blockReason.trim(), status: "Succès", link: `/commandes/${o.id}` }); setBlockDlg(false); setBlockReason(""); toast.warning("Commande marquée comme bloquée."); };
  const saveStep = () => { if (!stepDlg) return; s.updateOrder(o.id, { steps: o.steps.map((st) => st.name === stepDlg.name ? { ...st, plannedDate: new Date(stepDlg.planned).toISOString(), owner: stepDlg.owner } : st) }); setStepDlg(null); toast.success("Étape mise à jour."); };

  return (
    <div>
      <Button variant="ghost" size="sm" className="mb-3 -ml-2" asChild><Link to="/commandes"><ArrowLeft className="h-4 w-4" /> Commandes</Link></Button>
      <PageHeader title={o.number} description={`${o.projectName} · ${client?.name} (${client?.company})`}
        actions={<>
          <StatusBadge status={o.status} className="h-8 px-3 text-sm" />
          {o.blocked && <StatusBadge status="Bloquée" className="h-8 px-3 text-sm" />}
          <Button variant="outline" onClick={() => setEdit(true)}><Pencil className="h-4 w-4" /> Modifier</Button>
          <Button variant="outline" onClick={toggleBlock}>{o.blocked ? <><Unlock className="h-4 w-4" /> Débloquer</> : <><Lock className="h-4 w-4" /> Signaler un blocage</>}</Button>
          {idx < ORDER_STATUSES.length - 1 && o.status !== "Annulée" && <Button className="bg-gold text-gold-foreground hover:bg-gold/90" onClick={() => advance(ORDER_STATUSES[idx + 1])} disabled={o.blocked}><Check className="h-4 w-4" /> Étape suivante : {ORDER_STATUSES[idx + 1]}</Button>}
          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDel(true)}><Trash2 className="h-4 w-4" /></Button>
        </>} />

      {(late || o.blocked || insights.length > 0) && (
        <div className="mb-4 space-y-2">
          {o.blocked && <div className="flex items-center gap-3 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm"><Lock className="h-4 w-4 text-destructive" /><span><span className="font-medium">Commande bloquée :</span> {o.blockReason}</span></div>}
          {late && !o.blocked && <div className="flex items-center gap-3 rounded-md border border-warning/40 bg-warning/10 px-4 py-3 text-sm"><AlertTriangle className="h-4 w-4 text-warning" /><span>Cette commande est en retard de {Math.max(0, daysSince(o.dueDate))} jour(s) sur la date de livraison prévue ({fmtDate(o.dueDate)}).</span></div>}
          {insights.map((i) => <div key={i.id} className="flex items-center gap-3 rounded-md border border-gold/40 bg-gold-soft px-4 py-3 text-sm"><span className="text-gold font-medium">AI Insight</span><span className="flex-1">{i.message} — <span className="text-muted-foreground">{i.recommendation}</span></span><Button size="sm" variant="ghost" asChild><Link to="/agents/suivi-commandes">Traiter</Link></Button></div>)}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <Section title="Progression" description={`${orderProgress(o)} % · étape ${idx + 1}/${ORDER_STATUSES.length}`}>
            <Progress value={orderProgress(o)} className="mb-6 h-2" />
            <ol className="relative space-y-0">
              {o.steps.map((st, i) => {
                const done = i < idx || (i === idx && o.status === "Livrée"); const current = i === idx && !done; const overdue = !st.actualDate && new Date(st.plannedDate).getTime() < Date.now() && i >= idx;
                return (
                  <li key={st.name} className="relative flex gap-4 pb-6 last:pb-0">
                    {i < o.steps.length - 1 && <span className={cn("absolute left-[11px] top-6 h-full w-px", done ? "bg-gold" : "bg-border")} />}
                    <span className={cn("relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2", done ? "border-gold bg-gold text-gold-foreground" : current ? "border-gold bg-card text-gold" : "border-border bg-card text-muted-foreground")}>{done ? <Check className="h-3.5 w-3.5" /> : current ? <Clock className="h-3.5 w-3.5" /> : <Circle className="h-2 w-2 fill-current" />}</span>
                    <button type="button" onClick={() => setStepDlg({ name: st.name, planned: st.plannedDate.slice(0, 10), owner: st.owner })} className="flex flex-1 flex-wrap items-center gap-x-4 gap-y-1 rounded-md px-2 py-1 text-left -mx-2 hover:bg-accent">
                      <span className={cn("w-40 text-sm font-medium", current && "text-gold")}>{st.name}</span>
                      <span className="text-xs text-muted-foreground">Prévu : <span className={cn(overdue && "text-destructive font-medium")}>{fmtDate(st.plannedDate)}</span></span>
                      <span className="text-xs text-muted-foreground">Réel : {st.actualDate ? fmtDate(st.actualDate) : "—"}</span>
                      <span className="ml-auto text-xs text-muted-foreground">{st.owner}</span>
                      {current && <span className="rounded bg-gold-soft px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-gold-foreground dark:text-gold">En cours</span>}
                      {overdue && !done && <AlertTriangle className="h-3.5 w-3.5 text-destructive" />}
                    </button>
                  </li>
                );
              })}
            </ol>
            <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
              {ORDER_STATUSES.map((st) => <Button key={st} size="sm" variant={st === o.status ? "secondary" : "outline"} className={cn("h-7 text-xs", st === o.status && "border-gold")} onClick={() => advance(st)} disabled={st === o.status}>{st}</Button>)}
              <Button size="sm" variant="outline" className="h-7 text-xs text-destructive" onClick={() => advance("Annulée")} disabled={o.status === "Annulée"}>Annuler la commande</Button>
            </div>
          </Section>

          <Section title="Lignes de commande" noPadding>
            <table className="w-full text-sm">
              <thead className="border-b text-[11px] uppercase tracking-wider text-muted-foreground"><tr><th className="px-5 py-2 text-left">Réf.</th><th className="px-2 py-2 text-left">Produit</th><th className="px-2 py-2 text-left">Couleur</th><th className="px-2 py-2 text-right">Qté</th><th className="px-2 py-2 text-right">PU</th><th className="px-5 py-2 text-right">Total</th></tr></thead>
              <tbody>{o.lines.map((l) => <tr key={l.id} className="border-b last:border-0"><td className="px-5 py-2 font-mono text-xs">{l.reference}</td><td className="px-2 py-2">{l.description}</td><td className="px-2 py-2 text-muted-foreground">{l.color}</td><td className="px-2 py-2 text-right">{l.quantity}</td><td className="px-2 py-2 text-right">{fmtMoney2(l.unitPrice)}{l.discount ? <span className="text-xs text-muted-foreground"> (-{l.discount} %)</span> : null}</td><td className="px-5 py-2 text-right font-medium">{fmtMoney2(l.quantity * l.unitPrice * (1 - l.discount / 100))}</td></tr>)}</tbody>
              <tfoot className="border-t bg-secondary/40"><tr><td colSpan={5} className="px-5 py-2 text-right text-muted-foreground">Total HT</td><td className="px-5 py-2 text-right font-semibold">{fmtMoney2(o.totalHT)}</td></tr><tr><td colSpan={5} className="px-5 py-2 text-right text-muted-foreground">Total TTC</td><td className="px-5 py-2 text-right font-semibold">{fmtMoney2(o.totalTTC)}</td></tr></tfoot>
            </table>
          </Section>

          <div className="grid gap-4 md:grid-cols-2">
            <Section title="Tâches" description={`${tasks.filter((t) => !t.done).length} ouverte(s)`}>
              <ul className="space-y-2">
                {tasks.map((t) => <li key={t.id} className="flex items-center gap-2 text-sm"><Checkbox checked={t.done} onCheckedChange={() => s.toggleTask(t.id)} /><span className={cn("flex-1", t.done && "line-through text-muted-foreground")}>{t.title}</span>{t.dueDate && <span className="text-xs text-muted-foreground">{fmtDate(t.dueDate)}</span>}{t.agent && <span className="rounded bg-gold-soft px-1.5 text-[10px] text-gold-foreground dark:text-gold">IA</span>}</li>)}
                {tasks.length === 0 && <li className="text-sm text-muted-foreground">Aucune tâche.</li>}
              </ul>
              <div className="mt-3 flex gap-2"><Input placeholder="Nouvelle tâche…" value={task} onChange={(e) => setTask(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && task.trim()) { s.addTask({ title: task.trim(), relatedType: "order", relatedId: o.id }); setTask(""); toast.success("Tâche ajoutée."); } }} /><Button size="icon" variant="outline" disabled={!task.trim()} onClick={() => { s.addTask({ title: task.trim(), relatedType: "order", relatedId: o.id }); setTask(""); toast.success("Tâche ajoutée."); }}><Plus className="h-4 w-4" /></Button></div>
            </Section>
            <Section title="Notes internes">
              <ul className="max-h-48 space-y-3 overflow-y-auto">
                {o.notes.map((n) => <li key={n.id} className="text-sm"><div className="text-xs text-muted-foreground">{n.author} · {fmtDateTime(n.date)}</div><div>{n.text}</div></li>)}
                {o.notes.length === 0 && <li className="text-sm text-muted-foreground">Aucune note.</li>}
              </ul>
              <div className="mt-3 flex gap-2"><Textarea rows={2} placeholder="Ajouter une note…" value={note} onChange={(e) => setNote(e.target.value)} /><Button size="sm" variant="outline" disabled={!note.trim()} onClick={() => { s.addOrderNote(o.id, note.trim()); setNote(""); toast.success("Note ajoutée."); }}>Ajouter</Button></div>
            </Section>
          </div>
        </div>

        <div className="space-y-4">
          <Section title="Informations">
            <DefinitionList items={[{ label: "Client", value: <Link to="/clients/$id" params={{ id: o.clientId }} className="text-gold hover:underline">{client?.name}</Link> }, { label: "Responsable", value: o.owner }, { label: "Créée le", value: fmtDate(o.createdAt) }, { label: "Livraison prévue", value: <span className={cn(late && "text-destructive font-medium")}>{fmtDate(o.dueDate)}</span> }, { label: "Montant HT", value: fmtMoney(o.totalHT) }, { label: "Montant TTC", value: fmtMoney(o.totalTTC) }, { label: "Devis d'origine", value: quote ? <Link to="/devis/$id" params={{ id: quote.id }} className="text-gold hover:underline"><FileText className="mr-1 inline h-3.5 w-3.5" />{quote.number}</Link> : "—" }, { label: "Expédition", value: shipment ? <Link to="/export" className="text-gold hover:underline"><Ship className="mr-1 inline h-3.5 w-3.5" />{shipment.carrier} · {shipment.status}</Link> : "Non planifiée" }]} />
          </Section>
          <Section title="Livraison"><p className="text-sm">{o.deliveryAddress || "—"}</p><p className="text-sm text-muted-foreground">{o.deliveryCountry}</p>
            {!shipment && idx >= 2 && <Button size="sm" variant="outline" className="mt-3" onClick={() => { const eta = new Date(); eta.setDate(eta.getDate() + 14); s.addShipment({ orderId: o.id, carrier: "À définir", trackingNumber: "", destinationCountry: o.deliveryCountry, address: o.deliveryAddress, eta: eta.toISOString(), status: "Préparation", issue: null, incoterm: "EXW Fès", weightKg: 0 }); toast.success("Expédition créée.", { action: { label: "Voir", onClick: () => navigate({ to: "/export" }) } }); }}><Ship className="h-4 w-4" /> Planifier l'expédition</Button>}
          </Section>
          <Section title="Actions rapides">
            <div className="flex flex-col gap-2">
              <Button variant="outline" size="sm" className="justify-start" onClick={() => { s.addTask({ title: `Point client ${client?.name} — ${o.number}`, relatedType: "order", relatedId: o.id }); toast.success("Tâche créée."); }}><CheckSquare className="h-4 w-4" /> Créer une tâche de suivi</Button>
              <Button variant="outline" size="sm" className="justify-start" asChild><Link to="/agents/suivi-commandes">Analyser avec l'agent IA</Link></Button>
            </div>
          </Section>
        </div>
      </div>

      <OrderDialog open={edit} onOpenChange={setEdit} order={o} />
      <ConfirmDialog open={del} onOpenChange={setDel} title={`Supprimer ${o.number} ?`} onConfirm={() => { s.deleteOrder(o.id); toast.success("Élément supprimé."); navigate({ to: "/commandes" }); }} />
      <Dialog open={blockDlg} onOpenChange={setBlockDlg}><DialogContent className="max-w-md"><DialogHeader><DialogTitle>Signaler un blocage</DialogTitle></DialogHeader><Field label="Raison"><Textarea rows={3} value={blockReason} onChange={(e) => setBlockReason(e.target.value)} placeholder="Ex. lot non conforme, matière indisponible…" /></Field><DialogFooter><Button variant="outline" onClick={() => setBlockDlg(false)}>Annuler</Button><Button variant="destructive" onClick={block}>Bloquer</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={!!stepDlg} onOpenChange={(v) => !v && setStepDlg(null)}><DialogContent className="max-w-md">{stepDlg && <><DialogHeader><DialogTitle>Étape « {stepDlg.name} »</DialogTitle></DialogHeader><Field label="Date prévue"><Input type="date" value={stepDlg.planned} onChange={(e) => setStepDlg({ ...stepDlg, planned: e.target.value })} /></Field><Field label="Responsable"><Input value={stepDlg.owner} onChange={(e) => setStepDlg({ ...stepDlg, owner: e.target.value })} /></Field><DialogFooter><Button variant="outline" onClick={() => setStepDlg(null)}>Annuler</Button><Button className="bg-gold text-gold-foreground hover:bg-gold/90" onClick={saveStep}>Enregistrer</Button></DialogFooter></>}</DialogContent></Dialog>
    </div>
  );
}
