import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Sparkles, Loader2, CalendarCheck, Check, X, Bell, ArrowRightLeft, Clock } from "lucide-react";
import { useStore, useHydrated, fmtDateTime, contactName } from "@/lib/store";
import { proposeSlots } from "@/lib/agents";
import type { Appointment } from "@/lib/types";
import { PageHeader, LoadingBlock, StatusBadge, Section, KpiCard, Field } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { CalendarWorkspace } from "@/components/appointments/CalendarWorkspace";

export const Route = createFileRoute("/_app/agents/booking")({
  head: () => ({ meta: [{ title: "Agent Prise de rendez-vous — Atelier du Zellige" }, { name: "description", content: "Booking Center : analyse des demandes, proposition de créneaux, confirmation, déplacement et rappels." }, { property: "og:title", content: "Agent Prise de rendez-vous" }, { property: "og:description", content: "Booking Center piloté par IA." }] }),
  component: BookingPage,
});

const SAMPLE = "Bonjour, je souhaiterais visiter votre showroom la semaine prochaine, idéalement en fin de matinée, pour voir les panneaux de la collection Fès. Nous serons deux. Merci, Aisha Rahman.";

function BookingPage() {
  const hydrated = useHydrated();
  const s = useStore();
  const [req, setReq] = useState(SAMPLE);
  const [contactType, setContactType] = useState<"prospect" | "client">("prospect");
  const [contactId, setContactId] = useState("p3");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<{ type: Appointment["type"]; duration: number; preference: string; participants: number; slots: { start: string; end: string }[] } | null>(null);
  const [moving, setMoving] = useState<{ a: Appointment; slots: { start: string; end: string }[] } | null>(null);
  if (!hydrated) return <LoadingBlock />;

  const contacts = contactType === "client" ? s.clients : s.prospects;
  const analyze = async () => {
    if (!req.trim()) return toast.error("Collez une demande à analyser.");
    setLoading(true); await new Promise((r) => setTimeout(r, 1000));
    const t = req.toLowerCase();
    const type: Appointment["type"] = /showroom|visite/.test(t) ? "Visite showroom" : /site|chantier|relev/.test(t) ? "Sur site" : /appel|téléphone|call/.test(t) ? "Appel" : "Visio";
    const pref = /matin/.test(t) ? "Matin" : /après-midi|apres-midi|afternoon/.test(t) ? "Après-midi" : "Indifférent";
    let slots = proposeSlots(s, 6);
    if (pref === "Matin") slots = slots.filter((x) => new Date(x.start).getHours() < 13); if (pref === "Après-midi") slots = slots.filter((x) => new Date(x.start).getHours() >= 13);
    const res = { type, duration: type === "Visite showroom" ? 90 : type === "Sur site" ? 180 : 45, preference: pref, participants: /deux|2 personnes|two/.test(t) ? 2 : 1, slots: slots.slice(0, 4) };
    setAnalysis(res); setLoading(false);
    s.log({ agent: "Prise de rendez-vous", action: "Analyse de demande", target: contactName(s, contactType, contactId), result: `${type} · ${res.slots.length} créneaux proposés`, status: "Succès", link: "/agents/booking" });
    toast.success("Demande analysée, créneaux proposés.");
  };
  const book = (slot: { start: string; end: string }) => {
    if (!analysis) return; const name = contactName(s, contactType, contactId).split(" · ")[0];
    const end = new Date(new Date(slot.start).getTime() + analysis.duration * 60000).toISOString();
    s.addAppointment({ title: `${analysis.type} — ${name}`, contactType, contactId, start: slot.start, end, type: analysis.type, status: "Confirmé", participants: [s.settings.profile.name, name], notes: `Réservé par l'agent IA. Demande : « ${req.slice(0, 120)}… »` });
    if (contactType === "prospect") { const p = s.prospects.find((x) => x.id === contactId); if (p && p.stage === "Nouveau") s.moveProspect(p.id, "Contacté"); }
    s.addMessage({ direction: "out", channel: "Email", contactType, contactId, fromName: s.settings.profile.name, fromEmail: s.settings.profile.email, subject: `Confirmation de rendez-vous — ${fmtDateTime(slot.start)}`, body: `Bonjour ${name.split(" ")[0]},\n\nVotre ${analysis.type.toLowerCase()} est confirmé le ${fmtDateTime(slot.start)}. Vous recevrez un rappel 24h et 1h avant.\n\nÀ très bientôt,\n${s.settings.profile.name}` });
    s.log({ agent: "Prise de rendez-vous", action: "Confirmation", target: name, result: fmtDateTime(slot.start), status: "Succès", link: "/rendez-vous" });
    setAnalysis(null); toast.success("Rendez-vous confirmé et ajouté au calendrier.");
  };
  const confirm = (a: Appointment) => { s.updateAppointment(a.id, { status: "Confirmé" }); s.log({ agent: "Prise de rendez-vous", action: "Confirmation", target: a.title, result: "Confirmé", status: "Succès", link: "/rendez-vous" }); toast.success("Rendez-vous confirmé."); };
  const cancel = (a: Appointment) => { s.updateAppointment(a.id, { status: "Annulé" }); s.log({ agent: "Prise de rendez-vous", action: "Annulation", target: a.title, result: "Annulé", status: "Succès", link: "/rendez-vous" }); toast.success("Rendez-vous annulé."); };
  const move = (a: Appointment, slot: { start: string; end: string }) => { const dur = new Date(a.end).getTime() - new Date(a.start).getTime(); s.updateAppointment(a.id, { start: slot.start, end: new Date(new Date(slot.start).getTime() + dur).toISOString(), reminders: a.reminders.map((r) => ({ ...r, sent: false })) }); s.log({ agent: "Prise de rendez-vous", action: "Déplacement", target: a.title, result: fmtDateTime(slot.start), status: "Succès", link: "/rendez-vous" }); setMoving(null); toast.success("Rendez-vous déplacé."); };
  const remind = (a: Appointment, at: "24h" | "1h") => { s.updateAppointment(a.id, { reminders: a.reminders.map((r) => (r.at === at ? { ...r, sent: true } : r)) }); s.notify({ title: `Rappel ${at} — ${a.title}`, description: `Rappel envoyé (simulé) à ${a.participants.join(", ")}.`, link: "/rendez-vous", severity: "info" }); s.log({ agent: "Prise de rendez-vous", action: `Rappel ${at}`, target: a.title, result: "Envoyé (simulé)", status: "Succès", link: "/rendez-vous" }); toast.success(`Rappel ${at} envoyé (simulé).`); };

  const upcoming = [...s.appointments].filter((a) => new Date(a.end) >= new Date() && a.status !== "Annulé").sort((a, b) => a.start.localeCompare(b.start));
  const agentLogs = s.activities.filter((a) => a.agent === "Prise de rendez-vous");

  return (
    <div>
      <PageHeader eyebrow="Agent IA" title="Agent Prise de rendez-vous" description="Demandes, réservations et agenda global réunis dans un seul espace." />
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label="À venir" value={upcoming.length} icon={CalendarCheck} accent />
        <KpiCard label="À confirmer" value={s.appointments.filter((a) => a.status === "Proposé").length} icon={Clock} />
        <KpiCard label="Rappels envoyés" value={s.appointments.reduce((n, a) => n + a.reminders.filter((r) => r.sent).length, 0)} icon={Bell} />
        <KpiCard label="Réservations IA" value={agentLogs.filter((a) => a.action === "Confirmation").length} icon={Sparkles} />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Section title="Analyser une demande" description="Collez un email ou un message reçu">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Type de contact"><Select value={contactType} onValueChange={(v) => { setContactType(v as "client" | "prospect"); setContactId((v === "client" ? s.clients[0]?.id : s.prospects[0]?.id) ?? ""); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="prospect">Prospect</SelectItem><SelectItem value="client">Client</SelectItem></SelectContent></Select></Field>
              <Field label="Contact"><Select value={contactId} onValueChange={setContactId}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{contacts.map((c) => <SelectItem key={c.id} value={c.id}>{c.name} · {c.company}</SelectItem>)}</SelectContent></Select></Field>
            </div>
            <Field label="Demande"><Textarea rows={5} value={req} onChange={(e) => setReq(e.target.value)} /></Field>
            <Button className="w-full bg-gold text-gold-foreground hover:bg-gold/90" onClick={analyze} disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Analyser et proposer des créneaux</Button>
          </div>
          {analysis && (
            <div className="mt-4 rounded-md border border-gold/40 bg-gold-soft/40 p-4">
              <div className="mb-2 flex flex-wrap gap-2 text-xs"><span className="rounded border bg-card px-2 py-0.5">Type : <b>{analysis.type}</b></span><span className="rounded border bg-card px-2 py-0.5">Durée : <b>{analysis.duration} min</b></span><span className="rounded border bg-card px-2 py-0.5">Préférence : <b>{analysis.preference}</b></span><span className="rounded border bg-card px-2 py-0.5">Participants : <b>{analysis.participants}</b></span></div>
              <div className="mb-2 text-sm font-medium">Créneaux disponibles (sans conflit avec l'agenda) :</div>
              <div className="grid gap-2 sm:grid-cols-2">{analysis.slots.map((sl) => <Button key={sl.start} variant="outline" className="h-auto justify-between bg-card py-2" onClick={() => book(sl)}><span className="text-sm capitalize">{new Date(sl.start).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</span><span className="text-xs text-muted-foreground">{new Date(sl.start).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span><Check className="h-4 w-4 text-gold" /></Button>)}</div>
              {analysis.slots.length === 0 && <p className="text-sm text-muted-foreground">Aucun créneau correspondant à la préférence sur 2 semaines.</p>}
            </div>
          )}
        </Section>

        <Section title="Rendez-vous à venir" description="Confirmer · Déplacer · Annuler · Rappels" noPadding>
          <ul className="max-h-[520px] divide-y overflow-y-auto">
            {upcoming.length === 0 && <li className="p-8 text-center text-sm text-muted-foreground">Aucun rendez-vous à venir.</li>}
            {upcoming.map((a) => (
              <li key={a.id} className="px-4 py-3">
                <div className="flex flex-wrap items-center gap-2"><div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{a.title}</div><div className="text-xs text-muted-foreground">{fmtDateTime(a.start)} · {a.type}</div></div><StatusBadge status={a.status} /></div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {a.status === "Proposé" && <Button size="sm" className="h-7 bg-gold text-xs text-gold-foreground hover:bg-gold/90" onClick={() => confirm(a)}><Check className="h-3.5 w-3.5" /> Confirmer</Button>}
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setMoving(moving?.a.id === a.id ? null : { a, slots: proposeSlots(s, 4) })}><ArrowRightLeft className="h-3.5 w-3.5" /> Déplacer</Button>
                  {a.reminders.map((r) => <Button key={r.at} size="sm" variant="outline" className={cn("h-7 text-xs", r.sent && "text-success")} disabled={r.sent} onClick={() => remind(a, r.at)}><Bell className="h-3.5 w-3.5" /> {r.sent ? `Rappel ${r.at} envoyé` : `Rappel ${r.at}`}</Button>)}
                  <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={() => cancel(a)}><X className="h-3.5 w-3.5" /> Annuler</Button>
                </div>
                {moving?.a.id === a.id && <div className="mt-2 grid gap-1 rounded-md border bg-secondary/40 p-2 sm:grid-cols-2">{moving.slots.map((sl) => <Button key={sl.start} size="sm" variant="outline" className="h-8 justify-start bg-card text-xs" onClick={() => move(a, sl)}>{fmtDateTime(sl.start)}</Button>)}</div>}
              </li>
            ))}
          </ul>
        </Section>
      </div>
      <div className="mt-4"><CalendarWorkspace /></div>
      <Section title="Historique de l'agent" className="mt-4" noPadding>
        <ul className="divide-y">{agentLogs.slice(0, 8).map((l) => <li key={l.id} className="flex items-center gap-3 px-5 py-2.5 text-sm"><span className="w-28 text-xs text-muted-foreground">{fmtDateTime(l.date)}</span><span className="font-medium">{l.action}</span><span className="flex-1 truncate text-muted-foreground">{l.target} — {l.result}</span><StatusBadge status={l.status} /></li>)}{agentLogs.length === 0 && <li className="p-6 text-center text-sm text-muted-foreground">Aucune activité.</li>}</ul>
      </Section>
    </div>
  );
}
