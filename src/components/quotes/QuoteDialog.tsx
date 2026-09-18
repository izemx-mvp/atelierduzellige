import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { useStore, uid, quoteTotals, fmtMoney2 } from "@/lib/store";
import type { Quote, QuoteLine, QuoteStatus } from "@/lib/types";
import { QUOTE_STATUSES } from "@/lib/types";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field } from "@/components/shared";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Form = Omit<Quote, "id" | "number" | "createdAt">;
const blank = (clientId: string): Form => { const exp = new Date(); exp.setDate(exp.getDate() + 30); return { clientId, projectName: "", projectDescription: "", projectType: "Résidentiel", projectLocation: "", expiresAt: exp.toISOString(), lines: [], globalDiscount: 0, fees: 0, vatRate: 0, status: "Brouillon", paymentTerms: "40 % à la commande, solde avant expédition", leadTime: "6 à 8 semaines", deliveryTerms: "EXW Fès — transport à la charge du client", notes: "" }; };

export function QuoteDialog({ open, onOpenChange, quote, defaultClientId, onSaved }: { open: boolean; onOpenChange: (o: boolean) => void; quote?: Quote | null; defaultClientId?: string; onSaved?: (q: Quote) => void }) {
  const s = useStore();
  const [f, setF] = useState<Form>(blank(""));
  const [touched, setTouched] = useState(false);
  useEffect(() => { if (open) { if (quote) { const { id: _i, number: _n, createdAt: _c, ...rest } = quote; setF({ ...rest, lines: rest.lines.map((l) => ({ ...l })) }); } else setF(blank(defaultClientId ?? s.clients[0]?.id ?? "")); setTouched(false); } }, [open, quote, defaultClientId, s.clients]);

  const client = s.clients.find((c) => c.id === f.clientId);
  useEffect(() => { if (open && !quote && client) setF((x) => ({ ...x, vatRate: client.country === "Maroc" ? 20 : 0, projectLocation: x.projectLocation || `${client.city ? client.city + ", " : ""}${client.country}` })); }, [client, open, quote]);

  const setLine = (id: string, p: Partial<QuoteLine>) => setF((x) => ({ ...x, lines: x.lines.map((l) => (l.id === id ? { ...l, ...p } : l)) }));
  const addLine = (productId?: string) => { const p = s.products.find((pp) => pp.id === productId); setF((x) => ({ ...x, lines: [...x.lines, { id: uid(), productId: p?.id, reference: p?.reference ?? "", description: p?.name ?? "", collection: p?.collection ?? "", dimensions: p?.dimensions ?? "", color: p?.colors[0] ?? "", quantity: 1, unitPrice: p?.price ?? 0, discount: 0 }] })); };
  const pickProduct = (lineId: string, productId: string) => { const p = s.products.find((pp) => pp.id === productId); if (p) setLine(lineId, { productId: p.id, reference: p.reference, description: p.name, collection: p.collection, dimensions: p.dimensions, color: p.colors[0], unitPrice: p.price }); };
  const t = quoteTotals(f);
  const errs = { client: f.clientId ? "" : "Client requis.", project: f.projectName.trim() ? "" : "Nom du projet requis.", lines: f.lines.length ? "" : "Ajoutez au moins une ligne." };
  const valid = !errs.client && !errs.project && !errs.lines;

  const submit = () => {
    setTouched(true);
    if (!valid) return toast.error("Veuillez compléter le devis.");
    if (quote) { s.updateQuote(quote.id, f); toast.success("Modifications enregistrées."); onSaved?.({ ...quote, ...f }); }
    else { const q = s.addQuote(f); toast.success(`Devis ${q.number} créé avec succès.`); onSaved?.(q); }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto">
        <DialogHeader><DialogTitle>{quote ? `Modifier le devis ${quote.number}` : "Nouveau devis"}</DialogTitle><DialogDescription>Client, projet, lignes et conditions commerciales.</DialogDescription></DialogHeader>
        <Tabs defaultValue="general">
          <TabsList><TabsTrigger value="general">Général</TabsTrigger><TabsTrigger value="lines">Lignes ({f.lines.length})</TabsTrigger><TabsTrigger value="terms">Conditions</TabsTrigger></TabsList>
          <TabsContent value="general" className="grid gap-4 pt-3 sm:grid-cols-2">
            <Field label="Client *"><Select value={f.clientId} onValueChange={(v) => setF({ ...f, clientId: v })}><SelectTrigger><SelectValue placeholder="Choisir un client" /></SelectTrigger><SelectContent>{s.clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name} · {c.company}</SelectItem>)}</SelectContent></Select>{touched && errs.client && <span className="text-xs text-destructive">{errs.client}</span>}</Field>
            <Field label="Statut"><Select value={f.status} onValueChange={(v) => setF({ ...f, status: v as QuoteStatus })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{QUOTE_STATUSES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></Field>
            <Field label="Nom du projet *" className="sm:col-span-2"><Input value={f.projectName} onChange={(e) => setF({ ...f, projectName: e.target.value })} />{touched && errs.project && <span className="text-xs text-destructive">{errs.project}</span>}</Field>
            <Field label="Description" className="sm:col-span-2"><Textarea rows={2} value={f.projectDescription} onChange={(e) => setF({ ...f, projectDescription: e.target.value })} /></Field>
            <Field label="Type de projet"><Select value={f.projectType} onValueChange={(v) => setF({ ...f, projectType: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["Résidentiel", "Hôtellerie", "Restauration", "Commercial", "Promotion immobilière", "Distribution"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></Field>
            <Field label="Localisation"><Input value={f.projectLocation} onChange={(e) => setF({ ...f, projectLocation: e.target.value })} /></Field>
            <Field label="Date d'expiration"><Input type="date" value={f.expiresAt.slice(0, 10)} onChange={(e) => setF({ ...f, expiresAt: new Date(e.target.value).toISOString() })} /></Field>
            <Field label="TVA (%)"><Input type="number" min={0} value={f.vatRate} onChange={(e) => setF({ ...f, vatRate: Number(e.target.value) })} /></Field>
          </TabsContent>
          <TabsContent value="lines" className="pt-3">
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-secondary text-[11px] uppercase tracking-wider text-muted-foreground"><tr><th className="px-2 py-2 text-left">Produit</th><th className="px-2 py-2 text-left">Description</th><th className="px-2 py-2 text-left">Couleur</th><th className="w-20 px-2 py-2">Qté</th><th className="w-24 px-2 py-2">PU (€)</th><th className="w-20 px-2 py-2">Rem. %</th><th className="w-28 px-2 py-2 text-right">Total</th><th className="w-10" /></tr></thead>
                <tbody>
                  {f.lines.map((l) => (
                    <tr key={l.id} className="border-t">
                      <td className="px-2 py-1.5"><Select value={l.productId ?? "custom"} onValueChange={(v) => v === "custom" ? setLine(l.id, { productId: undefined }) : pickProduct(l.id, v)}><SelectTrigger className="h-8 w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="custom">Ligne libre</SelectItem>{s.products.map((p) => <SelectItem key={p.id} value={p.id}>{p.reference} — {p.name}</SelectItem>)}</SelectContent></Select></td>
                      <td className="px-2 py-1.5"><Input className="h-8" value={l.description} onChange={(e) => setLine(l.id, { description: e.target.value })} /></td>
                      <td className="px-2 py-1.5"><Input className="h-8 w-28" value={l.color} onChange={(e) => setLine(l.id, { color: e.target.value })} /></td>
                      <td className="px-2 py-1.5"><Input className="h-8" type="number" min={0} value={l.quantity} onChange={(e) => setLine(l.id, { quantity: Number(e.target.value) })} /></td>
                      <td className="px-2 py-1.5"><Input className="h-8" type="number" min={0} value={l.unitPrice} onChange={(e) => setLine(l.id, { unitPrice: Number(e.target.value) })} /></td>
                      <td className="px-2 py-1.5"><Input className="h-8" type="number" min={0} max={100} value={l.discount} onChange={(e) => setLine(l.id, { discount: Number(e.target.value) })} /></td>
                      <td className="px-2 py-1.5 text-right font-medium">{fmtMoney2(l.quantity * l.unitPrice * (1 - l.discount / 100))}</td>
                      <td className="px-1"><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setF({ ...f, lines: f.lines.filter((x) => x.id !== l.id) })}><Trash2 className="h-3.5 w-3.5" /></Button></td>
                    </tr>
                  ))}
                  {f.lines.length === 0 && <tr><td colSpan={8} className="px-3 py-8 text-center text-muted-foreground">Aucune ligne. Ajoutez un produit du catalogue ou une ligne libre.</td></tr>}
                </tbody>
              </table>
            </div>
            {touched && errs.lines && <div className="mt-1 text-xs text-destructive">{errs.lines}</div>}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Select onValueChange={(v) => addLine(v)}><SelectTrigger className="w-72"><SelectValue placeholder="+ Ajouter un produit du catalogue" /></SelectTrigger><SelectContent>{s.products.map((p) => <SelectItem key={p.id} value={p.id}>{p.reference} — {p.name} ({fmtMoney2(p.price)})</SelectItem>)}</SelectContent></Select>
              <Button variant="outline" size="sm" onClick={() => addLine()}><Plus className="h-4 w-4" /> Ligne libre</Button>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Remise globale (€)"><Input type="number" min={0} value={f.globalDiscount} onChange={(e) => setF({ ...f, globalDiscount: Number(e.target.value) })} /></Field>
                <Field label="Frais (emballage, transport…) (€)"><Input type="number" min={0} value={f.fees} onChange={(e) => setF({ ...f, fees: Number(e.target.value) })} /></Field>
              </div>
              <div className="rounded-md border bg-secondary/40 p-4 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Sous-total HT</span><span>{fmtMoney2(t.subtotal)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Remise</span><span>- {fmtMoney2(t.discount)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Frais</span><span>{fmtMoney2(t.fees)}</span></div>
                <div className="flex justify-between border-t pt-1 mt-1"><span>Total HT</span><span className="font-medium">{fmtMoney2(t.ht)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">TVA {f.vatRate} %</span><span>{fmtMoney2(t.vat)}</span></div>
                <div className="flex justify-between text-base font-semibold"><span>Total TTC</span><span>{fmtMoney2(t.ttc)}</span></div>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="terms" className="grid gap-4 pt-3 sm:grid-cols-2">
            <Field label="Conditions de paiement"><Textarea rows={2} value={f.paymentTerms} onChange={(e) => setF({ ...f, paymentTerms: e.target.value })} /></Field>
            <Field label="Délais estimatifs"><Textarea rows={2} value={f.leadTime} onChange={(e) => setF({ ...f, leadTime: e.target.value })} /></Field>
            <Field label="Conditions de livraison"><Textarea rows={2} value={f.deliveryTerms} onChange={(e) => setF({ ...f, deliveryTerms: e.target.value })} /></Field>
            <Field label="Notes / observations"><Textarea rows={2} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></Field>
          </TabsContent>
        </Tabs>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button><Button className="bg-gold text-gold-foreground hover:bg-gold/90" onClick={submit} disabled={touched && !valid}>{quote ? "Enregistrer" : "Créer le devis"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
