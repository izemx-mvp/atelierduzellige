import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { MessageSquare, Mail, Send, Sparkles, Plus, Trash2, Reply, Inbox, Search } from "lucide-react";
import { useStore, useHydrated, fmtDateTime, contactName } from "@/lib/store";
import type { Message } from "@/lib/types";
import { PageHeader, LoadingBlock, StatusBadge, EmptyState, Field, ConfirmDialog } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/communication")({
  head: () => ({ meta: [{ title: "Communication — Atelier du Zellige" }, { name: "description", content: "Centre de communication : emails, messages prospects et clients, historique des échanges." }, { property: "og:title", content: "Communication — Atelier du Zellige" }, { property: "og:description", content: "Centre de communication centralisé." }] }),
  component: CommunicationPage,
});

const CHANNELS: Message["channel"][] = ["Email", "WhatsApp", "Instagram", "Formulaire"];

function CommunicationPage() {
  const hydrated = useHydrated();
  const s = useStore();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "in" | "out" | "unread" | "clients" | "prospects">("all");
  const [channel, setChannel] = useState("all");
  const [sel, setSel] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [compose, setCompose] = useState(false);
  const [del, setDel] = useState<Message | null>(null);
  const [cf, setCf] = useState({ contactType: "client" as "client" | "prospect", contactId: "", channel: "Email" as Message["channel"], subject: "", body: "" });

  const threads = useMemo(() => {
    const t = q.toLowerCase();
    const list = s.messages.filter((m) => (!t || [m.fromName, m.subject, m.body, m.fromEmail].some((x) => x.toLowerCase().includes(t))) && (channel === "all" || m.channel === channel) && (filter === "all" || (filter === "in" && m.direction === "in") || (filter === "out" && m.direction === "out") || (filter === "unread" && !m.read && m.direction === "in") || (filter === "clients" && m.contactType === "client") || (filter === "prospects" && m.contactType === "prospect")));
    return [...list].sort((a, b) => b.date.localeCompare(a.date));
  }, [s.messages, q, filter, channel]);
  const current = s.messages.find((m) => m.id === sel) ?? threads[0];
  const conversation = useMemo(() => current ? s.messages.filter((m) => (current.contactId && m.contactId === current.contactId) || m.fromEmail === current.fromEmail || (m.direction === "out" && m.subject.includes(current.subject.replace(/^RE: /, "")))).sort((a, b) => a.date.localeCompare(b.date)) : [], [s.messages, current]);

  if (!hydrated) return <LoadingBlock />;

  const open = (m: Message) => { setSel(m.id); if (!m.read) s.updateMessage(m.id, { read: true }); };
  const sendReply = () => {
    if (!current || !reply.trim()) return;
    s.addMessage({ direction: "out", channel: current.channel, contactType: current.contactType, contactId: current.contactId, fromName: s.settings.profile.name, fromEmail: s.settings.profile.email, subject: `RE: ${current.subject.replace(/^RE: /, "")}`, body: reply.trim() });
    s.updateMessage(current.id, { handled: true, read: true });
    s.log({ agent: "Utilisateur", action: "Réponse envoyée", target: current.fromName, result: current.subject, status: "Succès", link: "/communication" });
    setReply(""); toast.success("Message envoyé (simulé).");
  };
  const sendCompose = () => {
    if (!cf.contactId || !cf.subject.trim() || !cf.body.trim()) return toast.error("Destinataire, objet et message requis.");
    const c = cf.contactType === "client" ? s.clients.find((x) => x.id === cf.contactId) : s.prospects.find((x) => x.id === cf.contactId);
    s.addMessage({ direction: "out", channel: cf.channel, contactType: cf.contactType, contactId: cf.contactId, fromName: s.settings.profile.name, fromEmail: s.settings.profile.email, subject: cf.subject, body: cf.body });
    if (c && cf.contactType === "prospect") s.updateProspect(c.id, { stage: s.prospects.find((p) => p.id === c.id)?.stage === "Nouveau" ? "Contacté" : (s.prospects.find((p) => p.id === c.id)?.stage ?? "Contacté") });
    setCompose(false); setCf({ contactType: "client", contactId: "", channel: "Email", subject: "", body: "" }); toast.success("Message envoyé (simulé).");
  };
  const unread = s.messages.filter((m) => m.direction === "in" && !m.read).length;

  return (
    <div>
      <PageHeader eyebrow="Échanges" title="Communication" description={`${s.messages.length} messages · ${unread} non lus`}
        actions={<><Button variant="outline" asChild><Link to="/agents/service-client"><Sparkles className="h-4 w-4 text-gold" /> Analyser avec l'IA</Link></Button><Button className="bg-gold text-gold-foreground hover:bg-gold/90" onClick={() => setCompose(true)}><Plus className="h-4 w-4" /> Nouveau message</Button></>} />

      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <div className="surface flex max-h-[calc(100vh-15rem)] flex-col overflow-hidden">
          <div className="space-y-2 border-b p-3">
            <div className="relative"><Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher…" className="pl-9" /></div>
            <div className="flex flex-wrap gap-1">{([["all", "Tous"], ["unread", "Non lus"], ["in", "Reçus"], ["out", "Envoyés"], ["clients", "Clients"], ["prospects", "Prospects"]] as const).map(([k, l]) => <Button key={k} size="sm" variant={filter === k ? "secondary" : "ghost"} className={cn("h-7 text-xs", filter === k && "border border-gold")} onClick={() => setFilter(k)}>{l}</Button>)}</div>
            <Select value={channel} onValueChange={setChannel}><SelectTrigger className="h-8"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Tous les canaux</SelectItem>{CHANNELS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
          </div>
          <ul className="flex-1 divide-y overflow-y-auto">
            {threads.length === 0 && <li className="p-8 text-center text-sm text-muted-foreground">Aucun message.</li>}
            {threads.map((m) => (
              <li key={m.id}>
                <button type="button" onClick={() => open(m)} className={cn("flex w-full items-start gap-3 px-3 py-3 text-left hover:bg-accent", current?.id === m.id && "bg-accent", !m.read && m.direction === "in" && "bg-gold-soft/30")}>
                  <Avatar className="h-8 w-8"><AvatarFallback className={cn("text-[11px]", m.direction === "out" ? "bg-charcoal text-charcoal-foreground" : "bg-secondary")}>{m.fromName.split(" ").map((x) => x[0]).slice(0, 2).join("")}</AvatarFallback></Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2"><span className={cn("truncate text-sm", !m.read && m.direction === "in" ? "font-semibold" : "font-medium")}>{m.direction === "out" ? "→ " : ""}{m.fromName}</span><span className="shrink-0 text-[11px] text-muted-foreground">{fmtDateTime(m.date)}</span></div>
                    <div className="truncate text-xs">{m.subject}</div>
                    <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground"><span>{m.channel}</span>{m.contactType && <span>· {m.contactType === "client" ? "Client" : "Prospect"}</span>}{m.analysis && <span className="text-gold">· Analysé</span>}</div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {current ? (
          <div className="surface flex flex-col">
            <div className="flex flex-wrap items-center gap-3 border-b px-5 py-4">
              <div className="min-w-0 flex-1"><h2 className="truncate font-semibold">{current.subject}</h2><div className="text-xs text-muted-foreground">{current.fromName} · {current.fromEmail} · {current.channel}{current.contactType && <> · {current.contactType === "client" ? <Link to="/clients/$id" params={{ id: current.contactId! }} className="text-gold hover:underline">{contactName(s, current.contactType, current.contactId)}</Link> : <Link to="/prospects" className="text-gold hover:underline">{contactName(s, current.contactType, current.contactId)}</Link>}</>}</div></div>
              {current.analysis && <StatusBadge status={current.analysis.urgency} />}
              <Button variant="outline" size="sm" asChild><Link to="/agents/service-client"><Sparkles className="h-4 w-4 text-gold" /> Analyser</Link></Button>
              <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDel(current)}><Trash2 className="h-4 w-4" /></Button>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              {conversation.map((m) => (
                <div key={m.id} className={cn("max-w-[85%] rounded-lg border p-4 text-sm", m.direction === "out" ? "ml-auto bg-charcoal text-charcoal-foreground border-charcoal" : "bg-card")}>
                  <div className={cn("mb-1.5 flex items-center justify-between gap-3 text-[11px]", m.direction === "out" ? "text-charcoal-foreground/70" : "text-muted-foreground")}><span className="font-medium">{m.fromName}</span><span>{fmtDateTime(m.date)} · {m.channel}</span></div>
                  <div className="whitespace-pre-wrap leading-relaxed">{m.body}</div>
                </div>
              ))}
            </div>
            <div className="border-t p-4">
              <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground"><Reply className="h-3.5 w-3.5" /> Répondre à {current.fromName}</div>
              <Textarea rows={3} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Votre réponse…" />
              <div className="mt-2 flex items-center justify-between"><Button variant="ghost" size="sm" onClick={() => { const a = current.analysis; setReply(a ? a.suggestedReply : `Bonjour ${current.fromName.split(" ")[0]},\n\nMerci pour votre message. `); }}><Sparkles className="h-4 w-4 text-gold" /> Suggestion IA</Button><Button size="sm" className="bg-gold text-gold-foreground hover:bg-gold/90" onClick={sendReply} disabled={!reply.trim()}><Send className="h-4 w-4" /> Envoyer</Button></div>
            </div>
          </div>
        ) : <EmptyState icon={Inbox} title="Aucun message sélectionné" description="Sélectionnez une conversation ou créez un nouveau message." action={<Button onClick={() => setCompose(true)} className="bg-gold text-gold-foreground hover:bg-gold/90"><Plus className="h-4 w-4" /> Nouveau message</Button>} />}
      </div>

      <Dialog open={compose} onOpenChange={setCompose}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle><Mail className="mr-2 inline h-4 w-4" />Nouveau message</DialogTitle></DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Type"><Select value={cf.contactType} onValueChange={(v) => setCf({ ...cf, contactType: v as "client" | "prospect", contactId: "" })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="client">Client</SelectItem><SelectItem value="prospect">Prospect</SelectItem></SelectContent></Select></Field>
            <Field label="Destinataire"><Select value={cf.contactId} onValueChange={(v) => setCf({ ...cf, contactId: v })}><SelectTrigger><SelectValue placeholder="Choisir…" /></SelectTrigger><SelectContent>{(cf.contactType === "client" ? s.clients : s.prospects).map((c) => <SelectItem key={c.id} value={c.id}>{c.name} · {c.company}</SelectItem>)}</SelectContent></Select></Field>
            <Field label="Canal"><Select value={cf.channel} onValueChange={(v) => setCf({ ...cf, channel: v as Message["channel"] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CHANNELS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></Field>
            <Field label="Objet"><Input value={cf.subject} onChange={(e) => setCf({ ...cf, subject: e.target.value })} /></Field>
            <Field label="Message" className="sm:col-span-2"><Textarea rows={5} value={cf.body} onChange={(e) => setCf({ ...cf, body: e.target.value })} /></Field>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setCompose(false)}>Annuler</Button><Button className="bg-gold text-gold-foreground hover:bg-gold/90" onClick={sendCompose}><Send className="h-4 w-4" /> Envoyer</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={!!del} onOpenChange={(o) => !o && setDel(null)} title="Supprimer ce message ?" onConfirm={() => { if (del) { s.deleteMessage(del.id); if (sel === del.id) setSel(null); toast.success("Élément supprimé."); setDel(null); } }} />
    </div>
  );
}
