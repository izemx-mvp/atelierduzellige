import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { PROSPECT_STAGES, type Prospect, type ProspectStage } from "@/lib/types";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field } from "@/components/shared";

const SOURCES: Prospect["source"][] = ["Site web", "Instagram", "Salon", "Recommandation", "Email", "LinkedIn"];
const empty = { name: "", company: "", country: "", email: "", phone: "", source: "Site web" as Prospect["source"], stage: "Nouveau" as ProspectStage, project: "", estimatedValue: 0, score: 50 };

export function ProspectDialog({ open, onOpenChange, prospect, initial }: { open: boolean; onOpenChange: (o: boolean) => void; prospect?: Prospect | null; initial?: Partial<typeof empty> }) {
  const addProspect = useStore((s) => s.addProspect);
  const updateProspect = useStore((s) => s.updateProspect);
  const [form, setForm] = useState(empty);
  const [touched, setTouched] = useState(false);
  useEffect(() => { if (open) { setForm(prospect ? { name: prospect.name, company: prospect.company, country: prospect.country, email: prospect.email, phone: prospect.phone, source: prospect.source, stage: prospect.stage, project: prospect.project, estimatedValue: prospect.estimatedValue, score: prospect.score } : { ...empty, ...initial }); setTouched(false); } }, [open, prospect, initial]);
  const set = <K extends keyof typeof empty>(k: K) => (v: (typeof empty)[K]) => setForm((f) => ({ ...f, [k]: v }));
  const errs = { name: form.name.trim() ? "" : "Nom requis.", email: /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email) ? "" : "Email invalide.", project: form.project.trim() ? "" : "Projet requis." };
  const valid = !errs.name && !errs.email && !errs.project;
  const submit = () => {
    setTouched(true);
    if (!valid) { toast.error("Veuillez corriger les champs en erreur."); return; }
    if (prospect) { updateProspect(prospect.id, form); toast.success("Modifications enregistrées."); }
    else { addProspect(form); toast.success("Prospect créé avec succès."); }
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>{prospect ? "Modifier le prospect" : "Nouveau prospect"}</DialogTitle><DialogDescription>Renseignez le contact et le projet.</DialogDescription></DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nom du contact *"><Input value={form.name} onChange={(e) => set("name")(e.target.value)} />{touched && errs.name && <span className="text-xs text-destructive">{errs.name}</span>}</Field>
          <Field label="Entreprise"><Input value={form.company} onChange={(e) => set("company")(e.target.value)} /></Field>
          <Field label="Email *"><Input type="email" value={form.email} onChange={(e) => set("email")(e.target.value)} />{touched && errs.email && <span className="text-xs text-destructive">{errs.email}</span>}</Field>
          <Field label="Téléphone"><Input value={form.phone} onChange={(e) => set("phone")(e.target.value)} /></Field>
          <Field label="Pays"><Input value={form.country} onChange={(e) => set("country")(e.target.value)} /></Field>
          <Field label="Source"><Select value={form.source} onValueChange={(v) => set("source")(v as Prospect["source"])}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{SOURCES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Projet *" className="sm:col-span-2"><Input value={form.project} onChange={(e) => set("project")(e.target.value)} placeholder="Ex. Lobby hôtel 5 étoiles Doha" />{touched && errs.project && <span className="text-xs text-destructive">{errs.project}</span>}</Field>
          <Field label="Valeur estimée (€)"><Input type="number" min={0} value={form.estimatedValue} onChange={(e) => set("estimatedValue")(Number(e.target.value))} /></Field>
          <Field label="Étape"><Select value={form.stage} onValueChange={(v) => set("stage")(v as ProspectStage)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PROSPECT_STAGES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></Field>
          <Field label={`Score de qualification : ${form.score}/100`} className="sm:col-span-2"><input type="range" min={0} max={100} value={form.score} onChange={(e) => set("score")(Number(e.target.value))} className="accent-[var(--color-gold)]" /></Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button className="bg-gold text-gold-foreground hover:bg-gold/90" onClick={submit} disabled={touched && !valid}>{prospect ? "Enregistrer" : "Créer le prospect"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
