import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import type { Appointment, AppointmentStatus } from "@/lib/types";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field } from "@/components/shared";

const TYPES: Appointment["type"][] = ["Visite showroom", "Visio", "Appel", "Sur site"];
const STATUSES: AppointmentStatus[] = ["Proposé", "Confirmé", "Terminé", "Annulé"];
const toLocal = (iso: string) => { const d = new Date(iso); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); };

export function AppointmentDialog({ open, onOpenChange, appointment, initialStart }: { open: boolean; onOpenChange: (o: boolean) => void; appointment?: Appointment | null; initialStart?: string }) {
  const s = useStore();
  const [f, setF] = useState({ title: "", contactType: "none" as "none" | "client" | "prospect", contactId: "", start: "", end: "", type: "Visio" as Appointment["type"], status: "Proposé" as AppointmentStatus, participants: "", notes: "" });
  useEffect(() => {
    if (!open) return;
    if (appointment) setF({ title: appointment.title, contactType: appointment.contactType ?? "none", contactId: appointment.contactId ?? "", start: toLocal(appointment.start), end: toLocal(appointment.end), type: appointment.type, status: appointment.status, participants: appointment.participants.join(", "), notes: appointment.notes });
    else { const st = initialStart ? new Date(initialStart) : (() => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(10, 0, 0, 0); return d; })(); const en = new Date(st); en.setHours(st.getHours() + 1); setF({ title: "", contactType: "none", contactId: "", start: toLocal(st.toISOString()), end: toLocal(en.toISOString()), type: "Visio", status: "Proposé", participants: s.settings.profile.name, notes: "" }); }
  }, [open, appointment, initialStart, s.settings.profile.name]);
  const contacts = f.contactType === "client" ? s.clients : f.contactType === "prospect" ? s.prospects : [];
  const valid = f.title.trim() && f.start && f.end && new Date(f.end) > new Date(f.start);
  const submit = () => {
    if (!valid) return toast.error("Titre et créneau valide requis.");
    const payload = { title: f.title.trim(), contactType: f.contactType === "none" ? undefined : f.contactType, contactId: f.contactType === "none" ? undefined : f.contactId || undefined, start: new Date(f.start).toISOString(), end: new Date(f.end).toISOString(), type: f.type, status: f.status, participants: f.participants.split(",").map((x) => x.trim()).filter(Boolean), notes: f.notes };
    if (appointment) { s.updateAppointment(appointment.id, payload); toast.success("Modifications enregistrées."); }
    else { s.addAppointment(payload); toast.success("Rendez-vous créé avec succès."); }
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>{appointment ? "Modifier le rendez-vous" : "Nouveau rendez-vous"}</DialogTitle><DialogDescription>Le calendrier global est mis à jour automatiquement.</DialogDescription></DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Titre *" className="sm:col-span-2"><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
          <Field label="Type"><Select value={f.type} onValueChange={(v) => setF({ ...f, type: v as Appointment["type"] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Statut"><Select value={f.status} onValueChange={(v) => setF({ ...f, status: v as AppointmentStatus })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATUSES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Début"><Input type="datetime-local" value={f.start} onChange={(e) => { const st = e.target.value; const en = new Date(st); en.setHours(en.getHours() + 1); setF({ ...f, start: st, end: toLocal(en.toISOString()) }); }} /></Field>
          <Field label="Fin"><Input type="datetime-local" value={f.end} onChange={(e) => setF({ ...f, end: e.target.value })} /></Field>
          <Field label="Contact lié"><Select value={f.contactType} onValueChange={(v) => setF({ ...f, contactType: v as typeof f.contactType, contactId: "" })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Aucun</SelectItem><SelectItem value="client">Client</SelectItem><SelectItem value="prospect">Prospect</SelectItem></SelectContent></Select></Field>
          <Field label="Nom"><Select value={f.contactId} onValueChange={(v) => setF({ ...f, contactId: v })} disabled={f.contactType === "none"}><SelectTrigger><SelectValue placeholder="—" /></SelectTrigger><SelectContent>{contacts.map((c) => <SelectItem key={c.id} value={c.id}>{c.name} · {c.company}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Participants (séparés par des virgules)" className="sm:col-span-2"><Input value={f.participants} onChange={(e) => setF({ ...f, participants: e.target.value })} /></Field>
          <Field label="Notes" className="sm:col-span-2"><Textarea rows={2} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></Field>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button><Button className="bg-gold text-gold-foreground hover:bg-gold/90" onClick={submit} disabled={!valid}>{appointment ? "Enregistrer" : "Créer"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
