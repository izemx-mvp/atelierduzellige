export type ID = string;

export type ClientType = "Architecte" | "Décorateur" | "Particulier" | "Revendeur" | "Promoteur" | "Hôtel";
export type ClientStatus = "Actif" | "Inactif" | "VIP";

export interface Client {
  id: ID;
  name: string;
  company: string;
  country: string;
  city: string;
  address: string;
  email: string;
  phone: string;
  type: ClientType;
  status: ClientStatus;
  notes: string;
  createdAt: string;
  lastActivity: string;
  fromProspectId?: ID;
}

export type ProspectStage =
  | "Nouveau" | "Contacté" | "Qualifié" | "Échantillon" | "Devis" | "Négociation" | "Gagné" | "Perdu";
export const PROSPECT_STAGES: ProspectStage[] = [
  "Nouveau", "Contacté", "Qualifié", "Échantillon", "Devis", "Négociation", "Gagné", "Perdu",
];

export interface Task {
  id: ID;
  title: string;
  done: boolean;
  dueDate?: string;
  createdAt: string;
  relatedType?: "prospect" | "client" | "order" | "quote" | "sample";
  relatedId?: ID;
  agent?: string;
}

export interface Prospect {
  id: ID;
  name: string;
  company: string;
  country: string;
  email: string;
  phone: string;
  source: "Site web" | "Instagram" | "Salon" | "Recommandation" | "Email" | "LinkedIn";
  stage: ProspectStage;
  project: string;
  estimatedValue: number;
  score: number;
  notes: { id: ID; text: string; date: string }[];
  createdAt: string;
  lastActivity: string;
  convertedClientId?: ID;
}

export type Collection = "Atlas" | "Fès" | "Marrakech" | "Sur-mesure";
export const COLLECTIONS: Collection[] = ["Atlas", "Fès", "Marrakech", "Sur-mesure"];
export type ProductStatus = "Actif" | "Rupture" | "Archivé" | "Nouveauté";

export interface Product {
  id: ID;
  reference: string;
  name: string;
  collection: Collection;
  description: string;
  dimensions: string;
  colors: string[];
  material: string;
  cost: number;
  price: number;
  stock: number;
  minStock: number;
  unit: "m²" | "pièce" | "ml";
  status: ProductStatus;
  imageHue: number;
  createdAt: string;
}

export type SampleStatus = "Demandé" | "En préparation" | "Envoyé" | "En attente de validation" | "Validé" | "Refusé";
export const SAMPLE_STATUSES: SampleStatus[] = ["Demandé", "En préparation", "Envoyé", "En attente de validation", "Validé", "Refusé"];

export interface Sample {
  id: ID;
  reference: string;
  contactType: "client" | "prospect";
  contactId: ID;
  productId: ID;
  quantity: number;
  requestDate: string;
  sentDate?: string;
  status: SampleStatus;
  comments: string;
  createdAt: string;
}

export type QuoteStatus = "Brouillon" | "Envoyé" | "En attente" | "Validé" | "Refusé" | "Expiré";
export const QUOTE_STATUSES: QuoteStatus[] = ["Brouillon", "Envoyé", "En attente", "Validé", "Refusé", "Expiré"];

export interface QuoteLine {
  id: ID;
  productId?: ID;
  reference: string;
  description: string;
  collection: string;
  dimensions: string;
  color: string;
  quantity: number;
  unitPrice: number;
  discount: number; // %
}

export interface Quote {
  id: ID;
  number: string;
  clientId: ID;
  projectName: string;
  projectDescription: string;
  projectType: string;
  projectLocation: string;
  createdAt: string;
  expiresAt: string;
  lines: QuoteLine[];
  globalDiscount: number; // amount
  fees: number;
  vatRate: number;
  status: QuoteStatus;
  paymentTerms: string;
  leadTime: string;
  deliveryTerms: string;
  notes: string;
  orderId?: ID;
  sentAt?: string;
}

export type OrderStatus =
  | "Confirmée" | "Production" | "Préparation" | "Contrôle qualité" | "Emballage" | "Expédiée" | "Livrée" | "Annulée";
export const ORDER_STATUSES: OrderStatus[] = ["Confirmée", "Production", "Préparation", "Contrôle qualité", "Emballage", "Expédiée", "Livrée"];

export interface OrderStep {
  name: OrderStatus;
  plannedDate: string;
  actualDate?: string;
  owner: string;
}

export interface Order {
  id: ID;
  number: string;
  clientId: ID;
  quoteId?: ID;
  projectName: string;
  lines: QuoteLine[];
  totalHT: number;
  totalTTC: number;
  status: OrderStatus;
  steps: OrderStep[];
  createdAt: string;
  dueDate: string;
  owner: string;
  notes: { id: ID; text: string; date: string; author: string }[];
  deliveryAddress: string;
  deliveryCountry: string;
  blocked?: boolean;
  blockReason?: string;
}

export type ShipmentStatus = "Préparation" | "Prêt à expédier" | "Expédié" | "En transit" | "Arrivé" | "Livré";
export const SHIPMENT_STATUSES: ShipmentStatus[] = ["Préparation", "Prêt à expédier", "Expédié", "En transit", "Arrivé", "Livré"];
export type ShipmentIssue = "Retard" | "Blocage douane" | "Problème transporteur" | null;

export interface Shipment {
  id: ID;
  orderId: ID;
  carrier: string;
  trackingNumber: string;
  destinationCountry: string;
  address: string;
  shippedAt?: string;
  eta: string;
  status: ShipmentStatus;
  issue: ShipmentIssue;
  incoterm: string;
  weightKg: number;
  createdAt: string;
}

export type AppointmentStatus = "Proposé" | "Confirmé" | "Annulé" | "Terminé";
export interface Appointment {
  id: ID;
  title: string;
  contactType?: "client" | "prospect";
  contactId?: ID;
  start: string;
  end: string;
  type: "Visite showroom" | "Visio" | "Appel" | "Sur site";
  status: AppointmentStatus;
  participants: string[];
  notes: string;
  reminders: { at: "24h" | "1h"; sent: boolean }[];
  createdAt: string;
}

export interface Message {
  id: ID;
  direction: "in" | "out";
  channel: "Email" | "WhatsApp" | "Instagram" | "Formulaire";
  contactType?: "client" | "prospect";
  contactId?: ID;
  fromName: string;
  fromEmail: string;
  subject: string;
  body: string;
  date: string;
  read: boolean;
  analysis?: MessageAnalysis;
  handled?: boolean;
}

export interface MessageAnalysis {
  intent: string;
  company: string;
  country: string;
  project: string;
  products: string[];
  quantity: string;
  budget: string;
  urgency: "Faible" | "Moyenne" | "Haute";
  score: number;
  suggestedReply: string;
}

export type Network = "Instagram" | "Facebook" | "TikTok";
export type PostType = "Publication" | "Carrousel" | "Story" | "Reel" | "Vidéo";
export type PostStatus = "Brouillon" | "Généré" | "Validé" | "Planifié" | "Publié" | "Archivé";

export interface SocialPost {
  id: ID;
  title: string;
  text: string;
  hashtags: string[];
  cta: string;
  network: Network;
  type: PostType;
  productId?: ID;
  collection?: Collection | "";
  objective: string;
  tone: string;
  language: "FR" | "EN" | "AR";
  status: PostStatus;
  scheduledAt?: string;
  publishedAt?: string;
  createdAt: string;
}

export interface ActivityLog {
  id: ID;
  date: string;
  agent: string; // "Système", "Utilisateur", "Community Manager", etc.
  action: string;
  target: string;
  result: string;
  status: "Succès" | "En attente" | "Refusé" | "Erreur";
  link?: string;
}

export interface Notification {
  id: ID;
  title: string;
  description: string;
  date: string;
  read: boolean;
  link?: string;
  severity: "info" | "warning" | "success" | "error";
}

export interface FollowUpRule {
  id: ID;
  label: string;
  trigger: "quote" | "sample" | "prospect" | "order" | "client" | "appointment";
  days: number;
  action: "Proposer une relance" | "Créer une alerte" | "Créer une tâche";
  enabled: boolean;
}

export interface FollowUp {
  id: ID;
  type: "Devis sans réponse" | "Échantillon non validé" | "Prospect inactif" | "Commande bloquée" | "Client sans réponse" | "Rendez-vous non confirmé";
  targetType: "quote" | "sample" | "prospect" | "order" | "client" | "appointment";
  targetId: ID;
  contactName: string;
  daysSince: number;
  message: string;
  status: "À traiter" | "Planifiée" | "Envoyée" | "Ignorée";
  scheduledAt?: string;
}

export interface OrderInsight {
  id: ID;
  orderId: ID;
  type: "Retard" | "Étape manquante" | "Échantillon absent" | "Transporteur absent" | "Commande bloquée" | "Date dépassée";
  severity: "Haute" | "Moyenne" | "Faible";
  message: string;
  recommendation: string;
  resolved: boolean;
}

export interface CMSettings {
  accounts: { network: Network; connected: boolean; lastSync?: string; handle: string }[];
  autoPublish: boolean;
  autoHashtags: boolean;
  autoTranslate: boolean;
  reminders: boolean;
  mix: { produits: number; inspiration: number; savoirFaire: number; coulisses: number; promotion: number };
  postsPerWeek: number;
  allowedDays: string[];
  allowedHours: string[];
  brandTone: string;
  mustMention: string;
  mustAvoid: string;
  hashtags: string;
  humanValidation: boolean;
}

export interface AppSettings {
  profile: { name: string; email: string; role: string; avatarInitials: string; phone: string };
  theme: "light" | "dark";
  notifications: { email: boolean; inApp: boolean; orders: boolean; quotes: boolean; agents: boolean; appointments: boolean };
  sidebarCMOpen: boolean;
}

export interface Session {
  email: string;
  name: string;
  loggedAt: string;
}
