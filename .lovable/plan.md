# Mise à jour ciblée — CM, rendez-vous et prospects

## Objectif
Réorganiser uniquement les trois zones demandées, sans modifier leurs données, règles métier ou les autres écrans.

## Changements prévus

### 1. CM — Idées
- Ajouter en tête une rangée de métriques utiles issues des contenus existants.
- Placer les actions **Générer avec l’IA** et **Créer un post** dans l’en-tête.
- Conserver tous les paramètres actuels et les réunir dans un bloc de génération pleine largeur.
- Afficher immédiatement dessous les cartes de résultats générés, puis l’historique filtrable.
- Réutiliser la fenêtre d’édition actuelle pour **Créer un post**, afin de conserver exactement les mêmes champs et actions.

### 2. Agent Prise de rendez-vous
- Faire de `/agents/booking` l’interface unique sous **Agents IA**, nommée **Agent Prise de rendez-vous**.
- Retirer l’entrée séparée **Rendez-vous** de la sidebar.
- Intégrer dans cette interface unique : KPIs, analyse de demande, créneaux proposés, agenda mois/semaine/jour/liste, création/modification, glisser-déposer, confirmations, déplacements, annulations, rappels et historique.
- Conserver `/rendez-vous` comme ancienne adresse compatible, redirigée vers l’interface fusionnée.
- Mettre à jour les liens internes concernés vers l’interface unique.

### 3. Prospects / CRM
- Créer une fiche dédiée `/prospects/$id`, sur le modèle des fiches clients existantes.
- Rendre les cartes Kanban et les lignes du tableau ouvrables vers cette fiche, sans perturber le glisser-déposer ni le menu d’actions.
- Afficher les coordonnées, projet, valeur, score, étape, notes et les éléments liés : tâches, rendez-vous, échantillons, échanges et activité.
- Conserver les actions existantes de modification et suppression sur la fiche.

## Validation
- Vérifier la sidebar et les anciennes adresses.
- Tester la génération/création de contenu CM.
- Tester l’analyse puis l’ajout d’un rendez-vous dans l’agenda fusionné.
- Tester l’ouverture d’un prospect depuis les vues Kanban et tableau, sur ordinateur et mobile.
- Vérifier les métadonnées propres de la nouvelle fiche prospect.
