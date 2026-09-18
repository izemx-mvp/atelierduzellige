import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Package, MoreHorizontal, Pencil, Trash2, Eye, PackagePlus, PackageMinus, LayoutGrid, List } from "lucide-react";
import { useStore, useHydrated, fmtMoney } from "@/lib/store";
import { COLLECTIONS, type Product, type Collection, type ProductStatus } from "@/lib/types";
import { PageHeader, EmptyState, LoadingBlock, StatusBadge, ConfirmDialog, SearchInput, SortHeader, useSort, Field, ProductSwatch, DefinitionList, Section } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/produits")({
  head: () => ({ meta: [{ title: "Produits — Atelier du Zellige" }, { name: "description", content: "Catalogue produits : collections Atlas, Fès, Marrakech et Sur-mesure, stock et tarifs." }, { property: "og:title", content: "Produits — Atelier du Zellige" }, { property: "og:description", content: "Catalogue des zelliges Atelier du Zellige." }] }),
  component: ProductsPage,
});

type F = "reference" | "name" | "collection" | "price" | "cost" | "stock" | "status";
const STATUSES: ProductStatus[] = ["Actif", "Nouveauté", "Rupture", "Archivé"];
const empty = { reference: "", name: "", collection: "Atlas" as Collection, description: "", dimensions: "10 x 10 cm", colors: "", material: "Terre cuite émaillée", cost: 0, price: 0, stock: 0, minStock: 0, unit: "m²" as Product["unit"], status: "Actif" as ProductStatus, imageHue: 40 };

function ProductsPage() {
  const hydrated = useHydrated();
  const s = useStore();
  const [view, setView] = useState<"grid" | "table">("grid");
  const [q, setQ] = useState("");
  const [coll, setColl] = useState("all");
  const [status, setStatus] = useState("all");
  const [dialog, setDialog] = useState<{ open: boolean; p?: Product | null }>({ open: false });
  const [detail, setDetail] = useState<Product | null>(null);
  const [del, setDel] = useState<Product | null>(null);
  const [stockDlg, setStockDlg] = useState<{ p: Product; delta: number } | null>(null);
  const [form, setForm] = useState(empty);
  const [touched, setTouched] = useState(false);
  const { sort, onSort, sortFn } = useSort<F>("reference", "asc");

  useEffect(() => { if (dialog.open) { const p = dialog.p; setForm(p ? { ...p, colors: p.colors.join(", ") } : empty); setTouched(false); } }, [dialog]);

  const rows = useMemo(() => {
    const t = q.toLowerCase();
    return sortFn(s.products.filter((p) => (!t || [p.name, p.reference, p.description, p.colors.join(" ")].some((x) => x.toLowerCase().includes(t))) && (coll === "all" || p.collection === coll) && (status === "all" || p.status === status)), (p, k) => p[k]);
  }, [s.products, q, coll, status, sortFn]);

  if (!hydrated) return <LoadingBlock />;

  const errs = { reference: form.reference.trim() ? "" : "Référence requise.", name: form.name.trim() ? "" : "Nom requis.", price: form.price > 0 ? "" : "Prix requis." };
  const valid = !errs.reference && !errs.name && !errs.price;
  const submit = () => {
    setTouched(true);
    if (!valid) return toast.error("Veuillez corriger les champs en erreur.");
    const payload = { ...form, colors: form.colors.split(",").map((c) => c.trim()).filter(Boolean) };
    if (dialog.p) { s.updateProduct(dialog.p.id, payload); toast.success("Modifications enregistrées."); }
    else { s.addProduct(payload); s.log({ agent: "Utilisateur", action: "Création produit", target: payload.name, result: payload.reference, status: "Succès", link: "/produits" }); toast.success("Produit créé avec succès."); }
    setDialog({ open: false });
  };
  const margin = (p: Product) => (p.price ? Math.round(((p.price - p.cost) / p.price) * 100) : 0);
  const lowStock = s.products.filter((p) => p.minStock > 0 && p.stock <= p.minStock).length;

  const Actions = ({ p }: { p: Product }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setDetail(p)}><Eye className="h-4 w-4" /> Fiche détaillée</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setDialog({ open: true, p })}><Pencil className="h-4 w-4" /> Modifier</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setStockDlg({ p, delta: 50 })}><PackagePlus className="h-4 w-4" /> Entrée de stock</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setStockDlg({ p, delta: -10 })}><PackageMinus className="h-4 w-4" /> Sortie de stock</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDel(p)}><Trash2 className="h-4 w-4" /> Supprimer</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div>
      <PageHeader eyebrow="Catalogue" title="Produits" description={`${s.products.length} références · ${lowStock} en stock faible`}
        actions={<>
          <div className="flex rounded-md border bg-card p-0.5">
            <Button variant={view === "grid" ? "secondary" : "ghost"} size="sm" onClick={() => setView("grid")}><LayoutGrid className="h-4 w-4" /></Button>
            <Button variant={view === "table" ? "secondary" : "ghost"} size="sm" onClick={() => setView("table")}><List className="h-4 w-4" /></Button>
          </div>
          <Button className="bg-gold text-gold-foreground hover:bg-gold/90" onClick={() => setDialog({ open: true, p: null })}><Plus className="h-4 w-4" /> Nouveau produit</Button>
        </>} />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchInput value={q} onChange={setQ} placeholder="Référence, nom, couleur…" className="w-full md:w-80" />
        <div className="flex gap-1">
          <Button variant={coll === "all" ? "secondary" : "outline"} size="sm" onClick={() => setColl("all")}>Toutes</Button>
          {COLLECTIONS.map((c) => <Button key={c} variant={coll === c ? "secondary" : "outline"} size="sm" onClick={() => setColl(c)} className={cn(coll === c && "border-gold")}>{c}</Button>)}
        </div>
        <Select value={status} onValueChange={setStatus}><SelectTrigger className="w-40 bg-card"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Tous statuts</SelectItem>{STATUSES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={Package} title="Aucun produit" description={s.products.length ? "Aucun produit ne correspond à vos filtres." : "Ajoutez votre première référence au catalogue."} action={<Button className="bg-gold text-gold-foreground hover:bg-gold/90" onClick={() => setDialog({ open: true, p: null })}><Plus className="h-4 w-4" /> Créer un produit</Button>} />
      ) : view === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rows.map((p) => (
            <div key={p.id} className="surface group overflow-hidden">
              <button type="button" onClick={() => setDetail(p)} className="block w-full"><ProductSwatch hue={p.imageHue} size="lg" className="rounded-none border-0 border-b" /></button>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0"><div className="text-[11px] uppercase tracking-wider text-muted-foreground">{p.reference} · {p.collection}</div><div className="truncate font-medium">{p.name}</div></div>
                  <Actions p={p} />
                </div>
                <div className="mt-2 line-clamp-2 text-xs text-muted-foreground">{p.description}</div>
                <div className="mt-3 flex items-center justify-between">
                  <div><span className="text-lg font-semibold">{fmtMoney(p.price)}</span><span className="text-xs text-muted-foreground"> / {p.unit}</span></div>
                  <StatusBadge status={p.status} />
                </div>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className={cn(p.minStock > 0 && p.stock <= p.minStock ? "text-warning font-medium" : "text-muted-foreground")}>Stock : {p.stock} {p.unit}</span>
                  <span className="text-muted-foreground">Marge {margin(p)} %</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="surface overflow-x-auto">
          <Table>
            <TableHeader><TableRow>
              <TableHead className="w-12" /><TableHead><SortHeader label="Réf." field="reference" sort={sort} onSort={onSort} /></TableHead><TableHead><SortHeader label="Nom" field="name" sort={sort} onSort={onSort} /></TableHead>
              <TableHead><SortHeader label="Collection" field="collection" sort={sort} onSort={onSort} /></TableHead><TableHead>Dimensions</TableHead><TableHead>Couleurs</TableHead>
              <TableHead><SortHeader label="Coût" field="cost" sort={sort} onSort={onSort} /></TableHead><TableHead><SortHeader label="Prix" field="price" sort={sort} onSort={onSort} /></TableHead><TableHead>Marge</TableHead>
              <TableHead><SortHeader label="Stock" field="stock" sort={sort} onSort={onSort} /></TableHead><TableHead><SortHeader label="Statut" field="status" sort={sort} onSort={onSort} /></TableHead><TableHead className="w-12" />
            </TableRow></TableHeader>
            <TableBody>
              {rows.map((p) => (
                <TableRow key={p.id}>
                  <TableCell><ProductSwatch hue={p.imageHue} size="sm" /></TableCell><TableCell className="font-mono text-xs">{p.reference}</TableCell><TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>{p.collection}</TableCell><TableCell className="text-muted-foreground">{p.dimensions}</TableCell><TableCell className="text-muted-foreground">{p.colors.join(", ")}</TableCell>
                  <TableCell>{fmtMoney(p.cost)}</TableCell><TableCell className="font-medium">{fmtMoney(p.price)}</TableCell><TableCell className="text-muted-foreground">{margin(p)} %</TableCell>
                  <TableCell className={cn(p.minStock > 0 && p.stock <= p.minStock && "text-warning font-medium")}>{p.stock} {p.unit}</TableCell><TableCell><StatusBadge status={p.status} /></TableCell><TableCell><Actions p={p} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialog.open} onOpenChange={(o) => setDialog((d) => ({ ...d, open: o }))}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{dialog.p ? "Modifier le produit" : "Nouveau produit"}</DialogTitle><DialogDescription>Référence catalogue, tarif et stock.</DialogDescription></DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Référence *"><Input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value.toUpperCase() })} placeholder="ATL-005" />{touched && errs.reference && <span className="text-xs text-destructive">{errs.reference}</span>}</Field>
            <Field label="Nom *"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />{touched && errs.name && <span className="text-xs text-destructive">{errs.name}</span>}</Field>
            <Field label="Collection"><Select value={form.collection} onValueChange={(v) => setForm({ ...form, collection: v as Collection })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{COLLECTIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></Field>
            <Field label="Statut"><Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as ProductStatus })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATUSES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></Field>
            <Field label="Description" className="sm:col-span-2"><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
            <Field label="Dimensions"><Input value={form.dimensions} onChange={(e) => setForm({ ...form, dimensions: e.target.value })} /></Field>
            <Field label="Matière"><Input value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })} /></Field>
            <Field label="Couleurs (séparées par des virgules)" className="sm:col-span-2"><Input value={form.colors} onChange={(e) => setForm({ ...form, colors: e.target.value })} /></Field>
            <Field label="Coût (€)"><Input type="number" min={0} value={form.cost} onChange={(e) => setForm({ ...form, cost: Number(e.target.value) })} /></Field>
            <Field label="Prix de vente (€) *"><Input type="number" min={0} value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />{touched && errs.price && <span className="text-xs text-destructive">{errs.price}</span>}</Field>
            <Field label="Unité"><Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v as Product["unit"] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["m²", "pièce", "ml"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></Field>
            <Field label={`Teinte du visuel (${form.imageHue}°)`}><input type="range" min={0} max={360} value={form.imageHue} onChange={(e) => setForm({ ...form, imageHue: Number(e.target.value) })} className="accent-[var(--color-gold)]" /></Field>
            <Field label="Stock"><Input type="number" min={0} value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} /></Field>
            <Field label="Seuil d'alerte"><Input type="number" min={0} value={form.minStock} onChange={(e) => setForm({ ...form, minStock: Number(e.target.value) })} /></Field>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialog({ open: false })}>Annuler</Button><Button className="bg-gold text-gold-foreground hover:bg-gold/90" onClick={submit} disabled={touched && !valid}>{dialog.p ? "Enregistrer" : "Créer le produit"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-2xl">
          {detail && <>
            <DialogHeader><DialogTitle>{detail.name}</DialogTitle><DialogDescription>{detail.reference} · Collection {detail.collection}</DialogDescription></DialogHeader>
            <ProductSwatch hue={detail.imageHue} size="lg" />
            <p className="text-sm text-muted-foreground">{detail.description}</p>
            <DefinitionList items={[{ label: "Dimensions", value: detail.dimensions }, { label: "Matière", value: detail.material }, { label: "Couleurs", value: detail.colors.join(", ") }, { label: "Unité", value: detail.unit }, { label: "Coût", value: fmtMoney(detail.cost) }, { label: "Prix", value: fmtMoney(detail.price) }, { label: "Marge", value: `${margin(detail)} %` }, { label: "Stock", value: `${detail.stock} ${detail.unit} (seuil ${detail.minStock})` }, { label: "Statut", value: <StatusBadge status={detail.status} /> }, { label: "Utilisé dans", value: `${s.quotes.filter((q) => q.lines.some((l) => l.productId === detail.id)).length} devis · ${s.orders.filter((o) => o.lines.some((l) => l.productId === detail.id)).length} commandes` }]} />
            <DialogFooter><Button variant="outline" onClick={() => { setDialog({ open: true, p: detail }); setDetail(null); }}><Pencil className="h-4 w-4" /> Modifier</Button></DialogFooter>
          </>}
        </DialogContent>
      </Dialog>

      <Dialog open={!!stockDlg} onOpenChange={(o) => !o && setStockDlg(null)}>
        <DialogContent className="max-w-sm">
          {stockDlg && <>
            <DialogHeader><DialogTitle>Mouvement de stock — {stockDlg.p.name}</DialogTitle><DialogDescription>Stock actuel : {stockDlg.p.stock} {stockDlg.p.unit}</DialogDescription></DialogHeader>
            <Field label="Quantité (négatif = sortie)"><Input type="number" value={stockDlg.delta} onChange={(e) => setStockDlg({ ...stockDlg, delta: Number(e.target.value) })} /></Field>
            <Section className="bg-secondary/50 shadow-none"><div className="text-sm">Nouveau stock : <span className="font-semibold">{Math.max(0, stockDlg.p.stock + stockDlg.delta)} {stockDlg.p.unit}</span></div></Section>
            <DialogFooter><Button variant="outline" onClick={() => setStockDlg(null)}>Annuler</Button><Button className="bg-gold text-gold-foreground hover:bg-gold/90" disabled={!stockDlg.delta} onClick={() => { s.adjustStock(stockDlg.p.id, stockDlg.delta); s.log({ agent: "Utilisateur", action: "Mouvement de stock", target: stockDlg.p.name, result: `${stockDlg.delta > 0 ? "+" : ""}${stockDlg.delta} ${stockDlg.p.unit}`, status: "Succès", link: "/produits" }); toast.success("Stock mis à jour."); setStockDlg(null); }}>Valider</Button></DialogFooter>
          </>}
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!del} onOpenChange={(o) => !o && setDel(null)} title={`Supprimer ${del?.name} ?`} onConfirm={() => { if (del) { s.deleteProduct(del.id); toast.success("Élément supprimé."); setDel(null); } }} />
    </div>
  );
}
