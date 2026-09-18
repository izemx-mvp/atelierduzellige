import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Activity, Bot, CheckCircle2, ThumbsUp, TrendingUp, Zap } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useStore, useHydrated, fmtDateTime } from "@/lib/store";
import { PageHeader, LoadingBlock, StatusBadge, Section, KpiCard, SearchInput, EmptyState } from "@/components/shared";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_app/agents/activite")({
  head: () => ({ meta: [{ title: "Activity Center — Atelier du Zellige" }, { name: "description", content: "Journal d'activité et statistiques des agents IA : tâches, approbations, conversions." }, { property: "og:title", content: "Activity Center — Agents IA" }, { property: "og:description", content: "Journal et métriques des agents IA." }] }),
  component: ActivityPage,
});

const AGENTS = ["Community Manager", "Service Client & Prospection", "Prise de rendez-vous", "Suivi des commandes", "Relances", "Utilisateur", "Système"];

function ActivityPage() {
  const hydrated = useHydrated();
  const navigate = useNavigate();
  const acts = useStore((s) => s.activities);
  const followUps = useStore((s) => s.followUps);
  const prospects = useStore((s) => s.prospects);
  const [q, setQ] = useState("");
  const [agent, setAgent] = useState("all");
  const [action, setAction] = useState("all");
  const [status, setStatus] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const actions = useMemo(() => Array.from(new Set(acts.map((a) => a.action))).sort(), [acts]);
  const rows = useMemo(() => { const t = q.toLowerCase(); return acts.filter((a) => (!t || [a.agent, a.action, a.target, a.result].some((x) => x.toLowerCase().includes(t))) && (agent === "all" || a.agent === agent) && (action === "all" || a.action === action) && (status === "all" || a.status === status) && (!from || a.date >= new Date(from).toISOString()) && (!to || a.date <= new Date(to + "T23:59:59").toISOString())); }, [acts, q, agent, action, status, from, to]);
  if (!hydrated) return <LoadingBlock />;

  const ai = acts.filter((a) => !["Utilisateur", "Système"].includes(a.agent));
  const recos = ai.filter((a) => /Analyse|Détection|Génération|Proposition|Optimisation|Suggestion|Blocage/.test(a.action)).length;
  const executed = ai.filter((a) => a.status === "Succès" && !/Analyse|Détection|Génération|Proposition|Optimisation/.test(a.action)).length;
  const approval = (() => { const dec = followUps.filter((f) => f.status !== "À traiter"); const acc = dec.filter((f) => f.status !== "Ignorée").length; const sug = acts.filter((a) => /Suggestion/.test(a.action)); const accS = sug.filter((a) => a.action === "Suggestion acceptée").length; const tot = dec.length + sug.length; return tot ? Math.round(((acc + accS) / tot) * 100) : 100; })();
  const conv = prospects.length ? Math.round((prospects.filter((p) => p.stage === "Gagné").length / prospects.length) * 100) : 0;
  const perAgent = AGENTS.filter((a) => !["Utilisateur", "Système"].includes(a)).map((name) => ({ name: name.replace("Service Client & Prospection", "Service client").replace("Prise de rendez-vous", "Booking").replace("Suivi des commandes", "Suivi cmd").replace("Community Manager", "CM"), n: acts.filter((a) => a.agent === name).length }));

  return (
    <div>
      <PageHeader eyebrow="Agents IA" title="Activity Center" description="Journal centralisé et statistiques des agents." />
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-5">
        <KpiCard label="Tâches traitées" value={ai.length} icon={Activity} accent />
        <KpiCard label="Taux d'approbation" value={`${approval} %`} icon={ThumbsUp} hint="recommandations acceptées" />
        <KpiCard label="Taux de conversion" value={`${conv} %`} icon={TrendingUp} hint="prospects gagnés" />
        <KpiCard label="Recommandations" value={recos} icon={Bot} />
        <KpiCard label="Actions exécutées" value={executed} icon={Zap} />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <Section title="Activity Log" description={`${rows.length} entrée(s)`} noPadding>
          <div className="flex flex-wrap gap-2 border-b p-3">
            <SearchInput value={q} onChange={setQ} placeholder="Rechercher…" className="w-56" />
            <Select value={agent} onValueChange={setAgent}><SelectTrigger className="w-52"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Tous les agents</SelectItem>{AGENTS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent></Select>
            <Select value={action} onValueChange={setAction}><SelectTrigger className="w-48"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Tous types d'action</SelectItem>{actions.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent></Select>
            <Select value={status} onValueChange={setStatus}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Tous statuts</SelectItem>{["Succès", "En attente", "Refusé", "Erreur"].map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent></Select>
            <Input type="date" className="w-40" value={from} onChange={(e) => setFrom(e.target.value)} /><Input type="date" className="w-40" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          {rows.length === 0 ? <div className="p-4"><EmptyState icon={Activity} title="Aucune activité" description="Modifiez vos filtres." /></div> : (
            <div className="overflow-x-auto"><Table>
              <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Agent</TableHead><TableHead>Action</TableHead><TableHead>Objet</TableHead><TableHead>Résultat</TableHead><TableHead>Statut</TableHead></TableRow></TableHeader>
              <TableBody>{rows.slice(0, 100).map((a) => (
                <TableRow key={a.id} className={a.link ? "cursor-pointer" : ""} onClick={() => a.link && navigate({ href: a.link })}>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{fmtDateTime(a.date)}</TableCell>
                  <TableCell><span className="flex items-center gap-1.5 text-sm">{!["Utilisateur", "Système"].includes(a.agent) && <Bot className="h-3.5 w-3.5 text-gold" />}{a.agent}</span></TableCell>
                  <TableCell className="text-sm font-medium">{a.action}</TableCell><TableCell className="max-w-56 truncate text-sm text-muted-foreground">{a.target}</TableCell><TableCell className="max-w-64 truncate text-sm text-muted-foreground">{a.result}</TableCell><TableCell><StatusBadge status={a.status} /></TableCell>
                </TableRow>
              ))}</TableBody>
            </Table></div>
          )}
        </Section>
        <div className="space-y-4">
          <Section title="Activité par agent">
            <div className="h-56"><ResponsiveContainer width="100%" height="100%"><BarChart data={perAgent} layout="vertical" margin={{ left: 0, right: 16 }}><CartesianGrid horizontal={false} stroke="var(--color-border)" /><XAxis type="number" hide allowDecimals={false} /><YAxis type="category" dataKey="name" width={90} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} /><Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }} /><Bar dataKey="n" fill="var(--color-gold)" radius={[0, 4, 4, 0]} barSize={14} /></BarChart></ResponsiveContainer></div>
          </Section>
          <Section title="Répartition des statuts">
            <ul className="space-y-2 text-sm">{["Succès", "En attente", "Refusé", "Erreur"].map((st) => { const n = acts.filter((a) => a.status === st).length; return <li key={st} className="flex items-center justify-between"><StatusBadge status={st} /><span className="font-medium">{n}</span></li>; })}</ul>
            <p className="mt-3 flex items-center gap-1 text-xs text-muted-foreground"><CheckCircle2 className="h-3.5 w-3.5 text-success" /> Chaque action d'agent passe par une validation humaine.</p>
          </Section>
        </div>
      </div>
    </div>
  );
}
