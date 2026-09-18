import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { MoreHorizontal, Plus, Users, Eye, Pencil, Trash2 } from "lucide-react";
import { useStore, useHydrated, fmtDate } from "@/lib/store";
import type { Client } from "@/lib/types";
import { PageHeader, EmptyState, LoadingBlock, StatusBadge, ConfirmDialog, SearchInput, SortHeader, useSort } from "@/components/shared";
import { ClientDialog } from "@/components/clients/ClientDialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_app/clients/")({
  head: () => ({ meta: [{ title: "Clients — Atelier du Zellige" }, { name: "description", content: "Gestion des clients : liste, fiches, historique, devis et commandes." }, { property: "og:title", content: "Clients — Atelier du Zellige" }, { property: "og:description", content: "Gestion centralisée des clients." }] }),
  component: ClientsPage,
});

type F = "name" | "company" | "country" | "type" | "lastActivity" | "status";

function ClientsPage() {
  const hydrated = useHydrated();
  const navigate = useNavigate();
  const clients = useStore((s) => s.clients);
  const deleteClient = useStore((s) => s.deleteClient);
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [country, setCountry] = useState("all");
  const [dialog, setDialog] = useState<{ open: boolean; client?: Client | null }>({ open: false });
  const [del, setDel] = useState<Client | null>(null);
  const { sort, onSort, sortFn } = useSort<F>("lastActivity");

  const countries = useMemo(() => Array.from(new Set(clients.map((c) => c.country))).sort(), [clients]);
  const rows = useMemo(() => {
    const t = q.toLowerCase();
    const f = clients.filter((c) => (!t || [c.name, c.company, c.email, c.country, c.city].some((x) => x.toLowerCase().includes(t))) && (type === "all" || c.type === type) && (status === "all" || c.status === status) && (country === "all" || c.country === country));
    return sortFn(f, (c, k) => c[k]);
  }, [clients, q, type, status, country, sortFn]);

  if (!hydrated) return <LoadingBlock />;

  return (
    <div>
      <PageHeader eyebrow="ERP" title="Clients" description={`${clients.length} clients · ${clients.filter((c) => c.status === "VIP").length} VIP`}
        actions={<Button className="bg-gold text-gold-foreground hover:bg-gold/90" onClick={() => setDialog({ open: true, client: null })}><Plus className="h-4 w-4" /> Nouveau client</Button>} />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchInput value={q} onChange={setQ} placeholder="Nom, entreprise, email, pays…" className="w-full md:w-80" />
        <Select value={type} onValueChange={setType}><SelectTrigger className="w-44 bg-card"><SelectValue placeholder="Type" /></SelectTrigger><SelectContent><SelectItem value="all">Tous les types</SelectItem>{["Architecte", "Décorateur", "Particulier", "Revendeur", "Promoteur", "Hôtel"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
        <Select value={status} onValueChange={setStatus}><SelectTrigger className="w-40 bg-card"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Tous statuts</SelectItem>{["Actif", "VIP", "Inactif"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
        <Select value={country} onValueChange={setCountry}><SelectTrigger className="w-44 bg-card"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Tous pays</SelectItem>{countries.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
        {(q || type !== "all" || status !== "all" || country !== "all") && <Button variant="ghost" size="sm" onClick={() => { setQ(""); setType("all"); setStatus("all"); setCountry("all"); }}>Réinitialiser</Button>}
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={Users} title={clients.length ? "Aucun client ne correspond" : "Aucun client"} description={clients.length ? "Modifiez vos filtres ou votre recherche." : "Créez votre premier client pour démarrer."} action={<Button className="bg-gold text-gold-foreground hover:bg-gold/90" onClick={() => setDialog({ open: true, client: null })}><Plus className="h-4 w-4" /> Créer un client</Button>} />
      ) : (
        <div className="surface overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><SortHeader label="Nom" field="name" sort={sort} onSort={onSort} /></TableHead>
                <TableHead><SortHeader label="Entreprise" field="company" sort={sort} onSort={onSort} /></TableHead>
                <TableHead><SortHeader label="Pays" field="country" sort={sort} onSort={onSort} /></TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead><SortHeader label="Type" field="type" sort={sort} onSort={onSort} /></TableHead>
                <TableHead><SortHeader label="Dernière activité" field="lastActivity" sort={sort} onSort={onSort} /></TableHead>
                <TableHead><SortHeader label="Statut" field="status" sort={sort} onSort={onSort} /></TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((c) => (
                <TableRow key={c.id} className="cursor-pointer" onClick={() => navigate({ to: "/clients/$id", params: { id: c.id } })}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-muted-foreground">{c.company}</TableCell>
                  <TableCell>{c.country}</TableCell>
                  <TableCell className="text-muted-foreground">{c.email}</TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">{c.phone}</TableCell>
                  <TableCell>{c.type}</TableCell>
                  <TableCell className="text-muted-foreground">{fmtDate(c.lastActivity)}</TableCell>
                  <TableCell><StatusBadge status={c.status} /></TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild><Link to="/clients/$id" params={{ id: c.id }}><Eye className="h-4 w-4" /> Voir la fiche</Link></DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDialog({ open: true, client: c })}><Pencil className="h-4 w-4" /> Modifier</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDel(c)}><Trash2 className="h-4 w-4" /> Supprimer</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ClientDialog open={dialog.open} onOpenChange={(o) => setDialog((d) => ({ ...d, open: o }))} client={dialog.client} />
      <ConfirmDialog open={!!del} onOpenChange={(o) => !o && setDel(null)} title={`Supprimer ${del?.name} ?`} onConfirm={() => { if (del) { deleteClient(del.id); toast.success("Élément supprimé."); setDel(null); } }} />
    </div>
  );
}
