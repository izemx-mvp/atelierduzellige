import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Pencil, Trash2, Mail, Phone, MapPin, FileText, ShoppingCart, FlaskConical, CalendarDays, MessageSquare, Plus, Bot } from "lucide-react";
import { useStore, useHydrated, fmtDate, fmtDateTime, fmtMoney, quoteTotals } from "@/lib/store";
import { PageHeader, LoadingBlock, StatusBadge, ConfirmDialog, Section, DefinitionList, EmptyState } from "@/components/shared";
import { ClientDialog } from "@/components/clients/ClientDialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export const Route = createFileRoute("/_app/clients/$id")({
  head: () => ({ meta: [{ title: "Fiche client — Atelier du Zellige" }, { name: "description", content: "Fiche client détaillée : informations, historique, devis, commandes, échantillons et rendez-vous." }, { property: "og:title", content: "Fiche client — Atelier du Zellige" }, { property: "og:description", content: "Fiche client détaillée." }] }),
  component: ClientDetail,
});

function ClientDetail() {
  const { id } = Route.useParams();
  const hydrated = useHydrated();
  const navigate = useNavigate();
  const s = useStore();
  const client = s.clients.find((c) => c.id === id);
  const [edit, setEdit] = useState(false);
  const [del, setDel] = useState(false);
  const [note, setNote] = useState("");

  if (!hydrated) return <LoadingBlock />;
  if (!client) return <EmptyState icon={FileText} title="Client introuvable" description="Ce client n'existe pas ou a été supprimé." action={<Button asChild variant="outline"><Link to="/clients"><ArrowLeft className="h-4 w-4" /> Retour aux clients</Link></Button>} />;

  const quotes = s.quotes.filter((q) => q.clientId === id);
  const orders = s.orders.filter((o) => o.clientId === id);
  const samples = s.samples.filter((x) => x.contactType === "client" && x.contactId === id);
  const rdv = s.appointments.filter((a) => a.contactType === "client" && a.contactId === id);
  const msgs = s.messages.filter((m) => m.contactType === "client" && m.contactId === id);
  const acts = s.activities.filter((a) => a.target.includes(client.name) || a.link === `/clients/${id}` || quotes.some((q) => a.target.includes(q.number)) || orders.some((o) => a.target.includes(o.number)));
  const ca = orders.filter((o) => o.status !== "Annulée").reduce((a, o) => a + o.totalHT, 0);
  const prospect = client.fromProspectId ? s.prospects.find((p) => p.id === client.fromProspectId) : undefined;

  const addNote = () => { if (!note.trim()) return; s.updateClient(id, { notes: `${client.notes}\n[${fmtDate(new Date().toISOString())}] ${note.trim()}`.trim() }); s.log({ agent: "Utilisateur", action: "Note client", target: client.name, result: note.trim().slice(0, 60), status: "Succès", link: `/clients/${id}` }); setNote(""); toast.success("Note ajoutée."); };

  return (
    <div>
      <Button variant="ghost" size="sm" className="mb-3 -ml-2" asChild><Link to="/clients"><ArrowLeft className="h-4 w-4" /> Clients</Link></Button>
      <PageHeader title={client.name} description={`${client.company} · ${client.city ? client.city + ", " : ""}${client.country}`}
        actions={<>
          <StatusBadge status={client.status} className="h-8 px-3 text-sm" />
          <Button variant="outline" onClick={() => setEdit(true)}><Pencil className="h-4 w-4" /> Modifier</Button>
          <Button variant="outline" className="text-destructive" onClick={() => setDel(true)}><Trash2 className="h-4 w-4" /> Supprimer</Button>
          <Button className="bg-gold text-gold-foreground hover:bg-gold/90" asChild><Link to="/devis" search={{ client: id, new: 1 }}><Plus className="h-4 w-4" /> Nouveau devis</Link></Button>
        </>} />

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="space-y-4">
          <Section title="Informations générales">
            <div className="mb-4 flex items-center gap-3">
              <Avatar className="h-12 w-12"><AvatarFallback className="bg-charcoal text-charcoal-foreground">{client.name.split(" ").map((x) => x[0]).slice(0, 2).join("")}</AvatarFallback></Avatar>
              <div><div className="font-medium">{client.name}</div><div className="text-sm text-muted-foreground">{client.type}</div></div>
            </div>
            <DefinitionList items={[{ label: "Entreprise", value: client.company }, { label: "Type", value: client.type }, { label: "Client depuis", value: fmtDate(client.createdAt) }, { label: "Dernière activité", value: fmtDate(client.lastActivity) }, { label: "CA cumulé", value: fmtMoney(ca) }, { label: "Origine", value: prospect ? <Link to="/prospects" className="text-gold hover:underline">CRM · {prospect.source}</Link> : "Direct" }]} />
          </Section>
          <Section title="Coordonnées">
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /><a href={`mailto:${client.email}`} className="hover:underline">{client.email}</a></li>
              <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" />{client.phone || "—"}</li>
              <li className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" /><span>{client.address || "—"}<br />{client.city} {client.country}</span></li>
            </ul>
          </Section>
          <Section title="Notes">
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">{client.notes || "Aucune note."}</p>
            <div className="mt-3 flex gap-2"><Textarea rows={2} placeholder="Ajouter une note…" value={note} onChange={(e) => setNote(e.target.value)} /><Button size="sm" variant="outline" onClick={addNote} disabled={!note.trim()}>Ajouter</Button></div>
          </Section>
        </div>

        <div className="xl:col-span-2">
          <Tabs defaultValue="quotes">
            <TabsList className="mb-3 flex-wrap">
              <TabsTrigger value="quotes"><FileText className="h-3.5 w-3.5" /> Devis ({quotes.length})</TabsTrigger>
              <TabsTrigger value="orders"><ShoppingCart className="h-3.5 w-3.5" /> Commandes ({orders.length})</TabsTrigger>
              <TabsTrigger value="samples"><FlaskConical className="h-3.5 w-3.5" /> Échantillons ({samples.length})</TabsTrigger>
              <TabsTrigger value="rdv"><CalendarDays className="h-3.5 w-3.5" /> Rendez-vous ({rdv.length})</TabsTrigger>
              <TabsTrigger value="msgs"><MessageSquare className="h-3.5 w-3.5" /> Échanges ({msgs.length})</TabsTrigger>
              <TabsTrigger value="activity"><Bot className="h-3.5 w-3.5" /> Activité</TabsTrigger>
            </TabsList>
            <TabsContent value="quotes"><Section noPadding>{quotes.length === 0 ? <Empty t="Aucun devis" /> : <ul className="divide-y">{quotes.map((q) => <li key={q.id}><Link to="/devis/$id" params={{ id: q.id }} className="flex items-center gap-4 px-5 py-3 hover:bg-accent"><span className="font-medium">{q.number}</span><span className="flex-1 truncate text-sm text-muted-foreground">{q.projectName}</span><span className="text-sm font-medium">{fmtMoney(quoteTotals(q).ttc)}</span><StatusBadge status={q.status} /></Link></li>)}</ul>}</Section></TabsContent>
            <TabsContent value="orders"><Section noPadding>{orders.length === 0 ? <Empty t="Aucune commande" /> : <ul className="divide-y">{orders.map((o) => <li key={o.id}><Link to="/commandes/$id" params={{ id: o.id }} className="flex items-center gap-4 px-5 py-3 hover:bg-accent"><span className="font-medium">{o.number}</span><span className="flex-1 truncate text-sm text-muted-foreground">{o.projectName}</span><span className="text-sm text-muted-foreground">Livraison {fmtDate(o.dueDate)}</span><span className="text-sm font-medium">{fmtMoney(o.totalHT)}</span><StatusBadge status={o.status} /></Link></li>)}</ul>}</Section></TabsContent>
            <TabsContent value="samples"><Section noPadding>{samples.length === 0 ? <Empty t="Aucun échantillon" /> : <ul className="divide-y">{samples.map((x) => <li key={x.id} className="flex items-center gap-4 px-5 py-3"><span className="font-medium">{x.reference}</span><span className="flex-1 truncate text-sm text-muted-foreground">{s.products.find((p) => p.id === x.productId)?.name} × {x.quantity}</span><span className="text-sm text-muted-foreground">{fmtDate(x.requestDate)}</span><StatusBadge status={x.status} /></li>)}</ul>}</Section></TabsContent>
            <TabsContent value="rdv"><Section noPadding>{rdv.length === 0 ? <Empty t="Aucun rendez-vous" /> : <ul className="divide-y">{rdv.map((a) => <li key={a.id} className="flex items-center gap-4 px-5 py-3"><span className="font-medium">{a.title}</span><span className="flex-1 text-sm text-muted-foreground">{a.type}</span><span className="text-sm text-muted-foreground">{fmtDateTime(a.start)}</span><StatusBadge status={a.status} /></li>)}</ul>}</Section></TabsContent>
            <TabsContent value="msgs"><Section noPadding>{msgs.length === 0 ? <Empty t="Aucun échange" /> : <ul className="divide-y">{msgs.map((m) => <li key={m.id} className="px-5 py-3"><div className="flex items-center gap-2 text-sm"><span className={m.direction === "in" ? "text-info" : "text-gold"}>{m.direction === "in" ? "Reçu" : "Envoyé"}</span><span className="font-medium">{m.subject}</span><span className="ml-auto text-xs text-muted-foreground">{fmtDateTime(m.date)} · {m.channel}</span></div><p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{m.body}</p></li>)}</ul>}</Section></TabsContent>
            <TabsContent value="activity"><Section noPadding>{acts.length === 0 ? <Empty t="Aucune activité" /> : <ul className="divide-y">{acts.slice(0, 15).map((a) => <li key={a.id} className="flex items-center gap-4 px-5 py-3 text-sm"><span className="w-28 shrink-0 text-xs text-muted-foreground">{fmtDateTime(a.date)}</span><span className="font-medium">{a.agent}</span><span className="flex-1 truncate text-muted-foreground">{a.action} — {a.result}</span><StatusBadge status={a.status} /></li>)}</ul>}</Section></TabsContent>
          </Tabs>
        </div>
      </div>

      <ClientDialog open={edit} onOpenChange={setEdit} client={client} />
      <ConfirmDialog open={del} onOpenChange={setDel} title={`Supprimer ${client.name} ?`} onConfirm={() => { s.deleteClient(id); toast.success("Élément supprimé."); navigate({ to: "/clients" }); }} />
    </div>
  );
}

function Empty({ t }: { t: string }) { return <div className="p-8 text-center text-sm text-muted-foreground">{t}</div>; }
