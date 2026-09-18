import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, FlaskConical, MoreHorizontal, Pencil, Trash2, ArrowRight, Check, X } from "lucide-react";
import { useStore, useHydrated, fmtDate, contactName } from "@/lib/store";
import { SAMPLE_STATUSES, type Sample, type SampleStatus } from "@/lib/types";
import { PageHeader, EmptyState, LoadingBlock, StatusBadge, ConfirmDialog, SearchInput, SortHeader, useSort, Field, ProductSwatch } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/echantillons")({
  head: () => ({ meta: [{ title: "Échantillons — Atelier du Zellige" }, { name: "description", content: "Suivi des échantillons : demande, préparation, envoi et validation." }, { property: "og:title", content: "Échantillons — Atelier du Zellige" }, { property: "og:description", content: "Suivi du workflow des échantillons." }] }),
  component: SamplesPage,
});

type F = "reference" | "requestDate" | "status" | "quantity";
const FLOW: SampleStatus[] = ["Demandé", "En préparation", "Envoyé", "En attente de validation", "Validé"];
const empty = { contactType: "prospect" as "client" | "prospect", contactId: "", productId: "", quantity: 2, requestDate: new Date().toISOString().slice(0, 10), sentDate: "", status: "Demandé" as SampleStatus, comments: "" };

function SamplesPage() {
  const hydrated = useHydrated();
  const s = useStore();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [dialog, setDialog] = useState<{ open: boolean; x?: Sample | null }>({ open: false });
  const [del, setDel] = useState<Sample | null>(null);
  const [form, setForm] = useState(empty);
  const { sort, onSort, sortFn } = useSort<F>("requestDate");

  useEffect(() => { if (dialog.open) { const x = dialog.x; setForm(x ? { contactType: x.contactType, contactId: x.contactId, productId: x.productId, quantity: x.quantity, requestDate: x.requestDate.slice(0, 10), sentDate: x.sentDate?.slice(0, 10) ?? "", status: x.status, comments: x.comments } : { ...empty, contactId: s.prospects[0]?.id ?? "", productId: s.products[0]?.id ?? "" }); } }, [dialog, s.prospects, s.products]);

  const rows = useMemo(() => {
    const t = q.toLowerCase();
    return sortFn(s.samples.filter((x) => { const c = contactName(s, x.contactType, x.contactId); const p = s.products.find((pp) => pp.id === x.productId)?.name ?? ""; return (!t || [x.reference, c, p, x.comments].some((v) => v.toLowerCase().includes(t))) && (status === "all" || x.status === status); }), (x, k) => x[k]);
  }, [s, q, status, sortFn]);

  if (!hydrated) return <LoadingBlock />;

  const counts = SAMPLE_STATUSES.map((st) => ({ st, n: s.samples.filter((x) => x.status === st).length }));
  const contacts = form.contactType === "client" ? s.clients : s.prospects;
  const valid = form.contactId && form.productId && form.quantity > 0;
  const submit = () => {
    if (!valid) return toast.error("Contact, produit et quantité sont requis.");
    const payload = { ...form, requestDate: new Date(form.requestDate).toISOString(), sentDate: form.sentDate ? new Date(form.sentDate).toISOString() : undefined };
    if (dialog.x) { s.updateSample(dialog.x.id, payload); toast.success("Modifications enregistrées."); }
    else { s.addSample(payload); toast.success("Échantillon créé avec succès."); }
    setDialog({ open: false });
  };
  const setSt = (x: Sample, st: SampleStatus) => {
    s.updateSample(x.id, { status: st, ...(st === "Envoyé" && !x.sentDate ? { sentDate: new Date().toISOString() } : {}) });
    s.log({ agent: "Utilisateur", action: "Statut échantillon", target: x.reference, result: st, status: "Succès", link: "/echantillons" });
    if (st === "Validé" && x.contactType === "prospect") { const p = s.prospects.find((pp) => pp.id === x.contactId); if (p && ["Nouveau", "Contacté", "Qualifié", "Échantillon"].includes(p.stage)) s.moveProspect(p.id, "Devis"); }
    toast.success(`Échantillon ${st.toLowerCase()}.`);
  };
  const next = (x: Sample) => FLOW[FLOW.indexOf(x.status) + 1];

  return (
    <div>
      <PageHeader eyebrow="Suivi" title="Échantillons" description={`${s.samples.length} échantillons · ${s.samples.filter((x) => x.status === "En attente de validation").length} en attente de validation`}
        actions={<Button className="bg-gold text-gold-foreground hover:bg-gold/90" onClick={() => setDialog({ open: true, x: null })}><Plus className="h-4 w-4" /> Nouvel échantillon</Button>} />

      <div className="mb-4 grid grid-cols-3 gap-2 md:grid-cols-6">
        {counts.map((c) => (
          <button type="button" key={c.st} onClick={() => setStatus(status === c.st ? "all" : c.st)} className={cn("surface px-3 py-2.5 text-left transition-colors hover:border-gold/50", status === c.st && "border-gold bg-gold-soft/40")}>
            <div className="text-xl font-semibold">{c.n}</div><div className="truncate text-[11px] text-muted-foreground">{c.st}</div>
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchInput value={q} onChange={setQ} placeholder="Référence, contact, produit…" className="w-full md:w-80" />
        <Select value={status} onValueChange={setStatus}><SelectTrigger className="w-56 bg-card"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Tous statuts</SelectItem>{SAMPLE_STATUSES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={FlaskConical} title="Aucun échantillon" description={s.samples.length ? "Aucun échantillon ne correspond." : "Créez une première demande d'échantillon."} action={<Button className="bg-gold text-gold-foreground hover:bg-gold/90" onClick={() => setDialog({ open: true, x: null })}><Plus className="h-4 w-4" /> Créer un échantillon</Button>} />
      ) : (
        <div className="surface overflow-x-auto">
          <Table>
            <TableHeader><TableRow>
              <TableHead><SortHeader label="Référence" field="reference" sort={sort} onSort={onSort} /></TableHead><TableHead>Contact</TableHead><TableHead>Produit</TableHead>
              <TableHead><SortHeader label="Qté" field="quantity" sort={sort} onSort={onSort} /></TableHead><TableHead><SortHeader label="Demande" field="requestDate" sort={sort} onSort={onSort} /></TableHead><TableHead>Envoi</TableHead>
              <TableHead><SortHeader label="Statut" field="status" sort={sort} onSort={onSort} /></TableHead><TableHead>Commentaires</TableHead><TableHead className="w-40" />
            </TableRow></TableHeader>
            <TableBody>
              {rows.map((x) => { const p = s.products.find((pp) => pp.id === x.productId); const n = next(x); return (
                <TableRow key={x.id}>
                  <TableCell className="font-medium">{x.reference}</TableCell>
                  <TableCell><div className="text-sm">{contactName(s, x.contactType, x.contactId)}</div><div className="text-[11px] uppercase tracking-wider text-muted-foreground">{x.contactType === "client" ? "Client" : "Prospect"}</div></TableCell>
                  <TableCell><div className="flex items-center gap-2">{p && <ProductSwatch hue={p.imageHue} size="sm" />}<span>{p?.name ?? "—"}</span></div></TableCell>
                  <TableCell>{x.quantity}</TableCell><TableCell className="text-muted-foreground">{fmtDate(x.requestDate)}</TableCell><TableCell className="text-muted-foreground">{fmtDate(x.sentDate)}</TableCell>
                  <TableCell><StatusBadge status={x.status} /></TableCell><TableCell className="max-w-48 truncate text-muted-foreground">{x.comments || "—"}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      {x.status === "En attente de validation" ? (<>
                        <Button size="sm" variant="outline" className="h-7 text-success" onClick={() => setSt(x, "Validé")}><Check className="h-3.5 w-3.5" /> Valider</Button>
                        <Button size="sm" variant="outline" className="h-7 text-destructive" onClick={() => setSt(x, "Refusé")}><X className="h-3.5 w-3.5" /></Button>
                      </>) : n && x.status !== "Refusé" ? <Button size="sm" variant="outline" className="h-7" onClick={() => setSt(x, n)}>{n} <ArrowRight className="h-3.5 w-3.5" /></Button> : null}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setDialog({ open: true, x })}><Pencil className="h-4 w-4" /> Modifier</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {SAMPLE_STATUSES.filter((st) => st !== x.status).map((st) => <DropdownMenuItem key={st} onClick={() => setSt(x, st)}>→ {st}</DropdownMenuItem>)}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDel(x)}><Trash2 className="h-4 w-4" /> Supprimer</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ); })}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialog.open} onOpenChange={(o) => setDialog((d) => ({ ...d, open: o }))}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>{dialog.x ? "Modifier l'échantillon" : "Nouvel échantillon"}</DialogTitle><DialogDescription>Associez un contact et un produit.</DialogDescription></DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Type de contact"><Select value={form.contactType} onValueChange={(v) => setForm({ ...form, contactType: v as "client" | "prospect", contactId: (v === "client" ? s.clients[0]?.id : s.prospects[0]?.id) ?? "" })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="prospect">Prospect</SelectItem><SelectItem value="client">Client</SelectItem></SelectContent></Select></Field>
            <Field label="Contact *"><Select value={form.contactId} onValueChange={(v) => setForm({ ...form, contactId: v })}><SelectTrigger><SelectValue placeholder="Choisir…" /></SelectTrigger><SelectContent>{contacts.map((c) => <SelectItem key={c.id} value={c.id}>{c.name} · {c.company}</SelectItem>)}</SelectContent></Select></Field>
            <Field label="Produit *" className="sm:col-span-2"><Select value={form.productId} onValueChange={(v) => setForm({ ...form, productId: v })}><SelectTrigger><SelectValue placeholder="Choisir…" /></SelectTrigger><SelectContent>{s.products.map((p) => <SelectItem key={p.id} value={p.id}>{p.reference} — {p.name}</SelectItem>)}</SelectContent></Select></Field>
            <Field label="Quantité"><Input type="number" min={1} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} /></Field>
            <Field label="Statut"><Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as SampleStatus })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{SAMPLE_STATUSES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></Field>
            <Field label="Date de demande"><Input type="date" value={form.requestDate} onChange={(e) => setForm({ ...form, requestDate: e.target.value })} /></Field>
            <Field label="Date d'envoi"><Input type="date" value={form.sentDate} onChange={(e) => setForm({ ...form, sentDate: e.target.value })} /></Field>
            <Field label="Commentaires" className="sm:col-span-2"><Textarea rows={2} value={form.comments} onChange={(e) => setForm({ ...form, comments: e.target.value })} /></Field>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialog({ open: false })}>Annuler</Button><Button className="bg-gold text-gold-foreground hover:bg-gold/90" onClick={submit} disabled={!valid}>{dialog.x ? "Enregistrer" : "Créer"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={!!del} onOpenChange={(o) => !o && setDel(null)} title={`Supprimer ${del?.reference} ?`} onConfirm={() => { if (del) { s.deleteSample(del.id); toast.success("Élément supprimé."); setDel(null); } }} />
    </div>
  );
}
