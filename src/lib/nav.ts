import {
  LayoutDashboard, Users, Target, Package, FlaskConical, FileText, ShoppingCart, Factory, Ship,
  MessageSquare, Bot, Sparkles, Lightbulb, CalendarRange, SlidersHorizontal, Headset,
  CalendarCheck, Radar, BellRing, BarChart3, Settings, Activity, type LucideIcon,
} from "lucide-react";

export type AppPath =
  | "/dashboard" | "/clients" | "/prospects" | "/produits" | "/echantillons" | "/devis" | "/commandes"
  | "/production" | "/export" | "/communication" | "/agents" | "/agents/cm"
  | "/agents/cm/idees" | "/agents/cm/planning" | "/agents/cm/parametres" | "/agents/service-client"
  | "/agents/booking" | "/agents/suivi-commandes" | "/agents/relances" | "/agents/activite" | "/analytics" | "/parametres";

export interface NavItem {
  label: string;
  to: AppPath;
  icon: LucideIcon;
  children?: NavItem[];
  badgeKey?: "notifications" | "messages" | "lateOrders" | "followUps";
}

export const NAV: NavItem[] = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "Clients", to: "/clients", icon: Users },
  { label: "Prospects / CRM", to: "/prospects", icon: Target },
  { label: "Produits", to: "/produits", icon: Package },
  { label: "Échantillons", to: "/echantillons", icon: FlaskConical },
  { label: "Devis", to: "/devis", icon: FileText },
  { label: "Commandes", to: "/commandes", icon: ShoppingCart, badgeKey: "lateOrders" },
  { label: "Production / Préparation", to: "/production", icon: Factory },
  { label: "Export & Transport", to: "/export", icon: Ship },
  { label: "Communication", to: "/communication", icon: MessageSquare, badgeKey: "messages" },
  {
    label: "Agents IA", to: "/agents", icon: Bot,
    children: [
      {
        label: "Community Manager", to: "/agents/cm", icon: Sparkles,
        children: [
          { label: "CM — Idées", to: "/agents/cm/idees", icon: Lightbulb },
          { label: "CM — Planning", to: "/agents/cm/planning", icon: CalendarRange },
          { label: "CM — Paramètres", to: "/agents/cm/parametres", icon: SlidersHorizontal },
        ],
      },
      { label: "Service Client & Prospection", to: "/agents/service-client", icon: Headset, badgeKey: "messages" },
      { label: "Agent Prise de rendez-vous", to: "/agents/booking", icon: CalendarCheck },
      { label: "Suivi des commandes", to: "/agents/suivi-commandes", icon: Radar, badgeKey: "lateOrders" },
      { label: "Relances", to: "/agents/relances", icon: BellRing, badgeKey: "followUps" },
      { label: "Activity Center", to: "/agents/activite", icon: Activity },
    ],
  },
  { label: "Analytics", to: "/analytics", icon: BarChart3 },
  { label: "Paramètres", to: "/parametres", icon: Settings },
];

export const ROUTE_LABELS: Record<string, string> = {
  dashboard: "Dashboard", clients: "Clients", prospects: "Prospects / CRM", produits: "Produits",
  echantillons: "Échantillons", devis: "Devis", commandes: "Commandes", production: "Production / Préparation",
  export: "Export & Transport", "rendez-vous": "Rendez-vous", communication: "Communication", agents: "Agents IA",
  cm: "Community Manager", idees: "Idées", planning: "Planning", parametres: "Paramètres",
  "service-client": "Service Client & Prospection", booking: "Agent Prise de rendez-vous",
  "suivi-commandes": "Suivi des commandes", relances: "Relances", activite: "Activity Center", analytics: "Analytics",
};
