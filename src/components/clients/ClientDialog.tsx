import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import type { Client, ClientType, ClientStatus } from "@/lib/types";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field } from "@/components/shared";

const TYPES: ClientType[] = ["Architecte", "Décorateur", "Particulier", "Revendeur", "Promoteur", "Hôtel"];
const STATUSES: ClientStatus[] = ["Actif", "VIP", "Inactif"];
const empty = { name: "", company: "", country: "", city: "", address: "", email: "", phone: "", type: "Architecte" as ClientType, status: "Actif" as ClientStatus, notes: "" };

export function ClientDialog({ open, onOpenChange, client, onSaved }: { open: boolean; onOpenChange: (o: boolean) => void; client?: Client | null; onSaved?: (c: Client) => void }) {
  const addClient = useStore((s) => s.addClient);
  const updateClient = useStore((s) => s.updateClient);
  const [form, setForm] = useState(empty);
  const [touched, setTouched] = useState(false);
  useEffect(() => { if (open) { setForm(client ? { name: client.name, company: client.company, country: client.country, city: client.city, address: client.address, email: client.email, phone: client.phone, type: client.type, status: client.status, notes: client.notes } : empty); setTouched(false); } }, [open, client]);
  const set = (k: keyof typeof empty) => (v: string) => setForm((f) => ({ ...f, [k]: v }));
  const errs = { name: form.name.trim() ? "" : "Nom requis.", email: /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email) ? "" : "Email invalide.", country: form.country.trim() ? "" : "Pays requis." };
  const valid = !errs.name && !errs.email && !errs.country;
  const submit = () => {
    setTouched(true);
    if (!valid) { toast.error("Veuillez corriger les champs en erreur."); return; }
    if (client) { updateClient(client.id, form); toast.success("Modifications enregistrées."); onSaved?.({ ...client, ...form }); }
    else { const c = addClient(form); toast.success("Client créé avec succès."); onSaved?.(c); }
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>{client ? "Modifier le client" : "Nouveau client"}</DialogTitle><DialogDescription>Informations générales et coordonnées.</DialogDescription></DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nom du contact *"><Input value={form.name} onChange={(e) => set("name")(e.target.value)} />{touched && errs.name && <span className="text-xs text-destructive">{errs.name}</span>}</Field>
          <Field label="Entreprise"><Input value={form.company} onChange={(e) => set("company")(e.target.value)} /></Field>
          <Field label="Email *"><Input type="email" value={form.email} onChange={(e) => set("email")(e.target.value)} />{touched && errs.email && <span className="text-xs text-destructive">{errs.email}</span>}</Field>
          <Field label="Téléphone"><Input value={form.phone} onChange={(e) => set("phone")(e.target.value)} /></Field>
          <Field label="Pays *"><Input value={form.country} onChange={(e) => set("country")(e.target.value)} />{touched && errs.country && <span className="text-xs text-destructive">{errs.country}</span>}</Field>
          <Field label="Ville"><Input value={form.city} onChange={(e) => set("city")(e.target.value)} /></Field>
          <Field label="Adresse" className="sm:col-span-2"><Input value={form.address} onChange={(e) => set("address")(e.target.value)} /></Field>
          <Field label="Type de client"><Select value={form.type} onValueChange={(v) => set("type")(v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Statut"><Select value={form.status} onValueChange={(v) => set("status")(v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATUSES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Notes" className="sm:col-span-2"><Textarea rows={3} value={form.notes} onChange={(e) => set("notes")(e.target.value)} /></Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button className="bg-gold text-gold-foreground hover:bg-gold/90" onClick={submit} disabled={touched && !valid}>{client ? "Enregistrer" : "Créer le client"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
