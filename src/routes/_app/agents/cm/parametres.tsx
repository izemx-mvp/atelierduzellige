import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Instagram, Facebook, Music2, RefreshCw, Link2, Unlink, Save, Loader2, AlertTriangle, Check } from "lucide-react";
import { useStore, useHydrated, fmtDateTime } from "@/lib/store";
import type { CMSettings, Network } from "@/lib/types";
import { PageHeader, LoadingBlock, Section, Field } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/agents/cm/parametres")({
  head: () => ({ meta: [{ title: "CM — Paramètres — Atelier du Zellige" }, { name: "description", content: "Comptes sociaux, automatisations, répartition des contenus, fréquence et brand voice." }, { property: "og:title", content: "Community Manager — Paramètres" }, { property: "og:description", content: "Configuration de l'agent Community Manager." }] }),
  component: CMSettingsPage,
});

const ICONS: Record<Network, typeof Instagram> = { Instagram, Facebook, TikTok: Music2 };
const MIX: { key: keyof CMSettings["mix"]; label: string }[] = [{ key: "produits", label: "Produits" }, { key: "inspiration", label: "Inspiration" }, { key: "savoirFaire", label: "Savoir-faire" }, { key: "coulisses", label: "Coulisses" }, { key: "promotion", label: "Promotion" }];
const ALL_DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const ALL_HOURS = ["08:00", "09:00", "10:00", "12:00", "13:00", "17:00", "18:00", "19:00", "20:00"];

function CMSettingsPage() {
  const hydrated = useHydrated();
  const cm = useStore((s) => s.cmSettings);
  const update = useStore((s) => s.updateCMSettings);
  const log = useStore((s) => s.log);
  const [f, setF] = useState<CMSettings>(cm);
  const [busy, setBusy] = useState<string | null>(null);
  useEffect(() => { setF(cm); }, [cm]);
  if (!hydrated) return <LoadingBlock />;

  const total = Object.values(f.mix).reduce((a, b) => a + b, 0);
  const dirty = JSON.stringify(f) !== JSON.stringify(cm);
  const save = () => { if (total !== 100) return toast.error("La répartition des contenus doit totaliser 100 %."); update(f); log({ agent: "Community Manager", action: "Paramètres mis à jour", target: "Configuration CM", result: `${f.postsPerWeek} publications/semaine`, status: "Succès", link: "/agents/cm/parametres" }); toast.success("Modifications enregistrées."); };
  const toggleAccount = async (n: Network) => { setBusy(n); await new Promise((r) => setTimeout(r, 900)); const acc = cm.accounts.find((a) => a.network === n)!; update({ accounts: cm.accounts.map((a) => (a.network === n ? { ...a, connected: !a.connected, lastSync: !a.connected ? new Date().toISOString() : a.lastSync } : a)) }); setBusy(null); toast.success(acc.connected ? `${n} déconnecté.` : `${n} connecté (simulé).`); };
  const sync = async (n: Network) => { setBusy(n + "sync"); await new Promise((r) => setTimeout(r, 900)); update({ accounts: cm.accounts.map((a) => (a.network === n ? { ...a, lastSync: new Date().toISOString() } : a)) }); setBusy(null); toast.success(`${n} synchronisé.`); };
  const setMix = (k: keyof CMSettings["mix"], v: number) => setF({ ...f, mix: { ...f.mix, [k]: v } });
  const autoBalance = () => { const keys = MIX.map((m) => m.key); const cur = keys.map((k) => f.mix[k]); const sum = cur.reduce((a, b) => a + b, 0) || 1; const scaled = cur.map((v) => Math.round((v / sum) * 100)); const diff = 100 - scaled.reduce((a, b) => a + b, 0); scaled[0] += diff; setF({ ...f, mix: Object.fromEntries(keys.map((k, i) => [k, scaled[i]])) as CMSettings["mix"] }); };
  const toggleIn = (arr: string[], v: string) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  return (
    <div>
      <PageHeader eyebrow="Agent IA · Community Manager" title="CM — Paramètres" description="Comptes, automatisations, répartition et brand voice de l'agent."
        actions={<Button className="bg-gold text-gold-foreground hover:bg-gold/90" onClick={save} disabled={!dirty || total !== 100}><Save className="h-4 w-4" /> Enregistrer</Button>} />
      <div className="grid gap-4 xl:grid-cols-2">
        <Section title="Comptes sociaux" description="Connexion simulée dans le MVP">
          <ul className="space-y-3">
            {cm.accounts.map((a) => { const Icon = ICONS[a.network]; return (
              <li key={a.network} className="flex flex-wrap items-center gap-3 rounded-md border p-3">
                <span className={cn("flex h-9 w-9 items-center justify-center rounded-md", a.connected ? "bg-gold text-gold-foreground" : "bg-secondary text-muted-foreground")}><Icon className="h-4 w-4" /></span>
                <div className="min-w-0 flex-1"><div className="text-sm font-medium">{a.network} <span className="text-muted-foreground">· {a.handle}</span></div><div className="text-xs text-muted-foreground">{a.connected ? <><span className="text-success">● Connecté</span> · Dernière synchro {fmtDateTime(a.lastSync)}</> : <span>○ Non connecté</span>}</div></div>
                {a.connected && <Button size="sm" variant="outline" className="h-8" onClick={() => sync(a.network)} disabled={busy === a.network + "sync"}>{busy === a.network + "sync" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} Synchroniser</Button>}
                <Button size="sm" variant={a.connected ? "ghost" : "default"} className={cn("h-8", !a.connected && "bg-charcoal text-charcoal-foreground hover:bg-charcoal/90")} onClick={() => toggleAccount(a.network)} disabled={busy === a.network}>{busy === a.network ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : a.connected ? <Unlink className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />} {a.connected ? "Déconnecter" : "Connecter"}</Button>
              </li>
            ); })}
          </ul>
        </Section>

        <Section title="Automatisations">
          <ul className="divide-y">
            {([["autoPublish", "Publication automatique", "Publie les contenus planifiés sans validation manuelle"], ["autoHashtags", "Génération automatique de hashtags", "Ajoute les hashtags de marque et de collection"], ["autoTranslate", "Traductions automatiques", "Propose des versions EN / AR de chaque contenu"], ["reminders", "Rappels", "Rappel avant chaque publication planifiée"], ["humanValidation", "Validation humaine obligatoire", "Aucune action de l'agent sans votre accord"]] as const).map(([k, l, d]) => (
              <li key={k} className="flex items-center justify-between gap-4 py-3"><div><div className="text-sm font-medium">{l}</div><div className="text-xs text-muted-foreground">{d}</div></div><Switch checked={f[k]} onCheckedChange={(v) => setF({ ...f, [k]: v })} /></li>
            ))}
          </ul>
          {f.autoPublish && f.humanValidation && <p className="mt-2 flex items-center gap-1 text-xs text-warning"><AlertTriangle className="h-3.5 w-3.5" /> La validation humaine prime : la publication automatique restera en attente d'approbation.</p>}
        </Section>

        <Section title="Répartition des contenus" description="Le total doit être égal à 100 %" actions={<span className={cn("rounded-md px-2 py-1 text-sm font-semibold", total === 100 ? "bg-success/12 text-success" : "bg-destructive/10 text-destructive")}>{total} %</span>}>
          <div className="space-y-4">
            {MIX.map((m) => (
              <div key={m.key}><div className="mb-1.5 flex justify-between text-sm"><span>{m.label}</span><span className="font-medium">{f.mix[m.key]} %</span></div><Slider value={[f.mix[m.key]]} min={0} max={100} step={5} onValueChange={([v]) => setMix(m.key, v ?? 0)} className="[&_[role=slider]]:border-gold [&_[data-orientation=horizontal]>span]:bg-gold" /></div>
            ))}
            <div className="flex h-2 overflow-hidden rounded-full bg-secondary">{MIX.map((m, i) => <div key={m.key} style={{ width: `${f.mix[m.key]}%`, opacity: 1 - i * 0.15 }} className="bg-gold" />)}</div>
            {total !== 100 && <div className="flex items-center justify-between rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"><span><AlertTriangle className="mr-1 inline h-3.5 w-3.5" />Total {total} % — la sauvegarde est bloquée.</span><Button size="sm" variant="outline" className="h-7" onClick={autoBalance}>Rééquilibrer à 100 %</Button></div>}
            {total === 100 && <p className="text-xs text-success"><Check className="mr-1 inline h-3.5 w-3.5" />Répartition valide.</p>}
          </div>
        </Section>

        <Section title="Fréquence & Brand Voice">
          <div className="space-y-4">
            <Field label={`Publications par semaine : ${f.postsPerWeek}`}><Slider value={[f.postsPerWeek]} min={1} max={14} step={1} onValueChange={([v]) => setF({ ...f, postsPerWeek: v ?? 1 })} /></Field>
            <Field label="Jours autorisés"><div className="flex flex-wrap gap-1.5">{ALL_DAYS.map((d) => <button type="button" key={d} onClick={() => setF({ ...f, allowedDays: toggleIn(f.allowedDays, d) })} className={cn("rounded-md border px-2.5 py-1 text-xs", f.allowedDays.includes(d) ? "border-gold bg-gold-soft font-medium" : "text-muted-foreground")}>{d.slice(0, 3)}</button>)}</div></Field>
            <Field label="Horaires autorisés"><div className="flex flex-wrap gap-1.5">{ALL_HOURS.map((h) => <button type="button" key={h} onClick={() => setF({ ...f, allowedHours: toggleIn(f.allowedHours, h).sort() })} className={cn("rounded-md border px-2.5 py-1 text-xs", f.allowedHours.includes(h) ? "border-gold bg-gold-soft font-medium" : "text-muted-foreground")}>{h}</button>)}</div></Field>
            <Field label="Ton de la marque"><Textarea rows={2} value={f.brandTone} onChange={(e) => setF({ ...f, brandTone: e.target.value })} /></Field>
            <Field label="À mentionner"><Textarea rows={2} value={f.mustMention} onChange={(e) => setF({ ...f, mustMention: e.target.value })} /></Field>
            <Field label="À éviter"><Textarea rows={2} value={f.mustAvoid} onChange={(e) => setF({ ...f, mustAvoid: e.target.value })} /></Field>
            <Field label="Hashtags de marque"><Input value={f.hashtags} onChange={(e) => setF({ ...f, hashtags: e.target.value })} /></Field>
          </div>
        </Section>
      </div>
      {dirty && <div className="sticky bottom-4 mt-4 flex items-center justify-between rounded-md border bg-card px-4 py-3 shadow-elevated"><span className="text-sm text-muted-foreground">Modifications non enregistrées{total !== 100 ? " — répartition invalide" : ""}.</span><div className="flex gap-2"><Button variant="ghost" onClick={() => setF(cm)}>Annuler</Button><Button className="bg-gold text-gold-foreground hover:bg-gold/90" onClick={save} disabled={total !== 100}><Save className="h-4 w-4" /> Enregistrer</Button></div></div>}
    </div>
  );
}
