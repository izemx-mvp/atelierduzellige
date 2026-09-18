import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Atelier du Zellige — ERP" },
      { name: "description", content: "Application de gestion centralisée d'Atelier du Zellige, augmentée par des agents IA." },
      { property: "og:title", content: "Atelier du Zellige — ERP" },
      { property: "og:description", content: "Gestion centralisée : CRM, devis, commandes, export et agents IA." },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
});
