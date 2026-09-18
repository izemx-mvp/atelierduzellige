import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Sparkles, Loader2, UserPlus, FileText, CalendarPlus, CheckSquare, Reply, StickyNote, Inbox, Check, Headset } from "lucide-react";
import { useStore, useHydrated, fmtDateTime, contactName } from "@/lib/store";
import { analyzeMessage } from "@/lib/agents";
import type { Message } from "@/lib/types";
import { PageHeader, LoadingBlock, StatusBadge, Section, KpiCard, EmptyState, DefinitionList } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/agents/service-client")({
  head: () => ({ meta: [{ title: "Agent Service Client & Prospection — Atelier du Zellige" }, { name: "description", content: "AI Inbox : analyse automatique des messages entrants, qualification et actions en un clic." }, { property: "og:title", content: "Agent Service Client & Prospection" }, { property: "og:description", content: "AI Inbox d'Atelier du Zellige." }] }),
  component: ServiceClientPage,
});

function ServiceClientPage() {
  const hydrated = useHydrated();
  const navigate = useNavigate();
  const s = useStore();
  const [sel, setSel] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [reply, setReply] = useState("");
  const [filter, setFilter] = useState<"todo" | "all">("todo");
  const inbox = useMemo(() => s.messages.filter((m) => m.direction === "in" && (filter === "all" || !m.handled)).sort((a, b) => b.date.localeCompare(a.date)), [s.messages, filter]);
  const current = s.messages.find((m) => m.id === sel) ?? inbox[0];
  if (!hydrated) return <LoadingBlock />;

  const a = current?.analysis;
  const analyze = async (m: Message) => { setLoading(true); await new Promise((r) => setTimeout(r, 1100)); const res = analyzeMessage(m, s); s.updateMessage(m.id, { analysis: res, read: true }); setReply(res.suggestedReply); setLoading(false); s.log({ agent: "Service Client & Prospection", action: "Analyse de message", target: `${m.fromName} — ${m.subject}`, result: `${res.intent} · score ${res.score}`, status: "Succès", link: "/agents/service-client" }); toast.success("Message analysé."); };
  const analyzeAll = async () => { const todo = inbox.filter((m) => !m.analysis); if (!todo.length) return toast.info("Tous les messages sont déjà analysés."); setLoading(true); await new Promise((r) => setTimeout(r, 1400)); todo.forEach((m) => s.updateMessage(m.id, { analysis: analyzeMessage(m, s), read: true })); setLoading(false); s.log({ agent: "Service Client & Prospection", action: "Analyse groupée", target: `${todo.length} messages`, result: "Qualifiés", status: "Succès", link: "/agents/service-client" }); toast.success(`${todo.length} messages analysés.`); };
  const done = (m: Message, action: string, result: string) => { s.updateMessage(m.id, { handled: true }); s.log({ agent: "Service Client & Prospection", action, target: m.fromName, result, status: "Succès", link: "/agents/service-client" }); };

  const createProspect = (m: Message) => { if (!a) return; if (m.contactType) return toast.info("Ce contact existe déjà."); const p = s.addProspect({ name: m.fromName, company: a.company, country: a.country, email: m.fromEmail, phone: "", source: m.channel === "Formulaire" ? "Site web" : m.channel === "Instagram" ? "Instagram" : "Email", stage: "Qualifié", project: a.project, estimatedValue: a.budget.match(/\d+/) ? Number(a.budget.replace(/[^\d]/g, "")) * (a.budget.toLowerCase().includes("k") ? 1000 : 1) : 0, score: a.score, notes: [{ id: Math.random().toString(36).slice(2), text: `Créé par l'agent IA depuis un message ${m.channel}. Intention : ${a.intent}. Produits : ${a.products.join(", ") || "—"}.`, date: new Date().toISOString() }] }); s.updateMessage(m.id, { contactType: "prospect", contactId: p.id }); done(m, "Création prospect", `${p.name} (score ${a.score})`); toast.success("Prospect créé.", { action: { label: "Voir le CRM", onClick: () => navigate({ to: "/prospects" }) } }); };
  const createQuote = (m: Message) => { let clientId = m.contactType === "client" ? m.contactId : undefined; if (!clientId && m.contactType === "prospect" && m.contactId) clientId = s.convertProspect(m.contactId)?.id; if (!clientId) { const c = s.addClient({ name: m.fromName, company: a?.company ?? "", country: a?.country ?? "", city: "", address: "", email: m.fromEmail, phone: "", type: "Architecte", status: "Actif", notes: "Créé par l'agent IA." }); clientId = c.id; s.updateMessage(m.id, { contactType: "client", contactId: c.id }); } const exp = new Date(); exp.setDate(exp.getDate() + 30); const prods = (a?.products ?? []).map((n) => s.products.find((p) => p.name === n)).filter(Boolean); const qty = Number((a?.quantity ?? "").replace(/[^\d]/g, "")) || 10; const q = s.addQuote({ clientId, projectName: a?.project ?? m.subject, projectDescription: m.body.slice(0, 200), projectType: "Résidentiel", projectLocation: a?.country ?? "", expiresAt: exp.toISOString(), lines: prods.map((p) => ({ id: Math.random().toString(36).slice(2), productId: p!.id, reference: p!.reference, description: p!.name, collection: p!.collection, dimensions: p!.dimensions, color: p!.colors[0] ?? "", quantity: qty, unitPrice: p!.price, discount: 0 })), globalDiscount: 0, fees: 0, vatRate: a?.country === "Maroc" ? 20 : 0, status: "Brouillon", paymentTerms: "40 % à la commande, solde avant expédition", leadTime: "6 à 8 semaines", deliveryTerms: "EXW Fès", notes: `Généré depuis le message « ${m.subject} ».` }); done(m, "Création devis", q.number); toast.success(`Devis ${q.number} créé (brouillon).`); navigate({ to: "/devis/$id", params: { id: q.id } }); };
  const createRdv = (m: Message) => { const d = new Date(); d.setDate(d.getDate() + 2); d.setHours(10, 0, 0, 0); const e = new Date(d); e.setHours(11); s.addAppointment({ title: `Échange — ${m.fromName}`, contactType: m.contactType, contactId: m.contactId, start: d.toISOString(), end: e.toISOString(), type: "Visio", status: "Proposé", participants: [s.settings.profile.name, m.fromName], notes: `Suite au message « ${m.subject} ».` }); done(m, "Création rendez-vous", fmtDateTime(d.toISOString())); toast.success("Rendez-vous proposé.", { action: { label: "Calendrier", onClick: () => navigate({ to: "/rendez-vous" }) } }); };
  const createTask = (m: Message) => { s.addTask({ title: `Répondre à ${m.fromName} — ${m.subject}`, dueDate: new Date(Date.now() + 86400000).toISOString(), agent: "Service Client & Prospection" }); done(m, "Création tâche", m.subject); toast.success("Tâche créée."); };
  const addNote = (m: Message) => { if (!a) return; const txt = `[IA] ${a.intent} — ${a.project}. Produits : ${a.products.join(", ") || "—"}. Qté : ${a.quantity}. Budget : ${a.budget}.`; if (m.contactType === "prospect" && m.contactId) s.addProspectNote(m.contactId, txt); else if (m.contactType === "client" && m.contactId) { const c = s.clients.find((x) => x.id === m.contactId); if (c) s.updateClient(c.id, { notes: `${c.notes}\n${txt}`.trim() }); } else return toast.error("Aucune fiche liée : créez d'abord un prospect."); done(m, "Note ajoutée", m.fromName); toast.success("Note ajoutée à la fiche."); };
  const sendReply = (m: Message) => { if (!reply.trim()) return toast.error("La réponse est vide."); s.addMessage({ direction: "out", channel: m.channel, contactType: m.contactType, contactId: m.contactId, fromName: s.settings.profile.name, fromEmail: s.settings.profile.email, subject: `RE: ${m.subject}`, body: reply.trim() }); done(m, "Réponse envoyée", m.subject); toast.success("Réponse envoyée (simulé)."); };

  const analyzed = s.messages.filter((m) => m.direction === "in" && m.analysis).length;
  const handled = s.messages.filter((m) => m.direction === "in" && m.handled).length;

  return (
    <div>
      <PageHeader eyebrow="Agent IA" title="Service Client & Prospection" description="AI Inbox — analyse, qualification et action en un clic."
        actions={<><Button variant="outline" asChild><Link to="/communication">Centre de communication</Link></Button><Button className="bg-gold text-gold-foreground hover:bg-gold/90" onClick={analyzeAll} disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Analyser tous les messages</Button></>} />
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label="À traiter" value={s.messages.filter((m) => m.direction === "in" && !m.handled).length} icon={Inbox} accent />
        <KpiCard label="Analysés" value={analyzed} icon={Sparkles} />
        <KpiCard label="Traités" value={handled} icon={Check} />
        <KpiCard label="Score moyen" value={analyzed ? Math.round(s.messages.filter((m) => m.analysis).reduce((x, m) => x + m.analysis!.score, 0) / analyzed) : "—"} hint="qualification" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
        <div className="surface flex max-h-[calc(100vh-18rem)] flex-col overflow-hidden">
          <div className="flex gap-1 border-b p-2">{(["todo", "all"] as const).map((k) => <Button key={k} size="sm" variant={filter === k ? "secondary" : "ghost"} className={cn("h-7 text-xs", filter === k && "border border-gold")} onClick={() => setFilter(k)}>{k === "todo" ? "À traiter" : "Tous"}</Button>)}</div>
          <ul className="flex-1 divide-y overflow-y-auto">
            {inbox.length === 0 && <li className="p-8 text-center text-sm text-muted-foreground">Boîte vide. Bravo !</li>}
            {inbox.map((m) => (
              <li key={m.id}><button type="button" onClick={() => { setSel(m.id); setReply(m.analysis?.suggestedReply ?? ""); }} className={cn("flex w-full items-start gap-3 px-3 py-3 text-left hover:bg-accent", current?.id === m.id && "bg-accent")}>
                <Avatar className="h-8 w-8"><AvatarFallback className="bg-secondary text-[11px]">{m.fromName.split(" ").map((x) => x[0]).slice(0, 2).join("")}</AvatarFallback></Avatar>
                <div className="min-w-0 flex-1"><div className="flex justify-between gap-2"><span className={cn("truncate text-sm", !m.read ? "font-semibold" : "font-medium")}>{m.fromName}</span><span className="text-[11px] text-muted-foreground">{fmtDateTime(m.date)}</span></div><div className="truncate text-xs">{m.subject}</div><div className="mt-1 flex items-center gap-1.5">{m.analysis ? <><StatusBadge status={m.analysis.urgency} className="text-[10px]" /><span className="text-[11px] text-muted-foreground">Score {m.analysis.score}</span></> : <span className="text-[11px] text-muted-foreground">Non analysé</span>}{m.handled && <Check className="ml-auto h-3.5 w-3.5 text-success" />}</div></div>
              </button></li>
            ))}
          </ul>
        </div>

        {!current ? <EmptyState icon={Headset} title="Aucun message à traiter" description="Les nouveaux messages entrants apparaîtront ici pour analyse." /> : (
          <div className="space-y-4">
            <Section title={current.subject} description={`${current.fromName} · ${current.fromEmail} · ${current.channel} · ${fmtDateTime(current.date)}${current.contactType ? ` · ${contactName(s, current.contactType, current.contactId)}` : ""}`} actions={<div className="flex items-center gap-2">{current.handled && <StatusBadge status="Succès" />}{!a && <Button size="sm" className="bg-gold text-gold-foreground hover:bg-gold/90" onClick={() => analyze(current)} disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Analyser</Button>}</div>}>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{current.body}</p>
            </Section>
            {loading && !a && <Section><div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin text-gold" /> Analyse IA : intention, entreprise, pays, produits, quantités, budget, urgence…</div></Section>}
            {a && (
              <div className="grid gap-4 xl:grid-cols-2">
                <Section title="Résultat de l'analyse IA" actions={<div className="flex items-center gap-2"><StatusBadge status={a.urgency} /><span className={cn("rounded-md px-2 py-0.5 text-sm font-semibold", a.score >= 70 ? "bg-success/12 text-success" : a.score >= 45 ? "bg-gold-soft text-gold-foreground dark:text-gold" : "bg-muted text-muted-foreground")}>Score {a.score}</span></div>}>
                  <DefinitionList items={[{ label: "Intention", value: a.intent }, { label: "Entreprise", value: a.company }, { label: "Pays", value: a.country }, { label: "Projet", value: a.project }, { label: "Produits recherchés", value: a.products.length ? a.products.join(", ") : "Non identifiés" }, { label: "Quantités", value: a.quantity }, { label: "Budget", value: a.budget }, { label: "Urgence", value: a.urgency }]} />
                  <div className="mt-4"><div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Actions recommandées</div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" size="sm" className="justify-start" onClick={() => createProspect(current)} disabled={!!current.contactType}><UserPlus className="h-4 w-4 text-gold" /> {current.contactType ? "Contact existant" : "Créer prospect"}</Button>
                      <Button variant="outline" size="sm" className="justify-start" onClick={() => createQuote(current)}><FileText className="h-4 w-4 text-gold" /> Créer devis</Button>
                      <Button variant="outline" size="sm" className="justify-start" onClick={() => createRdv(current)}><CalendarPlus className="h-4 w-4 text-gold" /> Créer rendez-vous</Button>
                      <Button variant="outline" size="sm" className="justify-start" onClick={() => createTask(current)}><CheckSquare className="h-4 w-4 text-gold" /> Ajouter une tâche</Button>
                      <Button variant="outline" size="sm" className="justify-start" onClick={() => addNote(current)}><StickyNote className="h-4 w-4 text-gold" /> Ajouter une note</Button>
                      <Button variant="outline" size="sm" className="justify-start" onClick={() => { s.updateMessage(current.id, { handled: !current.handled }); toast.success(current.handled ? "Remis à traiter." : "Marqué comme traité."); }}><Check className="h-4 w-4 text-gold" /> {current.handled ? "Remettre à traiter" : "Marquer traité"}</Button>
                    </div>
                  </div>
                </Section>
                <Section title="Réponse proposée" description="Générée par l'agent — modifiable avant envoi">
                  <Textarea rows={11} value={reply} onChange={(e) => setReply(e.target.value)} />
                  <div className="mt-2 flex justify-between"><Button variant="ghost" size="sm" onClick={() => setReply(a.suggestedReply)}>Réinitialiser</Button><Button size="sm" className="bg-gold text-gold-foreground hover:bg-gold/90" onClick={() => sendReply(current)}><Reply className="h-4 w-4" /> Répondre au message</Button></div>
                </Section>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
