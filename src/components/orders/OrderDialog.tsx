import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { useStore, uid, fmtMoney2 } from "@/lib/store";
import type { Order, QuoteLine } from "@/lib/types";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field } from "@/components/shared";

const OWNERS = ["Hassan Idrissi", "Mehdi Alaoui", "Houda Bennani"];

export function OrderDialog({ open, onOpenChange, order }: { open: boolean; onOpenChange: (o: boolean) => void; order?: Order | null }) {
  const s = useStore();
  const [f, setF] = useState({ clientId: "", projectName: "", owner: OWNERS[0], dueDate: "", deliveryAddress: "", deliveryCountry: "", vat: 0, lines: [] as QuoteLine[] });
  const [touched, setTouched] = useState(false);
  useEffect(() => {
    if (!open) return;
    if (order) setF({ clientId: order.clientId, projectName: order.projectName, owner: order.owner, dueDate: order.dueDate.slice(0, 10), deliveryAddress: order.deliveryAddress, deliveryCountry: order.deliveryCountry, vat: order.totalHT ? Math.round(((order.totalTTC - order.totalHT) / order.totalHT) * 100) : 0, lines: order.lines.map((l) => ({ ...l })) });
    else { const c = s.clients[0]; const d = new Date(); d.setDate(d.getDate() + 46); setF({ clientId: c?.id ?? "", projectName: "", owner: OWNERS[0], dueDate: d.toISOString().slice(0, 10), deliveryAddress: c?.address ?? "", deliveryCountry: c?.country ?? "", vat: c?.country === "Maroc" ? 20 : 0, lines: [] }); }
    setTouched(false);
  }, [open, order, s.clients]);
  const pickClient = (id: string) => { const c = s.clients.find((x) => x.id === id); setF({ ...f, clientId: id, deliveryAddress: c?.address ?? "", deliveryCountry: c?.country ?? "", vat: c?.country === "Maroc" ? 20 : 0 }); };
  const addLine = (pid: string) => { const p = s.products.find((x) => x.id === pid); if (!p) return; setF({ ...f, lines: [...f.lines, { id: uid(), productId: p.id, reference: p.reference, description: p.name, collection: p.collection, dimensions: p.dimensions, color: p.colors[0], quantity: 1, unitPrice: p.price, discount: 0 }] }); };
  const setLine = (id: string, p: Partial<QuoteLine>) => setF({ ...f, lines: f.lines.map((l) => (l.id === id ? { ...l, ...p } : l)) });
  const ht = f.lines.reduce((a, l) => a + l.quantity * l.unitPrice * (1 - l.discount / 100), 0);
  const valid = f.clientId && f.projectName.trim() && f.lines.length > 0 && f.dueDate;
  const submit = () => {
    setTouched(true);
    if (!valid) return toast.error("Client, projet, échéance et au moins une ligne sont requis.");
    const payload = { clientId: f.clientId, projectName: f.projectName, owner: f.owner, dueDate: new Date(f.dueDate).toISOString(), deliveryAddress: f.deliveryAddress, deliveryCountry: f.deliveryCountry, lines: f.lines, totalHT: ht, totalTTC: ht * (1 + f.vat / 100) };
    if (order) { s.updateOrder(order.id, { ...payload, steps: order.steps.map((st) => ({ ...st, owner: f.owner })) }); toast.success("Modifications enregistrées."); }
    else { const o = s.addOrder({ ...payload, status: "Confirmée", notes: [] }); toast.success(`Commande ${o.number} créée avec succès.`); }
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto">
        <DialogHeader><DialogTitle>{order ? `Modifier ${order.number}` : "Nouvelle commande"}</DialogTitle><DialogDescription>Une commande créée manuellement démarre au statut « Confirmée ».</DialogDescription></DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Client *"><Select value={f.clientId} onValueChange={pickClient}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{s.clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name} · {c.company}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Projet *"><Input value={f.projectName} onChange={(e) => setF({ ...f, projectName: e.target.value })} />{touched && !f.projectName.trim() && <span className="text-xs text-destructive">Requis.</span>}</Field>
          <Field label="Responsable"><Select value={f.owner} onValueChange={(v) => setF({ ...f, owner: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{OWNERS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Date de livraison prévue *"><Input type="date" value={f.dueDate} onChange={(e) => setF({ ...f, dueDate: e.target.value })} /></Field>
          <Field label="Adresse de livraison"><Input value={f.deliveryAddress} onChange={(e) => setF({ ...f, deliveryAddress: e.target.value })} /></Field>
          <Field label="Pays de livraison"><Input value={f.deliveryCountry} onChange={(e) => setF({ ...f, deliveryCountry: e.target.value })} /></Field>
        </div>
        <div className="mt-2 overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-[11px] uppercase tracking-wider text-muted-foreground"><tr><th className="px-2 py-2 text-left">Produit</th><th className="w-20 px-2 py-2">Qté</th><th className="w-24 px-2 py-2">PU</th><th className="w-20 px-2 py-2">Rem. %</th><th className="w-28 px-2 py-2 text-right">Total</th><th className="w-10" /></tr></thead>
            <tbody>
              {f.lines.map((l) => <tr key={l.id} className="border-t"><td className="px-2 py-1.5">{l.reference} — {l.description}</td><td className="px-2 py-1.5"><Input className="h-8" type="number" min={0} value={l.quantity} onChange={(e) => setLine(l.id, { quantity: Number(e.target.value) })} /></td><td className="px-2 py-1.5"><Input className="h-8" type="number" value={l.unitPrice} onChange={(e) => setLine(l.id, { unitPrice: Number(e.target.value) })} /></td><td className="px-2 py-1.5"><Input className="h-8" type="number" value={l.discount} onChange={(e) => setLine(l.id, { discount: Number(e.target.value) })} /></td><td className="px-2 py-1.5 text-right font-medium">{fmtMoney2(l.quantity * l.unitPrice * (1 - l.discount / 100))}</td><td><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setF({ ...f, lines: f.lines.filter((x) => x.id !== l.id) })}><Trash2 className="h-3.5 w-3.5" /></Button></td></tr>)}
              {f.lines.length === 0 && <tr><td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">Aucune ligne.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Select onValueChange={addLine}><SelectTrigger className="w-72"><SelectValue placeholder="+ Ajouter un produit" /></SelectTrigger><SelectContent>{s.products.map((p) => <SelectItem key={p.id} value={p.id}>{p.reference} — {p.name}</SelectItem>)}</SelectContent></Select>
          <div className="text-sm">Total HT <span className="font-semibold">{fmtMoney2(ht)}</span> · TVA {f.vat} % · TTC <span className="font-semibold">{fmtMoney2(ht * (1 + f.vat / 100))}</span></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button><Button className="bg-gold text-gold-foreground hover:bg-gold/90" onClick={submit}><Plus className="h-4 w-4" /> {order ? "Enregistrer" : "Créer la commande"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
