import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Euro, ShoppingCart, Target, FileText, AlertTriangle, TrendingUp, Plus, UserPlus, CalendarPlus, FlaskConical, ArrowRight, Bot } from "lucide-react";
import { useStore, useHydrated, fmtMoney, fmtDateTime, isOrderLate, quoteTotals, daysUntil } from "@/lib/store";
import { PageHeader, KpiCard, Section, LoadingBlock, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Atelier du Zellige" },
      { name: "description", content: "Vue globale de l'activité : chiffre d'affaires, commandes, prospects, devis et alertes." },
      { property: "og:title", content: "Dashboard — Atelier du Zellige" },
      { property: "og:description", content: "Vue globale de l'activité d'Atelier du Zellige." },
    ],
  }),
  component: Dashboard,
});

const TT = { contentStyle: { background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }, labelStyle: { color: "var(--color-foreground)" } };
const MONTHS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];

function Dashboard() {
  const hydrated = useHydrated();
  const navigate = useNavigate();
  const orders = useStore((s) => s.orders);
  const quotes = useStore((s) => s.quotes);
  const prospects = useStore((s) => s.prospects);
  const products = useStore((s) => s.products);
  const clients = useStore((s) => s.clients);
  const activities = useStore((s) => s.activities);
  const insights = useStore((s) => s.insights);
  const followUps = useStore((s) => s.followUps);
  const messages = useStore((s) => s.messages);

  const kpi = useMemo(() => {
    const valid = orders.filter((o) => o.status !== "Annulée");
    const ca = valid.reduce((s, o) => s + o.totalHT, 0);
    const cost = valid.reduce((s, o) => s + o.lines.reduce((a, l) => a + (products.find((p) => p.id === l.productId)?.cost ?? l.unitPrice * 0.5) * l.quantity, 0), 0);
    return {
      ca, inProgress: orders.filter((o) => !["Livrée", "Annulée"].includes(o.status)).length,
      prospects: prospects.filter((p) => !["Gagné", "Perdu"].includes(p.stage)).length,
      quotes: quotes.filter((q) => ["Envoyé", "En attente", "Brouillon"].includes(q.status)).length,
      quotesValue: quotes.filter((q) => ["Envoyé", "En attente"].includes(q.status)).reduce((s, q) => s + quoteTotals(q).ht, 0),
      late: orders.filter((o) => isOrderLate(o) || o.blocked).length,
      margin: ca ? Math.round(((ca - cost) / ca) * 100) : 0,
    };
  }, [orders, quotes, prospects, products]);

  const sales = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 8 }).map((_, i) => {
      const dt = new Date(now.getFullYear(), now.getMonth() - 7 + i, 1);
      const real = orders.filter((o) => { const d = new Date(o.createdAt); return d.getMonth() === dt.getMonth() && d.getFullYear() === dt.getFullYear() && o.status !== "Annulée"; }).reduce((s, o) => s + o.totalHT, 0);
      const base = [31000, 28500, 36200, 41800, 39400, 45100, 42600, 0][i];
      return { m: MONTHS[dt.getMonth()], ca: Math.round(real + (i < 7 ? base * 0.65 : 0)) };
    });
  }, [orders]);

  const byCollection = useMemo(() => {
    const acc: Record<string, number> = {};
    orders.filter((o) => o.status !== "Annulée").forEach((o) => o.lines.forEach((l) => { acc[l.collection] = (acc[l.collection] ?? 0) + l.quantity * l.unitPrice * (1 - l.discount / 100); }));
    return Object.entries(acc).map(([name, value]) => ({ name, value: Math.round(value) })).sort((a, b) => b.value - a.value);
  }, [orders]);

  const byCountry = useMemo(() => {
    const acc: Record<string, number> = {};
    orders.filter((o) => o.status !== "Annulée").forEach((o) => { acc[o.deliveryCountry] = (acc[o.deliveryCountry] ?? 0) + o.totalHT; });
    return Object.entries(acc).map(([name, value]) => ({ name, value: Math.round(value) })).sort((a, b) => b.value - a.value).slice(0, 6);
  }, [orders]);

  const topProducts = useMemo(() => {
    const acc: Record<string, number> = {};
    orders.forEach((o) => o.lines.forEach((l) => { acc[l.description] = (acc[l.description] ?? 0) + l.quantity; }));
    return Object.entries(acc).map(([name, qty]) => ({ name, qty })).sort((a, b) => b.qty - a.qty).slice(0, 5);
  }, [orders]);

  const byStatus = useMemo(() => {
    const acc: Record<string, number> = {};
    orders.forEach((o) => { acc[o.status] = (acc[o.status] ?? 0) + 1; });
    return Object.entries(acc).map(([name, value]) => ({ name, value }));
  }, [orders]);

  const alerts = useMemo(() => {
    const a: { title: string; desc: string; link: string; sev: "error" | "warning" | "info" }[] = [];
    insights.filter((i) => !i.resolved && i.severity === "Haute").forEach((i) => a.push({ title: i.type, desc: i.message, link: `/commandes/${i.orderId}`, sev: "error" }));
    quotes.filter((q) => ["Envoyé", "En attente"].includes(q.status) && daysUntil(q.expiresAt) <= 7 && daysUntil(q.expiresAt) >= 0).forEach((q) => a.push({ title: "Devis bientôt expiré", desc: `${q.number} expire dans ${daysUntil(q.expiresAt)} j.`, link: `/devis/${q.id}`, sev: "warning" }));
    products.filter((p) => p.stock <= p.minStock && p.minStock > 0).forEach((p) => a.push({ title: "Stock faible", desc: `${p.name} : ${p.stock} ${p.unit} restants.`, link: "/produits", sev: "warning" }));
    const unread = messages.filter((m) => m.direction === "in" && !m.read).length;
    if (unread) a.push({ title: "Messages non lus", desc: `${unread} message(s) à analyser dans l'AI Inbox.`, link: "/agents/service-client", sev: "info" });
    const fu = followUps.filter((f) => f.status === "À traiter").length;
    if (fu) a.push({ title: "Relances suggérées", desc: `${fu} relance(s) proposée(s) par l'agent.`, link: "/agents/relances", sev: "info" });
    return a.slice(0, 7);
  }, [insights, quotes, products, messages, followUps]);

  if (!hydrated) return <LoadingBlock rows={8} />;

  const PIE = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)", "var(--color-chart-5)"];

  return (
    <div>
      <PageHeader eyebrow="Vue d'ensemble" title={`Bonjour, ${useStore.getState().settings.profile.name.split(" ")[0]}`} description="Voici l'état de l'activité aujourd'hui."
        actions={<>
          <Button variant="outline" size="sm" asChild><Link to="/prospects"><UserPlus className="h-4 w-4" /> Prospect</Link></Button>
          <Button variant="outline" size="sm" asChild><Link to="/agents/booking"><CalendarPlus className="h-4 w-4" /> Rendez-vous</Link></Button>
          <Button variant="outline" size="sm" asChild><Link to="/echantillons"><FlaskConical className="h-4 w-4" /> Échantillon</Link></Button>
          <Button size="sm" className="bg-gold text-gold-foreground hover:bg-gold/90" asChild><Link to="/devis"><Plus className="h-4 w-4" /> Nouveau devis</Link></Button>
        </>} />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Chiffre d'affaires" value={fmtMoney(kpi.ca)} hint="commandes HT" icon={Euro} trend={{ value: 12 }} accent onClick={() => navigate({ to: "/analytics" })} />
        <KpiCard label="Commandes en cours" value={kpi.inProgress} hint={`${orders.length} au total`} icon={ShoppingCart} onClick={() => navigate({ to: "/commandes" })} />
        <KpiCard label="Prospects actifs" value={kpi.prospects} hint={`${clients.length} clients`} icon={Target} trend={{ value: 8 }} onClick={() => navigate({ to: "/prospects" })} />
        <KpiCard label="Devis en cours" value={kpi.quotes} hint={fmtMoney(kpi.quotesValue) + " en attente"} icon={FileText} onClick={() => navigate({ to: "/devis" })} />
        <KpiCard label="Retards / blocages" value={kpi.late} hint="commandes à surveiller" icon={AlertTriangle} onClick={() => navigate({ to: "/agents/suivi-commandes" })} />
        <KpiCard label="Marge estimée" value={`${kpi.margin} %`} hint="sur coût matière" icon={TrendingUp} trend={{ value: 2 }} onClick={() => navigate({ to: "/analytics" })} />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <Section title="Évolution des ventes" description="CA HT mensuel (8 derniers mois)" className="xl:col-span-2">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sales} margin={{ left: -10, right: 10, top: 10 }}>
                <defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--color-gold)" stopOpacity={0.35} /><stop offset="100%" stopColor="var(--color-gold)" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="m" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                <Tooltip {...TT} formatter={(v: number) => [fmtMoney(v), "CA"]} />
                <Area type="monotone" dataKey="ca" stroke="var(--color-gold)" strokeWidth={2} fill="url(#g1)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Section>
        <Section title="Ventes par collection" description="Répartition du CA">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byCollection} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3} strokeWidth={0}>
                  {byCollection.map((_, i) => <Cell key={i} fill={PIE[i % PIE.length]} />)}
                </Pie>
                <Tooltip {...TT} formatter={(v: number) => fmtMoney(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-2 space-y-1.5">
            {byCollection.map((c, i) => (
              <li key={c.name} className="flex items-center justify-between text-sm"><span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: PIE[i % PIE.length] }} />{c.name}</span><span className="font-medium">{fmtMoney(c.value)}</span></li>
            ))}
          </ul>
        </Section>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Section title="Ventes par pays" description="Top destinations">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byCountry} layout="vertical" margin={{ left: 10, right: 20 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={110} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
                <Tooltip {...TT} formatter={(v: number) => fmtMoney(v)} />
                <Bar dataKey="value" fill="var(--color-chart-2)" radius={[0, 4, 4, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Section>
        <Section title="Performance produits" description="Quantités commandées">
          <ul className="space-y-3">
            {topProducts.map((p, i) => (
              <li key={p.name}>
                <div className="flex justify-between text-sm"><span className="truncate">{i + 1}. {p.name}</span><span className="font-medium text-muted-foreground">{p.qty} m²</span></div>
                <div className="mt-1 h-1.5 rounded-full bg-secondary"><div className="h-1.5 rounded-full bg-gold" style={{ width: `${(p.qty / topProducts[0].qty) * 100}%` }} /></div>
              </li>
            ))}
          </ul>
        </Section>
        <Section title="Commandes par statut">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byStatus} margin={{ left: -20, right: 10 }}>
                <CartesianGrid vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} interval={0} angle={-20} textAnchor="end" height={50} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
                <Tooltip {...TT} />
                <Bar dataKey="value" fill="var(--color-gold)" radius={[4, 4, 0, 0]} barSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Section>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Section title="Alertes importantes" description="Cliquez pour ouvrir le module concerné" noPadding actions={<Button variant="ghost" size="sm" asChild><Link to="/agents/suivi-commandes"><Bot className="h-4 w-4" /> Agents</Link></Button>}>
          {alerts.length === 0 ? <div className="p-6 text-center text-sm text-muted-foreground">Aucune alerte. Tout est sous contrôle.</div> : (
            <ul className="divide-y">
              {alerts.map((a, i) => (
                <li key={i}>
                  <button type="button" onClick={() => navigate({ href: a.link })} className="flex w-full items-start gap-3 px-5 py-3 text-left hover:bg-accent">
                    <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", a.sev === "error" ? "bg-destructive" : a.sev === "warning" ? "bg-warning" : "bg-info")} />
                    <span className="min-w-0 flex-1"><span className="block text-sm font-medium">{a.title}</span><span className="block truncate text-xs text-muted-foreground">{a.desc}</span></span>
                    <ArrowRight className="mt-1 h-4 w-4 text-muted-foreground" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Section>
        <Section title="Activité récente" description="Utilisateurs et agents IA" noPadding className="xl:col-span-2" actions={<Button variant="ghost" size="sm" asChild><Link to="/agents/activite">Tout voir</Link></Button>}>
          <ul className="divide-y">
            {activities.slice(0, 8).map((a) => (
              <li key={a.id} className="flex items-center gap-4 px-5 py-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-secondary text-xs font-semibold text-muted-foreground">{a.agent === "Utilisateur" ? "HB" : <Bot className="h-4 w-4 text-gold" />}</div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm"><span className="font-medium">{a.agent}</span> · {a.action} — <span className="text-muted-foreground">{a.target}</span></div>
                  <div className="truncate text-xs text-muted-foreground">{a.result}</div>
                </div>
                <StatusBadge status={a.status} />
                <span className="hidden w-24 text-right text-xs text-muted-foreground md:block">{fmtDateTime(a.date)}</span>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </div>
  );
}
