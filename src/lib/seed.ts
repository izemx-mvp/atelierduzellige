import type {
  Client, Prospect, Product, Sample, Quote, Order, Shipment, Appointment, Message,
  SocialPost, ActivityLog, Notification, FollowUpRule, CMSettings, AppSettings, OrderStep, OrderStatus, Task,
} from "./types";

export const NOW = () => new Date();
export const d = (offsetDays: number, hour = 10, minute = 0) => {
  const x = new Date();
  x.setDate(x.getDate() + offsetDays);
  x.setHours(hour, minute, 0, 0);
  return x.toISOString();
};
export const uid = () => Math.random().toString(36).slice(2, 10);

export const seedClients: Client[] = [
  { id: "c1", name: "Claire Moreau", company: "Studio Moreau Architecture", country: "France", city: "Paris", address: "12 rue de Turenne, 75003 Paris", email: "claire@studiomoreau.fr", phone: "+33 6 12 34 56 78", type: "Architecte", status: "VIP", notes: "Cliente fidèle depuis 2023. Projets hôteliers haut de gamme.", createdAt: d(-420), lastActivity: d(-1) },
  { id: "c2", name: "Yassine Benjelloun", company: "Riad Dar Yassine", country: "Maroc", city: "Marrakech", address: "Derb Sidi Bouloukat 14, Médina, Marrakech", email: "contact@riaddaryassine.ma", phone: "+212 6 61 22 33 44", type: "Hôtel", status: "Actif", notes: "Rénovation complète du patio et des salles de bain.", createdAt: d(-300), lastActivity: d(-3) },
  { id: "c3", name: "Sofia Lindqvist", company: "Lindqvist Interiors", country: "Suède", city: "Stockholm", address: "Strandvägen 7, 114 56 Stockholm", email: "sofia@lindqvist.se", phone: "+46 70 123 45 67", type: "Décorateur", status: "Actif", notes: "Sensible aux teintes naturelles. Préfère la collection Atlas.", createdAt: d(-210), lastActivity: d(-6) },
  { id: "c4", name: "James Whitaker", company: "Whitaker & Co Tiles", country: "Royaume-Uni", city: "Londres", address: "48 Kings Road, London SW3 4UD", email: "james@whitakertiles.co.uk", phone: "+44 7700 900123", type: "Revendeur", status: "Actif", notes: "Revendeur exclusif UK. Commandes trimestrielles.", createdAt: d(-500), lastActivity: d(-12) },
  { id: "c5", name: "Amina El Fassi", company: "Villa Amina", country: "Maroc", city: "Casablanca", address: "Bd de la Corniche, Anfa, Casablanca", email: "amina.elfassi@gmail.com", phone: "+212 6 70 11 22 33", type: "Particulier", status: "Actif", notes: "Cuisine et hammam privé.", createdAt: d(-90), lastActivity: d(-2) },
  { id: "c6", name: "Marco Bianchi", company: "Bianchi Design Milano", country: "Italie", city: "Milan", address: "Via Brera 21, 20121 Milano", email: "marco@bianchidesign.it", phone: "+39 335 123 4567", type: "Décorateur", status: "Actif", notes: "Showroom Milan. Intéressé par le sur-mesure.", createdAt: d(-150), lastActivity: d(-20) },
  { id: "c7", name: "Sarah Al Maktoum", company: "Palm Residences Dubai", country: "Émirats Arabes Unis", city: "Dubaï", address: "Palm Jumeirah, Dubai", email: "sarah@palmresidences.ae", phone: "+971 50 123 4567", type: "Promoteur", status: "VIP", notes: "Programme de 40 villas. Volume important.", createdAt: d(-180), lastActivity: d(-4) },
  { id: "c8", name: "Thomas Keller", company: "Keller Bäder GmbH", country: "Allemagne", city: "Munich", address: "Maximilianstraße 12, 80539 München", email: "t.keller@kellerbaeder.de", phone: "+49 170 1234567", type: "Revendeur", status: "Inactif", notes: "Dernière commande il y a 8 mois.", createdAt: d(-600), lastActivity: d(-240) },
  { id: "c9", name: "Nadia Berrada", company: "Hôtel La Mamounia Annexe", country: "Maroc", city: "Marrakech", address: "Avenue Bab Jdid, Marrakech", email: "n.berrada@lamamounia-annexe.ma", phone: "+212 5 24 38 86 00", type: "Hôtel", status: "Actif", notes: "Spa et piscine.", createdAt: d(-60), lastActivity: d(-8), fromProspectId: "p9" },
  { id: "c10", name: "Olivier Dubois", company: "Dubois Architectes", country: "Belgique", city: "Bruxelles", address: "Avenue Louise 200, 1050 Bruxelles", email: "o.dubois@duboisarch.be", phone: "+32 470 12 34 56", type: "Architecte", status: "Actif", notes: "Projet de restaurant marocain.", createdAt: d(-40), lastActivity: d(-5) },
];

export const seedProspects: Prospect[] = [
  { id: "p1", name: "Emma Johansson", company: "Nordic Living AB", country: "Suède", email: "emma@nordicliving.se", phone: "+46 70 987 65 43", source: "Site web", stage: "Nouveau", project: "Boutique concept store Göteborg", estimatedValue: 18000, score: 55, notes: [{ id: "n1", text: "Demande via formulaire, cherche des teintes vertes.", date: d(-2) }], createdAt: d(-2), lastActivity: d(-2) },
  { id: "p2", name: "Lucas Martin", company: "Maison Martin", country: "France", email: "lucas@maisonmartin.fr", phone: "+33 6 98 76 54 32", source: "Instagram", stage: "Contacté", project: "Rénovation appartement haussmannien", estimatedValue: 9500, score: 48, notes: [], createdAt: d(-8), lastActivity: d(-5) },
  { id: "p3", name: "Aisha Rahman", company: "Rahman Hospitality", country: "Qatar", email: "aisha@rahmanhosp.qa", phone: "+974 5512 3456", source: "Salon", stage: "Qualifié", project: "Lobby hôtel 5 étoiles Doha", estimatedValue: 85000, score: 82, notes: [{ id: "n2", text: "Rencontrée au salon Maison&Objet. Budget confirmé.", date: d(-15) }], createdAt: d(-20), lastActivity: d(-3) },
  { id: "p4", name: "David Cohen", company: "Cohen Estates", country: "États-Unis", email: "david@cohenestates.com", phone: "+1 305 555 0123", source: "Recommandation", stage: "Échantillon", project: "Villa Miami Beach — piscine", estimatedValue: 42000, score: 74, notes: [], createdAt: d(-30), lastActivity: d(-9) },
  { id: "p5", name: "Ines Garcia", company: "Garcia Interiorismo", country: "Espagne", email: "ines@garciainteriorismo.es", phone: "+34 612 345 678", source: "LinkedIn", stage: "Devis", project: "Restaurant Sevilla — bar", estimatedValue: 14500, score: 68, notes: [], createdAt: d(-35), lastActivity: d(-6) },
  { id: "p6", name: "Hiroshi Tanaka", company: "Tanaka Design Tokyo", country: "Japon", email: "h.tanaka@tanakadesign.jp", phone: "+81 90 1234 5678", source: "Site web", stage: "Négociation", project: "Salon de thé Tokyo", estimatedValue: 27000, score: 79, notes: [{ id: "n3", text: "Négocie une remise volume de 8 %.", date: d(-4) }], createdAt: d(-50), lastActivity: d(-4) },
  { id: "p7", name: "Karim Ziani", company: "Ziani Promotion", country: "Maroc", email: "k.ziani@zianipromo.ma", phone: "+212 6 62 33 44 55", source: "Recommandation", stage: "Contacté", project: "Résidence Bouskoura — halls", estimatedValue: 36000, score: 40, notes: [], createdAt: d(-25), lastActivity: d(-18) },
  { id: "p8", name: "Charlotte Evans", company: "Evans Studio", country: "Royaume-Uni", email: "charlotte@evansstudio.uk", phone: "+44 7911 123456", source: "Email", stage: "Perdu", project: "Cuisine privée Londres", estimatedValue: 6000, score: 20, notes: [{ id: "n4", text: "A choisi un concurrent (budget).", date: d(-12) }], createdAt: d(-60), lastActivity: d(-12) },
  { id: "p9", name: "Nadia Berrada", company: "Hôtel La Mamounia Annexe", country: "Maroc", email: "n.berrada@lamamounia-annexe.ma", phone: "+212 5 24 38 86 00", source: "Salon", stage: "Gagné", project: "Spa et piscine", estimatedValue: 52000, score: 95, notes: [], createdAt: d(-120), lastActivity: d(-60), convertedClientId: "c9" },
  { id: "p10", name: "Pierre Lefebvre", company: "Lefebvre & Fils", country: "France", email: "pierre@lefebvre-fils.fr", phone: "+33 6 11 22 33 44", source: "Instagram", stage: "Nouveau", project: "Cave à vin Bordeaux", estimatedValue: 7800, score: 35, notes: [], createdAt: d(-1), lastActivity: d(-1) },
  { id: "p11", name: "Laura Schmidt", company: "Schmidt Wohnen", country: "Autriche", email: "laura@schmidtwohnen.at", phone: "+43 664 1234567", source: "Site web", stage: "Qualifié", project: "Salle de bain chalet Kitzbühel", estimatedValue: 11000, score: 60, notes: [], createdAt: d(-14), lastActivity: d(-10) },
];

export const seedProducts: Product[] = [
  { id: "pr1", reference: "ATL-001", name: "Atlas Blanc Neige", collection: "Atlas", description: "Zellige émaillé blanc nacré, éclat traditionnel façonné à la main.", dimensions: "10 x 10 cm", colors: ["Blanc neige"], material: "Terre cuite émaillée", cost: 42, price: 89, stock: 320, minStock: 80, unit: "m²", status: "Actif", imageHue: 40, createdAt: d(-400) },
  { id: "pr2", reference: "ATL-002", name: "Atlas Vert Cèdre", collection: "Atlas", description: "Vert profond inspiré des forêts du Moyen Atlas.", dimensions: "10 x 10 cm", colors: ["Vert cèdre"], material: "Terre cuite émaillée", cost: 46, price: 95, stock: 145, minStock: 60, unit: "m²", status: "Actif", imageHue: 150, createdAt: d(-400) },
  { id: "pr3", reference: "ATL-003", name: "Atlas Terre Ocre", collection: "Atlas", description: "Ocre chaud aux variations naturelles.", dimensions: "10 x 10 cm", colors: ["Ocre"], material: "Terre cuite émaillée", cost: 44, price: 92, stock: 38, minStock: 60, unit: "m²", status: "Actif", imageHue: 50, createdAt: d(-380) },
  { id: "pr4", reference: "FES-101", name: "Fès Bleu Majorelle", collection: "Fès", description: "Bleu intense emblématique, émail brillant.", dimensions: "5 x 5 cm", colors: ["Bleu Majorelle"], material: "Terre cuite émaillée", cost: 58, price: 118, stock: 210, minStock: 50, unit: "m²", status: "Actif", imageHue: 255, createdAt: d(-360) },
  { id: "pr5", reference: "FES-102", name: "Fès Étoile Huit Branches", collection: "Fès", description: "Motif géométrique traditionnel, découpe manuelle.", dimensions: "Panneau 30 x 30 cm", colors: ["Bleu", "Blanc", "Vert"], material: "Terre cuite émaillée", cost: 95, price: 210, stock: 64, minStock: 20, unit: "m²", status: "Actif", imageHue: 220, createdAt: d(-350) },
  { id: "pr6", reference: "FES-103", name: "Fès Noir Charbon", collection: "Fès", description: "Noir profond aux reflets satinés.", dimensions: "10 x 10 cm", colors: ["Noir"], material: "Terre cuite émaillée", cost: 47, price: 98, stock: 0, minStock: 40, unit: "m²", status: "Rupture", imageHue: 0, createdAt: d(-340) },
  { id: "pr7", reference: "MRK-201", name: "Marrakech Rose Poudré", collection: "Marrakech", description: "Rose terracotta doux, esprit médina.", dimensions: "10 x 10 cm", colors: ["Rose poudré"], material: "Terre cuite émaillée", cost: 45, price: 94, stock: 180, minStock: 50, unit: "m²", status: "Nouveauté", imageHue: 15, createdAt: d(-30) },
  { id: "pr8", reference: "MRK-202", name: "Marrakech Bejmat Naturel", collection: "Marrakech", description: "Bejmat brut non émaillé pour sols.", dimensions: "15 x 5 cm", colors: ["Terre naturelle"], material: "Terre cuite brute", cost: 30, price: 68, stock: 420, minStock: 100, unit: "m²", status: "Actif", imageHue: 35, createdAt: d(-300) },
  { id: "pr9", reference: "MRK-203", name: "Marrakech Miel", collection: "Marrakech", description: "Jaune miel translucide.", dimensions: "10 x 10 cm", colors: ["Miel"], material: "Terre cuite émaillée", cost: 44, price: 92, stock: 96, minStock: 40, unit: "m²", status: "Actif", imageHue: 70, createdAt: d(-280) },
  { id: "pr10", reference: "SM-301", name: "Frise Sur-mesure Calligraphie", collection: "Sur-mesure", description: "Frise sculptée sur plan, motif calligraphique.", dimensions: "Sur plan", colors: ["Au choix"], material: "Terre cuite émaillée", cost: 180, price: 420, stock: 0, minStock: 0, unit: "ml", status: "Actif", imageHue: 45, createdAt: d(-200) },
  { id: "pr11", reference: "SM-302", name: "Panneau Sur-mesure Mosaïque", collection: "Sur-mesure", description: "Panneau mural mosaïque composé sur mesure.", dimensions: "Sur plan", colors: ["Au choix"], material: "Terre cuite émaillée", cost: 260, price: 590, stock: 0, minStock: 0, unit: "m²", status: "Actif", imageHue: 200, createdAt: d(-200) },
  { id: "pr12", reference: "ATL-004", name: "Atlas Gris Brume", collection: "Atlas", description: "Gris minéral discret, finition mate.", dimensions: "10 x 10 cm", colors: ["Gris brume"], material: "Terre cuite émaillée", cost: 45, price: 93, stock: 22, minStock: 50, unit: "m²", status: "Actif", imageHue: 240, createdAt: d(-120) },
];

export const seedSamples: Sample[] = [
  { id: "s1", reference: "ECH-2026-014", contactType: "prospect", contactId: "p4", productId: "pr4", quantity: 4, requestDate: d(-9), sentDate: d(-6), status: "En attente de validation", comments: "Coffret 4 teintes bleues.", createdAt: d(-9) },
  { id: "s2", reference: "ECH-2026-015", contactType: "prospect", contactId: "p3", productId: "pr5", quantity: 2, requestDate: d(-5), status: "En préparation", comments: "Panneau étoile 30x30 pour maquette lobby.", createdAt: d(-5) },
  { id: "s3", reference: "ECH-2026-016", contactType: "client", contactId: "c7", productId: "pr1", quantity: 6, requestDate: d(-20), sentDate: d(-16), status: "Validé", comments: "Validé pour les 40 villas.", createdAt: d(-20) },
  { id: "s4", reference: "ECH-2026-017", contactType: "client", contactId: "c3", productId: "pr2", quantity: 3, requestDate: d(-2), status: "Demandé", comments: "", createdAt: d(-2) },
  { id: "s5", reference: "ECH-2026-018", contactType: "prospect", contactId: "p6", productId: "pr7", quantity: 5, requestDate: d(-28), sentDate: d(-24), status: "Refusé", comments: "Teinte trop rosée pour le client.", createdAt: d(-28) },
  { id: "s6", reference: "ECH-2026-019", contactType: "client", contactId: "c10", productId: "pr9", quantity: 3, requestDate: d(-12), sentDate: d(-10), status: "Envoyé", comments: "DHL Express.", createdAt: d(-12) },
];

const line = (productId: string, qty: number, discount = 0, color?: string) => {
  const p = seedProducts.find((x) => x.id === productId)!;
  return { id: uid(), productId, reference: p.reference, description: p.name, collection: p.collection, dimensions: p.dimensions, color: color ?? p.colors[0], quantity: qty, unitPrice: p.price, discount };
};

export const seedQuotes: Quote[] = [
  { id: "q1", number: "ATZ-2026-001", clientId: "c1", projectName: "Hôtel Le Marais — Salles de bain", projectDescription: "Habillage de 24 salles de bain, murs et niches.", projectType: "Hôtellerie", projectLocation: "Paris, France", createdAt: d(-40), expiresAt: d(-10), lines: [line("pr1", 180), line("pr4", 60, 5)], globalDiscount: 0, fees: 850, vatRate: 20, status: "Validé", paymentTerms: "40 % à la commande, solde avant expédition", leadTime: "6 à 8 semaines", deliveryTerms: "EXW Fès — transport à la charge du client", notes: "Calepinage fourni par l'architecte.", orderId: "o1", sentAt: d(-38) },
  { id: "q2", number: "ATZ-2026-002", clientId: "c7", projectName: "Palm Residences — 40 villas", projectDescription: "Cuisines et salles de bain de 40 villas.", projectType: "Promotion immobilière", projectLocation: "Dubaï, EAU", createdAt: d(-25), expiresAt: d(5), lines: [line("pr1", 1200, 10), line("pr8", 800, 8), line("pr9", 300)], globalDiscount: 5000, fees: 4200, vatRate: 0, status: "En attente", paymentTerms: "50 % à la commande, 50 % avant expédition", leadTime: "12 à 14 semaines (livraisons échelonnées)", deliveryTerms: "FOB Casablanca", notes: "Export hors TVA. Livraisons en 3 lots.", sentAt: d(-24) },
  { id: "q3", number: "ATZ-2026-003", clientId: "c3", projectName: "Appartement Östermalm", projectDescription: "Crédence cuisine et salle de bain principale.", projectType: "Résidentiel", projectLocation: "Stockholm, Suède", createdAt: d(-12), expiresAt: d(18), lines: [line("pr2", 28), line("pr12", 14)], globalDiscount: 0, fees: 320, vatRate: 0, status: "Envoyé", paymentTerms: "100 % à la commande", leadTime: "4 à 5 semaines", deliveryTerms: "DAP Stockholm", notes: "", sentAt: d(-11) },
  { id: "q4", number: "ATZ-2026-004", clientId: "c10", projectName: "Restaurant Souk — Bruxelles", projectDescription: "Bar, sol et frise calligraphique.", projectType: "Restauration", projectLocation: "Bruxelles, Belgique", createdAt: d(-6), expiresAt: d(24), lines: [line("pr9", 45), line("pr8", 90), line("pr10", 12)], globalDiscount: 600, fees: 480, vatRate: 0, status: "Envoyé", paymentTerms: "40 % à la commande, solde avant expédition", leadTime: "7 semaines", deliveryTerms: "DAP Bruxelles", notes: "Frise selon plan v2.", sentAt: d(-6) },
  { id: "q5", number: "ATZ-2026-005", clientId: "c5", projectName: "Villa Amina — Hammam", projectDescription: "Hammam privé et cuisine.", projectType: "Résidentiel", projectLocation: "Casablanca, Maroc", createdAt: d(-3), expiresAt: d(27), lines: [line("pr5", 12), line("pr7", 30)], globalDiscount: 0, fees: 250, vatRate: 20, status: "Brouillon", paymentTerms: "50 % à la commande", leadTime: "5 semaines", deliveryTerms: "Livraison Casablanca incluse", notes: "" },
  { id: "q6", number: "ATZ-2026-006", clientId: "c6", projectName: "Showroom Brera", projectDescription: "Mur d'exposition sur-mesure.", projectType: "Commercial", projectLocation: "Milan, Italie", createdAt: d(-70), expiresAt: d(-40), lines: [line("pr11", 18)], globalDiscount: 0, fees: 600, vatRate: 0, status: "Expiré", paymentTerms: "50 % à la commande", leadTime: "8 semaines", deliveryTerms: "DAP Milan", notes: "", sentAt: d(-69) },
  { id: "q7", number: "ATZ-2026-007", clientId: "c2", projectName: "Riad Dar Yassine — Patio", projectDescription: "Sol patio et fontaine centrale.", projectType: "Hôtellerie", projectLocation: "Marrakech, Maroc", createdAt: d(-55), expiresAt: d(-25), lines: [line("pr8", 120), line("pr5", 6)], globalDiscount: 0, fees: 0, vatRate: 20, status: "Validé", paymentTerms: "50 % à la commande", leadTime: "6 semaines", deliveryTerms: "Livraison Marrakech incluse", notes: "", orderId: "o2", sentAt: d(-54) },
  { id: "q8", number: "ATZ-2026-008", clientId: "c4", projectName: "Réassort Q3 — Whitaker", projectDescription: "Réassort stock revendeur.", projectType: "Distribution", projectLocation: "Londres, UK", createdAt: d(-9), expiresAt: d(21), lines: [line("pr1", 200, 15), line("pr4", 120, 15), line("pr7", 80, 15)], globalDiscount: 0, fees: 1500, vatRate: 0, status: "Refusé", paymentTerms: "30 jours fin de mois", leadTime: "5 semaines", deliveryTerms: "FOB Casablanca", notes: "Refusé : demande une remise de 20 %.", sentAt: d(-9) },
];

const mkSteps = (start: number, current: OrderStatus, owner: string): OrderStep[] => {
  const names: OrderStatus[] = ["Confirmée", "Production", "Préparation", "Contrôle qualité", "Emballage", "Expédiée", "Livrée"];
  const idx = names.indexOf(current);
  const gaps = [0, 3, 24, 30, 33, 36, 46];
  return names.map((name, i) => ({ name, plannedDate: d(start + gaps[i]), actualDate: i < idx ? d(start + gaps[i] + (i % 2 === 0 ? 0 : 1)) : i === idx ? d(start + gaps[i]) : undefined, owner }));
};

const q1Total = 180 * 89 + 60 * 118 * 0.95 + 850;
const q7Total = 120 * 68 + 6 * 210;

export const seedOrders: Order[] = [
  { id: "o1", number: "CMD-2026-021", clientId: "c1", quoteId: "q1", projectName: "Hôtel Le Marais — Salles de bain", lines: seedQuotes[0].lines, totalHT: q1Total, totalTTC: q1Total * 1.2, status: "Préparation", steps: mkSteps(-36, "Préparation", "Hassan Idrissi"), createdAt: d(-36), dueDate: d(10), owner: "Hassan Idrissi", notes: [{ id: uid(), text: "Cuisson lot 2 terminée.", date: d(-4), author: "Hassan" }], deliveryAddress: "12 rue de Turenne, 75003 Paris", deliveryCountry: "France" },
  { id: "o2", number: "CMD-2026-022", clientId: "c2", quoteId: "q7", projectName: "Riad Dar Yassine — Patio", lines: seedQuotes[6].lines, totalHT: q7Total, totalTTC: q7Total * 1.2, status: "Livrée", steps: mkSteps(-52, "Livrée", "Mehdi Alaoui"), createdAt: d(-52), dueDate: d(-6), owner: "Mehdi Alaoui", notes: [], deliveryAddress: "Derb Sidi Bouloukat 14, Marrakech", deliveryCountry: "Maroc" },
  { id: "o3", number: "CMD-2026-023", clientId: "c7", projectName: "Palm Residences — Lot 1 (échantillonnage)", lines: [line("pr1", 60)], totalHT: 5340, totalTTC: 5340, status: "Production", steps: mkSteps(-30, "Production", "Hassan Idrissi"), createdAt: d(-30), dueDate: d(-3), owner: "Hassan Idrissi", notes: [{ id: uid(), text: "Retard four n°2 — maintenance.", date: d(-5), author: "Hassan" }], deliveryAddress: "Palm Jumeirah, Dubai", deliveryCountry: "Émirats Arabes Unis" },
  { id: "o4", number: "CMD-2026-024", clientId: "c4", projectName: "Réassort Q2 — Whitaker", lines: [line("pr1", 150, 15), line("pr4", 90, 15)], totalHT: 150 * 89 * 0.85 + 90 * 118 * 0.85, totalTTC: 150 * 89 * 0.85 + 90 * 118 * 0.85, status: "Expédiée", steps: mkSteps(-45, "Expédiée", "Mehdi Alaoui"), createdAt: d(-45), dueDate: d(2), owner: "Mehdi Alaoui", notes: [], deliveryAddress: "48 Kings Road, London", deliveryCountry: "Royaume-Uni" },
  { id: "o5", number: "CMD-2026-025", clientId: "c9", projectName: "Spa & piscine — Mamounia Annexe", lines: [line("pr4", 140), line("pr5", 20)], totalHT: 140 * 118 + 20 * 210, totalTTC: (140 * 118 + 20 * 210) * 1.2, status: "Contrôle qualité", steps: mkSteps(-28, "Contrôle qualité", "Hassan Idrissi"), createdAt: d(-28), dueDate: d(14), owner: "Hassan Idrissi", notes: [], deliveryAddress: "Avenue Bab Jdid, Marrakech", deliveryCountry: "Maroc", blocked: true, blockReason: "Lot 3 non conforme — variation de teinte hors tolérance." },
  { id: "o6", number: "CMD-2026-026", clientId: "c6", projectName: "Showroom Brera — Panneau", lines: [line("pr11", 10)], totalHT: 5900, totalTTC: 5900, status: "Confirmée", steps: mkSteps(-2, "Confirmée", "Mehdi Alaoui"), createdAt: d(-2), dueDate: d(44), owner: "Mehdi Alaoui", notes: [], deliveryAddress: "Via Brera 21, Milano", deliveryCountry: "Italie" },
  { id: "o7", number: "CMD-2026-020", clientId: "c3", projectName: "Villa Djursholm", lines: [line("pr2", 40), line("pr1", 30)], totalHT: 40 * 95 + 30 * 89, totalTTC: 40 * 95 + 30 * 89, status: "Emballage", steps: mkSteps(-40, "Emballage", "Mehdi Alaoui"), createdAt: d(-40), dueDate: d(-1), owner: "Mehdi Alaoui", notes: [], deliveryAddress: "Strandvägen 7, Stockholm", deliveryCountry: "Suède" },
];

export const seedShipments: Shipment[] = [
  { id: "sh1", orderId: "o4", carrier: "DHL Freight", trackingNumber: "DHL-7841-2290-UK", destinationCountry: "Royaume-Uni", address: "48 Kings Road, London SW3 4UD", shippedAt: d(-6), eta: d(2), status: "En transit", issue: null, incoterm: "FOB Casablanca", weightKg: 4200, createdAt: d(-8) },
  { id: "sh2", orderId: "o2", carrier: "Transport Atlas Express", trackingNumber: "TAE-0091-MA", destinationCountry: "Maroc", address: "Derb Sidi Bouloukat 14, Marrakech", shippedAt: d(-9), eta: d(-7), status: "Livré", issue: null, incoterm: "Livré", weightKg: 2100, createdAt: d(-12) },
  { id: "sh3", orderId: "o7", carrier: "Maersk / Geodis", trackingNumber: "MSK-55210-SE", destinationCountry: "Suède", address: "Strandvägen 7, Stockholm", eta: d(21), status: "Préparation", issue: null, incoterm: "DAP Stockholm", weightKg: 1350, createdAt: d(-3) },
  { id: "sh4", orderId: "o3", carrier: "Emirates SkyCargo", trackingNumber: "EK-CGO-77120", destinationCountry: "Émirats Arabes Unis", address: "Palm Jumeirah, Dubai", eta: d(8), status: "Préparation", issue: "Retard", incoterm: "FOB Casablanca", weightKg: 1100, createdAt: d(-4) },
  { id: "sh5", orderId: "o1", carrier: "Geodis", trackingNumber: "GEO-FR-33091", destinationCountry: "France", address: "12 rue de Turenne, 75003 Paris", eta: d(16), status: "Préparation", issue: null, incoterm: "EXW Fès", weightKg: 4600, createdAt: d(-2) },
];

export const seedAppointments: Appointment[] = [
  { id: "a1", title: "Visite showroom — Aisha Rahman", contactType: "prospect", contactId: "p3", start: d(1, 10), end: d(1, 11, 30), type: "Visite showroom", status: "Confirmé", participants: ["Houda", "Aisha Rahman"], notes: "Présenter panneaux Fès et échantillons lobby.", reminders: [{ at: "24h", sent: false }, { at: "1h", sent: false }], createdAt: d(-7) },
  { id: "a2", title: "Visio suivi — Palm Residences", contactType: "client", contactId: "c7", start: d(2, 14), end: d(2, 15), type: "Visio", status: "Confirmé", participants: ["Houda", "Sarah Al Maktoum", "Hassan"], notes: "Point retard lot 1.", reminders: [{ at: "24h", sent: false }, { at: "1h", sent: false }], createdAt: d(-3) },
  { id: "a3", title: "Appel qualification — Emma Johansson", contactType: "prospect", contactId: "p1", start: d(0, 16), end: d(0, 16, 30), type: "Appel", status: "Proposé", participants: ["Houda", "Emma Johansson"], notes: "", reminders: [{ at: "24h", sent: true }, { at: "1h", sent: false }], createdAt: d(-1) },
  { id: "a4", title: "Sur site — Villa Amina", contactType: "client", contactId: "c5", start: d(4, 9), end: d(4, 12), type: "Sur site", status: "Confirmé", participants: ["Mehdi", "Amina El Fassi"], notes: "Relevé des cotes hammam.", reminders: [{ at: "24h", sent: false }, { at: "1h", sent: false }], createdAt: d(-2) },
  { id: "a5", title: "Négociation — Hiroshi Tanaka", contactType: "prospect", contactId: "p6", start: d(-2, 9), end: d(-2, 10), type: "Visio", status: "Terminé", participants: ["Houda", "Hiroshi Tanaka"], notes: "Remise 8 % en discussion.", reminders: [{ at: "24h", sent: true }, { at: "1h", sent: true }], createdAt: d(-9) },
  { id: "a6", title: "Visite showroom — Dubois Architectes", contactType: "client", contactId: "c10", start: d(7, 11), end: d(7, 12), type: "Visite showroom", status: "Proposé", participants: ["Houda", "Olivier Dubois"], notes: "", reminders: [{ at: "24h", sent: false }, { at: "1h", sent: false }], createdAt: d(-1) },
  { id: "a7", title: "Point production hebdo", start: d(3, 8, 30), end: d(3, 9), type: "Appel", status: "Confirmé", participants: ["Houda", "Hassan", "Mehdi"], notes: "", reminders: [], createdAt: d(-10) },
];

export const seedMessages: Message[] = [
  { id: "m1", direction: "in", channel: "Formulaire", fromName: "Emma Johansson", fromEmail: "emma@nordicliving.se", subject: "Demande pour concept store à Göteborg", body: "Bonjour, nous ouvrons un concept store de 180 m² à Göteborg en janvier. Nous cherchons environ 45 m² de zellige dans des tons verts pour le mur principal et le comptoir. Budget indicatif 15-20 k€. Pourriez-vous nous envoyer des échantillons ? Merci, Emma", date: d(-2, 9, 12), read: true, contactType: "prospect", contactId: "p1" },
  { id: "m2", direction: "in", channel: "Email", fromName: "Rachid Benali", fromEmail: "r.benali@oasisresorts.ma", subject: "Projet resort Dakhla — 3 000 m²", body: "Bonjour, je suis directeur technique d'Oasis Resorts. Nous lançons un resort à Dakhla avec environ 3 000 m² de zellige (piscines, hammams, restaurants). Ouverture prévue fin 2027. Nous souhaitons un rendez-vous rapidement pour discuter faisabilité et délais. Cordialement, Rachid Benali", date: d(0, 8, 40), read: false },
  { id: "m3", direction: "in", channel: "Instagram", fromName: "Lucas Martin", fromEmail: "lucas@maisonmartin.fr", subject: "Question sur le bleu Majorelle", body: "Bonjour ! Le bleu Majorelle est-il disponible en 5x5 ? C'est pour une crédence de 6 m² environ. Merci !", date: d(-1, 18, 5), read: false, contactType: "prospect", contactId: "p2" },
  { id: "m4", direction: "in", channel: "Email", fromName: "Sarah Al Maktoum", fromEmail: "sarah@palmresidences.ae", subject: "Retard lot 1 ?", body: "Hello, we were expecting the sample lot last week. Can you confirm the new shipping date? The site team is waiting. Best, Sarah", date: d(-1, 11, 20), read: true, contactType: "client", contactId: "c7" },
  { id: "m5", direction: "out", channel: "Email", fromName: "Houda — Atelier du Zellige", fromEmail: "houda@atelierduzellige.ma", subject: "RE: Retard lot 1 ?", body: "Dear Sarah, thank you for your patience. Kiln n°2 maintenance delayed the batch by 5 days. New shipping date: next Tuesday via Emirates SkyCargo. We'll share the tracking number as soon as available. Warm regards, Houda", date: d(-1, 14, 2), read: true, contactType: "client", contactId: "c7" },
  { id: "m6", direction: "in", channel: "WhatsApp", fromName: "Amina El Fassi", fromEmail: "amina.elfassi@gmail.com", subject: "Devis hammam", body: "Bonjour Houda, avez-vous pu finaliser le devis pour le hammam ? J'aimerais valider avant la fin du mois.", date: d(0, 10, 15), read: false, contactType: "client", contactId: "c5" },
  { id: "m7", direction: "in", channel: "Email", fromName: "Giulia Rossi", fromEmail: "giulia@rossiarchitetti.it", subject: "Collaborazione — boutique hotel Firenze", body: "Buongiorno, siamo uno studio di architettura a Firenze. Stiamo progettando un boutique hotel di 18 camere e vorremmo utilizzare zellige per i bagni (circa 220 m²). Potete inviarci il catalogo e i tempi di consegna? Grazie, Giulia Rossi", date: d(-3, 15, 30), read: true },
  { id: "m8", direction: "in", channel: "Formulaire", fromName: "Mark Stevens", fromEmail: "mark.stevens@outlook.com", subject: "Pricing for kitchen backsplash", body: "Hi, I'm renovating my kitchen in Austin, Texas and love your white zellige. Need about 8 m². What's the price and shipping to the US? Thanks!", date: d(-4, 20, 0), read: true },
];

export const seedPosts: SocialPost[] = [
  { id: "sp1", title: "Collection Atlas — Blanc Neige", text: "Chaque carreau Atlas est façonné à la main à Fès, puis émaillé selon un savoir-faire transmis depuis des générations. Le Blanc Neige capte la lumière comme aucun autre.", hashtags: ["#zellige", "#atelierduzellige", "#artisanatmarocain", "#interiordesign", "#collectionatlas"], cta: "Découvrez la collection Atlas — lien en bio", network: "Instagram", type: "Carrousel", productId: "pr1", collection: "Atlas", objective: "Présentation produit", tone: "Premium", language: "FR", status: "Publié", scheduledAt: d(-5, 18), publishedAt: d(-5, 18), createdAt: d(-8) },
  { id: "sp2", title: "Behind the kiln", text: "Between 900°C and 1000°C, the enamel comes alive. A glimpse inside our kilns in Fès.", hashtags: ["#zellige", "#craftsmanship", "#madeinmorocco", "#behindthescenes"], cta: "Follow for more", network: "TikTok", type: "Vidéo", collection: "Fès", objective: "Notoriété", tone: "Authentique", language: "EN", status: "Planifié", scheduledAt: d(1, 12), createdAt: d(-3) },
  { id: "sp3", title: "Rose Poudré — Nouveauté", text: "Une nouvelle teinte rejoint la collection Marrakech : Rose Poudré, inspirée des murs de la médina au coucher du soleil.", hashtags: ["#zellige", "#marrakech", "#rosepoudre", "#newcollection"], cta: "Demandez un échantillon", network: "Instagram", type: "Publication", productId: "pr7", collection: "Marrakech", objective: "Vente", tone: "Élégant", language: "FR", status: "Planifié", scheduledAt: d(3, 11), createdAt: d(-2) },
  { id: "sp4", title: "Projet Riad Dar Yassine", text: "Retour sur la rénovation du patio du Riad Dar Yassine : bejmat naturel et étoiles de Fès pour un dialogue entre tradition et sobriété.", hashtags: ["#zellige", "#riad", "#marrakech", "#architecture", "#projet"], cta: "Voir le projet", network: "Facebook", type: "Carrousel", productId: "pr8", collection: "Marrakech", objective: "Inspiration", tone: "Institutionnel", language: "FR", status: "Validé", createdAt: d(-1) },
  { id: "sp5", title: "Étoile à huit branches", text: "L'étoile à huit branches, symbole d'équilibre, découpée à la main au menqach.", hashtags: ["#zellige", "#fes", "#geometry", "#craft"], cta: "", network: "Instagram", type: "Reel", productId: "pr5", collection: "Fès", objective: "Engagement", tone: "Inspirant", language: "FR", status: "Brouillon", createdAt: d(0) },
  { id: "sp6", title: "Salon Maison&Objet — Merci", text: "Merci à tous pour vos visites sur notre stand. De belles rencontres et de nouveaux projets à venir.", hashtags: ["#maisonetobjet", "#zellige", "#salon"], cta: "", network: "Facebook", type: "Publication", collection: "", objective: "Notoriété", tone: "Institutionnel", language: "FR", status: "Publié", scheduledAt: d(-12, 10), publishedAt: d(-12, 10), createdAt: d(-13) },
  { id: "sp7", title: "Bleu Majorelle en cuisine", text: "Le bleu Majorelle en crédence : une profondeur qui change avec la lumière du jour.", hashtags: ["#zellige", "#majorelle", "#kitchendesign"], cta: "Demandez un devis", network: "Instagram", type: "Story", productId: "pr4", collection: "Fès", objective: "Vente", tone: "Élégant", language: "FR", status: "Planifié", scheduledAt: d(5, 9), createdAt: d(-1) },
];

export const seedActivities: ActivityLog[] = [
  { id: uid(), date: d(-1, 14, 2), agent: "Service Client & Prospection", action: "Analyse de message", target: "Sarah Al Maktoum — Retard lot 1", result: "Intention : suivi commande — réponse proposée", status: "Succès", link: "/agents/service-client" },
  { id: uid(), date: d(-1, 9, 30), agent: "Suivi des commandes", action: "Détection de retard", target: "CMD-2026-023", result: "Retard de 3 jours détecté — recommandation envoyée", status: "En attente", link: "/agents/suivi-commandes" },
  { id: uid(), date: d(-2, 10, 0), agent: "Relances", action: "Relance devis", target: "ATZ-2026-002 — Palm Residences", result: "Message généré, en attente de validation", status: "En attente", link: "/agents/relances" },
  { id: uid(), date: d(-3, 16, 45), agent: "Community Manager", action: "Génération de contenu", target: "Behind the kiln (TikTok)", result: "3 variantes générées, 1 planifiée", status: "Succès", link: "/agents/cm/planning" },
  { id: uid(), date: d(-3, 11, 0), agent: "Prise de rendez-vous", action: "Proposition de créneaux", target: "Aisha Rahman", result: "Créneau confirmé", status: "Succès", link: "/rendez-vous" },
  { id: uid(), date: d(-5, 9, 15), agent: "Utilisateur", action: "Conversion prospect", target: "Nadia Berrada → Client", result: "Client créé", status: "Succès", link: "/clients/c9" },
  { id: uid(), date: d(-6, 15, 0), agent: "Suivi des commandes", action: "Blocage détecté", target: "CMD-2026-025", result: "Lot 3 non conforme — tâche corrective créée", status: "Succès", link: "/commandes/o5" },
  { id: uid(), date: d(-8, 10, 0), agent: "Community Manager", action: "Publication", target: "Collection Atlas — Blanc Neige", result: "Publié sur Instagram", status: "Succès", link: "/agents/cm/planning" },
  { id: uid(), date: d(-9, 12, 0), agent: "Relances", action: "Relance échantillon", target: "ECH-2026-014 — David Cohen", result: "Ignorée par l'utilisateur", status: "Refusé", link: "/agents/relances" },
];

export const seedNotifications: Notification[] = [
  { id: uid(), title: "Commande en retard", description: "CMD-2026-023 dépasse sa date prévue de 3 jours.", date: d(0, 8), read: false, link: "/commandes/o3", severity: "warning" },
  { id: uid(), title: "Nouveau message", description: "Rachid Benali — Projet resort Dakhla (3 000 m²).", date: d(0, 8, 40), read: false, link: "/agents/service-client", severity: "info" },
  { id: uid(), title: "Devis bientôt expiré", description: "ATZ-2026-002 expire dans 5 jours.", date: d(0, 7), read: false, link: "/devis/q2", severity: "warning" },
  { id: uid(), title: "Commande bloquée", description: "CMD-2026-025 : lot 3 non conforme au contrôle qualité.", date: d(-1, 15), read: true, link: "/commandes/o5", severity: "error" },
  { id: uid(), title: "Stock faible", description: "Atlas Gris Brume : 22 m² restants.", date: d(-1, 9), read: true, link: "/produits", severity: "warning" },
];

export const seedTasks: Task[] = [
  { id: uid(), title: "Envoyer le catalogue à Giulia Rossi", done: false, dueDate: d(1), createdAt: d(-2) },
  { id: uid(), title: "Refaire cuisson lot 3 — CMD-2026-025", done: false, dueDate: d(2), createdAt: d(-5), relatedType: "order", relatedId: "o5", agent: "Suivi des commandes" },
  { id: uid(), title: "Préparer calepinage Palm Residences", done: true, dueDate: d(-3), createdAt: d(-10), relatedType: "client", relatedId: "c7" },
  { id: uid(), title: "Relancer David Cohen pour validation échantillon", done: false, dueDate: d(0), createdAt: d(-1), relatedType: "sample", relatedId: "s1", agent: "Relances" },
];

export const seedFollowUpRules: FollowUpRule[] = [
  { id: "r1", label: "Devis sans réponse", trigger: "quote", days: 5, action: "Proposer une relance", enabled: true },
  { id: "r2", label: "Échantillon non validé", trigger: "sample", days: 7, action: "Créer une alerte", enabled: true },
  { id: "r3", label: "Prospect inactif", trigger: "prospect", days: 3, action: "Proposer une relance", enabled: true },
  { id: "r4", label: "Commande bloquée", trigger: "order", days: 2, action: "Créer une tâche", enabled: true },
  { id: "r5", label: "Rendez-vous non confirmé", trigger: "appointment", days: 1, action: "Proposer une relance", enabled: false },
];

export const seedCMSettings: CMSettings = {
  accounts: [
    { network: "Instagram", connected: true, lastSync: d(0, 7, 30), handle: "@atelierduzellige" },
    { network: "Facebook", connected: true, lastSync: d(-1, 19), handle: "Atelier du Zellige" },
    { network: "TikTok", connected: false, handle: "@atelierduzellige" },
  ],
  autoPublish: false, autoHashtags: true, autoTranslate: true, reminders: true,
  mix: { produits: 35, inspiration: 20, savoirFaire: 25, coulisses: 10, promotion: 10 },
  postsPerWeek: 4,
  allowedDays: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"],
  allowedHours: ["09:00", "12:00", "18:00"],
  brandTone: "Premium, sobre, ancré dans l'artisanat marocain. Jamais promotionnel à l'excès.",
  mustMention: "Fabrication à la main à Fès, savoir-faire transmis, export international.",
  mustAvoid: "Prix barrés, promotions agressives, comparaisons avec la concurrence, emojis excessifs.",
  hashtags: "#zellige #atelierduzellige #artisanatmarocain #madeinmorocco #interiordesign",
  humanValidation: true,
};

export const seedSettings: AppSettings = {
  profile: { name: "Houda Bennani", email: "admin@atelierduzellige.ma", role: "Directrice commerciale", avatarInitials: "HB", phone: "+212 6 00 00 00 00" },
  theme: "light",
  notifications: { email: true, inApp: true, orders: true, quotes: true, agents: true, appointments: true },
  sidebarCMOpen: true,
};
