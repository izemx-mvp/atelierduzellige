import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Target, MoreHorizontal, Pencil, Trash2, StickyNote, CheckSquare, CalendarPlus, FlaskConical, FileText, UserCheck, LayoutGrid, List, GripVertical, Sparkles } from "lucide-react";
import { useStore, useHydrated, fmtDate, fmtMoney, daysSince } from "@/lib/store";
import { PROSPECT_STAGES, type Prospect, type ProspectStage } from "@/lib/types";
import { PageHeader, EmptyState, LoadingBlock, StatusBadge, ConfirmDialog, SearchInput, SortHeader, useSort, Field } from "@/components/shared";
import { ProspectDialog } from "@/components/prospects/ProspectDialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/prospects/")({
  head: () => ({ meta: [{ title: "Prospects / CRM — Atelier du Zellige" }, { name: "description", content: "Pipeline commercial : vue Kanban et tableau, qualification et conversion des prospects." }, { property: "og:title", content: "Prospects / CRM — Atelier du Zellige" }, { property: "og:description", content: "Pipeline commercial d'Atelier du Zellige." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: ProspectsPage,
});

type F = "name" | "company" | "country" | "stage" | "estimatedValue" | "score" | "lastActivity";
type Sub = { kind: "note" | "task" | "rdv" | "sample" | "quote"; p: Prospect } | null;

function ProspectsPage() {
  const hydrated = useHydrated();
  const navigate = useNavigate();
  const s = useStore();
  const [view, setView] = useState<"kanban" | "table">("kanban");
  const [q, setQ] = useState("");
  const [stage, setStage] = useState("all");
  const [dialog, setDialog] = useState<{ open: boolean; p?: Prospect | null }>({ open: false });
  const [del, setDel] = useState<Prospect | null>(null);
  const [conv, setConv] = useState<Prospect | null>(null);
  const [sub, setSub] = useState<Sub>(null);
  const [subText, setSubText] = useState("");
  const [subProduct, setSubProduct] = useState("");
  const [subDate, setSubDate] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const { sort, onSort, sortFn } = useSort<F>("lastActivity");

  const rows = useMemo(() => {
    const t = q.toLowerCase();
    return sortFn(s.prospects.filter((p) => (!t || [p.name, p.company, p.country, p.project].some((x) => x.toLowerCase().includes(t))) && (stage === "all" || p.stage === stage)), (p, k) => p[k]);
  }, [s.prospects, q, stage, sortFn]);

  if (!hydrated) return <LoadingBlock />;

  const move = (p: Prospect, st: ProspectStage) => {
    if (p.stage === st) return;
    if (st === "Gagné" && !p.convertedClientId) { setConv(p); return; }
    s.moveProspect(p.id, st);
    s.log({ agent: "Utilisateur", action: "Changement d'étape", target: p.name, result: `${p.stage} → ${st}`, status: "Succès", link: "/prospects" });
    toast.success(`${p.name} déplacé vers « ${st} ».`);
  };
  const convert = (p: Prospect) => {
    const c = s.convertProspect(p.id);
    setConv(null);
    if (c) { toast.success("Prospect converti en client.", { action: { label: "Voir la fiche", onClick: () => navigate({ to: "/clients/$id", params: { id: c.id } }) } }); }
  };
  const qualify = (p: Prospect) => { s.updateProspect(p.id, { stage: p.stage === "Nouveau" || p.stage === "Contacté" ? "Qualifié" : p.stage, score: Math.min(100, p.score + 15) }); s.log({ agent: "Utilisateur", action: "Qualification", target: p.name, result: `Score ${Math.min(100, p.score + 15)}`, status: "Succès", link: "/prospects" }); toast.success("Prospect qualifié."); };
  const openSub = (kind: NonNullable<Sub>["kind"], p: Prospect) => { setSub({ kind, p }); setSubText(""); setSubProduct(s.products[0]?.id ?? ""); const d = new Date(); d.setDate(d.getDate() + 2); d.setHours(10, 0, 0, 0); setSubDate(d.toISOString().slice(0, 16)); };
  const submitSub = () => {
    if (!sub) return; const p = sub.p;
    if (sub.kind === "note") { if (!subText.trim()) return toast.error("La note est vide."); s.addProspectNote(p.id, subText.trim()); toast.success("Note ajoutée."); }
    if (sub.kind === "task") { if (!subText.trim()) return toast.error("Titre requis."); s.addTask({ title: subText.trim(), dueDate: subDate ? new Date(subDate).toISOString() : undefined, relatedType: "prospect", relatedId: p.id }); toast.success("Tâche créée."); }
    if (sub.kind === "rdv") { const st = new Date(subDate); const en = new Date(st); en.setHours(st.getHours() + 1); s.addAppointment({ title: subText.trim() || `Rendez-vous — ${p.name}`, contactType: "prospect", contactId: p.id, start: st.toISOString(), end: en.toISOString(), type: "Visio", status: "Proposé", participants: [s.settings.profile.name, p.name], notes: "" }); s.updateProspect(p.id, { stage: p.stage === "Nouveau" ? "Contacté" : p.stage }); toast.success("Rendez-vous planifié.", { action: { label: "Calendrier", onClick: () => navigate({ to: "/agents/booking" }) } }); }
    if (sub.kind === "sample") { s.addSample({ contactType: "prospect", contactId: p.id, productId: subProduct, quantity: 2, requestDate: new Date().toISOString(), status: "Demandé", comments: subText }); s.moveProspect(p.id, PROSPECT_STAGES.indexOf(p.stage) < 3 ? "Échantillon" : p.stage); toast.success("Échantillon créé.", { action: { label: "Voir", onClick: () => navigate({ to: "/echantillons" }) } }); }
    if (sub.kind === "quote") { const c = s.convertProspect(p.id); if (!c) return; s.updateProspect(p.id, { stage: "Devis" }); const exp = new Date(); exp.setDate(exp.getDate() + 30); const qd = s.addQuote({ clientId: c.id, projectName: p.project, projectDescription: "", projectType: "Résidentiel", projectLocation: p.country, expiresAt: exp.toISOString(), lines: [], globalDiscount: 0, fees: 0, vatRate: p.country === "Maroc" ? 20 : 0, status: "Brouillon", paymentTerms: "40 % à la commande, solde avant expédition", leadTime: "6 à 8 semaines", deliveryTerms: "EXW Fès", notes: subText }); toast.success("Devis créé (brouillon)."); navigate({ to: "/devis/$id", params: { id: qd.id } }); }
    setSub(null);
  };

  const Actions = ({ p }: { p: Prospect }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={() => setDialog({ open: true, p })}><Pencil className="h-4 w-4" /> Modifier</DropdownMenuItem>
        <DropdownMenuItem onClick={() => qualify(p)}><Sparkles className="h-4 w-4" /> Qualifier</DropdownMenuItem>
        <DropdownMenuSub><DropdownMenuSubTrigger><Target className="h-4 w-4" /> Changer d'étape</DropdownMenuSubTrigger><DropdownMenuSubContent>{PROSPECT_STAGES.map((st) => <DropdownMenuItem key={st} disabled={st === p.stage} onClick={() => move(p, st)}>{st}</DropdownMenuItem>)}</DropdownMenuSubContent></DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => openSub("note", p)}><StickyNote className="h-4 w-4" /> Ajouter une note</DropdownMenuItem>
        <DropdownMenuItem onClick={() => openSub("task", p)}><CheckSquare className="h-4 w-4" /> Ajouter une tâche</DropdownMenuItem>
        <DropdownMenuItem onClick={() => openSub("rdv", p)}><CalendarPlus className="h-4 w-4" /> Créer un rendez-vous</DropdownMenuItem>
        <DropdownMenuItem onClick={() => openSub("sample", p)}><FlaskConical className="h-4 w-4" /> Créer un échantillon</DropdownMenuItem>
        <DropdownMenuItem onClick={() => openSub("quote", p)}><FileText className="h-4 w-4" /> Créer un devis</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={!!p.convertedClientId} onClick={() => setConv(p)} className="text-gold focus:text-gold"><UserCheck className="h-4 w-4" /> {p.convertedClientId ? "Déjà converti" : "Convertir en client"}</DropdownMenuItem>
        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDel(p)}><Trash2 className="h-4 w-4" /> Supprimer</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const pipelineValue = s.prospects.filter((p) => !["Gagné", "Perdu"].includes(p.stage)).reduce((a, p) => a + p.estimatedValue, 0);

  return (
    <div>
      <PageHeader eyebrow="CRM" title="Prospects" description={`${rows.length} prospects · Pipeline ${fmtMoney(pipelineValue)}`}
        actions={<>
          <div className="flex rounded-md border bg-card p-0.5">
            <Button variant={view === "kanban" ? "secondary" : "ghost"} size="sm" onClick={() => setView("kanban")}><LayoutGrid className="h-4 w-4" /> Kanban</Button>
            <Button variant={view === "table" ? "secondary" : "ghost"} size="sm" onClick={() => setView("table")}><List className="h-4 w-4" /> Tableau</Button>
          </div>
          <Button className="bg-gold text-gold-foreground hover:bg-gold/90" onClick={() => setDialog({ open: true, p: null })}><Plus className="h-4 w-4" /> Nouveau prospect</Button>
        </>} />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchInput value={q} onChange={setQ} placeholder="Nom, entreprise, projet…" className="w-full md:w-80" />
        {view === "table" && <Select value={stage} onValueChange={setStage}><SelectTrigger className="w-44 bg-card"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Toutes les étapes</SelectItem>{PROSPECT_STAGES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>}
      </div>

      {s.prospects.length === 0 ? (
        <EmptyState icon={Target} title="Aucun prospect" description="Ajoutez votre premier prospect pour démarrer le pipeline." action={<Button className="bg-gold text-gold-foreground hover:bg-gold/90" onClick={() => setDialog({ open: true, p: null })}><Plus className="h-4 w-4" /> Créer un prospect</Button>} />
      ) : view === "kanban" ? (
        <div className="scrollbar-thin flex gap-3 overflow-x-auto pb-4">
          {PROSPECT_STAGES.map((st) => {
            const items = rows.filter((p) => p.stage === st);
            const total = items.reduce((a, p) => a + p.estimatedValue, 0);
            return (
              <div key={st} onDragOver={(e) => { e.preventDefault(); setOver(st); }} onDragLeave={() => setOver(null)} onDrop={() => { const p = s.prospects.find((x) => x.id === dragId); if (p) move(p, st); setDragId(null); setOver(null); }}
                className={cn("flex w-64 shrink-0 flex-col rounded-lg border bg-secondary/50 transition-colors", over === st && "border-gold bg-gold-soft/40")}>
                <div className="flex items-center justify-between px-3 py-2.5">
                  <div className="flex items-center gap-2"><span className={cn("h-2 w-2 rounded-full", st === "Gagné" ? "bg-success" : st === "Perdu" ? "bg-destructive" : "bg-gold")} /><span className="text-xs font-semibold uppercase tracking-wider">{st}</span><span className="rounded bg-card px-1.5 text-[11px] text-muted-foreground">{items.length}</span></div>
                  <span className="text-[11px] text-muted-foreground">{fmtMoney(total)}</span>
                </div>
                <div className="flex min-h-24 flex-1 flex-col gap-2 px-2 pb-2">
                  {items.map((p) => (
                    <div key={p.id} draggable onClick={() => navigate({ to: "/prospects/$id", params: { id: p.id } })} onDragStart={() => setDragId(p.id)} onDragEnd={() => { setDragId(null); setOver(null); }} className={cn("surface group cursor-grab p-3 active:cursor-grabbing", dragId === p.id && "opacity-50")}>
                      <div className="flex items-start gap-2">
                        <GripVertical className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">{p.name}</div>
                          <div className="truncate text-xs text-muted-foreground">{p.company}</div>
                        </div>
                        <div onClick={(e) => e.stopPropagation()}><Actions p={p} /></div>
                      </div>
                      <div className="mt-2 truncate text-xs text-muted-foreground">{p.project}</div>
                      <div className="mt-2 flex items-center justify-between text-xs">
                        <span className="font-medium">{fmtMoney(p.estimatedValue)}</span>
                        <span className="flex items-center gap-1.5"><span className="text-muted-foreground">{p.country}</span><span className={cn("rounded px-1.5 py-0.5 font-medium", p.score >= 70 ? "bg-success/12 text-success" : p.score >= 45 ? "bg-gold-soft text-gold-foreground dark:text-gold" : "bg-muted text-muted-foreground")}>{p.score}</span></span>
                      </div>
                      {daysSince(p.lastActivity) >= 7 && !["Gagné", "Perdu"].includes(p.stage) && <div className="mt-2 text-[11px] text-warning">Inactif depuis {daysSince(p.lastActivity)} j</div>}
                    </div>
                  ))}
                  {items.length === 0 && <div className="flex flex-1 items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">Déposer ici</div>}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="surface overflow-x-auto">
          <Table>
            <TableHeader><TableRow>
              <TableHead><SortHeader label="Nom" field="name" sort={sort} onSort={onSort} /></TableHead>
              <TableHead><SortHeader label="Entreprise" field="company" sort={sort} onSort={onSort} /></TableHead>
              <TableHead><SortHeader label="Pays" field="country" sort={sort} onSort={onSort} /></TableHead>
              <TableHead>Projet</TableHead><TableHead>Source</TableHead>
              <TableHead><SortHeader label="Valeur" field="estimatedValue" sort={sort} onSort={onSort} /></TableHead>
              <TableHead><SortHeader label="Score" field="score" sort={sort} onSort={onSort} /></TableHead>
              <TableHead><SortHeader label="Étape" field="stage" sort={sort} onSort={onSort} /></TableHead>
              <TableHead><SortHeader label="Activité" field="lastActivity" sort={sort} onSort={onSort} /></TableHead>
              <TableHead className="w-12" />
            </TableRow></TableHeader>
            <TableBody>
              {rows.map((p) => (
                <TableRow key={p.id} className="cursor-pointer" onClick={() => navigate({ to: "/prospects/$id", params: { id: p.id } })}>
                  <TableCell className="font-medium">{p.name}</TableCell><TableCell className="text-muted-foreground">{p.company}</TableCell><TableCell>{p.country}</TableCell>
                  <TableCell className="max-w-56 truncate text-muted-foreground">{p.project}</TableCell><TableCell className="text-muted-foreground">{p.source}</TableCell>
                  <TableCell>{fmtMoney(p.estimatedValue)}</TableCell><TableCell>{p.score}</TableCell>
                  <TableCell><StatusBadge status={p.stage} /></TableCell><TableCell className="text-muted-foreground">{fmtDate(p.lastActivity)}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}><Actions p={p} /></TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && <TableRow><TableCell colSpan={10} className="py-10 text-center text-muted-foreground">Aucun prospect ne correspond.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      )}

      <ProspectDialog open={dialog.open} onOpenChange={(o) => setDialog((d) => ({ ...d, open: o }))} prospect={dialog.p} />
      <ConfirmDialog open={!!del} onOpenChange={(o) => !o && setDel(null)} title={`Supprimer ${del?.name} ?`} onConfirm={() => { if (del) { s.deleteProspect(del.id); toast.success("Élément supprimé."); setDel(null); } }} />
      <ConfirmDialog open={!!conv} onOpenChange={(o) => !o && setConv(null)} destructive={false} confirmLabel="Convertir" title={`Convertir ${conv?.name} en client ?`} description="Le prospect passera à l'étape « Gagné » et une fiche client sera créée avec ses informations, ses échantillons et ses rendez-vous." onConfirm={() => conv && convert(conv)} />

      <Dialog open={!!sub} onOpenChange={(o) => !o && setSub(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{sub?.kind === "note" ? "Ajouter une note" : sub?.kind === "task" ? "Nouvelle tâche" : sub?.kind === "rdv" ? "Planifier un rendez-vous" : sub?.kind === "sample" ? "Créer un échantillon" : "Créer un devis"} — {sub?.p.name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {sub?.kind === "sample" && <Field label="Produit"><Select value={subProduct} onValueChange={setSubProduct}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{s.products.map((p) => <SelectItem key={p.id} value={p.id}>{p.reference} — {p.name}</SelectItem>)}</SelectContent></Select></Field>}
            {(sub?.kind === "task" || sub?.kind === "rdv") && <Field label={sub.kind === "task" ? "Échéance" : "Date et heure"}><Input type="datetime-local" value={subDate} onChange={(e) => setSubDate(e.target.value)} /></Field>}
            {sub?.kind === "quote" && <p className="text-sm text-muted-foreground">Le prospect sera converti en client et un devis brouillon sera créé pour le projet « {sub.p.project} ».</p>}
            <Field label={sub?.kind === "note" ? "Note" : sub?.kind === "task" ? "Titre de la tâche" : sub?.kind === "rdv" ? "Titre" : "Commentaire"}><Textarea rows={3} value={subText} onChange={(e) => setSubText(e.target.value)} /></Field>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setSub(null)}>Annuler</Button><Button className="bg-gold text-gold-foreground hover:bg-gold/90" onClick={submitSub}>Valider</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
