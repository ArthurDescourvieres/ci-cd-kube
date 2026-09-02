# Sujet M2 — Pipelines CI/CD, Kubernetes

> Conversion fidèle du PDF `Sujet M2 - CI_CD.pdf`.
> Rendu : **vendredi 18 septembre 2026** — soutenance + repo GitHub public.

## Introduction du sujet

Dans ce projet, vous allez configurer une pipeline d'intégration continue (CI) et de déploiement continue (CD) en utilisant **GitHub Actions**. L'objectif est d'automatiser le processus de construction, de test, et de déploiement de votre projet en utilisant **Docker**.

La pipeline doit être déclenchée automatiquement :
- à chaque **push sur la branche `main`** ;
- lors de la **création d'un tag Git**.

Vous devrez ensuite déployer votre projet sur une **infrastructure Kubernetes fournie**.

## Objectif du projet

Le but est de développer une pipeline CI/CD complète. Voici les différentes étapes à suivre pour réaliser cette pipeline.

### 1. Récupération du code
- À chaque push sur la branche `main`, ou à la création d'un tag, la pipeline démarre par la récupération du code source du projet.

### 2. Exécution des tests
- Lancer les tests de l'application.
- Si un test échoue, la pipeline doit **s'arrêter immédiatement**.

### 3. Build de l'image Docker
- Construire une image Docker du projet, **adaptée à l'environnement de développement ou de production**, en fonction de la branche ou du tag.

### 4. Push de l'image Docker
- Pousser l'image Docker sur un registre, tel que **GitHub Container Registry (GHCR)** ou **Docker Hub**.
- Utiliser des **tags** pour distinguer les images de développement (branche `main`) et de production (tag Git).

### 5. Envoi de notifications
- Envoyer une notification via **Google Chat** à chaque exécution de la pipeline, indiquant le succès ou l'échec.
- La notification doit contenir des informations clés, telles que :
  - le **commit responsable** ;
  - le **statut de la pipeline** ;
  - en cas d'échec, la **raison de l'échec** (logs, erreurs).

### 6. Déploiement sur l'infra Kubernetes
- Création des fichiers de configuration permettant de déployer votre image Docker (`deployment`, `service`, `ingress`, `storage` ?).
- Déploiement de ces fichiers sur l'infra Kubernetes fournie, et **vérification du bon fonctionnement** du projet.
- **Automatisation du changement de l'image Docker** déployée sur Kubernetes après l'exécution de la pipeline.

## Compétences visées

- Rédiger et exécuter les scénarios de tests pour détecter et corriger les erreurs et garantir la qualité de l'application.
- Automatisation, intégration et réponse rapide (**SOAR**).
- Concevoir, implémenter et utiliser des pipelines CI/CD avec des outils d'automatisation.
- Déployer et orchestrer des environnements conteneurisés.
- Assurer la **portabilité**, la **scalabilité** et la **résilience** des applications en optimisant la consommation des ressources.

## Rendu

- Le projet sera présenté lors d'une **soutenance** qui montrera le bon fonctionnement du projet, et les fichiers de config créés.
- Le projet devra être livré sur GitHub : `https://github.com/prenom-nom/ci-cd-kube`
- **Penser à rendre ce repo public.**

## Base de connaissances

- GitHub Actions — https://docs.github.com/en/actions
- Kubernetes Deployments — https://kubernetes.io/docs/concepts/workloads/controllers/deployment/
- Référence `kubectl` — https://kubernetes.io/docs/reference/kubectl/
- GitHub Container Registry — https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry
- `act` (exécuter GitHub Actions en local) — https://github.com/nektos/act
