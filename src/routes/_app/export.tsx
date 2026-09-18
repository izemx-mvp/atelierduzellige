import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Ship, MoreHorizontal, Pencil, Trash2, ArrowRight, AlertTriangle, Globe } from "lucide-react";
import { useStore, useHydrated, fmtDate, daysUntil } from "@/lib/store";
import { SHIPMENT_STATUSES, type Shipment, type ShipmentStatus, type ShipmentIssue } from "@/lib/types";
import { PageHeader, EmptyState, LoadingBlock, StatusBadge, ConfirmDialog, SearchInput, SortHeader, useSort, Field, KpiCard } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/export")({
  head: () => ({ meta: [{ title: "Export & Transport — Atelier du Zellige" }, { name: "description", content: "Expéditions internationales : transporteurs, suivi, statuts, retards et blocages." }, { property: "og:title", content: "Export & Transport — Atelier du Zellige" }, { property: "og:description", content: "Suivi des expéditions à l'international." }] }),
  component: ExportPage,
});

type F = "carrier" | "destinationCountry" | "eta" | "status" | "shippedAt";
const CARRIERS = ["DHL Freight", "Geodis", "Maersk / Geodis", "Emirates SkyCargo", "Transport Atlas Express", "Kuehne+Nagel", "À définir"];
const ISSUES: Exclude<ShipmentIssue, null>[] = ["Retard", "Blocage douane", "Problème transporteur"];
const empty = { orderId: "", carrier: CARRIERS[0], trackingNumber: "", destinationCountry: "", address: "", shippedAt: "", eta: "", status: "Préparation" as ShipmentStatus, issue: null as ShipmentIssue, incoterm: "EXW Fès", weightKg: 0 };

function ExportPage() {
  const hydrated = useHydrated();
  const s = useStore();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [issuesOnly, setIssuesOnly] = useState(false);
  const [dialog, setDialog] = useState<{ open: boolean; sh?: Shipment | null }>({ open: false });
  const [del, setDel] = useState<Shipment | null>(null);
  const [f, setF] = useState(empty);
  const { sort, onSort, sortFn } = useSort<F>("eta", "asc");

  useEffect(() => { if (dialog.open) { const sh = dialog.sh; if (sh) setF({ ...sh, shippedAt: sh.shippedAt?.slice(0, 10) ?? "", eta: sh.eta.slice(0, 10) }); else { const o = s.orders.find((oo) => !s.shipments.some((x) => x.orderId === oo.id) && !["Livrée", "Annulée"].includes(oo.status)); const eta = new Date(); eta.setDate(eta.getDate() + 14); setF({ ...empty, orderId: o?.id ?? "", destinationCountry: o?.deliveryCountry ?? "", address: o?.deliveryAddress ?? "", eta: eta.toISOString().slice(0, 10) }); } } }, [dialog, s.orders, s.shipments]);

  const rows = useMemo(() => { const t = q.toLowerCase(); return sortFn(s.shipments.filter((sh) => { const o = s.orders.find((oo) => oo.id === sh.orderId); const c = s.clients.find((cc) => cc.id === o?.clientId); return (!t || [sh.carrier, sh.trackingNumber, sh.destinationCountry, o?.number ?? "", c?.name ?? ""].some((v) => v.toLowerCase().includes(t))) && (status === "all" || sh.status === status) && (!issuesOnly || !!sh.issue); }), (sh, k) => sh[k]); }, [s.shipments, s.orders, s.clients, q, status, issuesOnly, sortFn]);

  if (!hydrated) return <LoadingBlock />;
  const inTransit = s.shipments.filter((sh) => ["Expédié", "En transit"].includes(sh.status)).length;
  const issues = s.shipments.filter((sh) => sh.issue).length;
  const countries = new Set(s.shipments.map((sh) => sh.destinationCountry)).size;
  const pickOrder = (id: string) => { const o = s.orders.find((oo) => oo.id === id); setF({ ...f, orderId: id, destinationCountry: o?.deliveryCountry ?? f.destinationCountry, address: o?.deliveryAddress ?? f.address }); };
  const submit = () => {
    if (!f.orderId || !f.eta) return toast.error("Commande et date estimée requises.");
    const payload = { ...f, shippedAt: f.shippedAt ? new Date(f.shippedAt).toISOString() : undefined, eta: new Date(f.eta).toISOString() };
    if (dialog.sh) { s.updateShipment(dialog.sh.id, payload); toast.success("Modifications enregistrées."); }
    else { s.addShipment(payload); const o = s.orders.find((oo) => oo.id === f.orderId); s.log({ agent: "Utilisateur", action: "Création expédition", target: o?.number ?? "", result: `${f.carrier} → ${f.destinationCountry}`, status: "Succès", link: "/export" }); toast.success("Expédition créée avec succès."); }
    setDialog({ open: false });
  };
  const setSt = (sh: Shipment, st: ShipmentStatus) => {
    s.updateShipment(sh.id, { status: st, ...(st === "Expédié" && !sh.shippedAt ? { shippedAt: new Date().toISOString() } : {}), ...(st === "Livré" ? { issue: null } : {}) });
    const o = s.orders.find((oo) => oo.id === sh.orderId);
    if (o) { if (st === "Livré" && o.status !== "Livrée") s.setOrderStatus(o.id, "Livrée"); else if (["Expédié", "En transit", "Arrivé"].includes(st) && !["Expédiée", "Livrée"].includes(o.status)) s.setOrderStatus(o.id, "Expédiée"); }
    s.log({ agent: "Utilisateur", action: "Statut expédition", target: o?.number ?? sh.trackingNumber, result: st, status: "Succès", link: "/export" });
    toast.success(`Expédition : ${st}.`);
  };
  const setIssue = (sh: Shipment, issue: ShipmentIssue) => { s.updateShipment(sh.id, { issue }); const o = s.orders.find((oo) => oo.id === sh.orderId); if (issue) s.notify({ title: `Expédition — ${issue}`, description: `${o?.number ?? ""} vers ${sh.destinationCountry} (${sh.carrier}).`, link: "/export", severity: "warning" }); toast.success(issue ? `Signalé : ${issue}.` : "Incident levé."); };

  return (
    <div>
      <PageHeader eyebrow="Logistique" title="Export & Transport" description={`${s.shipments.length} expéditions · ${countries} pays desservis`}
        actions={<Button className="bg-gold text-gold-foreground hover:bg-gold/90" onClick={() => setDialog({ open: true, sh: null })}><Plus className="h-4 w-4" /> Nouvelle expédition</Button>} />
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label="En transit" value={inTransit} icon={Ship} accent />
        <KpiCard label="En préparation" value={s.shipments.filter((sh) => ["Préparation", "Prêt à expédier"].includes(sh.status)).length} />
        <KpiCard label="Incidents" value={issues} icon={AlertTriangle} onClick={() => setIssuesOnly(true)} />
        <KpiCard label="Pays" value={countries} icon={Globe} />
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchInput value={q} onChange={setQ} placeholder="Transporteur, n° de suivi, pays, commande…" className="w-full md:w-80" />
        <Select value={status} onValueChange={setStatus}><SelectTrigger className="w-44 bg-card"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Tous statuts</SelectItem>{SHIPMENT_STATUSES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
        <Button variant={issuesOnly ? "secondary" : "outline"} size="sm" className={cn(issuesOnly && "border-gold")} onClick={() => setIssuesOnly(!issuesOnly)}><AlertTriangle className="h-4 w-4" /> Incidents</Button>
      </div>

      {rows.length === 0 ? <EmptyState icon={Ship} title="Aucune expédition" description={s.shipments.length ? "Aucune expédition ne correspond." : "Planifiez votre première expédition."} action={<Button className="bg-gold text-gold-foreground hover:bg-gold/90" onClick={() => setDialog({ open: true, sh: null })}><Plus className="h-4 w-4" /> Créer une expédition</Button>} /> : (
        <div className="surface overflow-x-auto">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Commande</TableHead><TableHead>Client</TableHead><TableHead><SortHeader label="Destination" field="destinationCountry" sort={sort} onSort={onSort} /></TableHead>
              <TableHead><SortHeader label="Transporteur" field="carrier" sort={sort} onSort={onSort} /></TableHead><TableHead>N° de suivi</TableHead>
              <TableHead><SortHeader label="Expédié" field="shippedAt" sort={sort} onSort={onSort} /></TableHead><TableHead><SortHeader label="Arrivée est." field="eta" sort={sort} onSort={onSort} /></TableHead>
              <TableHead><SortHeader label="Statut" field="status" sort={sort} onSort={onSort} /></TableHead><TableHead>Incident</TableHead><TableHead className="w-36" />
            </TableRow></TableHeader>
            <TableBody>
              {rows.map((sh) => { const o = s.orders.find((oo) => oo.id === sh.orderId); const c = s.clients.find((cc) => cc.id === o?.clientId); const next = SHIPMENT_STATUSES[SHIPMENT_STATUSES.indexOf(sh.status) + 1]; const lateEta = daysUntil(sh.eta) < 0 && sh.status !== "Livré"; return (
                <TableRow key={sh.id}>
                  <TableCell>{o ? <Link to="/commandes/$id" params={{ id: o.id }} className="font-medium hover:text-gold">{o.number}</Link> : "—"}<div className="text-xs text-muted-foreground">{sh.incoterm} · {sh.weightKg ? `${sh.weightKg} kg` : ""}</div></TableCell>
                  <TableCell>{c?.name}</TableCell>
                  <TableCell><div>{sh.destinationCountry}</div><div className="max-w-44 truncate text-xs text-muted-foreground">{sh.address}</div></TableCell>
                  <TableCell>{sh.carrier}</TableCell><TableCell className="font-mono text-xs text-muted-foreground">{sh.trackingNumber || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{fmtDate(sh.shippedAt)}</TableCell><TableCell className={cn(lateEta && "text-destructive font-medium")}>{fmtDate(sh.eta)}</TableCell>
                  <TableCell><StatusBadge status={sh.status} /></TableCell>
                  <TableCell>{sh.issue ? <StatusBadge status={sh.issue} /> : <span className="text-xs text-muted-foreground">—</span>}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      {next && <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setSt(sh, next)}>{next} <ArrowRight className="h-3 w-3" /></Button>}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setDialog({ open: true, sh })}><Pencil className="h-4 w-4" /> Modifier</DropdownMenuItem>
                          <DropdownMenuSub><DropdownMenuSubTrigger>Statut</DropdownMenuSubTrigger><DropdownMenuSubContent>{SHIPMENT_STATUSES.filter((st) => st !== sh.status).map((st) => <DropdownMenuItem key={st} onClick={() => setSt(sh, st)}>{st}</DropdownMenuItem>)}</DropdownMenuSubContent></DropdownMenuSub>
                          <DropdownMenuSub><DropdownMenuSubTrigger>Signaler un incident</DropdownMenuSubTrigger><DropdownMenuSubContent>{ISSUES.map((i) => <DropdownMenuItem key={i} onClick={() => setIssue(sh, i)}>{i}</DropdownMenuItem>)}{sh.issue && <DropdownMenuItem onClick={() => setIssue(sh, null)}>Lever l'incident</DropdownMenuItem>}</DropdownMenuSubContent></DropdownMenuSub>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDel(sh)}><Trash2 className="h-4 w-4" /> Supprimer</DropdownMenuItem>
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
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{dialog.sh ? "Modifier l'expédition" : "Nouvelle expédition"}</DialogTitle><DialogDescription>Transporteur, destination et suivi.</DialogDescription></DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Commande *" className="sm:col-span-2"><Select value={f.orderId} onValueChange={pickOrder}><SelectTrigger><SelectValue placeholder="Choisir…" /></SelectTrigger><SelectContent>{s.orders.filter((o) => o.status !== "Annulée").map((o) => <SelectItem key={o.id} value={o.id}>{o.number} — {o.projectName}</SelectItem>)}</SelectContent></Select></Field>
            <Field label="Transporteur"><Select value={f.carrier} onValueChange={(v) => setF({ ...f, carrier: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CARRIERS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></Field>
            <Field label="N° de suivi"><Input value={f.trackingNumber} onChange={(e) => setF({ ...f, trackingNumber: e.target.value })} /></Field>
            <Field label="Pays destinataire"><Input value={f.destinationCountry} onChange={(e) => setF({ ...f, destinationCountry: e.target.value })} /></Field>
            <Field label="Incoterm"><Select value={f.incoterm} onValueChange={(v) => setF({ ...f, incoterm: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["EXW Fès", "FOB Casablanca", "DAP", "DDP", "Livré"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></Field>
            <Field label="Adresse" className="sm:col-span-2"><Input value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} /></Field>
            <Field label="Date d'expédition"><Input type="date" value={f.shippedAt} onChange={(e) => setF({ ...f, shippedAt: e.target.value })} /></Field>
            <Field label="Arrivée estimée *"><Input type="date" value={f.eta} onChange={(e) => setF({ ...f, eta: e.target.value })} /></Field>
            <Field label="Statut"><Select value={f.status} onValueChange={(v) => setF({ ...f, status: v as ShipmentStatus })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{SHIPMENT_STATUSES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></Field>
            <Field label="Poids (kg)"><Input type="number" min={0} value={f.weightKg} onChange={(e) => setF({ ...f, weightKg: Number(e.target.value) })} /></Field>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialog({ open: false })}>Annuler</Button><Button className="bg-gold text-gold-foreground hover:bg-gold/90" onClick={submit}>{dialog.sh ? "Enregistrer" : "Créer"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={!!del} onOpenChange={(o) => !o && setDel(null)} title="Supprimer cette expédition ?" onConfirm={() => { if (del) { s.deleteShipment(del.id); toast.success("Élément supprimé."); setDel(null); } }} />
    </div>
  );
}
