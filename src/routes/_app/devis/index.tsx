import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, FileText, MoreHorizontal, Pencil, Trash2, Eye, Copy, Send, ShoppingCart } from "lucide-react";
import { useStore, useHydrated, fmtDate, fmtMoney, quoteTotals, daysUntil } from "@/lib/store";
import { QUOTE_STATUSES, type Quote, type QuoteStatus } from "@/lib/types";
import { PageHeader, EmptyState, LoadingBlock, StatusBadge, ConfirmDialog, SearchInput, SortHeader, useSort } from "@/components/shared";
import { QuoteDialog } from "@/components/quotes/QuoteDialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_app/devis/")({
  validateSearch: (search: Record<string, unknown>): { client?: string; new?: number } => {
    const out: { client?: string; new?: number } = {};
    if (typeof search["client"] === "string") out.client = search["client"];
    if (search["new"]) out.new = 1;
    return out;
  },
  head: () => ({ meta: [{ title: "Devis — Atelier du Zellige" }, { name: "description", content: "Gestion des devis : création, suivi du cycle de vie, duplication et conversion en commande." }, { property: "og:title", content: "Devis — Atelier du Zellige" }, { property: "og:description", content: "Gestion des devis commerciaux." }] }),
  component: QuotesPage,
});

type F = "number" | "createdAt" | "expiresAt" | "status" | "total";
const PAGE = 10;

function QuotesPage() {
  const hydrated = useHydrated();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const s = useStore();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState<{ open: boolean; quote?: Quote | null; clientId?: string }>({ open: false });
  const [del, setDel] = useState<Quote | null>(null);
  const [orderPrompt, setOrderPrompt] = useState<Quote | null>(null);
  const { sort, onSort, sortFn } = useSort<F>("createdAt");

  useEffect(() => { if (hydrated && search.new) { setDialog({ open: true, quote: null, clientId: search.client }); navigate({ to: "/devis", search: {}, replace: true }); } }, [hydrated, search.new, search.client, navigate]);

  const rows = useMemo(() => {
    const t = q.toLowerCase();
    const list = s.quotes.filter((x) => { const c = s.clients.find((cc) => cc.id === x.clientId); return (!t || [x.number, x.projectName, c?.name ?? "", c?.company ?? ""].some((v) => v.toLowerCase().includes(t))) && (status === "all" || x.status === status); });
    return sortFn(list, (x, k) => (k === "total" ? quoteTotals(x).ttc : x[k]));
  }, [s.quotes, s.clients, q, status, sortFn]);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const view = rows.slice((page - 1) * PAGE, page * PAGE);

  if (!hydrated) return <LoadingBlock />;

  const setSt = (x: Quote, st: QuoteStatus) => { s.setQuoteStatus(x.id, st); toast.success(`Devis ${x.number} : ${st}.`); if (st === "Validé" && !x.orderId) setOrderPrompt({ ...x, status: st }); };
  const send = (x: Quote) => { s.setQuoteStatus(x.id, "Envoyé"); const c = s.clients.find((cc) => cc.id === x.clientId); s.addMessage({ direction: "out", channel: "Email", contactType: "client", contactId: x.clientId, fromName: s.settings.profile.name, fromEmail: s.settings.profile.email, subject: `Devis ${x.number} — ${x.projectName}`, body: `Bonjour ${c?.name ?? ""},\n\nVeuillez trouver ci-joint notre devis ${x.number} pour le projet « ${x.projectName} ». Il est valable jusqu'au ${fmtDate(x.expiresAt)}.\n\nBien cordialement,\n${s.settings.profile.name}` }); toast.success(`Devis ${x.number} envoyé (simulé) à ${c?.email ?? "client"}.`); };
  const dup = (x: Quote) => { const n = s.duplicateQuote(x.id); if (n) toast.success(`Devis dupliqué : ${n.number}.`, { action: { label: "Ouvrir", onClick: () => navigate({ to: "/devis/$id", params: { id: n.id } }) } }); };
  const totals = { pending: s.quotes.filter((x) => ["Envoyé", "En attente"].includes(x.status)).reduce((a, x) => a + quoteTotals(x).ht, 0), won: s.quotes.filter((x) => x.status === "Validé").reduce((a, x) => a + quoteTotals(x).ht, 0) };

  return (
    <div>
      <PageHeader eyebrow="Commercial" title="Devis" description={`${s.quotes.length} devis · ${fmtMoney(totals.pending)} en attente · ${fmtMoney(totals.won)} validés`}
        actions={<Button className="bg-gold text-gold-foreground hover:bg-gold/90" onClick={() => setDialog({ open: true, quote: null })}><Plus className="h-4 w-4" /> Nouveau devis</Button>} />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Numéro, client, projet…" className="w-full md:w-80" />
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}><SelectTrigger className="w-44 bg-card"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Tous statuts</SelectItem>{QUOTE_STATUSES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={FileText} title="Aucun devis" description={s.quotes.length ? "Aucun devis ne correspond." : "Créez votre premier devis."} action={<Button className="bg-gold text-gold-foreground hover:bg-gold/90" onClick={() => setDialog({ open: true, quote: null })}><Plus className="h-4 w-4" /> Créer un devis</Button>} />
      ) : (
        <div className="surface overflow-x-auto">
          <Table>
            <TableHeader><TableRow>
              <TableHead><SortHeader label="Numéro" field="number" sort={sort} onSort={onSort} /></TableHead><TableHead>Client</TableHead><TableHead>Projet</TableHead>
              <TableHead><SortHeader label="Création" field="createdAt" sort={sort} onSort={onSort} /></TableHead><TableHead><SortHeader label="Expiration" field="expiresAt" sort={sort} onSort={onSort} /></TableHead>
              <TableHead className="text-right">Montant HT</TableHead><TableHead className="text-right">TVA</TableHead><TableHead className="text-right"><SortHeader label="TTC" field="total" sort={sort} onSort={onSort} /></TableHead>
              <TableHead><SortHeader label="Statut" field="status" sort={sort} onSort={onSort} /></TableHead><TableHead className="w-12" />
            </TableRow></TableHeader>
            <TableBody>
              {view.map((x) => { const c = s.clients.find((cc) => cc.id === x.clientId); const t = quoteTotals(x); const du = daysUntil(x.expiresAt); return (
                <TableRow key={x.id} className="cursor-pointer" onClick={() => navigate({ to: "/devis/$id", params: { id: x.id } })}>
                  <TableCell className="font-medium">{x.number}</TableCell>
                  <TableCell><div>{c?.name}</div><div className="text-xs text-muted-foreground">{c?.company}</div></TableCell>
                  <TableCell className="max-w-56 truncate text-muted-foreground">{x.projectName}</TableCell>
                  <TableCell className="text-muted-foreground">{fmtDate(x.createdAt)}</TableCell>
                  <TableCell className={du < 0 && ["Envoyé", "En attente"].includes(x.status) ? "text-destructive" : du <= 7 && ["Envoyé", "En attente"].includes(x.status) ? "text-warning" : "text-muted-foreground"}>{fmtDate(x.expiresAt)}</TableCell>
                  <TableCell className="text-right">{fmtMoney(t.ht)}</TableCell><TableCell className="text-right text-muted-foreground">{fmtMoney(t.vat)}</TableCell><TableCell className="text-right font-medium">{fmtMoney(t.ttc)}</TableCell>
                  <TableCell><StatusBadge status={x.status} /></TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuItem asChild><Link to="/devis/$id" params={{ id: x.id }}><Eye className="h-4 w-4" /> Voir le devis</Link></DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDialog({ open: true, quote: x })}><Pencil className="h-4 w-4" /> Modifier</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => dup(x)}><Copy className="h-4 w-4" /> Dupliquer</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => send(x)} disabled={["Validé", "Refusé"].includes(x.status)}><Send className="h-4 w-4" /> Envoyer (simulé)</DropdownMenuItem>
                        <DropdownMenuSub><DropdownMenuSubTrigger>Changer le statut</DropdownMenuSubTrigger><DropdownMenuSubContent>{QUOTE_STATUSES.filter((st) => st !== x.status).map((st) => <DropdownMenuItem key={st} onClick={() => setSt(x, st)}>{st}</DropdownMenuItem>)}</DropdownMenuSubContent></DropdownMenuSub>
                        {x.status === "Validé" && !x.orderId && <DropdownMenuItem onClick={() => setOrderPrompt(x)} className="text-gold focus:text-gold"><ShoppingCart className="h-4 w-4" /> Créer la commande</DropdownMenuItem>}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDel(x)}><Trash2 className="h-4 w-4" /> Supprimer</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ); })}
            </TableBody>
          </Table>
          {pages > 1 && <div className="flex items-center justify-between border-t px-4 py-2 text-sm text-muted-foreground"><span>{rows.length} devis</span><div className="flex items-center gap-1"><Button variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Précédent</Button><span>{page} / {pages}</span><Button variant="ghost" size="sm" disabled={page === pages} onClick={() => setPage(page + 1)}>Suivant</Button></div></div>}
        </div>
      )}

      <QuoteDialog open={dialog.open} onOpenChange={(o) => setDialog((d) => ({ ...d, open: o }))} quote={dialog.quote} defaultClientId={dialog.clientId} onSaved={(qq) => { if (!dialog.quote) navigate({ to: "/devis/$id", params: { id: qq.id } }); }} />
      <ConfirmDialog open={!!del} onOpenChange={(o) => !o && setDel(null)} title={`Supprimer le devis ${del?.number} ?`} onConfirm={() => { if (del) { s.deleteQuote(del.id); toast.success("Élément supprimé."); setDel(null); } }} />
      <ConfirmDialog open={!!orderPrompt} onOpenChange={(o) => !o && setOrderPrompt(null)} destructive={false} confirmLabel="Créer la commande" title="Ce devis a été validé." description="Voulez-vous créer une commande à partir de ce devis ? Le client, le projet, les produits, quantités, prix et informations de livraison seront repris automatiquement." onConfirm={() => { if (orderPrompt) { const o = s.createOrderFromQuote(orderPrompt.id); setOrderPrompt(null); if (o) toast.success(`Commande ${o.number} créée.`, { action: { label: "Ouvrir", onClick: () => navigate({ to: "/commandes/$id", params: { id: o.id } }) } }); } }} />
    </div>
  );
}
