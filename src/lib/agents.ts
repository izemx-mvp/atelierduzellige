/**
 * Simulated AI engines shared by the agent modules.
 * Data → Analyse → Recommandation → Validation humaine → Action → Feedback
 */
import { useEffect, useMemo } from "react";
import { useStore, daysSince, isOrderLate, uid, type DataState } from "./store";
import type { FollowUp, OrderInsight, Message, MessageAnalysis, SocialPost, Network, PostType, Collection } from "./types";

/* ---------- Follow-ups (Relances) ---------- */
export function computeFollowUps(s: DataState): FollowUp[] {
  const out: FollowUp[] = [];
  const rule = (t: string) => s.followUpRules.find((r) => r.trigger === t && r.enabled);
  const cname = (type?: "client" | "prospect", id?: string) => (type === "client" ? s.clients.find((c) => c.id === id)?.name : s.prospects.find((p) => p.id === id)?.name) ?? "Contact";

  const rq = rule("quote");
  if (rq) s.quotes.filter((q) => ["Envoyé", "En attente"].includes(q.status) && daysSince(q.sentAt ?? q.createdAt) >= rq.days).forEach((q) => {
    const n = cname("client", q.clientId);
    out.push({ id: `fu-q-${q.id}`, type: "Devis sans réponse", targetType: "quote", targetId: q.id, contactName: n, daysSince: daysSince(q.sentAt ?? q.createdAt), status: "À traiter", message: `Bonjour ${n.split(" ")[0]},\n\nJe me permets de revenir vers vous concernant notre devis ${q.number} pour le projet « ${q.projectName} ». Avez-vous eu l'occasion de l'étudier ?\n\nJe reste à votre disposition pour tout ajustement (quantités, calepinage, délais).\n\nBien cordialement,\nHouda — Atelier du Zellige` });
  });
  const rs = rule("sample");
  if (rs) s.samples.filter((x) => ["Envoyé", "En attente de validation"].includes(x.status) && daysSince(x.sentDate ?? x.requestDate) >= rs.days).forEach((x) => {
    const n = cname(x.contactType, x.contactId);
    const p = s.products.find((pp) => pp.id === x.productId)?.name ?? "l'échantillon";
    out.push({ id: `fu-s-${x.id}`, type: "Échantillon non validé", targetType: "sample", targetId: x.id, contactName: n, daysSince: daysSince(x.sentDate ?? x.requestDate), status: "À traiter", message: `Bonjour ${n.split(" ")[0]},\n\nVous avez bien reçu l'échantillon ${p} (${x.reference}) ? Nous serions ravis de connaître votre retour sur la teinte et la finition.\n\nSi vous le souhaitez, nous pouvons préparer une proposition chiffrée dès validation.\n\nBien à vous,\nHouda — Atelier du Zellige` });
  });
  const rp = rule("prospect");
  if (rp) s.prospects.filter((p) => !["Gagné", "Perdu"].includes(p.stage) && daysSince(p.lastActivity) >= rp.days).forEach((p) => {
    out.push({ id: `fu-p-${p.id}`, type: "Prospect inactif", targetType: "prospect", targetId: p.id, contactName: p.name, daysSince: daysSince(p.lastActivity), status: "À traiter", message: `Bonjour ${p.name.split(" ")[0]},\n\nJ'espère que votre projet « ${p.project} » avance bien. Souhaitez-vous que nous échangions sur les prochaines étapes ? Je peux vous proposer un créneau cette semaine, ou vous envoyer une sélection d'échantillons.\n\nÀ très bientôt,\nHouda — Atelier du Zellige` });
  });
  const ro = rule("order");
  if (ro) s.orders.filter((o) => o.blocked).forEach((o) => {
    out.push({ id: `fu-o-${o.id}`, type: "Commande bloquée", targetType: "order", targetId: o.id, contactName: cname("client", o.clientId), daysSince: 2, status: "À traiter", message: `Point interne — ${o.number} bloquée : ${o.blockReason ?? "raison non précisée"}. Merci de confirmer le plan d'action et la nouvelle date prévisionnelle.` });
  });
  const ra = rule("appointment");
  if (ra) s.appointments.filter((a) => a.status === "Proposé" && daysSince(a.createdAt) >= ra.days).forEach((a) => {
    const n = cname(a.contactType, a.contactId);
    out.push({ id: `fu-a-${a.id}`, type: "Rendez-vous non confirmé", targetType: "appointment", targetId: a.id, contactName: n, daysSince: daysSince(a.createdAt), status: "À traiter", message: `Bonjour ${n.split(" ")[0]},\n\nPouvez-vous me confirmer le rendez-vous « ${a.title} » ? Si le créneau ne convient plus, je vous en propose volontiers un autre.\n\nBien cordialement,\nHouda` });
  });
  // Unanswered client messages
  s.messages.filter((m) => m.direction === "in" && m.contactType === "client" && !m.handled && daysSince(m.date) >= 2).forEach((m) => {
    out.push({ id: `fu-m-${m.id}`, type: "Client sans réponse", targetType: "client", targetId: m.contactId!, contactName: m.fromName, daysSince: daysSince(m.date), status: "À traiter", message: `Bonjour ${m.fromName.split(" ")[0]},\n\nMerci pour votre message « ${m.subject} ». Nous revenons vers vous avec les éléments demandés dans les plus brefs délais.\n\nBien à vous,\nHouda — Atelier du Zellige` });
  });
  return out;
}

/* ---------- Order insights ---------- */
export function computeInsights(s: DataState): OrderInsight[] {
  const out: OrderInsight[] = [];
  s.orders.filter((o) => !["Livrée", "Annulée"].includes(o.status)).forEach((o) => {
    if (o.blocked) out.push({ id: `in-b-${o.id}`, orderId: o.id, type: "Commande bloquée", severity: "Haute", message: `${o.number} est bloquée : ${o.blockReason}`, recommendation: "Créer une tâche corrective et informer le client du nouveau délai.", resolved: false });
    if (isOrderLate(o)) {
      const late = o.steps.filter((st) => !st.actualDate && new Date(st.plannedDate).getTime() < Date.now());
      out.push({ id: `in-l-${o.id}`, orderId: o.id, type: "Retard", severity: daysSince(o.dueDate) > 5 ? "Haute" : "Moyenne", message: `${o.number} — ${late.length > 0 ? `étape « ${late[0].name} » en retard` : "date de livraison dépassée"} (${Math.max(daysSince(o.dueDate), 0)} j).`, recommendation: "Relancer le responsable et proposer une nouvelle date au client.", resolved: false });
    }
    const idx = ["Confirmée", "Production", "Préparation", "Contrôle qualité", "Emballage", "Expédiée", "Livrée"].indexOf(o.status);
    if (idx >= 4 && !s.shipments.some((sh) => sh.orderId === o.id)) out.push({ id: `in-t-${o.id}`, orderId: o.id, type: "Transporteur absent", severity: "Moyenne", message: `${o.number} est en ${o.status.toLowerCase()} sans expédition planifiée.`, recommendation: "Créer l'expédition et sélectionner un transporteur.", resolved: false });
    const hasSample = s.samples.some((sm) => sm.contactType === "client" && sm.contactId === o.clientId && sm.status === "Validé");
    if (!hasSample && o.totalHT > 15000 && idx <= 1) out.push({ id: `in-s-${o.id}`, orderId: o.id, type: "Échantillon absent", severity: "Faible", message: `${o.number} (${Math.round(o.totalHT).toLocaleString("fr-FR")} €) sans échantillon validé.`, recommendation: "Faire valider un échantillon avant lancement en production pour limiter le risque de refus.", resolved: false });
    const pending = o.steps.find((st) => !st.actualDate && new Date(st.plannedDate).getTime() < Date.now() - 86400000 * 2 && st.name !== o.status);
    if (pending && !isOrderLate(o)) out.push({ id: `in-m-${o.id}`, orderId: o.id, type: "Étape manquante", severity: "Faible", message: `${o.number} : l'étape « ${pending.name} » n'a pas de date réelle.`, recommendation: "Mettre à jour la timeline de la commande.", resolved: false });
  });
  return out;
}

/* ---------- Message analysis (Service client) ---------- */
export function analyzeMessage(m: Message, s: DataState): MessageAnalysis {
  const t = (m.subject + " " + m.body).toLowerCase();
  const products = s.products.filter((p) => t.includes(p.name.toLowerCase().split(" ")[1]?.toLowerCase() ?? "§§") || t.includes(p.collection.toLowerCase())).map((p) => p.name);
  const colorHints = [["vert", "Atlas Vert Cèdre"], ["green", "Atlas Vert Cèdre"], ["blanc", "Atlas Blanc Neige"], ["white", "Atlas Blanc Neige"], ["majorelle", "Fès Bleu Majorelle"], ["bleu", "Fès Bleu Majorelle"], ["rose", "Marrakech Rose Poudré"]];
  colorHints.forEach(([k, v]) => { if (t.includes(k) && !products.includes(v)) products.push(v); });
  const qtyMatch = m.body.match(/(\d[\d\s.,]*)\s?m²/);
  const budgetMatch = m.body.match(/(\d[\d\s.,-]*)\s?k?\s?(€|eur|\$|usd)/i);
  const isDelay = /retard|delay|expect|attend/.test(t);
  const isQuote = /devis|quote|pricing|price|prix|tarif/.test(t);
  const isMeeting = /rendez-vous|rdv|meeting|appel|call|rencontr/.test(t);
  const isSample = /échantillon|sample|catalog/.test(t);
  const intent = isDelay ? "Suivi de commande" : isMeeting ? "Demande de rendez-vous" : isQuote ? "Demande de devis" : isSample ? "Demande d'échantillons / catalogue" : "Demande d'information";
  const bigProject = /resort|hotel|hôtel|villas|3 000|3000|boutique hotel/.test(t);
  const urgency: MessageAnalysis["urgency"] = isDelay || /rapidement|urgent|asap|fin du mois|waiting/.test(t) ? "Haute" : bigProject ? "Moyenne" : "Faible";
  const countryMap: [RegExp, string][] = [[/göteborg|stockholm|sweden|suède/, "Suède"], [/dakhla|casablanca|marrakech|maroc/, "Maroc"], [/firenze|italia|milano/, "Italie"], [/austin|texas|usa|us\b/, "États-Unis"], [/paris|france/, "France"], [/dubai|uae/, "Émirats Arabes Unis"]];
  const country = countryMap.find(([r]) => r.test(t))?.[1] ?? (m.contactType === "client" ? s.clients.find((c) => c.id === m.contactId)?.country ?? "Non détecté" : m.contactType === "prospect" ? s.prospects.find((p) => p.id === m.contactId)?.country ?? "Non détecté" : "Non détecté");
  let score = 40;
  if (qtyMatch) score += 15; if (budgetMatch) score += 15; if (bigProject) score += 20; if (m.contactType) score += 10; if (isDelay) score = 70;
  score = Math.min(98, score);
  const first = m.fromName.split(" ")[0];
  const suggestedReply = isDelay
    ? `Bonjour ${first},\n\nMerci pour votre message. Nous suivons de près l'avancement de votre commande et revenons vers vous aujourd'hui avec une date d'expédition confirmée et le numéro de suivi.\n\nBien cordialement,\nHouda — Atelier du Zellige`
    : isMeeting
      ? `Bonjour ${first},\n\nMerci pour l'intérêt porté à Atelier du Zellige. Votre projet est passionnant. Je vous propose un échange en visio cette semaine : seriez-vous disponible jeudi à 10h ou vendredi à 14h ?\n\nD'ici là, je vous transmets notre catalogue et nos délais indicatifs.\n\nBien cordialement,\nHouda — Atelier du Zellige`
      : `Bonjour ${first},\n\nMerci pour votre message. Nos zelliges sont fabriqués à la main à Fès et expédiés dans le monde entier. Pour votre projet, je vous propose de recevoir un coffret d'échantillons ainsi qu'une première estimation.\n\nPouvez-vous me préciser la surface totale et la date souhaitée de livraison ?\n\nBien cordialement,\nHouda — Atelier du Zellige`;
  const company = m.contactType === "client" ? s.clients.find((c) => c.id === m.contactId)?.company : m.contactType === "prospect" ? s.prospects.find((p) => p.id === m.contactId)?.company : (m.body.match(/(?:de|of|chez|at)\s+([A-Z][\w&' ]{2,30})/)?.[1] ?? m.fromEmail.split("@")[1]?.split(".")[0]);
  const project = m.subject.replace(/^(re:|fwd:)\s*/i, "");
  return { intent, company: company ?? "Non détecté", country, project, products: products.slice(0, 3), quantity: qtyMatch ? `${qtyMatch[1].trim()} m²` : "Non précisée", budget: budgetMatch ? budgetMatch[0].trim() : "Non précisé", urgency, score, suggestedReply };
}

/* ---------- Content generation (Community Manager) ---------- */
export interface GenParams { brief: string; network: Network; type: PostType; productId?: string; collection?: Collection | ""; objective: string; audience: string; tone: string; language: "FR" | "EN" | "AR"; length: "Court" | "Moyen" | "Long"; cta: string }
export function generatePosts(p: GenParams, s: DataState): Omit<SocialPost, "id" | "createdAt">[] {
  const product = s.products.find((x) => x.id === p.productId);
  const subject = product?.name ?? (p.collection ? `la collection ${p.collection}` : "nos zelliges");
  const coll = product?.collection ?? p.collection ?? "";
  const base = s.cmSettings.hashtags.split(/\s+/).filter(Boolean);
  const extra = coll ? [`#collection${coll.toLowerCase().replace("è", "e")}`] : [];
  const hooks: Record<string, string[]> = {
    FR: [
      `${subject} : la lumière de Fès, carreau après carreau.`,
      `Derrière chaque carreau de ${subject}, des mains, du feu et de la patience.`,
      `${subject} pour un intérieur qui raconte une histoire.`,
    ],
    EN: [
      `${subject}: the light of Fès, tile after tile.`,
      `Behind every piece of ${subject}: hands, fire and patience.`,
      `${subject} — for interiors that tell a story.`,
    ],
    AR: [
      `${subject} : ضوء فاس، بلاطة بعد بلاطة.`,
      `خلف كل بلاطة من ${subject}: أيادٍ ونار وصبر.`,
      `${subject} لمساحات تحكي قصة.`,
    ],
  };
  const bodies: Record<string, string[]> = {
    FR: [
      `${p.brief || `Découvrez ${subject}`}. Façonné à la main dans notre atelier de Fès, chaque carreau porte les variations subtiles de l'émail cuit au feu de bois. Une matière vivante, pensée pour les architectes et décorateurs exigeants${p.audience ? ` — ${p.audience}` : ""}.`,
      `${p.brief || `${subject} s'invite dans vos projets`}. Nos artisans perpétuent un savoir-faire transmis depuis des générations : découpe au menqach, émaillage manuel, cuisson traditionnelle. Le résultat : une surface unique, jamais identique.`,
      `${p.brief || subject}. Du Maroc vers le monde entier : nous accompagnons les projets résidentiels, hôteliers et commerciaux avec des délais maîtrisés et un conseil personnalisé.`,
    ],
    EN: [
      `${p.brief || `Discover ${subject}`}. Hand-shaped in our Fès workshop, each tile carries the subtle variations of wood-fired enamel. A living material for demanding architects and designers${p.audience ? ` — ${p.audience}` : ""}.`,
      `${p.brief || `${subject} for your next project`}. Our artisans carry on a craft handed down for generations: menqach cutting, hand glazing, traditional firing. The result: a surface that is never the same twice.`,
      `${p.brief || subject}. From Morocco to the world: we support residential, hospitality and commercial projects with reliable lead times and tailored advice.`,
    ],
    AR: [
      `${p.brief || `اكتشفوا ${subject}`}. مصنوع يدويًا في ورشتنا بفاس، تحمل كل بلاطة تدرجات المينا المحروقة على نار الحطب. مادة حية لمهندسي الديكور الأكثر تطلبًا.`,
      `${p.brief || subject}. يواصل حرفيونا مهارة توارثوها عبر الأجيال: القطع بالمنقاش، التزجيج اليدوي، والحرق التقليدي.`,
      `${p.brief || subject}. من المغرب إلى العالم: نرافق المشاريع السكنية والفندقية والتجارية بآجال مضبوطة.`,
    ],
  };
  const cut = (txt: string) => (p.length === "Court" ? txt.split(". ")[0] + "." : p.length === "Long" ? txt + (p.language === "EN" ? " Ask us for samples and a tailored quote." : p.language === "AR" ? " اطلبوا عينات وعرض سعر مخصص." : " Demandez vos échantillons et une estimation personnalisée.") : txt);
  const ctaDefault = p.language === "EN" ? "Request samples — link in bio" : p.language === "AR" ? "اطلبوا العينات — الرابط في البايو" : "Demandez vos échantillons — lien en bio";
  return [0, 1, 2].map((i) => ({
    title: hooks[p.language][i],
    text: cut(bodies[p.language][i]),
    hashtags: [...base, ...extra, p.network === "TikTok" ? "#fyp" : "#architecture", i === 1 ? "#craftsmanship" : "#zelligetiles"].slice(0, 8),
    cta: p.cta || ctaDefault,
    network: p.network, type: p.type, productId: p.productId, collection: (coll || "") as Collection | "", objective: p.objective, tone: p.tone, language: p.language, status: "Généré" as const,
  }));
}

/* ---------- Planning optimisation ---------- */
export interface PlanningSuggestion { id: string; title: string; detail: string; apply?: () => void }
export function computePlanningSuggestions(s: DataState): PlanningSuggestion[] {
  const planned = s.posts.filter((p) => p.status === "Planifié" && p.scheduledAt);
  const out: PlanningSuggestion[] = [];
  const perNet: Record<string, number> = { Instagram: 0, Facebook: 0, TikTok: 0 };
  planned.forEach((p) => { perNet[p.network]++; });
  const weekly = s.cmSettings.postsPerWeek;
  if (planned.length < weekly) out.push({ id: "freq", title: `Fréquence insuffisante : ${planned.length} publication(s) planifiée(s) pour un objectif de ${weekly}/semaine`, detail: "Ajouter une publication « Savoir-faire » jeudi à 18h sur Instagram.", apply: () => { const dt = new Date(); dt.setDate(dt.getDate() + ((4 - dt.getDay() + 7) % 7 || 7)); dt.setHours(18, 0, 0, 0); useStore.getState().addPost({ title: "Savoir-faire — Le menqach", text: "Le menqach, marteau tranchant de nos maâlems, découpe chaque carreau à main levée. Une précision millimétrique acquise après des années d'apprentissage.", hashtags: ["#zellige", "#savoirfaire", "#fes", "#artisanat"], cta: "Découvrez l'atelier", network: "Instagram", type: "Reel", collection: "Fès", objective: "Notoriété", tone: "Authentique", language: "FR", status: "Planifié", scheduledAt: dt.toISOString() }); } });
  const emptyNet = (Object.keys(perNet) as Network[]).filter((n) => perNet[n] === 0);
  emptyNet.forEach((n) => out.push({ id: `net-${n}`, title: `Aucune publication planifiée sur ${n}`, detail: `Dupliquer la prochaine publication Instagram vers ${n} en adaptant le format.`, apply: () => { const src = planned.find((p) => p.network === "Instagram") ?? planned[0]; if (!src) return; const dt = new Date(src.scheduledAt!); dt.setDate(dt.getDate() + 1); useStore.getState().addPost({ ...src, network: n, type: n === "TikTok" ? "Vidéo" : src.type, scheduledAt: dt.toISOString(), status: "Planifié" }); } }));
  const collCount: Record<string, number> = {};
  planned.forEach((p) => { collCount[p.collection || "Aucune"] = (collCount[p.collection || "Aucune"] ?? 0) + 1; });
  const missing = ["Atlas", "Fès", "Marrakech", "Sur-mesure"].filter((c) => !collCount[c]);
  if (missing.length) out.push({ id: "coll", title: `Collections absentes du planning : ${missing.join(", ")}`, detail: `Prévoir une publication produit ${missing[0]} la semaine prochaine.`, apply: () => { const prod = s.products.find((p) => p.collection === missing[0]); const dt = new Date(); dt.setDate(dt.getDate() + 7); dt.setHours(12, 0, 0, 0); useStore.getState().addPost({ title: `${prod?.name ?? missing[0]} — Focus produit`, text: `${prod?.description ?? "Découvrez la collection."} Fabriqué à la main à Fès.`, hashtags: ["#zellige", `#${missing[0].toLowerCase()}`], cta: "Demandez un échantillon", network: "Instagram", type: "Publication", productId: prod?.id, collection: missing[0] as Collection, objective: "Présentation produit", tone: "Premium", language: "FR", status: "Planifié", scheduledAt: dt.toISOString() }); } });
  const types = new Set(planned.map((p) => p.type));
  if (!types.has("Reel") && !types.has("Vidéo")) out.push({ id: "video", title: "Aucun contenu vidéo planifié", detail: "Les Reels génèrent 2,4× plus de portée sur votre compte. Convertir la prochaine publication en Reel.", apply: () => { const p = planned.find((x) => x.type === "Publication"); if (p) useStore.getState().updatePost(p.id, { type: "Reel" }); } });
  const promo = planned.filter((p) => p.objective === "Vente").length;
  if (planned.length && promo / planned.length > s.cmSettings.mix.promotion / 100 + 0.2) out.push({ id: "promo", title: "Trop de contenus orientés vente", detail: `${promo}/${planned.length} publications sont promotionnelles ; l'objectif est de ${s.cmSettings.mix.promotion} %. Rééquilibrer vers Inspiration / Savoir-faire.` });
  if (out.length === 0) out.push({ id: "ok", title: "Planning équilibré", detail: "La fréquence, la répartition des réseaux et des collections respectent vos paramètres." });
  return out;
}

/* ---------- Booking slots ---------- */
export function proposeSlots(s: DataState, count = 4): { start: string; end: string }[] {
  const slots: { start: string; end: string }[] = [];
  const busy = s.appointments.filter((a) => a.status !== "Annulé");
  const dt = new Date(); dt.setDate(dt.getDate() + 1); dt.setHours(0, 0, 0, 0);
  for (let day = 0; day < 14 && slots.length < count; day++) {
    const d = new Date(dt); d.setDate(dt.getDate() + day);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    for (const h of [10, 14, 16]) {
      if (slots.length >= count) break;
      const st = new Date(d); st.setHours(h, 0, 0, 0); const en = new Date(st); en.setHours(h + 1);
      const clash = busy.some((a) => new Date(a.start) < en && new Date(a.end) > st);
      if (!clash) slots.push({ start: st.toISOString(), end: en.toISOString() });
    }
  }
  return slots;
}

/* ---------- Hooks ---------- */
export function useBadges() {
  const messages = useStore((s) => s.messages);
  const orders = useStore((s) => s.orders);
  const followUps = useStore((s) => s.followUps);
  const notifications = useStore((s) => s.notifications);
  return useMemo(() => ({
    messages: messages.filter((m) => m.direction === "in" && !m.read).length,
    lateOrders: orders.filter((o) => isOrderLate(o) || o.blocked).length,
    followUps: followUps.filter((f) => f.status === "À traiter").length,
    notifications: notifications.filter((n) => !n.read).length,
  }), [messages, orders, followUps, notifications]);
}

/** Recomputes follow-ups & insights whenever source data changes, preserving user decisions. */
export function useAgentEngines() {
  const quotes = useStore((s) => s.quotes); const samples = useStore((s) => s.samples); const prospects = useStore((s) => s.prospects);
  const orders = useStore((s) => s.orders); const appointments = useStore((s) => s.appointments); const messages = useStore((s) => s.messages);
  const rules = useStore((s) => s.followUpRules); const shipments = useStore((s) => s.shipments);
  useEffect(() => {
    const st = useStore.getState();
    const fresh = computeFollowUps(st);
    const merged = fresh.map((f) => { const prev = st.followUps.find((x) => x.id === f.id); return prev ? { ...f, status: prev.status, message: prev.message, scheduledAt: prev.scheduledAt } : f; });
    if (JSON.stringify(merged) !== JSON.stringify(st.followUps)) st.setFollowUps(merged);
    const ins = computeInsights(st).map((i) => ({ ...i, resolved: st.insights.find((x) => x.id === i.id)?.resolved ?? false }));
    if (JSON.stringify(ins) !== JSON.stringify(st.insights)) st.setInsights(ins);
  }, [quotes, samples, prospects, orders, appointments, messages, rules, shipments]);

  // Simulated reminders for appointments (24h / 1h)
  useEffect(() => {
    const tick = () => {
      const st = useStore.getState();
      st.appointments.forEach((a) => {
        if (a.status !== "Confirmé") return;
        const diff = new Date(a.start).getTime() - Date.now();
        a.reminders.forEach((r) => {
          const limit = r.at === "24h" ? 24 * 3600e3 : 3600e3;
          if (!r.sent && diff > 0 && diff <= limit) {
            st.updateAppointment(a.id, { reminders: a.reminders.map((x) => (x.at === r.at ? { ...x, sent: true } : x)) });
            st.notify({ title: `Rappel ${r.at} — ${a.title}`, description: `Rendez-vous ${a.type.toLowerCase()} prévu ${new Date(a.start).toLocaleString("fr-FR", { weekday: "long", hour: "2-digit", minute: "2-digit" })}.`, link: "/rendez-vous", severity: "info" });
            st.log({ agent: "Prise de rendez-vous", action: `Rappel ${r.at}`, target: a.title, result: "Rappel envoyé (simulé)", status: "Succès", link: "/rendez-vous" });
          }
        });
      });
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [appointments]);
}

export const genId = uid;
