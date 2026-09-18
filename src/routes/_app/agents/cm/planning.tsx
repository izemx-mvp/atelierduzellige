import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, ChevronLeft, ChevronRight, Sparkles, Loader2, Check, X, Pencil, Trash2, Send, FileEdit, CalendarRange } from "lucide-react";
import { useStore, useHydrated, fmtDateTime } from "@/lib/store";
import { computePlanningSuggestions, type PlanningSuggestion } from "@/lib/agents";
import { COLLECTIONS, type SocialPost, type Network, type PostType, type PostStatus, type Collection } from "@/lib/types";
import { PageHeader, LoadingBlock, StatusBadge, Section, Field, ConfirmDialog } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/agents/cm/planning")({
  head: () => ({ meta: [{ title: "CM — Planning — Atelier du Zellige" }, { name: "description", content: "Content planner multi-réseaux avec glisser-déposer et optimisation IA." }, { property: "og:title", content: "Community Manager — Planning" }, { property: "og:description", content: "Planification des publications social media." }] }),
  component: PlanningPage,
});

const NETS: Network[] = ["Instagram", "Facebook", "TikTok"];
const NET_DOT: Record<Network, string> = { Instagram: "bg-gold", Facebook: "bg-info", TikTok: "bg-foreground" };
const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const startOfWeek = (d: Date) => { const x = new Date(d); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); x.setHours(0, 0, 0, 0); return x; };
const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
const toLocal = (iso: string) => { const d = new Date(iso); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); };

function PlanningPage() {
  const hydrated = useHydrated();
  const s = useStore();
  const [view, setView] = useState<"month" | "week" | "list">("month");
  const [cursor, setCursor] = useState(new Date());
  const [nets, setNets] = useState<Network[]>(NETS);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{ open: boolean; post?: SocialPost | null; at?: string }>({ open: false });
  const [f, setF] = useState({ title: "", text: "", network: "Instagram" as Network, type: "Publication" as PostType, at: "", productId: "none", collection: "none", status: "Planifié" as PostStatus });
  const [del, setDel] = useState<SocialPost | null>(null);
  const [optim, setOptim] = useState<{ loading: boolean; list: PlanningSuggestion[]; decided: Record<string, "ok" | "no"> } | null>(null);

  useEffect(() => { if (dialog.open) { const p = dialog.post; setF(p ? { title: p.title, text: p.text, network: p.network, type: p.type, at: p.scheduledAt ? toLocal(p.scheduledAt) : "", productId: p.productId ?? "none", collection: p.collection || "none", status: p.status } : { title: "", text: "", network: "Instagram", type: "Publication", at: dialog.at ? toLocal(dialog.at) : "", productId: "none", collection: "none", status: "Planifié" }); } }, [dialog]);

  const posts = useMemo(() => s.posts.filter((p) => p.scheduledAt && nets.includes(p.network) && p.status !== "Archivé"), [s.posts, nets]);
  if (!hydrated) return <LoadingBlock />;

  const forDay = (d: Date) => posts.filter((p) => sameDay(new Date(p.scheduledAt!), d)).sort((a, b) => a.scheduledAt!.localeCompare(b.scheduledAt!));
  const drop = (day: Date) => { const p = posts.find((x) => x.id === dragId); if (!p) return; const old = new Date(p.scheduledAt!); const n = new Date(day); n.setHours(old.getHours(), old.getMinutes()); s.updatePost(p.id, { scheduledAt: n.toISOString(), status: p.status === "Publié" ? p.status : "Planifié" }); s.log({ agent: "Community Manager", action: "Reprogrammation", target: p.title, result: fmtDateTime(n.toISOString()), status: "Succès", link: "/agents/cm/planning" }); toast.success("Publication reprogrammée."); setDragId(null); };
  const publishNow = (p: SocialPost) => { s.updatePost(p.id, { status: "Publié", publishedAt: new Date().toISOString(), scheduledAt: p.scheduledAt ?? new Date().toISOString() }); s.log({ agent: "Community Manager", action: "Publication immédiate", target: p.title, result: `Publié sur ${p.network} (simulé)`, status: "Succès", link: "/agents/cm/planning" }); toast.success(`Publié sur ${p.network} (simulé).`); };
  const toDraft = (p: SocialPost) => { s.updatePost(p.id, { status: "Brouillon" }); toast.success("Repassé en brouillon."); };
  const submit = () => {
    if (!f.title.trim() || !f.at) return toast.error("Titre et date requis.");
    const payload = { title: f.title.trim(), text: f.text, network: f.network, type: f.type, scheduledAt: new Date(f.at).toISOString(), productId: f.productId === "none" ? undefined : f.productId, collection: (f.collection === "none" ? "" : f.collection) as Collection | "", status: f.status };
    if (dialog.post) { s.updatePost(dialog.post.id, payload); toast.success("Modifications enregistrées."); }
    else { s.addPost({ ...payload, hashtags: s.cmSettings.hashtags.split(/\s+/).filter(Boolean), cta: "", objective: "Notoriété", tone: s.cmSettings.brandTone.split(",")[0] ?? "Premium", language: "FR" }); toast.success("Publication créée."); }
    setDialog({ open: false });
  };
  const optimise = async () => { setOptim({ loading: true, list: [], decided: {} }); await new Promise((r) => setTimeout(r, 1300)); const list = computePlanningSuggestions(useStore.getState()); setOptim({ loading: false, list, decided: {} }); s.log({ agent: "Community Manager", action: "Optimisation du planning", target: "Planning", result: `${list.length} recommandation(s)`, status: "Succès", link: "/agents/cm/planning" }); };
  const decide = (sg: PlanningSuggestion, ok: boolean) => { if (ok) sg.apply?.(); setOptim((o) => o && { ...o, decided: { ...o.decided, [sg.id]: ok ? "ok" : "no" } }); s.log({ agent: "Community Manager", action: ok ? "Suggestion acceptée" : "Suggestion refusée", target: sg.title, result: ok ? "Appliquée" : "Ignorée", status: ok ? "Succès" : "Refusé", link: "/agents/cm/planning" }); toast.success(ok ? "Suggestion appliquée." : "Suggestion refusée."); };

  const Chip = ({ p }: { p: SocialPost }) => (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" draggable onDragStart={() => setDragId(p.id)} onDragEnd={() => setDragId(null)} className={cn("flex w-full items-center gap-1.5 rounded border bg-card px-1.5 py-1 text-left text-[11px] leading-tight hover:border-gold/50", p.status === "Publié" && "opacity-70", dragId === p.id && "opacity-40")}>
          <span className={cn("h-2 w-2 shrink-0 rounded-full", NET_DOT[p.network])} /><span className="truncate">{new Date(p.scheduledAt!).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} {p.title}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="flex items-center gap-2"><StatusBadge status={p.network} /><span className="text-xs text-muted-foreground">{p.type}</span><span className="ml-auto"><StatusBadge status={p.status} /></span></div>
        <div className="mt-2 font-medium">{p.title}</div><p className="mt-1 line-clamp-4 text-xs text-muted-foreground">{p.text}</p>
        <div className="mt-1 text-xs text-muted-foreground">{fmtDateTime(p.scheduledAt)}{p.collection ? ` · ${p.collection}` : ""}</div>
        <div className="mt-3 flex flex-wrap gap-1">
          {p.status !== "Publié" && <Button size="sm" className="h-7 bg-gold text-gold-foreground hover:bg-gold/90" onClick={() => publishNow(p)}><Send className="h-3.5 w-3.5" /> Publier</Button>}
          <Button size="sm" variant="outline" className="h-7" onClick={() => setDialog({ open: true, post: p })}><Pencil className="h-3.5 w-3.5" /> Modifier</Button>
          {p.status !== "Brouillon" && p.status !== "Publié" && <Button size="sm" variant="outline" className="h-7" onClick={() => toDraft(p)}><FileEdit className="h-3.5 w-3.5" /> Brouillon</Button>}
          <Button size="sm" variant="ghost" className="h-7 text-destructive" onClick={() => setDel(p)}><Trash2 className="h-3.5 w-3.5" /></Button>
        </div>
      </PopoverContent>
    </Popover>
  );

  const monthCells = (() => { const st = startOfWeek(new Date(cursor.getFullYear(), cursor.getMonth(), 1)); return Array.from({ length: 42 }).map((_, i) => { const d = new Date(st); d.setDate(st.getDate() + i); return d; }); })();
  const weekCells = Array.from({ length: 7 }).map((_, i) => { const d = startOfWeek(cursor); d.setDate(d.getDate() + i); return d; });
  const nav = (dir: number) => { const d = new Date(cursor); if (view === "month") d.setMonth(d.getMonth() + dir); else d.setDate(d.getDate() + 7 * dir); setCursor(d); };

  const Cell = ({ d, tall }: { d: Date; tall?: boolean }) => { const items = forDay(d); const today = sameDay(d, new Date()); const at = new Date(d); at.setHours(12, 0, 0, 0); return (
    <div onDragOver={(e) => e.preventDefault()} onDrop={() => drop(d)} onDoubleClick={() => setDialog({ open: true, post: null, at: at.toISOString() })} className={cn("border-b border-r p-1.5 [&:nth-child(7n)]:border-r-0", tall ? "min-h-64" : "min-h-24", d.getMonth() !== cursor.getMonth() && view === "month" && "bg-secondary/30 text-muted-foreground")}>
      <div className="mb-1 flex items-center justify-between"><span className={cn("flex h-6 w-6 items-center justify-center rounded-full text-xs", today && "bg-gold font-semibold text-gold-foreground")}>{d.getDate()}</span></div>
      <div className="space-y-1">{items.map((p) => <Chip key={p.id} p={p} />)}</div>
    </div>
  ); };

  return (
    <div>
      <PageHeader eyebrow="Agent IA · Community Manager" title="CM — Planning" description={`${posts.filter((p) => p.status === "Planifié").length} planifiées · ${posts.filter((p) => p.status === "Publié").length} publiées`}
        actions={<>
          <div className="flex rounded-md border bg-card p-0.5">{(["month", "week", "list"] as const).map((v) => <Button key={v} size="sm" variant={view === v ? "secondary" : "ghost"} onClick={() => setView(v)}>{{ month: "Mois", week: "Semaine", list: "Liste" }[v]}</Button>)}</div>
          <Button variant="outline" onClick={optimise}><Sparkles className="h-4 w-4 text-gold" /> Optimiser mon planning avec l'IA</Button>
          <Button className="bg-gold text-gold-foreground hover:bg-gold/90" onClick={() => setDialog({ open: true, post: null })}><Plus className="h-4 w-4" /> Nouvelle publication</Button>
        </>} />

      <div className="mb-3 flex flex-wrap items-center gap-2">
        {view !== "list" && <><Button variant="outline" size="icon" className="h-8 w-8" onClick={() => nav(-1)}><ChevronLeft className="h-4 w-4" /></Button><Button variant="outline" size="icon" className="h-8 w-8" onClick={() => nav(1)}><ChevronRight className="h-4 w-4" /></Button><Button variant="ghost" size="sm" onClick={() => setCursor(new Date())}>Aujourd'hui</Button><h2 className="ml-1 text-base font-semibold capitalize">{view === "month" ? cursor.toLocaleDateString("fr-FR", { month: "long", year: "numeric" }) : `Semaine du ${startOfWeek(cursor).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}`}</h2></>}
        <div className="ml-auto flex items-center gap-1">{NETS.map((n) => <Button key={n} size="sm" variant={nets.includes(n) ? "secondary" : "outline"} className={cn("h-7 gap-1.5 text-xs", nets.includes(n) && "border-gold")} onClick={() => setNets((x) => (x.includes(n) ? x.filter((y) => y !== n) : [...x, n]))}><span className={cn("h-2 w-2 rounded-full", NET_DOT[n])} />{n}</Button>)}</div>
      </div>

      {optim && (
        <Section title="Recommandations de l'agent" description="Fréquence · répartition des collections · types de contenus · réseaux" className="mb-4 border-gold/40" actions={<Button variant="ghost" size="sm" onClick={() => setOptim(null)}><X className="h-4 w-4" /></Button>}>
          {optim.loading ? <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Analyse du planning en cours…</div> : (
            <ul className="space-y-2">{optim.list.map((sg) => (
              <li key={sg.id} className={cn("flex flex-wrap items-center gap-3 rounded-md border p-3", optim.decided[sg.id] === "ok" && "border-success/40 bg-success/5", optim.decided[sg.id] === "no" && "opacity-50")}>
                <Sparkles className="h-4 w-4 shrink-0 text-gold" /><div className="min-w-0 flex-1"><div className="text-sm font-medium">{sg.title}</div><div className="text-xs text-muted-foreground">{sg.detail}</div></div>
                {optim.decided[sg.id] ? <span className="text-xs text-muted-foreground">{optim.decided[sg.id] === "ok" ? "Acceptée" : "Refusée"}</span> : sg.apply ? <div className="flex gap-1"><Button size="sm" className="h-7 bg-gold text-gold-foreground hover:bg-gold/90" onClick={() => decide(sg, true)}><Check className="h-3.5 w-3.5" /> Accepter</Button><Button size="sm" variant="outline" className="h-7" onClick={() => decide(sg, false)}><X className="h-3.5 w-3.5" /> Refuser</Button></div> : <span className="text-xs text-muted-foreground">Information</span>}
              </li>
            ))}</ul>
          )}
        </Section>
      )}

      {view === "list" ? (
        <Section noPadding>
          {posts.length === 0 ? <div className="flex flex-col items-center py-12 text-sm text-muted-foreground"><CalendarRange className="mb-2 h-8 w-8 text-gold" />Aucune publication planifiée.</div> : (
            <ul className="divide-y">{[...posts].sort((a, b) => a.scheduledAt!.localeCompare(b.scheduledAt!)).map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                <span className="w-32 text-xs text-muted-foreground">{fmtDateTime(p.scheduledAt)}</span><StatusBadge status={p.network} /><span className="w-20 text-xs text-muted-foreground">{p.type}</span>
                <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{p.title}</div><div className="truncate text-xs text-muted-foreground">{p.collection || "—"} · {p.objective}</div></div>
                <StatusBadge status={p.status} />
                <div className="flex gap-0.5">{p.status !== "Publié" && <Button size="icon" variant="ghost" className="h-7 w-7 text-gold" onClick={() => publishNow(p)}><Send className="h-3.5 w-3.5" /></Button>}<Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setDialog({ open: true, post: p })}><Pencil className="h-3.5 w-3.5" /></Button><Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setDel(p)}><Trash2 className="h-3.5 w-3.5" /></Button></div>
              </li>
            ))}</ul>
          )}
        </Section>
      ) : (
        <div className="surface overflow-hidden">
          <div className="grid grid-cols-7 border-b bg-secondary/50 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{DAYS.map((d) => <div key={d} className="px-2 py-2">{d}</div>)}</div>
          <div className="grid grid-cols-7">{(view === "month" ? monthCells : weekCells).map((d) => <Cell key={d.toISOString()} d={d} tall={view === "week"} />)}</div>
        </div>
      )}
      <p className="mt-2 text-xs text-muted-foreground">Glissez une publication pour la reprogrammer · Double-clic sur un jour pour créer.</p>

      <Dialog open={dialog.open} onOpenChange={(o) => setDialog((d) => ({ ...d, open: o }))}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>{dialog.post ? "Modifier la publication" : "Planifier une publication"}</DialogTitle></DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Titre *" className="sm:col-span-2"><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
            <Field label="Contenu" className="sm:col-span-2"><Textarea rows={4} value={f.text} onChange={(e) => setF({ ...f, text: e.target.value })} /></Field>
            <Field label="Réseau"><Select value={f.network} onValueChange={(v) => setF({ ...f, network: v as Network })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{NETS.map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select></Field>
            <Field label="Type"><Select value={f.type} onValueChange={(v) => setF({ ...f, type: v as PostType })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["Publication", "Carrousel", "Story", "Reel", "Vidéo"].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select></Field>
            <Field label="Date et heure *"><Input type="datetime-local" value={f.at} onChange={(e) => setF({ ...f, at: e.target.value })} /></Field>
            <Field label="Statut"><Select value={f.status} onValueChange={(v) => setF({ ...f, status: v as PostStatus })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["Brouillon", "Planifié", "Publié"].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select></Field>
            <Field label="Produit"><Select value={f.productId} onValueChange={(v) => { const pr = s.products.find((x) => x.id === v); setF({ ...f, productId: v, collection: pr?.collection ?? f.collection }); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Aucun</SelectItem>{s.products.map((x) => <SelectItem key={x.id} value={x.id}>{x.name}</SelectItem>)}</SelectContent></Select></Field>
            <Field label="Collection"><Select value={f.collection} onValueChange={(v) => setF({ ...f, collection: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Aucune</SelectItem>{COLLECTIONS.map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select></Field>
          </div>
          <DialogFooter className="flex-wrap gap-2">
            {dialog.post && dialog.post.status !== "Publié" && <Button variant="outline" onClick={() => { publishNow(dialog.post!); setDialog({ open: false }); }}><Send className="h-4 w-4" /> Publier maintenant</Button>}
            {dialog.post && dialog.post.status !== "Brouillon" && <Button variant="outline" onClick={() => { toDraft(dialog.post!); setDialog({ open: false }); }}>Passer en brouillon</Button>}
            <Button className="bg-gold text-gold-foreground hover:bg-gold/90" onClick={submit}>{dialog.post ? "Enregistrer" : "Planifier"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={!!del} onOpenChange={(o) => !o && setDel(null)} title={`Supprimer « ${del?.title} » ?`} onConfirm={() => { if (del) { s.deletePost(del.id); toast.success("Élément supprimé."); setDel(null); } }} />
    </div>
  );
}
