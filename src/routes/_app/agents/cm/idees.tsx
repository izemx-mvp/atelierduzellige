import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Sparkles, Loader2, Copy, RefreshCw, Save, CalendarPlus, Trash2, Pencil, Lightbulb, Check, Send, FileEdit, Layers3, Eye, Clock } from "lucide-react";
import { useStore, useHydrated, fmtDate } from "@/lib/store";
import { generatePosts, type GenParams } from "@/lib/agents";
import { COLLECTIONS, type SocialPost, type PostStatus, type Network, type PostType } from "@/lib/types";
import { PageHeader, LoadingBlock, StatusBadge, Section, Field, ConfirmDialog, SearchInput, EmptyState, KpiCard } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import riadZelligeAsset from "@/assets/cm-ideas/riad-zellige.png.asset.json";
import murZelligeAsset from "@/assets/cm-ideas/mur-zellige.png.asset.json";
import salleDeBainZelligeAsset from "@/assets/cm-ideas/salle-de-bain-zellige.png.asset.json";

export const Route = createFileRoute("/_app/agents/cm/idees")({
  head: () => ({ meta: [{ title: "CM — Idées — Atelier du Zellige" }, { name: "description", content: "Génération de contenus social media assistée par IA : Instagram, Facebook, TikTok." }, { property: "og:title", content: "Community Manager — Idées" }, { property: "og:description", content: "Génération de contenus par l'agent IA Community Manager." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: IdeasPage,
});

const STATUSES: PostStatus[] = ["Brouillon", "Généré", "Validé", "Planifié", "Publié", "Archivé"];
type Draft = Omit<SocialPost, "id" | "createdAt"> & { tmpId: string; imageUrl?: string; displayStatus?: "Brouillon" | "À valider" | "Planifié"; displayAt?: string };

const MOCK_IDEAS: Draft[] = [
  { tmpId: "zellige-riad", title: "Un magnifique riad traditionnel avec des détails en zellige", text: "Une immersion dans l'élégance d'un riad marocain, où chaque motif raconte le geste précis de nos artisans.", hashtags: ["#ZelligeMarocain", "#Riad", "#Artisanat"], cta: "Découvrez notre savoir-faire.", network: "Instagram", type: "Carrousel", collection: "Fès", objective: "Inspiration", tone: "Authentique", language: "FR", status: "Brouillon", imageUrl: riadZelligeAsset.url, displayStatus: "Brouillon", displayAt: "19 septembre 2026 · 10:00" },
  { tmpId: "zellige-mur", title: "Un mur artistique en zellige marocain aux motifs géométriques", text: "Couleurs, reliefs et géométrie composent un décor vivant, façonné pièce après pièce selon la tradition marocaine.", hashtags: ["#Zellige", "#DesignIntérieur", "#Maroc"], cta: "Imaginez votre prochain décor.", network: "Facebook", type: "Publication", collection: "Atlas", objective: "Présentation produit", tone: "Premium", language: "FR", status: "Validé", imageUrl: murZelligeAsset.url, displayStatus: "À valider", displayAt: "20 septembre 2026 · 14:30" },
  { tmpId: "zellige-bain", title: "Une salle de bain moderne designée avec du zellige", text: "Le zellige bleu apporte profondeur et lumière à cette salle de bain contemporaine, entre fraîcheur et caractère.", hashtags: ["#SalleDeBain", "#ZelligeBleu", "#Décoration"], cta: "Créez votre projet sur mesure.", network: "Instagram", type: "Reel", collection: "Océan", objective: "Inspiration", tone: "Élégant", language: "FR", status: "Planifié", imageUrl: salleDeBainZelligeAsset.url, displayStatus: "Planifié", displayAt: "22 septembre 2026 · 18:00" },
];

function IdeasPage() {
  const hydrated = useHydrated();
  const navigate = useNavigate();
  const s = useStore();
  const [p, setP] = useState<GenParams>({ brief: "Présenter la collection Atlas et mettre en avant le savoir-faire artisanal marocain.", network: "Instagram", type: "Carrousel", productId: "pr1", collection: "Atlas", objective: "Présentation produit", audience: "Architectes et décorateurs d'intérieur", tone: "Premium", language: "FR", length: "Moyen", cta: "" });
  const [loading, setLoading] = useState(false);
  const [drafts, setDrafts] = useState<Draft[]>(MOCK_IDEAS);
  const [edit, setEdit] = useState<Draft | null>(null);
  const [detail, setDetail] = useState<Draft | null>(null);
  const [hq, setHq] = useState("");
  const [hStatus, setHStatus] = useState("all");
  const [hNet, setHNet] = useState("all");
  const [hColl, setHColl] = useState("all");
  const [del, setDel] = useState<string | null>(null);
  const [editPost, setEditPost] = useState<SocialPost | null>(null);
  const [schedule, setSchedule] = useState<{ draft?: Draft; post?: SocialPost; at: string } | null>(null);

  const history = useMemo(() => { const t = hq.toLowerCase(); return s.posts.filter((x) => (!t || [x.title, x.text, x.hashtags.join(" "), s.products.find((pp) => pp.id === x.productId)?.name ?? ""].some((v) => v.toLowerCase().includes(t))) && (hStatus === "all" || x.status === hStatus) && (hNet === "all" || x.network === hNet) && (hColl === "all" || x.collection === hColl)).sort((a, b) => b.createdAt.localeCompare(a.createdAt)); }, [s.posts, s.products, hq, hStatus, hNet, hColl]);

  if (!hydrated) return <LoadingBlock />;

  const generate = async () => {
    if (!p.brief.trim()) return toast.error("Indiquez une consigne.");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    const gen = generatePosts(p, s).map((g, index) => ({ ...g, tmpId: Math.random().toString(36).slice(2), imageUrl: MOCK_IDEAS[index % MOCK_IDEAS.length].imageUrl, displayStatus: "À valider" as const, displayAt: new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short" }).format(new Date()) }));
    setDrafts(gen); setLoading(false);
    s.log({ agent: "Community Manager", action: "Génération de contenu", target: p.brief.slice(0, 50), result: `${gen.length} variantes (${p.network} · ${p.type})`, status: "Succès", link: "/agents/cm/idees" });
    toast.success(`${gen.length} contenus générés.`);
  };
  const regen = async (d: Draft) => { setLoading(true); await new Promise((r) => setTimeout(r, 700)); const [g] = generatePosts({ ...p, brief: p.brief + " " }, s).sort(() => Math.random() - 0.5); setDrafts((ds) => ds.map((x) => (x.tmpId === d.tmpId ? { ...g, tmpId: d.tmpId } : x))); setLoading(false); toast.success("Contenu régénéré."); };
  const copy = (d: { title: string; text: string; hashtags: string[]; cta: string }) => { navigator.clipboard?.writeText(`${d.title}\n\n${d.text}\n\n${d.cta}\n\n${d.hashtags.join(" ")}`); toast.success("Contenu copié."); };
  const save = (d: Draft, status: PostStatus = "Généré") => { const { tmpId, imageUrl: _imageUrl, displayStatus: _displayStatus, displayAt: _displayAt, ...rest } = d; s.addPost({ ...rest, status }); setDrafts((ds) => ds.filter((x) => x.tmpId !== tmpId)); s.log({ agent: "Community Manager", action: "Contenu enregistré", target: d.title, result: status, status: "Succès", link: "/agents/cm/idees" }); toast.success("Contenu enregistré dans l'historique."); };
  const doSchedule = () => {
    if (!schedule) return; const at = new Date(schedule.at).toISOString();
    if (schedule.draft) { const { tmpId, imageUrl: _imageUrl, displayStatus: _displayStatus, displayAt: _displayAt, ...rest } = schedule.draft; s.addPost({ ...rest, status: "Planifié", scheduledAt: at }); setDrafts((ds) => ds.filter((x) => x.tmpId !== tmpId)); }
    if (schedule.post) s.updatePost(schedule.post.id, { status: "Planifié", scheduledAt: at });
    const scheduledContent = schedule.draft ?? schedule.post;
    if (!scheduledContent) return;
    s.log({ agent: "Community Manager", action: "Ajout au planning", target: scheduledContent.title, result: fmtDate(at), status: "Succès", link: "/agents/cm/planning" });
    setSchedule(null); toast.success("Ajouté au planning.", { action: { label: "Voir le planning", onClick: () => navigate({ to: "/agents/cm/planning" }) } });
  };
  const defaultAt = () => { const d = new Date(); d.setDate(d.getDate() + 2); d.setHours(18, 0, 0, 0); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); };
  const createPost = () => setEdit({ tmpId: Math.random().toString(36).slice(2), title: "", text: "", hashtags: [], cta: p.cta, network: p.network, type: p.type, productId: p.productId, collection: p.collection, objective: p.objective, tone: p.tone, language: p.language, status: "Brouillon" });

  const Card = ({ d, actions }: { d: Draft; actions: React.ReactNode }) => (
    <div className="surface flex min-h-0 flex-col overflow-hidden">
      {d.imageUrl && <img src={d.imageUrl} alt={d.title} className="aspect-[4/3] w-full object-cover" />}
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex flex-wrap items-center gap-1.5"><StatusBadge status={d.network} /><span className="rounded border px-1.5 py-0.5 text-[11px]">{d.type}</span><span className="ml-auto"><StatusBadge status={d.displayStatus ?? d.status} /></span></div>
        <h3 className="font-semibold leading-snug">{d.title}</h3>
        <p className="mt-2 line-clamp-3 flex-1 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{d.text}</p>
        {d.displayAt && <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground"><Clock className="h-3.5 w-3.5" />{d.displayAt}</p>}
        <div className="mt-3 grid grid-cols-2 gap-1.5 border-t pt-3">{actions}</div>
      </div>
    </div>
  );

  return (
    <div>
      <PageHeader eyebrow="Agent IA · Community Manager" title="CM — Idées" description="Données → Analyse IA → Recommandation → Validation humaine → Publication."
        actions={<><Button variant="outline" onClick={createPost}><Pencil className="h-4 w-4" /> Créer un post</Button><Button className="bg-gold text-gold-foreground hover:bg-gold/90" onClick={generate} disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Générer une idée</Button></>} />
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label="Contenus" value={s.posts.length} icon={Layers3} accent />
        <KpiCard label="Brouillons" value={s.posts.filter((x) => ["Brouillon", "Généré"].includes(x.status)).length} icon={FileEdit} />
        <KpiCard label="Planifiés" value={s.posts.filter((x) => x.status === "Planifié").length} icon={CalendarPlus} />
        <KpiCard label="Publiés" value={s.posts.filter((x) => x.status === "Publié").length} icon={Send} />
      </div>
      <div className="space-y-4">
        <Section title="Créer une idée de contenu" description="Décrivez votre idée et choisissez ses paramètres">
          <div className="space-y-3">
            <Field label="Votre idée"><Textarea rows={3} value={p.brief} onChange={(e) => setP({ ...p, brief: e.target.value })} placeholder="Décrivez le contenu que vous souhaitez créer…" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Réseau"><Select value={p.network} onValueChange={(v) => setP({ ...p, network: v as Network })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["Instagram", "Facebook", "TikTok"].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select></Field>
              <Field label="Type"><Select value={p.type} onValueChange={(v) => setP({ ...p, type: v as PostType })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["Publication", "Carrousel", "Story", "Reel", "Vidéo"].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select></Field>
              <Field label="Produit"><Select value={p.productId ?? "none"} onValueChange={(v) => { const pr = s.products.find((x) => x.id === v); setP({ ...p, productId: v === "none" ? undefined : v, collection: pr?.collection ?? p.collection }); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Aucun</SelectItem>{s.products.map((x) => <SelectItem key={x.id} value={x.id}>{x.name}</SelectItem>)}</SelectContent></Select></Field>
              <Field label="Collection"><Select value={p.collection || "none"} onValueChange={(v) => setP({ ...p, collection: v === "none" ? "" : (v as GenParams["collection"]) })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Aucune</SelectItem>{COLLECTIONS.map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select></Field>
              <Field label="Objectif"><Select value={p.objective} onValueChange={(v) => setP({ ...p, objective: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["Notoriété", "Engagement", "Vente", "Présentation produit", "Inspiration"].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select></Field>
              <Field label="Ton"><Select value={p.tone} onValueChange={(v) => setP({ ...p, tone: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["Premium", "Élégant", "Authentique", "Institutionnel", "Inspirant"].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select></Field>
              <Field label="Langue"><Select value={p.language} onValueChange={(v) => setP({ ...p, language: v as GenParams["language"] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["FR", "EN", "AR"].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select></Field>
              <Field label="Longueur"><Select value={p.length} onValueChange={(v) => setP({ ...p, length: v as GenParams["length"] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["Court", "Moyen", "Long"].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select></Field>
            </div>
            <Field label="Audience"><Input value={p.audience} onChange={(e) => setP({ ...p, audience: e.target.value })} /></Field>
            <Field label="Call-to-action (optionnel)"><Input value={p.cta} onChange={(e) => setP({ ...p, cta: e.target.value })} placeholder="Par défaut selon la langue" /></Field>
            <div className="flex justify-end"><Button className="bg-gold text-gold-foreground hover:bg-gold/90" onClick={generate} disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Générer une idée</Button></div>
            {s.cmSettings.humanValidation && <p className="text-[11px] text-muted-foreground"><Check className="mr-1 inline h-3 w-3 text-success" />Validation humaine obligatoire activée : aucun contenu n'est publié sans votre accord.</p>}
          </div>
        </Section>

          <Section title="Idées de contenus" description={drafts.length ? `${drafts.length} propositions prêtes à être affinées` : "Lancez une génération pour obtenir des propositions"}>
            {loading && drafts.length === 0 ? <div className="grid gap-3 md:grid-cols-3">{[0, 1, 2].map((i) => <div key={i} className="h-64 animate-pulse rounded-lg bg-secondary" />)}</div>
              : drafts.length === 0 ? <div className="flex flex-col items-center py-10 text-center text-sm text-muted-foreground"><Lightbulb className="mb-2 h-8 w-8 text-gold" />L'agent proposera 3 variantes éditables adaptées au réseau choisi.</div>
              : <div className="grid gap-3 md:grid-cols-3">{drafts.map((d) => <Card key={d.tmpId} d={d} actions={<>
                <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setDetail(d)}><Eye className="h-3.5 w-3.5" /> Voir le détail</Button>
                <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setEdit(d)}><Pencil className="h-3.5 w-3.5" /> Modifier</Button>
                <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => regen(d)} disabled={loading}><RefreshCw className="h-3.5 w-3.5" /> Régénérer</Button>
                <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => copy(d)}><Copy className="h-3.5 w-3.5" /> Copier</Button>
                <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => save(d)}><Save className="h-3.5 w-3.5" /> Enregistrer</Button>
                <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setSchedule({ draft: d, at: defaultAt() })}><CalendarPlus className="h-3.5 w-3.5" /> Planifier</Button>
                <Button size="sm" className="h-8 bg-gold text-xs text-gold-foreground hover:bg-gold/90" onClick={() => save(d, "Publié")}><Send className="h-3.5 w-3.5" /> Publier</Button>
                <Button size="sm" variant="ghost" className="h-8 text-xs text-destructive" onClick={() => setDrafts((ds) => ds.filter((x) => x.tmpId !== d.tmpId))}><Trash2 className="h-3.5 w-3.5" /> Supprimer</Button>
              </>} />)}</div>}
          </Section>

          <Section title="Historique des contenus" description={`${history.length} contenu(s)`} noPadding>
            <div className="flex flex-wrap gap-2 border-b p-3">
              <SearchInput value={hq} onChange={setHq} placeholder="Mot-clé, produit…" className="w-60" />
              <Select value={hStatus} onValueChange={setHStatus}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Tous statuts</SelectItem>{STATUSES.map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select>
              <Select value={hNet} onValueChange={setHNet}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Tous réseaux</SelectItem>{["Instagram", "Facebook", "TikTok"].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select>
              <Select value={hColl} onValueChange={setHColl}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Toutes collections</SelectItem>{COLLECTIONS.map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select>
            </div>
            {history.length === 0 ? <div className="p-4"><EmptyState icon={Lightbulb} title="Aucun contenu" description="Générez et enregistrez vos premiers contenus." /></div> : (
              <ul className="divide-y">
                {history.map((x) => (
                  <li key={x.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                    <StatusBadge status={x.network} /><span className="w-20 text-xs text-muted-foreground">{x.type}</span>
                    <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{x.title}</div><div className="truncate text-xs text-muted-foreground">{x.text}</div></div>
                    <span className="text-xs text-muted-foreground">{x.collection || "—"}</span><span className="w-24 text-xs text-muted-foreground">{x.scheduledAt ? fmtDate(x.scheduledAt) : fmtDate(x.createdAt)}</span><StatusBadge status={x.status} />
                    <div className="flex gap-0.5">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditPost(x)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => copy(x)}><Copy className="h-3.5 w-3.5" /></Button>
                      {["Brouillon", "Généré", "Validé"].includes(x.status) && <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setSchedule({ post: x, at: defaultAt() })}><CalendarPlus className="h-3.5 w-3.5" /></Button>}
                      {["Généré", "Brouillon"].includes(x.status) && <Button size="icon" variant="ghost" className="h-7 w-7 text-success" onClick={() => { s.updatePost(x.id, { status: "Validé" }); toast.success("Contenu validé."); }}><Check className="h-3.5 w-3.5" /></Button>}
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setDel(x.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>
      </div>

      {/* Edit draft / post */}
      <Dialog open={!!edit || !!editPost} onOpenChange={(o) => { if (!o) { setEdit(null); setEditPost(null); } }}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>Modifier le contenu</DialogTitle></DialogHeader>
          {(() => { const cur = edit ?? editPost; if (!cur) return null; const upd = (patch: Partial<typeof cur>) => (edit ? setEdit({ ...edit, ...patch } as Draft) : setEditPost({ ...(editPost as SocialPost), ...patch })); return (
            <div className="space-y-3">
              <Field label="Titre"><Input value={cur.title} onChange={(e) => upd({ title: e.target.value })} /></Field>
              <Field label="Texte"><Textarea rows={6} value={cur.text} onChange={(e) => upd({ text: e.target.value })} /></Field>
              <Field label="Hashtags"><Input value={cur.hashtags.join(" ")} onChange={(e) => upd({ hashtags: e.target.value.split(/\s+/).filter(Boolean) })} /></Field>
              <Field label="CTA"><Input value={cur.cta} onChange={(e) => upd({ cta: e.target.value })} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Réseau"><Select value={cur.network} onValueChange={(v) => upd({ network: v as Network })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["Instagram", "Facebook", "TikTok"].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select></Field>
                <Field label="Statut"><Select value={cur.status} onValueChange={(v) => upd({ status: v as PostStatus })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATUSES.map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select></Field>
                <Field label="Produit associé" className="col-span-2"><Select value={cur.productId ?? "none"} onValueChange={(v) => { const product = s.products.find((x) => x.id === v); upd({ productId: v === "none" ? undefined : v, collection: product?.collection ?? cur.collection }); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Aucun</SelectItem>{s.products.map((x) => <SelectItem key={x.id} value={x.id}>{x.name}</SelectItem>)}</SelectContent></Select></Field>
              </div>
            </div>
          ); })()}
          <DialogFooter><Button variant="outline" onClick={() => { setEdit(null); setEditPost(null); }}>Annuler</Button><Button className="bg-gold text-gold-foreground hover:bg-gold/90" onClick={() => { if (edit) { setDrafts((ds) => ds.some((x) => x.tmpId === edit.tmpId) ? ds.map((x) => (x.tmpId === edit.tmpId ? edit : x)) : [edit, ...ds]); setEdit(null); } if (editPost) { const { id, ...rest } = editPost; s.updatePost(id, rest); setEditPost(null); } toast.success("Modifications enregistrées."); }}>Enregistrer</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!schedule} onOpenChange={(o) => !o && setSchedule(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Ajouter au planning</DialogTitle></DialogHeader>
          <Field label="Date et heure de publication"><Input type="datetime-local" value={schedule?.at ?? ""} onChange={(e) => schedule && setSchedule({ ...schedule, at: e.target.value })} /></Field>
          <p className="text-xs text-muted-foreground">Créneaux recommandés : {s.cmSettings.allowedHours.join(", ")} — {s.cmSettings.allowedDays.join(", ")}.</p>
          <DialogFooter><Button variant="outline" onClick={() => setSchedule(null)}>Annuler</Button><Button className="bg-gold text-gold-foreground hover:bg-gold/90" onClick={doSchedule}>Planifier</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-2xl overflow-hidden p-0">
          {detail?.imageUrl && <img src={detail.imageUrl} alt={detail.title} className="aspect-[16/8] w-full object-cover" />}
          {detail && <div className="space-y-4 p-6">
            <DialogHeader><DialogTitle>{detail.title}</DialogTitle></DialogHeader>
            <div className="flex flex-wrap items-center gap-2"><StatusBadge status={detail.network} /><span className="rounded border px-2 py-1 text-xs">{detail.type}</span><StatusBadge status={detail.displayStatus ?? detail.status} />{detail.displayAt && <span className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground"><Clock className="h-3.5 w-3.5" />{detail.displayAt}</span>}</div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{detail.text}</p>
            {detail.cta && <p className="text-sm font-medium text-gold">{detail.cta}</p>}
            <p className="text-xs text-info">{detail.hashtags.join(" ")}</p>
            <DialogFooter><Button variant="outline" onClick={() => { setEdit(detail); setDetail(null); }}><Pencil className="h-4 w-4" /> Modifier</Button><Button className="bg-gold text-gold-foreground hover:bg-gold/90" onClick={() => { setSchedule({ draft: detail, at: defaultAt() }); setDetail(null); }}><CalendarPlus className="h-4 w-4" /> Planifier</Button></DialogFooter>
          </div>}
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={!!del} onOpenChange={(o) => !o && setDel(null)} title="Supprimer ce contenu ?" onConfirm={() => { if (del) { s.deletePost(del); toast.success("Élément supprimé."); setDel(null); } }} />
    </div>
  );
}
