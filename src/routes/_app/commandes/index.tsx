import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, ShoppingCart, MoreHorizontal, Pencil, Trash2, Eye, AlertTriangle, ArrowRight } from "lucide-react";
import { useStore, useHydrated, fmtDate, fmtMoney, isOrderLate, orderProgress } from "@/lib/store";
import { ORDER_STATUSES, type Order } from "@/lib/types";
import { PageHeader, EmptyState, LoadingBlock, StatusBadge, ConfirmDialog, SearchInput, SortHeader, useSort, KpiCard } from "@/components/shared";
import { OrderDialog } from "@/components/orders/OrderDialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/commandes/")({
  head: () => ({ meta: [{ title: "Commandes — Atelier du Zellige" }, { name: "description", content: "Suivi complet du cycle de commande, de la confirmation à la livraison." }, { property: "og:title", content: "Commandes — Atelier du Zellige" }, { property: "og:description", content: "Suivi des commandes clients." }] }),
  component: OrdersPage,
});

type F = "number" | "createdAt" | "dueDate" | "status" | "totalHT";

function OrdersPage() {
  const hydrated = useHydrated();
  const navigate = useNavigate();
  const s = useStore();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [onlyLate, setOnlyLate] = useState(false);
  const [dialog, setDialog] = useState<{ open: boolean; o?: Order | null }>({ open: false });
  const [del, setDel] = useState<Order | null>(null);
  const { sort, onSort, sortFn } = useSort<F>("createdAt");

  const rows = useMemo(() => {
    const t = q.toLowerCase();
    return sortFn(s.orders.filter((o) => { const c = s.clients.find((cc) => cc.id === o.clientId); return (!t || [o.number, o.projectName, c?.name ?? "", c?.company ?? ""].some((v) => v.toLowerCase().includes(t))) && (status === "all" || o.status === status) && (!onlyLate || isOrderLate(o) || o.blocked); }), (o, k) => o[k]);
  }, [s.orders, s.clients, q, status, onlyLate, sortFn]);

  if (!hydrated) return <LoadingBlock />;
  const late = s.orders.filter((o) => isOrderLate(o)).length;
  const blocked = s.orders.filter((o) => o.blocked).length;
  const active = s.orders.filter((o) => !["Livrée", "Annulée"].includes(o.status));

  return (
    <div>
      <PageHeader eyebrow="Opérations" title="Commandes" description={`${active.length} commandes en cours · ${fmtMoney(active.reduce((a, o) => a + o.totalHT, 0))} HT`}
        actions={<Button className="bg-gold text-gold-foreground hover:bg-gold/90" onClick={() => setDialog({ open: true, o: null })}><Plus className="h-4 w-4" /> Nouvelle commande</Button>} />
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label="En cours" value={active.length} icon={ShoppingCart} onClick={() => { setStatus("all"); setOnlyLate(false); }} />
        <KpiCard label="En retard" value={late} icon={AlertTriangle} onClick={() => setOnlyLate(true)} />
        <KpiCard label="Bloquées" value={blocked} icon={AlertTriangle} onClick={() => setOnlyLate(true)} />
        <KpiCard label="Livrées" value={s.orders.filter((o) => o.status === "Livrée").length} onClick={() => setStatus("Livrée")} />
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchInput value={q} onChange={setQ} placeholder="Numéro, client, projet…" className="w-full md:w-80" />
        <Select value={status} onValueChange={setStatus}><SelectTrigger className="w-48 bg-card"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Tous statuts</SelectItem>{[...ORDER_STATUSES, "Annulée"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
        <Button variant={onlyLate ? "secondary" : "outline"} size="sm" onClick={() => setOnlyLate(!onlyLate)} className={cn(onlyLate && "border-gold")}><AlertTriangle className="h-4 w-4" /> Retards & blocages</Button>
      </div>
      {rows.length === 0 ? (
        <EmptyState icon={ShoppingCart} title="Aucune commande" description={s.orders.length ? "Aucune commande ne correspond." : "Créez une commande ou validez un devis."} action={<Button className="bg-gold text-gold-foreground hover:bg-gold/90" onClick={() => setDialog({ open: true, o: null })}><Plus className="h-4 w-4" /> Créer une commande</Button>} />
      ) : (
        <div className="surface overflow-x-auto">
          <Table>
            <TableHeader><TableRow>
              <TableHead><SortHeader label="Numéro" field="number" sort={sort} onSort={onSort} /></TableHead><TableHead>Client</TableHead><TableHead>Projet</TableHead>
              <TableHead><SortHeader label="Création" field="createdAt" sort={sort} onSort={onSort} /></TableHead><TableHead><SortHeader label="Livraison" field="dueDate" sort={sort} onSort={onSort} /></TableHead>
              <TableHead>Responsable</TableHead><TableHead className="w-40">Progression</TableHead><TableHead className="text-right"><SortHeader label="Montant HT" field="totalHT" sort={sort} onSort={onSort} /></TableHead>
              <TableHead><SortHeader label="Statut" field="status" sort={sort} onSort={onSort} /></TableHead><TableHead className="w-12" />
            </TableRow></TableHeader>
            <TableBody>
              {rows.map((o) => { const c = s.clients.find((cc) => cc.id === o.clientId); const late = isOrderLate(o); const idx = ORDER_STATUSES.indexOf(o.status); const next = ORDER_STATUSES[idx + 1]; return (
                <TableRow key={o.id} className="cursor-pointer" onClick={() => navigate({ to: "/commandes/$id", params: { id: o.id } })}>
                  <TableCell><div className="font-medium">{o.number}</div>{(late || o.blocked) && <div className="mt-0.5 flex items-center gap-1 text-[11px] text-destructive"><AlertTriangle className="h-3 w-3" />{o.blocked ? "Bloquée" : "En retard"}</div>}</TableCell>
                  <TableCell><div>{c?.name}</div><div className="text-xs text-muted-foreground">{c?.country}</div></TableCell>
                  <TableCell className="max-w-56 truncate text-muted-foreground">{o.projectName}</TableCell>
                  <TableCell className="text-muted-foreground">{fmtDate(o.createdAt)}</TableCell><TableCell className={cn(late && "text-destructive font-medium")}>{fmtDate(o.dueDate)}</TableCell>
                  <TableCell className="text-muted-foreground">{o.owner}</TableCell>
                  <TableCell><div className="flex items-center gap-2"><Progress value={orderProgress(o)} className="h-1.5" /><span className="w-8 text-xs text-muted-foreground">{orderProgress(o)}%</span></div></TableCell>
                  <TableCell className="text-right font-medium">{fmtMoney(o.totalHT)}</TableCell>
                  <TableCell><StatusBadge status={o.status} /></TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild><Link to="/commandes/$id" params={{ id: o.id }}><Eye className="h-4 w-4" /> Voir</Link></DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDialog({ open: true, o })}><Pencil className="h-4 w-4" /> Modifier</DropdownMenuItem>
                        {next && o.status !== "Annulée" && <DropdownMenuItem onClick={() => { s.setOrderStatus(o.id, next); toast.success(`${o.number} → ${next}.`); }}><ArrowRight className="h-4 w-4" /> Passer à « {next} »</DropdownMenuItem>}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDel(o)}><Trash2 className="h-4 w-4" /> Supprimer</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ); })}
            </TableBody>
          </Table>
        </div>
      )}
      <OrderDialog open={dialog.open} onOpenChange={(o) => setDialog((d) => ({ ...d, open: o }))} order={dialog.o} />
      <ConfirmDialog open={!!del} onOpenChange={(o) => !o && setDel(null)} title={`Supprimer la commande ${del?.number} ?`} onConfirm={() => { if (del) { s.deleteOrder(del.id); toast.success("Élément supprimé."); setDel(null); } }} />
    </div>
  );
}
