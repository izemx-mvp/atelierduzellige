import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from "recharts";
import { Euro, Users, Target, Package, Clock, Ship } from "lucide-react";
import { useStore, useHydrated, fmtMoney, quoteTotals, isOrderLate } from "@/lib/store";
import { PageHeader, LoadingBlock, Section, KpiCard, Field } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/analytics")({
  head: () => ({ meta: [{ title: "Analytics — Atelier du Zellige" }, { name: "description", content: "Analyses croisées : ventes, clients, prospects, produits, collections, délais, export et pays." }, { property: "og:title", content: "Analytics — Atelier du Zellige" }, { property: "og:description", content: "Dashboard analytique avancé." }] }),
  component: AnalyticsPage,
});

const RANGES = [{ k: "today", l: "Aujourd'hui", d: 1 }, { k: "7", l: "7 jours", d: 7 }, { k: "30", l: "30 jours", d: 30 }, { k: "90", l: "3 mois", d: 90 }, { k: "180", l: "6 mois", d: 180 }, { k: "365", l: "12 mois", d: 365 }, { k: "custom", l: "Personnalisé", d: 0 }];
const TT = { contentStyle: { background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 } };
const PIE = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)", "var(--color-chart-5)"];

function AnalyticsPage() {
  const hydrated = useHydrated();
  const s = useStore();
  const [range, setRange] = useState("180");
  const [from, setFrom] = useState(""); const [to, setTo] = useState("");

  const [start, end] = useMemo(() => { if (range === "custom" && from) return [new Date(from), to ? new Date(to + "T23:59:59") : new Date()]; const d = RANGES.find((r) => r.k === range)?.d ?? 180; const st = new Date(); st.setDate(st.getDate() - d + (range === "today" ? 1 : 0)); st.setHours(0, 0, 0, 0); return [st, new Date()]; }, [range, from, to]);
  const inR = (iso: string) => { const d = new Date(iso); return d >= start && d <= end; };

  const data = useMemo(() => {
    const orders = s.orders.filter((o) => inR(o.createdAt) && o.status !== "Annulée");
    const quotes = s.quotes.filter((q) => inR(q.createdAt));
    const prospects = s.prospects.filter((p) => inR(p.createdAt));
    const clients = s.clients.filter((c) => inR(c.createdAt));
    const ca = orders.reduce((a, o) => a + o.totalHT, 0);
    const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000));
    const buckets = days <= 31 ? days : days <= 190 ? Math.ceil(days / 7) : Math.ceil(days / 30);
    const step = days <= 31 ? 1 : days <= 190 ? 7 : 30;
    const series = Array.from({ length: buckets }).map((_, i) => { const b0 = new Date(start); b0.setDate(b0.getDate() + i * step); const b1 = new Date(b0); b1.setDate(b1.getDate() + step); const os = orders.filter((o) => new Date(o.createdAt) >= b0 && new Date(o.createdAt) < b1); const qs = quotes.filter((q) => new Date(q.createdAt) >= b0 && new Date(q.createdAt) < b1); return { label: b0.toLocaleDateString("fr-FR", step === 30 ? { month: "short" } : { day: "2-digit", month: "short" }), ca: Math.round(os.reduce((a, o) => a + o.totalHT, 0)), devis: Math.round(qs.reduce((a, q) => a + quoteTotals(q).ht, 0)), commandes: os.length }; });
    const byColl: Record<string, number> = {}; const byProd: Record<string, number> = {}; const byCountry: Record<string, number> = {};
    orders.forEach((o) => { byCountry[o.deliveryCountry] = (byCountry[o.deliveryCountry] ?? 0) + o.totalHT; o.lines.forEach((l) => { const v = l.quantity * l.unitPrice * (1 - l.discount / 100); byColl[l.collection] = (byColl[l.collection] ?? 0) + v; byProd[l.description] = (byProd[l.description] ?? 0) + l.quantity; }); });
    const funnel = ["Nouveau", "Contacté", "Qualifié", "Échantillon", "Devis", "Négociation", "Gagné", "Perdu"].map((st) => ({ st, n: s.prospects.filter((p) => p.stage === st).length }));
    const quoteRate = quotes.length ? Math.round((quotes.filter((q) => q.status === "Validé").length / quotes.length) * 100) : 0;
    const delivered = s.orders.filter((o) => o.status === "Livrée");
    const avgLead = delivered.length ? Math.round(delivered.reduce((a, o) => { const d = o.steps.find((x) => x.name === "Livrée")?.actualDate; return a + (d ? (new Date(d).getTime() - new Date(o.createdAt).getTime()) / 86400000 : 46); }, 0) / delivered.length) : 0;
    const onTime = s.orders.filter((o) => !["Annulée"].includes(o.status)).length ? Math.round((s.orders.filter((o) => !isOrderLate(o) && o.status !== "Annulée").length / s.orders.filter((o) => o.status !== "Annulée").length) * 100) : 0;
    const stepDur = ["Production", "Préparation", "Contrôle qualité", "Emballage", "Expédiée"].map((name) => { const ds = s.orders.flatMap((o) => { const i = o.steps.findIndex((x) => x.name === name); const cur = o.steps[i]; const prev = o.steps[i - 1]; return cur?.actualDate && prev?.actualDate ? [(new Date(cur.actualDate).getTime() - new Date(prev.actualDate).getTime()) / 86400000] : []; }); return { name, jours: ds.length ? Math.round(ds.reduce((a, b) => a + b, 0) / ds.length) : 0 }; });
    const shipStatus = ["Préparation", "Prêt à expédier", "Expédié", "En transit", "Arrivé", "Livré"].map((st) => ({ st, n: s.shipments.filter((x) => x.status === st).length }));
    const clientTypes = Object.entries(s.clients.reduce<Record<string, number>>((acc, c) => { acc[c.type] = (acc[c.type] ?? 0) + 1; return acc; }, {})).map(([name, value]) => ({ name, value }));
    const sources = Object.entries(s.prospects.reduce<Record<string, number>>((acc, p) => { acc[p.source] = (acc[p.source] ?? 0) + 1; return acc; }, {})).map(([name, value]) => ({ name, value }));
    return { orders, quotes, prospects, clients, ca, series, byColl: Object.entries(byColl).map(([name, value]) => ({ name, value: Math.round(value) })).sort((a, b) => b.value - a.value), byProd: Object.entries(byProd).map(([name, qty]) => ({ name, qty })).sort((a, b) => b.qty - a.qty).slice(0, 6), byCountry: Object.entries(byCountry).map(([name, value]) => ({ name, value: Math.round(value) })).sort((a, b) => b.value - a.value), funnel, quoteRate, avgLead, onTime, stepDur, shipStatus, clientTypes, sources, avgBasket: orders.length ? ca / orders.length : 0 };
  }, [s, start, end]);

  if (!hydrated) return <LoadingBlock />;
  const d = data;

  return (
    <div>
      <PageHeader eyebrow="Pilotage" title="Analytics" description={`Période : ${start.toLocaleDateString("fr-FR")} → ${end.toLocaleDateString("fr-FR")}`} />
      <div className="mb-4 flex flex-wrap items-end gap-2">
        <div className="flex flex-wrap rounded-md border bg-card p-0.5">{RANGES.map((r) => <Button key={r.k} size="sm" variant={range === r.k ? "secondary" : "ghost"} className={cn(range === r.k && "border border-gold")} onClick={() => setRange(r.k)}>{r.l}</Button>)}</div>
        {range === "custom" && <><Field label="Du"><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" /></Field><Field label="Au"><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" /></Field></>}
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="CA HT" value={fmtMoney(d.ca)} icon={Euro} accent hint={`${d.orders.length} commandes`} />
        <KpiCard label="Panier moyen" value={fmtMoney(d.avgBasket)} />
        <KpiCard label="Nouveaux clients" value={d.clients.length} icon={Users} />
        <KpiCard label="Prospects créés" value={d.prospects.length} icon={Target} hint={`${d.quoteRate} % devis validés`} />
        <KpiCard label="Délai moyen" value={`${d.avgLead} j`} icon={Clock} hint="commande → livraison" />
        <KpiCard label="Livraison à temps" value={`${d.onTime} %`} icon={Ship} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Section title="Ventes & devis" description="CA commandes vs montant des devis" className="xl:col-span-2">
          <div className="h-64"><ResponsiveContainer width="100%" height="100%"><AreaChart data={d.series} margin={{ left: -10, right: 10, top: 10 }}><defs><linearGradient id="ga" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--color-gold)" stopOpacity={0.35} /><stop offset="100%" stopColor="var(--color-gold)" stopOpacity={0} /></linearGradient></defs><CartesianGrid vertical={false} stroke="var(--color-border)" /><XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} /><YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} /><Tooltip {...TT} formatter={(v: number) => fmtMoney(v)} /><Area type="monotone" dataKey="devis" name="Devis" stroke="var(--color-chart-3)" strokeDasharray="4 4" fill="none" strokeWidth={1.5} /><Area type="monotone" dataKey="ca" name="CA" stroke="var(--color-gold)" strokeWidth={2} fill="url(#ga)" /></AreaChart></ResponsiveContainer></div>
        </Section>
        <Section title="Collections" description="Part du CA">
          <div className="h-44"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={d.byColl} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70} paddingAngle={3} strokeWidth={0}>{d.byColl.map((_, i) => <Cell key={i} fill={PIE[i % PIE.length]} />)}</Pie><Tooltip {...TT} formatter={(v: number) => fmtMoney(v)} /></PieChart></ResponsiveContainer></div>
          <ul className="space-y-1 text-sm">{d.byColl.map((c, i) => <li key={c.name} className="flex justify-between"><span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: PIE[i % PIE.length] }} />{c.name}</span><span className="font-medium">{d.ca ? Math.round((c.value / d.ca) * 100) : 0} %</span></li>)}{d.byColl.length === 0 && <li className="text-muted-foreground">Aucune vente sur la période.</li>}</ul>
        </Section>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Section title="Pipeline prospects" description="Par étape"><div className="h-52"><ResponsiveContainer width="100%" height="100%"><BarChart data={d.funnel} margin={{ left: -25 }}><XAxis dataKey="st" tick={{ fontSize: 9, fill: "var(--color-muted-foreground)" }} interval={0} angle={-30} textAnchor="end" height={45} tickLine={false} axisLine={false} /><YAxis allowDecimals={false} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} /><Tooltip {...TT} /><Bar dataKey="n" name="Prospects" fill="var(--color-chart-2)" radius={[3, 3, 0, 0]} /></BarChart></ResponsiveContainer></div></Section>
        <Section title="Top produits" description="Quantités (m²)"><ul className="space-y-2.5">{d.byProd.map((p) => <li key={p.name}><div className="flex justify-between text-sm"><span className="truncate">{p.name}</span><span className="text-muted-foreground">{p.qty}</span></div><div className="mt-1 h-1.5 rounded-full bg-secondary"><div className="h-1.5 rounded-full bg-gold" style={{ width: `${(p.qty / (d.byProd[0]?.qty || 1)) * 100}%` }} /></div></li>)}{d.byProd.length === 0 && <li className="text-sm text-muted-foreground">Aucune donnée.</li>}</ul></Section>
        <Section title="Pays" description="CA par destination"><div className="h-52"><ResponsiveContainer width="100%" height="100%"><BarChart data={d.byCountry.slice(0, 6)} layout="vertical" margin={{ left: 0, right: 10 }}><XAxis type="number" hide /><YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} tickLine={false} axisLine={false} /><Tooltip {...TT} formatter={(v: number) => fmtMoney(v)} /><Bar dataKey="value" fill="var(--color-gold)" radius={[0, 3, 3, 0]} barSize={12} /></BarChart></ResponsiveContainer></div></Section>
        <Section title="Délais opérationnels" description="Durée moyenne par étape (jours)"><div className="h-52"><ResponsiveContainer width="100%" height="100%"><LineChart data={d.stepDur} margin={{ left: -25, right: 10 }}><CartesianGrid vertical={false} stroke="var(--color-border)" /><XAxis dataKey="name" tick={{ fontSize: 9, fill: "var(--color-muted-foreground)" }} interval={0} angle={-25} textAnchor="end" height={45} tickLine={false} axisLine={false} /><YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} /><Tooltip {...TT} /><Line type="monotone" dataKey="jours" stroke="var(--color-gold)" strokeWidth={2} dot={{ fill: "var(--color-gold)" }} /></LineChart></ResponsiveContainer></div></Section>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <Section title="Types de clients"><ul className="space-y-1.5 text-sm">{d.clientTypes.map((c, i) => <li key={c.name} className="flex items-center justify-between"><span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: PIE[i % PIE.length] }} />{c.name}</span><span className="font-medium">{c.value}</span></li>)}</ul></Section>
        <Section title="Sources des prospects"><ul className="space-y-1.5 text-sm">{d.sources.map((c) => <li key={c.name}><div className="flex justify-between"><span>{c.name}</span><span className="font-medium">{c.value}</span></div><div className="mt-1 h-1 rounded-full bg-secondary"><div className="h-1 rounded-full bg-chart-2" style={{ width: `${(c.value / s.prospects.length) * 100}%` }} /></div></li>)}</ul></Section>
        <Section title="Export" description="Expéditions par statut"><ul className="space-y-1.5 text-sm">{d.shipStatus.map((x) => <li key={x.st} className="flex justify-between"><span>{x.st}</span><span className="font-medium">{x.n}</span></li>)}<li className="flex justify-between border-t pt-1.5 text-muted-foreground"><span>Incidents</span><span className="font-medium text-destructive">{s.shipments.filter((x) => x.issue).length}</span></li></ul></Section>
      </div>
    </div>
  );
}
