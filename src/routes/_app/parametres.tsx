import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Sun, Moon, Save, RotateCcw, LogOut, Database, Check } from "lucide-react";
import { useStore, useHydrated } from "@/lib/store";
import type { AppSettings } from "@/lib/types";
import { PageHeader, LoadingBlock, Section, Field, ConfirmDialog } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/parametres")({
  head: () => ({ meta: [{ title: "Paramètres — Atelier du Zellige" }, { name: "description", content: "Profil, apparence (light / dark), notifications et données de démonstration." }, { property: "og:title", content: "Paramètres — Atelier du Zellige" }, { property: "og:description", content: "Paramètres globaux de l'application." }] }),
  component: SettingsPage,
});

const NOTIFS: { k: keyof AppSettings["notifications"]; l: string; d: string }[] = [{ k: "inApp", l: "Notifications dans l'application", d: "Centre de notifications du header" }, { k: "email", l: "Résumé par email", d: "Récapitulatif quotidien (simulé)" }, { k: "orders", l: "Commandes", d: "Retards, blocages, changements de statut" }, { k: "quotes", l: "Devis", d: "Validations, expirations" }, { k: "appointments", l: "Rendez-vous", d: "Rappels 24h / 1h" }, { k: "agents", l: "Agents IA", d: "Recommandations et actions" }];

function SettingsPage() {
  const hydrated = useHydrated();
  const navigate = useNavigate();
  const s = useStore();
  const [profile, setProfile] = useState(s.settings.profile);
  const [reset, setReset] = useState(false);
  useEffect(() => setProfile(s.settings.profile), [s.settings.profile]);
  if (!hydrated) return <LoadingBlock />;

  const dirty = JSON.stringify(profile) !== JSON.stringify(s.settings.profile);
  const saveProfile = () => { if (!profile.name.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(profile.email)) return toast.error("Nom et email valides requis."); s.updateSettings({ profile: { ...profile, avatarInitials: profile.name.split(" ").map((x) => x[0]).slice(0, 2).join("").toUpperCase() } }); toast.success("Modifications enregistrées."); };
  const doReset = () => { s.resetDemo(); setReset(false); toast.success("Données de démonstration réinitialisées."); navigate({ to: "/dashboard" }); };

  return (
    <div>
      <PageHeader eyebrow="Compte" title="Paramètres" description="Profil, apparence, notifications et données." />
      <div className="grid gap-4 xl:grid-cols-2">
        <Section title="Profil" actions={<Button size="sm" className="bg-gold text-gold-foreground hover:bg-gold/90" onClick={saveProfile} disabled={!dirty}><Save className="h-4 w-4" /> Enregistrer</Button>}>
          <div className="mb-4 flex items-center gap-4"><Avatar className="h-16 w-16"><AvatarFallback className="bg-charcoal text-lg text-charcoal-foreground">{profile.name.split(" ").map((x) => x[0]).slice(0, 2).join("").toUpperCase() || "?"}</AvatarFallback></Avatar><div><div className="font-medium">{profile.name}</div><div className="text-sm text-muted-foreground">{profile.role}</div><div className="mt-1 text-xs text-muted-foreground">Avatar généré à partir des initiales.</div></div></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nom complet"><Input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} /></Field>
            <Field label="Email"><Input type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} /></Field>
            <Field label="Fonction"><Input value={profile.role} onChange={(e) => setProfile({ ...profile, role: e.target.value })} /></Field>
            <Field label="Téléphone"><Input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} /></Field>
          </div>
        </Section>

        <Section title="Apparence" description="Le changement est instantané et persistant">
          <div className="grid grid-cols-2 gap-3">
            {(["light", "dark"] as const).map((t) => (
              <button type="button" key={t} onClick={() => { s.setTheme(t); toast.success(t === "light" ? "Light Mode activé." : "Dark Mode activé."); }} className={cn("flex flex-col items-start gap-3 rounded-lg border p-4 text-left transition-colors hover:border-gold/60", s.settings.theme === t && "border-gold bg-gold-soft/40")}>
                <div className={cn("flex h-20 w-full overflow-hidden rounded-md border", t === "light" ? "bg-[oklch(0.985_0.004_85)]" : "bg-[oklch(0.14_0.006_60)]")}><div className={cn("w-1/4", t === "light" ? "bg-[oklch(0.17_0.007_60)]" : "bg-[oklch(0.12_0.006_60)]")} /><div className="flex-1 space-y-1.5 p-2"><div className={cn("h-2 w-1/2 rounded", t === "light" ? "bg-[oklch(0.9_0.008_80)]" : "bg-[oklch(0.26_0.008_60)]")} /><div className="h-2 w-1/3 rounded bg-gold" /><div className={cn("h-2 w-2/3 rounded", t === "light" ? "bg-[oklch(0.9_0.008_80)]" : "bg-[oklch(0.26_0.008_60)]")} /></div></div>
                <div className="flex w-full items-center justify-between"><span className="flex items-center gap-2 text-sm font-medium">{t === "light" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}{t === "light" ? "Light Mode" : "Dark Mode"}{t === "light" && <span className="text-xs text-muted-foreground">(par défaut)</span>}</span>{s.settings.theme === t && <Check className="h-4 w-4 text-gold" />}</div>
              </button>
            ))}
          </div>
        </Section>

        <Section title="Notifications">
          <ul className="divide-y">{NOTIFS.map((n) => <li key={n.k} className="flex items-center justify-between gap-4 py-3"><div><div className="text-sm font-medium">{n.l}</div><div className="text-xs text-muted-foreground">{n.d}</div></div><Switch checked={s.settings.notifications[n.k]} onCheckedChange={(v) => { s.updateSettings({ notifications: { ...s.settings.notifications, [n.k]: v } }); toast.success("Préférence enregistrée."); }} /></li>)}</ul>
        </Section>

        <Section title="Données de démonstration" description="Persistées localement dans votre navigateur (localStorage)">
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{[["Clients", s.clients.length], ["Prospects", s.prospects.length], ["Produits", s.products.length], ["Devis", s.quotes.length], ["Commandes", s.orders.length], ["Expéditions", s.shipments.length], ["Rendez-vous", s.appointments.length], ["Publications", s.posts.length]].map(([l, n]) => <div key={l as string} className="rounded-md border bg-secondary/40 px-3 py-2"><div className="text-lg font-semibold">{n}</div><div className="text-[11px] uppercase tracking-wider text-muted-foreground">{l}</div></div>)}</div>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-destructive/30 bg-destructive/5 p-4"><div><div className="flex items-center gap-2 font-medium"><Database className="h-4 w-4 text-destructive" /> Reset Demo Data</div><div className="text-xs text-muted-foreground">Restaure les données initiales du MVP. Toutes vos modifications seront perdues.</div></div><Button variant="destructive" onClick={() => setReset(true)}><RotateCcw className="h-4 w-4" /> Réinitialiser</Button></div>
            <div className="flex items-center justify-between rounded-md border p-4"><div><div className="font-medium">Session</div><div className="text-xs text-muted-foreground">Connecté en tant que {s.session?.email}</div></div><Button variant="outline" onClick={() => { s.logout(); toast.success("Vous êtes déconnecté."); navigate({ to: "/login", replace: true }); }}><LogOut className="h-4 w-4" /> Déconnexion</Button></div>
          </div>
        </Section>
      </div>
      <ConfirmDialog open={reset} onOpenChange={setReset} title="Réinitialiser les données de démonstration ?" description="Toutes les données (clients, devis, commandes, publications, historiques…) seront remplacées par le jeu de données initial. Cette action est irréversible." confirmLabel="Réinitialiser" onConfirm={doReset} />
    </div>
  );
}
