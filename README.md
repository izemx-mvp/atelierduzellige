# Remix of Atelier AI

# PROMPT GLOBAL & CAHIER DES CHARGES — MVP ATELIER DU ZELLIGE

## Application de gestion centralisée et ERP augmenté par des agents IA

Atelier du Zellige est une entreprise marocaine spécialisée dans la fabrication et la réalisation de zellige artisanal, avec un positionnement mêlant **savoir-faire traditionnel marocain, design contemporain et projets de décoration/architecture**, au Maroc et à l'international, avec une forte activité d'export.

Ce MVP vise à remplacer le fonctionnement manuel actuel basé principalement sur **Excel + emails** par une application moderne, centralisée, interactive et intelligente.

---

# 1. RÈGLE PRINCIPALE — MVP RÉELLEMENT FONCTIONNEL

L'application doit être un **véritable MVP fonctionnel**, et non une simple maquette visuelle.

### Aucun composant statique

Tous les éléments visibles doivent être fonctionnels :

* Boutons
* Menus
* Sidebar
* Sous-menus
* Filtres
* Tris
* Recherche
* Modales
* Formulaires
* Tableaux
* Onglets
* Actions CRUD
* Drag & drop
* Calendrier
* Notifications
* Actions des agents IA
* KPIs
* Graphiques interactifs

### Persistence des données

Utiliser des **mock data robustes persistées dans `localStorage`**.

Toute action doit mettre immédiatement à jour l'application :

* Création
* Modification
* Suppression
* Changement de statut
* Conversion prospect → client
* Création d'un devis
* Création d'une commande
* Planification d'un rendez-vous
* Création d'une publication
* Modification des paramètres
* Actions des agents IA

Les KPIs, tableaux, graphiques et historiques doivent automatiquement refléter les nouvelles données.

### Expérience utilisateur

Prévoir systématiquement :

* États de chargement
* États vides
* Gestion des erreurs
* Toasts de confirmation
* Confirmations avant actions destructives
* Feedback visuel après chaque action
* Messages d'erreur compréhensibles
* États désactivés lorsque nécessaire

---

# 2. AUTHENTIFICATION & SESSION

Créer une page **Login moderne, premium et minimaliste**.

Les identifiants doivent être **pré-remplis par défaut** :

```text
Email : admin@atelierduzellige.ma
Mot de passe : admin123
```

### Fonctionnalités

* Validation des champs
* Bouton "Se connecter"
* Afficher / masquer le mot de passe
* Gestion d'une session mock
* Redirection vers le Dashboard après connexion
* Conservation de session
* Déconnexion fonctionnelle
* Protection des pages lorsque l'utilisateur n'est pas connecté

---

# 3. STRUCTURE DE NAVIGATION & SIDEBAR

## 3.1 Sidebar principale

La sidebar doit intégrer :

* Logo Atelier du Zellige
* Nom de l'application
* Navigation principale
* Icônes cohérentes avec **Lucide Icons**
* État actif clairement identifiable
* Badges de notification lorsque nécessaire

### Navigation

```text
Dashboard

Clients

Prospects / CRM

Produits

Échantillons

Devis

Commandes

Production / Préparation

Export & Transport

Rendez-vous

Communication

Agents IA
    ├── Community Manager
    │   ├── CM — Idées
    │   ├── CM — Planning
    │   └── CM — Paramètres
    │
    ├── Service Client & Prospection
    ├── Prise de rendez-vous
    ├── Suivi des commandes
    └── Relances

Analytics

Paramètres
```

Le sous-menu **Community Manager** doit être dépliable.

Il doit conserver son état ouvert/fermé pendant la navigation lorsque cela est pertinent.

### Header

Le header doit contenir :

* Breadcrumb
* Recherche globale cross-modules
* Centre de notifications
* Profil utilisateur
* Menu utilisateur
* Déconnexion

La recherche globale doit pouvoir rechercher dans plusieurs modules :

* Clients
* Prospects
* Produits
* Devis
* Commandes
* Échantillons
* Rendez-vous

---

# 4. MODULES MÉTIER CENTRAUX — ERP

## 4.1 Dashboard

Créer un dashboard opérationnel permettant d'avoir une vision globale de l'activité.

### KPIs

Afficher notamment :

* Chiffre d'affaires
* Commandes en cours
* Prospects
* Devis en cours
* Retards
* Marge estimée

Les KPIs doivent être calculés à partir des données mockées et évoluer automatiquement.

### Visualisations

Ajouter des graphiques dynamiques pour :

* Évolution des ventes
* Ventes par catégorie
* Ventes par pays
* Performance des produits
* Commandes par statut

### Activité

Ajouter :

* Timeline des activités récentes
* Alertes importantes
* Notifications
* Actions rapides

Les alertes doivent être cliquables et rediriger vers le module concerné.

---

# 4.2 Clients

Créer un module complet de gestion des clients.

### Liste

Tableau avec :

* Nom
* Entreprise
* Pays
* Email
* Téléphone
* Type de client
* Dernière activité
* Statut
* Actions

### Fiche client

Afficher :

* Informations générales
* Coordonnées
* Historique des échanges
* Commandes
* Devis
* Échantillons
* Rendez-vous
* Notes
* Activité récente

Permettre :

* Création
* Modification
* Suppression
* Recherche
* Filtrage
* Tri

---

# 4.3 Prospects / CRM

Créer un véritable pipeline commercial.

### Étapes

```text
Nouveau
→ Contacté
→ Qualifié
→ Échantillon
→ Devis
→ Négociation
→ Gagné
→ Perdu
```

### Vues

Prévoir :

* Vue tableau
* Vue Kanban

Le Kanban doit permettre le déplacement d'un prospect entre les différentes étapes.

### Actions

Permettre :

* Créer un prospect
* Modifier
* Supprimer
* Qualifier
* Ajouter une note
* Ajouter une tâche
* Créer un rendez-vous
* Créer un échantillon
* Créer un devis
* Convertir en client

Lorsqu'un prospect est converti en client, les données doivent être correctement transférées.

---

# 4.4 Produits

Créer un catalogue complet.

### Collections

Prévoir notamment :

* Atlas
* Fès
* Marrakech
* Sur-mesure

### Informations produit

Chaque produit peut contenir :

* Référence
* Nom
* Collection
* Description
* Dimensions
* Couleurs
* Matière
* Coût
* Prix
* Stock
* Statut
* Image / visuel

### Fonctionnalités

* CRUD complet
* Recherche
* Filtres
* Tri
* Gestion du stock
* Fiche détaillée

---

# 4.5 Échantillons

Créer un module de suivi des échantillons.

### Workflow

```text
Demandé
→ En préparation
→ Envoyé
→ En attente de validation
→ Validé
```

Avec possibilité de :

```text
Refusé
```

### Informations

* Client / prospect
* Produit
* Quantité
* Date de demande
* Date d'envoi
* Statut
* Commentaires
* Validation

---

4.6 Devis

Créer un module complet de gestion des devis.

Cycle de vie
Brouillon
→ Envoyé
→ En attente
→ Validé

Alternatives :

Refusé
Expiré
Liste des devis

Afficher un tableau avec notamment :

Numéro du devis
Client
Projet
Date de création
Date d'expiration
Montant HT
TVA
Montant TTC
Statut
Actions

Prévoir :

Recherche
Filtres
Tri
Pagination si nécessaire
Création
Modification
Suppression
Duplication
Changement de statut
Détails d'un devis

Lorsqu'un utilisateur clique sur un devis, ne pas ouvrir les détails dans une fenêtre modale ou une popup.

Ouvrir une page dédiée aux détails du devis avec une URL / route propre, par exemple :

/devis/:id

Cette page doit présenter le devis dans un format professionnel ressemblant à un véritable document commercial / PDF.

En-tête de la page

Afficher une barre d'actions en haut de la page avec :

Retour à la liste des devis
Modifier le devis
Imprimer
Télécharger le PDF

Les boutons Imprimer et Télécharger le PDF doivent être réellement fonctionnels.

Aperçu du devis

La page doit afficher un aperçu complet et fidèle du document PDF.

Le document doit avoir une présentation professionnelle et premium cohérente avec l'identité d'Atelier du Zellige.

En-tête du document

Afficher :

Logo Atelier du Zellige
Nom de l'entreprise
Coordonnées de l'entreprise
Numéro du devis
Date d'émission
Date d'expiration
Statut du devis
Informations client

Afficher :

Nom du client / entreprise
Contact
Email
Téléphone
Adresse
Pays
Informations du projet

Afficher :

Nom du projet
Description
Type de projet
Localisation
Informations complémentaires
Lignes du devis

Créer un tableau détaillé contenant :

Référence produit
Produit / description
Collection
Dimensions
Couleur
Quantité
Prix unitaire
Remise éventuelle
Total
Totaux

Afficher clairement :

Sous-total HT
Remise
Frais éventuels
TVA
Total TTC
Informations complémentaires

Prévoir :

Conditions de paiement
Délais estimatifs
Conditions de livraison
Conditions de validité du devis
Notes
Observations
Pied du document

Afficher :

Coordonnées Atelier du Zellige
Informations légales si disponibles
Mention de validité
Signature / zone de validation si nécessaire
Impression du devis

Le bouton Imprimer doit ouvrir l'interface d'impression native du navigateur.

L'impression doit utiliser une mise en page optimisée pour le format A4 :

Marges adaptées
Masquage de la sidebar
Masquage du header de l'application
Masquage des boutons d'action
Affichage uniquement du document
Respect des sauts de page
Mise en page professionnelle

Utiliser des styles @media print dédiés.

Téléchargement PDF

Le bouton Télécharger le PDF doit générer réellement un fichier PDF à partir du devis affiché.

Le fichier doit être téléchargé automatiquement avec un nom structuré, par exemple :

Devis-ATZ-2026-001.pdf

Le PDF téléchargé doit reprendre fidèlement :

Le logo
Les informations du devis
Les informations client
Les lignes du devis
Les totaux
Les conditions
Le footer

Le PDF doit être au format A4 et prêt à être envoyé au client.

Afficher un toast après génération :

PDF téléchargé avec succès.

En cas d'erreur :

Impossible de générer le PDF. Veuillez réessayer.

Actions depuis la page de détails

Depuis cette page, permettre également :

Modifier le devis
Dupliquer le devis
Changer son statut
Envoyer le devis en mode simulé
Créer une commande à partir du devis si celui-ci est validé
Workflow devis → commande

Lorsqu'un devis passe au statut Validé, afficher une proposition claire :

Ce devis a été validé. Voulez-vous créer une commande à partir de ce devis ?

Actions :

Créer la commande
Plus tard

Si l'utilisateur crée la commande, reprendre automatiquement les informations pertinentes du devis :

Client
Projet
Produits
Quantités
Prix
Montants
Informations de livraison
Notes

La nouvelle commande doit ensuite apparaître automatiquement dans le module Commandes.

Important — UX

Les détails du devis doivent toujours être affichés dans une page dédiée, jamais dans :

Une popup
Une modale
Un drawer
Une fenêtre flottante

La page doit être accessible directement depuis la liste des devis et permettre à l'utilisateur de revenir facilement à la liste.

Le document doit donner l'impression d'un véritable devis professionnel prêt à être imprimé ou envoyé au client.

---

# 4.7 Commandes & Production / Préparation

Créer un suivi complet du cycle de commande.

### Workflow

La commande doit suivre les différentes étapes de production et de préparation jusqu'à l'expédition.

Afficher :

* Statut actuel
* Progression
* Timeline
* Étapes terminées
* Étapes en cours
* Étapes à venir
* Dates prévues
* Dates réelles
* Responsable
* Alertes

### Fonctionnalités

* Création
* Modification
* Changement de statut
* Timeline interactive
* Barre de progression
* Détection des retards
* Ajout de tâches
* Notes internes

---

# 4.8 Export & Transport

Créer un module dédié aux expéditions internationales.

### Informations

* Commande
* Client
* Pays destinataire
* Adresse
* Transporteur
* Numéro de suivi
* Date d'expédition
* Date estimée d'arrivée
* Statut

### Statuts

Exemple :

```text
Préparation
→ Prêt à expédier
→ Expédié
→ En transit
→ Arrivé
→ Livré
```

Prévoir également les situations :

* Retard
* Blocage
* Problème transporteur

---

# 4.9 Rendez-vous & Communication

## Rendez-vous

Créer un calendrier interactif avec :

* Vue mois
* Vue semaine
* Vue jour
* Liste

Fonctionnalités :

* Créer
* Modifier
* Déplacer
* Annuler
* Confirmer
* Ajouter participants
* Ajouter notes
* Rappels simulés

## Communication

Créer un centre de communication centralisé permettant de regrouper :

* Emails
* Messages prospects
* Messages clients
* Historique des échanges

Les conversations doivent pouvoir être analysées par les agents IA.

---

# 5. ARCHITECTURE MÉTIER DES AGENTS IA

Les agents IA ne doivent **pas être de simples chatbots**.

Chaque agent doit fonctionner selon une logique opérationnelle :

```text
Données
→ Analyse IA
→ Recommandation
→ Validation humaine
→ Action
→ Feedback
```

Chaque agent doit disposer d'une interface dédiée avec :

* Données d'entrée
* Résultats IA
* Recommandations
* Actions
* Historique
* Statistiques
* États de traitement

Pour le MVP, les traitements IA peuvent être **simulés avec des réponses mockées intelligentes**, mais l'interface et les workflows doivent être conçus comme de véritables fonctionnalités IA.

---

# 5.1 AGENT COMMUNITY MANAGER

Le Community Manager est un véritable outil de gestion de contenu social media augmenté par l'IA.

Il comporte trois interfaces :

```text
CM — Idées
CM — Planning
CM — Paramètres
```

---

## A. CM — Idées

### Génération de contenu

Créer un champ permettant à l'utilisateur d'indiquer une consigne.

Exemple :

> Présenter la collection Atlas et mettre en avant le savoir-faire artisanal marocain.

Ajouter un bouton :

**Générer avec l'IA**

### Paramètres de génération

Permettre de sélectionner :

* Réseau :

  * Instagram
  * Facebook
  * TikTok

* Type :

  * Publication
  * Carrousel
  * Story
  * Reel
  * Vidéo

* Produit / collection associé

* Objectif :

  * Notoriété
  * Engagement
  * Vente
  * Présentation produit
  * Inspiration

* Audience

* Ton :

  * Premium
  * Élégant
  * Authentique
  * Institutionnel
  * Inspirant

* Langue :

  * FR
  * EN
  * AR

* Longueur

* Call-to-Action

### Résultat

Afficher les contenus générés sous forme de cartes éditables.

Chaque carte contient :

* Titre
* Texte
* Hashtags
* CTA
* Réseau
* Produit associé
* Statut

### Actions

Chaque contenu doit pouvoir être :

* Modifié
* Régénéré
* Copié
* Enregistré
* Ajouté au planning
* Supprimé

### Historique

Ajouter une liste filtrable par :

```text
Brouillon
Généré
Validé
Planifié
Publié
Archivé
```

Recherche par :

* Mot-clé
* Produit
* Collection
* Réseau

---

# 5.2 CM — PLANNING

Créer un véritable Content Planner.

### Vues

* Mois
* Semaine
* Liste

Afficher simultanément :

* Instagram
* Facebook
* TikTok

### Fonctionnalités

Les publications doivent pouvoir être :

* Créées
* Modifiées
* Déplacées
* Reprogrammées
* Supprimées

Le déplacement doit être possible via **drag & drop** lorsque pertinent.

### Modal de planification

Permettre de définir :

* Contenu
* Réseau
* Date
* Heure
* Produit
* Collection
* Statut

Statuts :

```text
Brouillon
Planifié
Publié
```

Ajouter :

* Publication immédiate
* Passage en brouillon

### Optimisation IA

Ajouter un bouton :

**Optimiser mon planning avec l'IA**

L'IA analyse :

* Fréquence de publication
* Répartition des collections
* Répartition des types de contenus
* Réseaux utilisés

Puis propose des recommandations.

L'utilisateur doit pouvoir :

* Accepter une suggestion
* Refuser une suggestion

---

# 5.3 CM — PARAMÈTRES

## Comptes sociaux

Afficher :

* Instagram
* Facebook
* TikTok

Avec :

* État de connexion
* Synchronisation
* Dernière synchronisation

La connexion est simulée dans le MVP.

## Automatisations

Ajouter des toggles pour :

* Publication automatique
* Génération automatique de hashtags
* Traductions automatiques
* Rappels

## Répartition des contenus

Créer des sliders pour :

* Produits
* Inspiration
* Savoir-faire
* Coulisses
* Promotion

### Règle obligatoire

Le total doit toujours être égal à :

**100 %**

Empêcher la sauvegarde si le total est différent de 100 %.

## Fréquence & Brand Voice

Permettre de définir :

* Nombre de publications par semaine
* Jours autorisés
* Horaires autorisés
* Ton de la marque
* Règles de contenu à mentionner
* Règles de contenu à éviter
* Hashtags
* Validation humaine obligatoire ON/OFF

---

# 5.4 AGENT SERVICE CLIENT & PROSPECTION

Créer une interface de type **AI Inbox**.

L'agent analyse automatiquement les messages entrants.

### Informations détectées

* Intention
* Entreprise
* Pays
* Projet
* Produits recherchés
* Quantités
* Budget si disponible
* Niveau d'urgence
* Score de qualification

### Actions IA

Après analyse, proposer :

* Créer prospect
* Créer devis
* Créer rendez-vous
* Ajouter une tâche
* Répondre au message
* Ajouter une note

Les actions doivent être exécutables en un clic.

---

# 5.5 AGENT DE PRISE DE RENDEZ-VOUS

Créer un **Booking Center**.

### Fonctionnalités

L'agent doit pouvoir simuler :

* Analyse d'une demande
* Proposition de créneaux disponibles
* Confirmation
* Déplacement
* Annulation
* Rappel 24h avant
* Rappel 1h avant

Toute réservation doit automatiquement mettre à jour le calendrier global.

---

# 5.6 AGENT DE SUIVI DES COMMANDES

Créer un **Order Control Center**.

L'agent surveille automatiquement les commandes.

### AI Insights

Détecter notamment :

* Retards
* Étapes manquantes
* Échantillon absent
* Transporteur absent
* Commande bloquée
* Étape dépassant la date prévue

### Actions

Permettre :

* Relancer
* Modifier la commande
* Créer une tâche corrective
* Ajouter une note
* Marquer le problème comme traité

---

# 5.7 AGENT DE RELANCE

Créer un agent **Smart Follow-up**.

L'agent identifie automatiquement les situations nécessitant une relance :

* Devis sans réponse
* Échantillon non validé
* Prospect inactif
* Commande bloquée
* Client sans réponse
* Rendez-vous non confirmé

### Actions

Permettre :

* Générer un message personnalisé
* Modifier le message
* Copier
* Planifier l'envoi
* Envoyer immédiatement en mode simulé
* Ignorer la relance
* Créer une tâche

### Règles automatiques

Permettre de configurer des règles basées sur des délais.

Exemples :

```text
Après 3 jours sans réponse → proposer une relance

Après 7 jours sans validation d'un échantillon → créer une alerte

Après 5 jours sans réponse à un devis → proposer une relance
```

---

# 5.8 ACTIVITY CENTER & STATISTIQUES DES AGENTS

Chaque agent doit disposer d'un journal d'activité.

### Activity Log

Afficher :

* Date
* Agent
* Action
* Objet concerné
* Résultat
* Statut

### Filtres

* Agent
* Type d'action
* Statut
* Date

### Métriques

Afficher notamment :

* Nombre de tâches traitées
* Taux d'approbation
* Taux de conversion
* Nombre de recommandations
* Nombre d'actions exécutées

---

# 6. ANALYTICS & PARAMÈTRES GLOBAUX

# 6.1 Analytics

Créer un dashboard analytique avancé.

### Analyses

Afficher des données croisées sur :

* Ventes
* Clients
* Prospects
* Produits
* Collections
* Délais opérationnels
* Commandes
* Export
* Pays

### Filtres

Prévoir des filtres temporels :

* Aujourd'hui
* 7 jours
* 30 jours
* 3 mois
* 6 mois
* 12 mois
* Personnalisé

Les graphiques doivent se mettre à jour selon les filtres.

---

# 6.2 Paramètres globaux

Créer une page de paramètres.

### Profil

Permettre de gérer :

* Nom
* Email
* Avatar
* Informations utilisateur

### Apparence

Permettre :

* Light Mode
* Dark Mode

Le **Light Mode doit être activé par défaut**.

### Notifications

Permettre de configurer les préférences de notification.

### Données de démonstration

Ajouter une action :

**Reset Demo Data**

Avec une confirmation avant réinitialisation.

La réinitialisation doit restaurer les données initiales du MVP.

---

# 7. DIRECTION ARTISTIQUE & DESIGN SYSTEM

L'application doit refléter le positionnement haut de gamme d'Atelier du Zellige.

L'esthétique recherchée est :

> **Luxe discret + architecture contemporaine + artisanat marocain.**

Éviter les interfaces génériques de type dashboard SaaS.

---

## Palette

### Noir / Charcoal

Utilisation :

* Sidebar
* Navigation
* Textes principaux
* Éléments structurants

### Blanc / Off-White

Utilisation :

* Fond principal
* Surfaces de travail
* Cartes
* Zones de contenu

### Gold / Doré

Utilisation avec parcimonie pour :

* Éléments actifs
* Boutons principaux
* Icônes importantes
* Accents
* Indicateurs
* Highlights

Le doré ne doit jamais être utilisé partout.

---

# 7.1 THÈMES

## Light Mode

Thème par défaut :

* Lumineux
* Élégant
* Aéré
* Moderne
* Excellent contraste
* Off-white plutôt que blanc agressif lorsque pertinent

## Dark Mode

Thème :

* Noir profond
* Charcoal
* Contrastes maîtrisés
* Accents dorés subtils
* Aspect premium

Le changement de thème doit être instantané et persistant.

---

# 7.2 COMPOSANTS

Utiliser :

* Typographie **Inter**
* Icônes **Lucide**
* Angles légèrement arrondis
* Ombres très discrètes
* Bordures fines
* Espacements cohérents
* Système d'espacement basé sur 4px / 8px

Éviter :

* Excès de gradients
* Excès de couleurs
* Boutons "pill" partout
* Cards trop arrondies
* Interfaces surchargées
* Effets visuels inutiles

Le design doit être **premium, professionnel, sobre et contemporain**.

---

# 7.3 RESPONSIVE DESIGN

L'application doit être responsive.

Prévoir une expérience cohérente sur :

* Desktop
* Laptop
* Tablette

La priorité UX est le desktop, car l'application est principalement destinée à une utilisation professionnelle interne.

La sidebar doit pouvoir être réduite ou adaptée aux écrans plus petits.

---

# 8. DONNÉES MOCK & STRUCTURE

Créer suffisamment de données de démonstration pour rendre l'application crédible dès le premier lancement.

Prévoir des données réalistes pour :

* Clients
* Prospects
* Produits
* Collections
* Échantillons
* Devis
* Commandes
* Production
* Expéditions
* Rendez-vous
* Messages
* Publications
* Activités IA

Les données doivent être cohérentes entre elles.

Exemple :

Un prospect converti en client doit pouvoir être retrouvé dans :

* Clients
* Historique CRM
* Devis
* Commandes
* Rendez-vous

---

# 9. RÈGLES D'INTERACTION

Chaque action utilisateur doit avoir un feedback.

### Exemple

Après création :

> Client créé avec succès.

Après modification :

> Modifications enregistrées.

Après suppression :

> Élément supprimé.

Pour les suppressions importantes :

> Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible.

### États vides

Chaque module doit prévoir un état vide utile avec :

* Illustration légère
* Message explicatif
* CTA permettant de créer le premier élément

---

# 10. COHÉRENCE ENTRE LES MODULES

Les modules doivent fonctionner ensemble et non comme des pages indépendantes.

Exemples :

### CRM → Client

```text
Prospect qualifié
→ Prospect gagné
→ Conversion en client
```

### Client → Devis

```text
Client
→ Nouveau devis
→ Validation
→ Proposition de commande
```

### Devis → Commande

```text
Devis validé
→ Créer commande
→ Production
→ Préparation
→ Export
→ Livraison
```

### Commande → Agent IA

```text
Commande en retard
→ Agent Suivi des commandes
→ AI Insight
→ Recommandation
→ Action corrective
```

### Communication → Agents IA

```text
Message entrant
→ AI Inbox
→ Analyse
→ Qualification
→ Action métier
```

### Rendez-vous → Agent Booking

```text
Demande de rendez-vous
→ Analyse IA
→ Créneaux disponibles
→ Confirmation
→ Calendrier global
```

---

# 11. FOOTER

Ajouter dans le footer :

> **Ce MVP a été conçu et développé par IZEMX**

Le footer doit être discret, élégant et cohérent avec le design global.

---

# 12. EXIGENCES FINALES POUR LE MVP

Avant de considérer le MVP comme terminé, vérifier que :

* [ ] Login fonctionnel
* [ ] Déconnexion fonctionnelle
* [ ] Session persistante
* [ ] Sidebar fonctionnelle
* [ ] Tous les sous-menus fonctionnels
* [ ] Recherche globale fonctionnelle
* [ ] Notifications fonctionnelles
* [ ] CRUD clients fonctionnel
* [ ] CRM fonctionnel
* [ ] Kanban fonctionnel
* [ ] Conversion prospect → client fonctionnelle
* [ ] Catalogue produits fonctionnel
* [ ] Gestion des échantillons fonctionnelle
* [ ] Gestion des devis fonctionnelle
* [ ] Conversion devis → commande fonctionnelle
* [ ] Suivi des commandes fonctionnel
* [ ] Suivi production fonctionnel
* [ ] Export & transport fonctionnel
* [ ] Calendrier fonctionnel
* [ ] Centre de communication fonctionnel
* [ ] CM — Idées fonctionnel
* [ ] CM — Planning fonctionnel
* [ ] CM — Paramètres fonctionnel
* [ ] Agent Service Client & Prospection fonctionnel
* [ ] Agent Prise de rendez-vous fonctionnel
* [ ] Agent Suivi des commandes fonctionnel
* [ ] Agent Relances fonctionnel
* [ ] Activity Center fonctionnel
* [ ] Analytics fonctionnels
* [ ] Paramètres fonctionnels
* [ ] Light / Dark Mode fonctionnel
* [ ] Reset Demo Data fonctionnel
* [ ] localStorage utilisé pour la persistence
* [ ] Toasts et feedbacks utilisateur présents
* [ ] États de chargement présents
* [ ] États vides présents
* [ ] Gestion des erreurs présente
* [ ] Design responsive
* [ ] Design premium noir / blanc / gold
* [ ] Footer IZEMX présent

---

# OBJECTIF FINAL

Le résultat attendu est une **application MVP complète, cohérente et réellement interactive**, représentant un véritable **ERP augmenté par des agents IA pour Atelier du Zellige**.

L'application doit donner l'impression d'un produit professionnel déjà exploitable, et non d'une simple démonstration UI.

Les différents modules doivent partager les mêmes données mockées, les workflows doivent être interconnectés et toutes les actions principales doivent produire des changements visibles et persistants dans l'application.

**Priorité absolue : fonctionnalité réelle + cohérence métier + UX premium + design moderne.**

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/b2720d91-fee6-48b5-bdc2-06872da88b7e).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
