import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { BellRing, Sparkles, Copy, Send, Clock, X, CheckSquare, Pencil, Plus, Trash2, Loader2, RefreshCw } from "lucide-react";
import { useStore, useHydrated, fmtDateTime } from "@/lib/store";
import { computeFollowUps } from "@/lib/agents";
import type { FollowUp, FollowUpRule } from "@/lib/types";
import { PageHeader, LoadingBlock, StatusBadge, Section, KpiCard, EmptyState, Field } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/agents/relances")({
  head: () => ({ meta: [{ title: "Agent Relances — Atelier du Zellige" }, { name: "description", content: "Smart Follow-up : détection automatique des relances, messages personnalisés et règles par délais." }, { property: "og:title", content: "Agent Relances" }, { property: "og:description", content: "Relances intelligentes pilotées par IA." }] }),
  component: FollowUpPage,
});

const TRIGGERS: { v: FollowUpRule["trigger"]; l: string }[] = [{ v: "quote", l: "Devis sans réponse" }, { v: "sample", l: "Échantillon non validé" }, { v: "prospect", l: "Prospect inactif" }, { v: "order", l: "Commande bloquée" }, { v: "client", l: "Client sans réponse" }, { v: "appointment", l: "Rendez-vous non confirmé" }];
const ACTIONS: FollowUpRule["action"][] = ["Proposer une relance", "Créer une alerte", "Créer une tâche"];

function FollowUpPage() {
  const hydrated = useHydrated();
  const navigate = useNavigate();
  const s = useStore();
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("À traiter");
  const [edit, setEdit] = useState<FollowUp | null>(null);
  const [plan, setPlan] = useState<{ f: FollowUp; at: string } | null>(null);
  const [gen, setGen] = useState<string | null>(null);
  const [newRule, setNewRule] = useState({ label: "", trigger: "quote" as FollowUpRule["trigger"], days: 3, action: "Proposer une relance" as FollowUpRule["action"] });
  const list = useMemo(() => s.followUps.filter((f) => (type === "all" || f.type === type) && (status === "all" || f.status === status)).sort((a, b) => b.daysSince - a.daysSince), [s.followUps, type, status]);
  if (!hydrated) return <LoadingBlock />;

  const link = (f: FollowUp) => f.targetType === "quote" ? `/devis/${f.targetId}` : f.targetType === "order" ? `/commandes/${f.targetId}` : f.targetType === "client" ? `/clients/${f.targetId}` : f.targetType === "sample" ? "/echantillons" : f.targetType === "appointment" ? "/rendez-vous" : "/prospects";
  const regenerate = async (f: FollowUp) => { setGen(f.id); await new Promise((r) => setTimeout(r, 900)); const fresh = computeFollowUps(useStore.getState()).find((x) => x.id === f.id); const variants = [fresh?.message ?? f.message, f.message.replace("Je me permets de revenir vers vous", "Je reviens vers vous").replace("J'espère que", "J'imagine que"), f.message.replace(/\n\nBien cordialement,|\n\nBien à vous,|\n\nÀ très bientôt,/, "\n\nAu plaisir d'échanger,")]; s.updateFollowUp(f.id, { message: variants[Math.floor(Math.random() * variants.length)] ?? f.message }); setGen(null); s.log({ agent: "Relances", action: "Génération de message", target: f.contactName, result: f.type, status: "Succès", link: "/agents/relances" }); toast.success("Message personnalisé généré."); };
  const send = (f: FollowUp) => { const ct = f.targetType === "client" || f.targetType === "quote" || f.targetType === "order" ? "client" : f.targetType === "prospect" ? "prospect" : undefined; const cid = f.targetType === "quote" ? s.quotes.find((q) => q.id === f.targetId)?.clientId : f.targetType === "order" ? s.orders.find((o) => o.id === f.targetId)?.clientId : f.targetType === "client" || f.targetType === "prospect" ? f.targetId : undefined; s.addMessage({ direction: "out", channel: "Email", contactType: ct, contactId: cid, fromName: s.settings.profile.name, fromEmail: s.settings.profile.email, subject: `Relance — ${f.type}`, body: f.message }); s.updateFollowUp(f.id, { status: "Envoyée" }); if (ct === "prospect" && cid) s.updateProspect(cid, {}); s.log({ agent: "Relances", action: "Relance envoyée", target: f.contactName, result: f.type, status: "Succès", link: "/agents/relances" }); toast.success("Relance envoyée (simulé)."); };
  const ignore = (f: FollowUp) => { s.updateFollowUp(f.id, { status: "Ignorée" }); s.log({ agent: "Relances", action: "Relance ignorée", target: f.contactName, result: f.type, status: "Refusé", link: "/agents/relances" }); toast.success("Relance ignorée."); };
  const task = (f: FollowUp) => { s.addTask({ title: `Relancer ${f.contactName} — ${f.type}`, dueDate: new Date(Date.now() + 86400000).toISOString(), relatedType: f.targetType === "appointment" ? undefined : f.targetType, relatedId: f.targetId, agent: "Relances" }); toast.success("Tâche créée."); };
  const doPlan = () => { if (!plan) return; s.updateFollowUp(plan.f.id, { status: "Planifiée", scheduledAt: new Date(plan.at).toISOString() }); s.log({ agent: "Relances", action: "Envoi planifié", target: plan.f.contactName, result: fmtDateTime(new Date(plan.at).toISOString()), status: "Succès", link: "/agents/relances" }); setPlan(null); toast.success("Envoi planifié."); };
  const addRule = () => { if (!newRule.label.trim()) return toast.error("Libellé requis."); s.addFollowUpRule({ ...newRule, enabled: true }); setNewRule({ label: "", trigger: "quote", days: 3, action: "Proposer une relance" }); toast.success("Règle ajoutée."); };

  const counts = { todo: s.followUps.filter((f) => f.status === "À traiter").length, planned: s.followUps.filter((f) => f.status === "Planifiée").length, sent: s.followUps.filter((f) => f.status === "Envoyée").length, ignored: s.followUps.filter((f) => f.status === "Ignorée").length };

  return (
    <div>
      <PageHeader eyebrow="Agent IA" title="Relances" description="Smart Follow-up — l'agent détecte, vous validez, l'envoi est simulé."
        actions={<Button variant="outline" onClick={() => { const st = useStore.getState(); st.setFollowUps(computeFollowUps(st).map((f) => { const p = st.followUps.find((x) => x.id === f.id); return p ? { ...f, status: p.status, message: p.message, scheduledAt: p.scheduledAt } : f; })); toast.success("Détection relancée."); }}><RefreshCw className="h-4 w-4" /> Relancer la détection</Button>} />
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label="À traiter" value={counts.todo} icon={BellRing} accent onClick={() => setStatus("À traiter")} />
        <KpiCard label="Planifiées" value={counts.planned} icon={Clock} onClick={() => setStatus("Planifiée")} />
        <KpiCard label="Envoyées" value={counts.sent} icon={Send} onClick={() => setStatus("Envoyée")} />
        <KpiCard label="Ignorées" value={counts.ignored} icon={X} onClick={() => setStatus("Ignorée")} />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <div>
          <div className="mb-3 flex flex-wrap gap-2">
            <Select value={type} onValueChange={setType}><SelectTrigger className="w-56 bg-card"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Toutes les situations</SelectItem>{TRIGGERS.map((t) => <SelectItem key={t.v} value={t.l}>{t.l}</SelectItem>)}</SelectContent></Select>
            <Select value={status} onValueChange={setStatus}><SelectTrigger className="w-40 bg-card"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Tous statuts</SelectItem>{["À traiter", "Planifiée", "Envoyée", "Ignorée"].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select>
          </div>
          {list.length === 0 ? <EmptyState icon={BellRing} title="Aucune relance" description="L'agent n'a détecté aucune situation nécessitant une relance avec ces filtres." /> : (
            <div className="space-y-3">{list.map((f) => (
              <div key={f.id} className={cn("surface p-4", f.status !== "À traiter" && "opacity-75")}>
                <div className="flex flex-wrap items-center gap-2"><StatusBadge status={f.type} className="bg-gold-soft text-gold-foreground border-gold/40 dark:text-gold" /><button type="button" onClick={() => navigate({ href: link(f) })} className="font-medium hover:text-gold">{f.contactName}</button><span className="text-xs text-muted-foreground">{f.daysSince} jour(s) sans réponse</span><span className="ml-auto"><StatusBadge status={f.status} /></span>{f.scheduledAt && <span className="text-xs text-muted-foreground">→ {fmtDateTime(f.scheduledAt)}</span>}</div>
                <pre className="mt-3 whitespace-pre-wrap rounded-md border bg-secondary/40 p-3 font-sans text-sm leading-relaxed">{f.message}</pre>
                {f.status === "À traiter" && <div className="mt-3 flex flex-wrap gap-1.5">
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => regenerate(f)} disabled={gen === f.id}>{gen === f.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 text-gold" />} Générer un message</Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setEdit(f)}><Pencil className="h-3.5 w-3.5" /> Modifier</Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { navigator.clipboard?.writeText(f.message); toast.success("Message copié."); }}><Copy className="h-3.5 w-3.5" /> Copier</Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); setPlan({ f, at: d.toISOString().slice(0, 16) }); }}><Clock className="h-3.5 w-3.5" /> Planifier</Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => task(f)}><CheckSquare className="h-3.5 w-3.5" /> Tâche</Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground" onClick={() => ignore(f)}><X className="h-3.5 w-3.5" /> Ignorer</Button>
                  <Button size="sm" className="ml-auto h-7 bg-gold text-xs text-gold-foreground hover:bg-gold/90" onClick={() => send(f)}><Send className="h-3.5 w-3.5" /> Envoyer maintenant</Button>
                </div>}
                {f.status === "Planifiée" && <div className="mt-3 flex gap-1.5"><Button size="sm" className="h-7 bg-gold text-xs text-gold-foreground hover:bg-gold/90" onClick={() => send(f)}><Send className="h-3.5 w-3.5" /> Envoyer maintenant</Button><Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => s.updateFollowUp(f.id, { status: "À traiter", scheduledAt: undefined })}>Annuler la planification</Button></div>}
              </div>
            ))}</div>
          )}
        </div>
        <div className="space-y-4">
          <Section title="Règles automatiques" description="Basées sur des délais" noPadding>
            <ul className="divide-y">{s.followUpRules.map((r) => (
              <li key={r.id} className="flex items-center gap-3 px-4 py-3"><Switch checked={r.enabled} onCheckedChange={(v) => { s.updateFollowUpRule(r.id, { enabled: v }); toast.success(v ? "Règle activée." : "Règle désactivée."); }} /><div className="min-w-0 flex-1"><div className="text-sm font-medium">{r.label}</div><div className="text-xs text-muted-foreground">Après <Input type="number" min={1} className="mx-1 inline h-6 w-14 px-1 text-xs" value={r.days} onChange={(e) => s.updateFollowUpRule(r.id, { days: Number(e.target.value) })} /> jours → {r.action}</div></div><Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => { s.deleteFollowUpRule(r.id); toast.success("Règle supprimée."); }}><Trash2 className="h-3.5 w-3.5" /></Button></li>
            ))}</ul>
            <div className="space-y-2 border-t p-4">
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Nouvelle règle</div>
              <Input placeholder="Libellé" value={newRule.label} onChange={(e) => setNewRule({ ...newRule, label: e.target.value })} />
              <div className="grid grid-cols-2 gap-2">
                <Select value={newRule.trigger} onValueChange={(v) => setNewRule({ ...newRule, trigger: v as FollowUpRule["trigger"] })}><SelectTrigger className="h-9"><SelectValue /></SelectTrigger><SelectContent>{TRIGGERS.map((t) => <SelectItem key={t.v} value={t.v}>{t.l}</SelectItem>)}</SelectContent></Select>
                <Input type="number" min={1} value={newRule.days} onChange={(e) => setNewRule({ ...newRule, days: Number(e.target.value) })} />
              </div>
              <Select value={newRule.action} onValueChange={(v) => setNewRule({ ...newRule, action: v as FollowUpRule["action"] })}><SelectTrigger className="h-9"><SelectValue /></SelectTrigger><SelectContent>{ACTIONS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent></Select>
              <Button size="sm" variant="outline" className="w-full" onClick={addRule}><Plus className="h-4 w-4" /> Ajouter la règle</Button>
            </div>
          </Section>
          <Section title="Journal de l'agent" noPadding>
            <ul className="divide-y">{s.activities.filter((a) => a.agent === "Relances").slice(0, 8).map((l) => <li key={l.id} className="px-4 py-2.5 text-sm"><div className="flex justify-between gap-2"><span className="font-medium">{l.action}</span><StatusBadge status={l.status} /></div><div className="truncate text-xs text-muted-foreground">{l.target} — {l.result} · {fmtDateTime(l.date)}</div></li>)}</ul>
          </Section>
        </div>
      </div>
      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}><DialogContent className="max-w-lg"><DialogHeader><DialogTitle>Modifier le message — {edit?.contactName}</DialogTitle></DialogHeader><Textarea rows={10} value={edit?.message ?? ""} onChange={(e) => edit && setEdit({ ...edit, message: e.target.value })} /><DialogFooter><Button variant="outline" onClick={() => setEdit(null)}>Annuler</Button><Button className="bg-gold text-gold-foreground hover:bg-gold/90" onClick={() => { if (edit) { s.updateFollowUp(edit.id, { message: edit.message }); toast.success("Modifications enregistrées."); setEdit(null); } }}>Enregistrer</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={!!plan} onOpenChange={(o) => !o && setPlan(null)}><DialogContent className="max-w-sm"><DialogHeader><DialogTitle>Planifier l'envoi</DialogTitle></DialogHeader><Field label="Date et heure"><Input type="datetime-local" value={plan?.at ?? ""} onChange={(e) => plan && setPlan({ ...plan, at: e.target.value })} /></Field><DialogFooter><Button variant="outline" onClick={() => setPlan(null)}>Annuler</Button><Button className="bg-gold text-gold-foreground hover:bg-gold/90" onClick={doPlan}>Planifier</Button></DialogFooter></DialogContent></Dialog>
    </div>
  );
}
