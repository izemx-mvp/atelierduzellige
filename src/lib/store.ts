import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  Client, Prospect, Product, Sample, Quote, Order, Shipment, Appointment, Message,
  SocialPost, ActivityLog, Notification, FollowUpRule, FollowUp, OrderInsight, CMSettings,
  AppSettings, Session, Task, OrderStatus, OrderStep, QuoteLine,
} from "./types";
import { ORDER_STATUSES } from "./types";
import {
  seedClients, seedProspects, seedProducts, seedSamples, seedQuotes, seedOrders, seedShipments,
  seedAppointments, seedMessages, seedPosts, seedActivities, seedNotifications, seedTasks,
  seedFollowUpRules, seedCMSettings, seedSettings, uid,
} from "./seed";

export { uid };

type Patch<T> = Partial<T>;

export interface DataState {
  clients: Client[]; prospects: Prospect[]; products: Product[]; samples: Sample[]; quotes: Quote[];
  orders: Order[]; shipments: Shipment[]; appointments: Appointment[]; messages: Message[];
  posts: SocialPost[]; activities: ActivityLog[]; notifications: Notification[]; tasks: Task[];
  followUpRules: FollowUpRule[]; followUps: FollowUp[]; insights: OrderInsight[];
  cmSettings: CMSettings; settings: AppSettings; session: Session | null;
  counters: { quote: number; order: number; sample: number };
}

export interface Actions {
  // auth
  login: (email: string, password: string) => boolean;
  logout: () => void;
  // generic
  log: (a: Omit<ActivityLog, "id" | "date">) => void;
  notify: (n: Omit<Notification, "id" | "date" | "read">) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  // clients
  addClient: (c: Omit<Client, "id" | "createdAt" | "lastActivity">) => Client;
  updateClient: (id: string, p: Patch<Client>) => void;
  deleteClient: (id: string) => void;
  // prospects
  addProspect: (p: Omit<Prospect, "id" | "createdAt" | "lastActivity" | "notes"> & { notes?: Prospect["notes"] }) => Prospect;
  updateProspect: (id: string, p: Patch<Prospect>) => void;
  deleteProspect: (id: string) => void;
  moveProspect: (id: string, stage: Prospect["stage"]) => void;
  addProspectNote: (id: string, text: string) => void;
  convertProspect: (id: string) => Client | null;
  // products
  addProduct: (p: Omit<Product, "id" | "createdAt">) => Product;
  updateProduct: (id: string, p: Patch<Product>) => void;
  deleteProduct: (id: string) => void;
  adjustStock: (id: string, delta: number) => void;
  // samples
  addSample: (s: Omit<Sample, "id" | "createdAt" | "reference">) => Sample;
  updateSample: (id: string, p: Patch<Sample>) => void;
  deleteSample: (id: string) => void;
  // quotes
  addQuote: (q: Omit<Quote, "id" | "number" | "createdAt">) => Quote;
  updateQuote: (id: string, p: Patch<Quote>) => void;
  deleteQuote: (id: string) => void;
  duplicateQuote: (id: string) => Quote | null;
  setQuoteStatus: (id: string, status: Quote["status"]) => void;
  createOrderFromQuote: (quoteId: string) => Order | null;
  // orders
  addOrder: (o: Omit<Order, "id" | "number" | "createdAt" | "steps" | "notes"> & { steps?: OrderStep[]; notes?: Order["notes"] }) => Order;
  updateOrder: (id: string, p: Patch<Order>) => void;
  deleteOrder: (id: string) => void;
  setOrderStatus: (id: string, status: OrderStatus) => void;
  addOrderNote: (id: string, text: string) => void;
  // shipments
  addShipment: (s: Omit<Shipment, "id" | "createdAt">) => Shipment;
  updateShipment: (id: string, p: Patch<Shipment>) => void;
  deleteShipment: (id: string) => void;
  // appointments
  addAppointment: (a: Omit<Appointment, "id" | "createdAt" | "reminders"> & { reminders?: Appointment["reminders"] }) => Appointment;
  updateAppointment: (id: string, p: Patch<Appointment>) => void;
  deleteAppointment: (id: string) => void;
  // messages
  addMessage: (m: Omit<Message, "id" | "date" | "read"> & { date?: string; read?: boolean }) => Message;
  updateMessage: (id: string, p: Patch<Message>) => void;
  deleteMessage: (id: string) => void;
  // posts
  addPost: (p: Omit<SocialPost, "id" | "createdAt">) => SocialPost;
  updatePost: (id: string, p: Patch<SocialPost>) => void;
  deletePost: (id: string) => void;
  // tasks
  addTask: (t: Omit<Task, "id" | "createdAt" | "done">) => Task;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  // follow-ups & insights
  setFollowUps: (f: FollowUp[]) => void;
  updateFollowUp: (id: string, p: Patch<FollowUp>) => void;
  updateFollowUpRule: (id: string, p: Patch<FollowUpRule>) => void;
  addFollowUpRule: (r: Omit<FollowUpRule, "id">) => void;
  deleteFollowUpRule: (id: string) => void;
  setInsights: (i: OrderInsight[]) => void;
  resolveInsight: (id: string) => void;
  // settings
  updateCMSettings: (p: Patch<CMSettings>) => void;
  updateSettings: (p: Patch<AppSettings>) => void;
  setTheme: (t: "light" | "dark") => void;
  resetDemo: () => void;
}

const initialData = (): DataState => ({
  clients: seedClients, prospects: seedProspects, products: seedProducts, samples: seedSamples,
  quotes: seedQuotes, orders: seedOrders, shipments: seedShipments, appointments: seedAppointments,
  messages: seedMessages, posts: seedPosts, activities: seedActivities, notifications: seedNotifications,
  tasks: seedTasks, followUpRules: seedFollowUpRules, followUps: [], insights: [],
  cmSettings: seedCMSettings, settings: seedSettings, session: null,
  counters: { quote: 9, order: 27, sample: 20 },
});

const now = () => new Date().toISOString();
const pad = (n: number) => String(n).padStart(3, "0");
const year = () => new Date().getFullYear();

export const lineTotal = (l: QuoteLine) => l.quantity * l.unitPrice * (1 - (l.discount || 0) / 100);
export const quoteTotals = (q: Pick<Quote, "lines" | "globalDiscount" | "fees" | "vatRate">) => {
  const subtotal = q.lines.reduce((s, l) => s + lineTotal(l), 0);
  const lineDiscounts = q.lines.reduce((s, l) => s + l.quantity * l.unitPrice * ((l.discount || 0) / 100), 0);
  const ht = Math.max(0, subtotal - (q.globalDiscount || 0) + (q.fees || 0));
  const vat = ht * ((q.vatRate || 0) / 100);
  return { subtotal, lineDiscounts, discount: q.globalDiscount || 0, fees: q.fees || 0, ht, vat, ttc: ht + vat };
};

const buildSteps = (startISO: string, owner: string): OrderStep[] => {
  const gaps = [0, 3, 24, 30, 33, 36, 46];
  return ORDER_STATUSES.map((name, i) => {
    const dt = new Date(startISO); dt.setDate(dt.getDate() + gaps[i]);
    return { name, plannedDate: dt.toISOString(), actualDate: i === 0 ? startISO : undefined, owner };
  });
};

export const useStore = create<DataState & Actions>()(
  persist(
    (set, get) => {
      const upd = <K extends keyof DataState>(key: K, id: string, p: object) =>
        set((s) => ({ [key]: (s[key] as { id: string }[]).map((x) => (x.id === id ? { ...x, ...p } : x)) }) as Pick<DataState, K>);
      const del = <K extends keyof DataState>(key: K, id: string) =>
        set((s) => ({ [key]: (s[key] as { id: string }[]).filter((x) => x.id !== id) }) as Pick<DataState, K>);
      const log: Actions["log"] = (a) => set((s) => ({ activities: [{ id: uid(), date: now(), ...a }, ...s.activities] }));
      const notify: Actions["notify"] = (n) => set((s) => ({ notifications: [{ id: uid(), date: now(), read: false, ...n }, ...s.notifications] }));

      return {
        ...initialData(),
        login: (email, password) => {
          if (email.trim().toLowerCase() === "admin@atelierduzellige.ma" && password === "admin123") {
            set({ session: { email, name: get().settings.profile.name, loggedAt: now() } });
            return true;
          }
          return false;
        },
        logout: () => set({ session: null }),
        log, notify,
        markNotificationRead: (id) => upd("notifications", id, { read: true }),
        markAllNotificationsRead: () => set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),

        addClient: (c) => { const n: Client = { ...c, id: uid(), createdAt: now(), lastActivity: now() }; set((s) => ({ clients: [n, ...s.clients] })); log({ agent: "Utilisateur", action: "Création client", target: n.name, result: "Client créé", status: "Succès", link: `/clients/${n.id}` }); return n; },
        updateClient: (id, p) => upd("clients", id, { ...p, lastActivity: now() }),
        deleteClient: (id) => { del("clients", id); log({ agent: "Utilisateur", action: "Suppression client", target: id, result: "Supprimé", status: "Succès" }); },

        addProspect: (p) => { const n: Prospect = { notes: [], ...p, id: uid(), createdAt: now(), lastActivity: now() }; set((s) => ({ prospects: [n, ...s.prospects] })); log({ agent: "Utilisateur", action: "Création prospect", target: n.name, result: `Étape ${n.stage}`, status: "Succès", link: `/prospects/${n.id}` }); return n; },
        updateProspect: (id, p) => upd("prospects", id, { ...p, lastActivity: now() }),
        deleteProspect: (id) => del("prospects", id),
        moveProspect: (id, stage) => { upd("prospects", id, { stage, lastActivity: now() }); },
        addProspectNote: (id, text) => set((s) => ({ prospects: s.prospects.map((p) => p.id === id ? { ...p, lastActivity: now(), notes: [{ id: uid(), text, date: now() }, ...p.notes] } : p) })),
        convertProspect: (id) => {
          const p = get().prospects.find((x) => x.id === id); if (!p) return null;
          if (p.convertedClientId) return get().clients.find((c) => c.id === p.convertedClientId) ?? null;
          const client: Client = { id: uid(), name: p.name, company: p.company, country: p.country, city: "", address: "", email: p.email, phone: p.phone, type: "Architecte", status: "Actif", notes: `Converti depuis le CRM. Projet : ${p.project}.\n${p.notes.map((n) => "- " + n.text).join("\n")}`, createdAt: now(), lastActivity: now(), fromProspectId: p.id };
          set((s) => ({
            clients: [client, ...s.clients],
            prospects: s.prospects.map((x) => x.id === id ? { ...x, stage: "Gagné", convertedClientId: client.id, lastActivity: now() } : x),
            samples: s.samples.map((sm) => sm.contactType === "prospect" && sm.contactId === id ? { ...sm, contactType: "client", contactId: client.id } : sm),
            appointments: s.appointments.map((a) => a.contactType === "prospect" && a.contactId === id ? { ...a, contactType: "client", contactId: client.id } : a),
            messages: s.messages.map((m) => m.contactType === "prospect" && m.contactId === id ? { ...m, contactType: "client", contactId: client.id } : m),
          }));
          log({ agent: "Utilisateur", action: "Conversion prospect", target: `${p.name} → Client`, result: "Client créé", status: "Succès", link: `/clients/${client.id}` });
          notify({ title: "Prospect converti", description: `${p.name} est maintenant client.`, link: `/clients/${client.id}`, severity: "success" });
          return client;
        },

        addProduct: (p) => { const n: Product = { ...p, id: uid(), createdAt: now() }; set((s) => ({ products: [n, ...s.products] })); return n; },
        updateProduct: (id, p) => upd("products", id, p),
        deleteProduct: (id) => del("products", id),
        adjustStock: (id, delta) => set((s) => ({ products: s.products.map((p) => p.id === id ? { ...p, stock: Math.max(0, p.stock + delta), status: p.stock + delta <= 0 ? "Rupture" : p.status === "Rupture" ? "Actif" : p.status } : p) })),

        addSample: (sm) => { const c = get().counters; const n: Sample = { ...sm, id: uid(), reference: `ECH-${year()}-${pad(c.sample)}`, createdAt: now() }; set((s) => ({ samples: [n, ...s.samples], counters: { ...s.counters, sample: c.sample + 1 } })); log({ agent: "Utilisateur", action: "Création échantillon", target: n.reference, result: n.status, status: "Succès", link: "/echantillons" }); return n; },
        updateSample: (id, p) => upd("samples", id, p),
        deleteSample: (id) => del("samples", id),

        addQuote: (q) => { const c = get().counters; const n: Quote = { ...q, id: uid(), number: `ATZ-${year()}-${pad(c.quote)}`, createdAt: now() }; set((s) => ({ quotes: [n, ...s.quotes], counters: { ...s.counters, quote: c.quote + 1 } })); log({ agent: "Utilisateur", action: "Création devis", target: n.number, result: n.status, status: "Succès", link: `/devis/${n.id}` }); return n; },
        updateQuote: (id, p) => upd("quotes", id, p),
        deleteQuote: (id) => del("quotes", id),
        duplicateQuote: (id) => { const q = get().quotes.find((x) => x.id === id); if (!q) return null; const exp = new Date(); exp.setDate(exp.getDate() + 30); const { id: _i, number: _n, orderId: _o, sentAt: _s, ...rest } = q; return get().addQuote({ ...rest, status: "Brouillon", createdAt: now(), expiresAt: exp.toISOString(), lines: q.lines.map((l) => ({ ...l, id: uid() })) } as Omit<Quote, "id" | "number" | "createdAt">); },
        setQuoteStatus: (id, status) => { const q = get().quotes.find((x) => x.id === id); upd("quotes", id, { status, ...(status === "Envoyé" ? { sentAt: now() } : {}) }); if (q) log({ agent: "Utilisateur", action: "Changement de statut devis", target: q.number, result: status, status: "Succès", link: `/devis/${id}` }); },
        createOrderFromQuote: (quoteId) => {
          const q = get().quotes.find((x) => x.id === quoteId); if (!q) return null;
          if (q.orderId) return get().orders.find((o) => o.id === q.orderId) ?? null;
          const client = get().clients.find((c) => c.id === q.clientId);
          const t = quoteTotals(q);
          const due = new Date(); due.setDate(due.getDate() + 46);
          const o = get().addOrder({ clientId: q.clientId, quoteId: q.id, projectName: q.projectName, lines: q.lines, totalHT: t.ht, totalTTC: t.ttc, status: "Confirmée", dueDate: due.toISOString(), owner: "Hassan Idrissi", deliveryAddress: client?.address ?? "", deliveryCountry: client?.country ?? "", notes: q.notes ? [{ id: uid(), text: `Note devis : ${q.notes}`, date: now(), author: "Système" }] : [] });
          upd("quotes", quoteId, { orderId: o.id });
          notify({ title: "Commande créée", description: `${o.number} créée depuis le devis ${q.number}.`, link: `/commandes/${o.id}`, severity: "success" });
          return o;
        },

        addOrder: (o) => { const c = get().counters; const created = now(); const n: Order = { notes: [], ...o, id: uid(), number: `CMD-${year()}-${pad(c.order)}`, createdAt: created, steps: o.steps ?? buildSteps(created, o.owner) }; set((s) => ({ orders: [n, ...s.orders], counters: { ...s.counters, order: c.order + 1 } })); log({ agent: "Utilisateur", action: "Création commande", target: n.number, result: n.status, status: "Succès", link: `/commandes/${n.id}` }); return n; },
        updateOrder: (id, p) => upd("orders", id, p),
        deleteOrder: (id) => del("orders", id),
        setOrderStatus: (id, status) => {
          const o = get().orders.find((x) => x.id === id); if (!o) return;
          const idx = ORDER_STATUSES.indexOf(status);
          const steps = o.steps.map((st, i) => i < idx ? { ...st, actualDate: st.actualDate ?? now() } : i === idx ? { ...st, actualDate: now() } : { ...st, actualDate: undefined });
          upd("orders", id, { status, steps });
          log({ agent: "Utilisateur", action: "Avancement commande", target: o.number, result: status, status: "Succès", link: `/commandes/${id}` });
          if (status === "Expédiée" && !get().shipments.some((s) => s.orderId === id)) {
            const eta = new Date(); eta.setDate(eta.getDate() + 10);
            get().addShipment({ orderId: id, carrier: "À définir", trackingNumber: "", destinationCountry: o.deliveryCountry, address: o.deliveryAddress, shippedAt: now(), eta: eta.toISOString(), status: "Expédié", issue: null, incoterm: "EXW Fès", weightKg: 0 });
          }
        },
        addOrderNote: (id, text) => set((s) => ({ orders: s.orders.map((o) => o.id === id ? { ...o, notes: [{ id: uid(), text, date: now(), author: s.settings.profile.name }, ...o.notes] } : o) })),

        addShipment: (sh) => { const n: Shipment = { ...sh, id: uid(), createdAt: now() }; set((s) => ({ shipments: [n, ...s.shipments] })); return n; },
        updateShipment: (id, p) => upd("shipments", id, p),
        deleteShipment: (id) => del("shipments", id),

        addAppointment: (a) => { const n: Appointment = { reminders: [{ at: "24h", sent: false }, { at: "1h", sent: false }], ...a, id: uid(), createdAt: now() }; set((s) => ({ appointments: [n, ...s.appointments] })); log({ agent: "Utilisateur", action: "Création rendez-vous", target: n.title, result: n.status, status: "Succès", link: "/agents/booking" }); return n; },
        updateAppointment: (id, p) => upd("appointments", id, p),
        deleteAppointment: (id) => del("appointments", id),

        addMessage: (m) => { const n: Message = { read: m.direction === "out", date: now(), ...m, id: uid() }; set((s) => ({ messages: [n, ...s.messages] })); return n; },
        updateMessage: (id, p) => upd("messages", id, p),
        deleteMessage: (id) => del("messages", id),

        addPost: (p) => { const n: SocialPost = { ...p, id: uid(), createdAt: now() }; set((s) => ({ posts: [n, ...s.posts] })); return n; },
        updatePost: (id, p) => upd("posts", id, p),
        deletePost: (id) => del("posts", id),

        addTask: (t) => { const n: Task = { ...t, id: uid(), createdAt: now(), done: false }; set((s) => ({ tasks: [n, ...s.tasks] })); return n; },
        toggleTask: (id) => set((s) => ({ tasks: s.tasks.map((t) => t.id === id ? { ...t, done: !t.done } : t) })),
        deleteTask: (id) => del("tasks", id),

        setFollowUps: (f) => set({ followUps: f }),
        updateFollowUp: (id, p) => upd("followUps", id, p),
        updateFollowUpRule: (id, p) => upd("followUpRules", id, p),
        addFollowUpRule: (r) => set((s) => ({ followUpRules: [...s.followUpRules, { ...r, id: uid() }] })),
        deleteFollowUpRule: (id) => del("followUpRules", id),
        setInsights: (i) => set({ insights: i }),
        resolveInsight: (id) => upd("insights", id, { resolved: true }),

        updateCMSettings: (p) => set((s) => ({ cmSettings: { ...s.cmSettings, ...p } })),
        updateSettings: (p) => set((s) => ({ settings: { ...s.settings, ...p } })),
        setTheme: (t) => { set((s) => ({ settings: { ...s.settings, theme: t } })); if (typeof document !== "undefined") document.documentElement.classList.toggle("dark", t === "dark"); },
        resetDemo: () => { const session = get().session; set({ ...initialData(), session }); },
      };
    },
    {
      name: "atz-erp-v1",
      storage: createJSONStorage(() =>
        typeof window !== "undefined"
          ? window.localStorage
          : // SSR fallback: no-op storage so the persist API exists during server rendering.
            { getItem: () => null, setItem: () => {}, removeItem: () => {} },
      ),
      partialize: (s) => Object.fromEntries(Object.entries(s).filter(([, v]) => typeof v !== "function")) as DataState,
    },
  ),
);

/** Hydration flag — true once localStorage has been read on the client. */
import { useEffect, useState } from "react";
export function useHydrated() {
  const [h, setH] = useState(useStore.persist.hasHydrated());
  useEffect(() => {
    const unsub = useStore.persist.onFinishHydration(() => setH(true));
    if (useStore.persist.hasHydrated()) setH(true);
    return unsub;
  }, []);
  return h;
}

/* -------- Selectors / helpers -------- */
export const contactName = (s: DataState, type?: "client" | "prospect", id?: string) => {
  if (!type || !id) return "—";
  const x = type === "client" ? s.clients.find((c) => c.id === id) : s.prospects.find((p) => p.id === id);
  return x ? `${x.name}${x.company ? " · " + x.company : ""}` : "—";
};
export const fmtMoney = (n: number, currency = "EUR") => new Intl.NumberFormat("fr-FR", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
export const fmtMoney2 = (n: number, currency = "EUR") => new Intl.NumberFormat("fr-FR", { style: "currency", currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
export const fmtDate = (iso?: string) => (iso ? new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(iso)) : "—");
export const fmtDateTime = (iso?: string) => (iso ? new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(iso)) : "—");
export const daysSince = (iso: string) => Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
export const daysUntil = (iso: string) => Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
export const isOrderLate = (o: Order) => !["Livrée", "Annulée"].includes(o.status) && (new Date(o.dueDate).getTime() < Date.now() || o.steps.some((s) => !s.actualDate && new Date(s.plannedDate).getTime() < Date.now() && ORDER_STATUSES.indexOf(s.name) <= ORDER_STATUSES.indexOf(o.status)));
export const orderProgress = (o: Order) => { if (o.status === "Annulée") return 0; const i = ORDER_STATUSES.indexOf(o.status); return Math.round(((i + 1) / ORDER_STATUSES.length) * 100); };
