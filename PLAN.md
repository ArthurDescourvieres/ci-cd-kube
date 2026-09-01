# PLAN — CI-CD Kube, étape par étape

> Règle du jeu : voir [CLAUDE.md](CLAUDE.md) § « Mode de travail ».
> **Toi** tu tapes tout ce qui est marqué ✍️. **Claude** ne génère que le 🤖.
> Une étape est finie quand le fichier marche. Les questions de contrôle sont là
> pour repérer ce qu'il faudra réviser avant la soutenance, pas pour bloquer.

**Deadline : vendredi 18 septembre 2026.** Aujourd'hui : 1er septembre.

Légende : ✍️ tu tapes (dicté) · 🤖 Claude génère · 🖥️ Claude lance la commande
et te l'explique · 🧑 manip que toi seul peux faire (navigateur, compte, install)

Chaque étape a son **issue GitHub** (numérotées 1 à 41, même ordre que ce
fichier) et sa carte sur le board :

- Burn down : [`docs/burndown.png`](docs/burndown.png) — régénéré à chaque
  étape close
- Board : <https://github.com/users/ArthurDescourvieres/projects/11>
- Issues : <https://github.com/ArthurDescourvieres/ci-cd-kube/issues>

---

## Lot 0 — Mise en place (aujourd'hui, ~1 h)

- [x] **0.1 — Créer le repo GitHub public** `ci-cd-kube` 🖥️
      Public dès le départ (imposé par le sujet), sans README auto pour éviter
      un merge inutile au premier push.
- [x] **0.2 — `git init` local + `.gitignore`** 🤖
      `node_modules/`, `.env`, `*.kubeconfig`. Le repo est public : ce qui fuite
      est définitif (l'historique Git en garde la trace même après suppression).
- [x] **0.3 — Premier commit + push** 🖥️
      On pousse `CLAUDE.md`, `SUJET.md`, `PLAN.md`, `.gitignore`. Rien d'autre.
      *Contrôle : pourquoi la branche s'appelle `main` et pas `master` ?*

---

## Lot 1 — L'application prétexte (S1, ~2 h)

L'app ne rapporte aucun point. Elle doit juste être **testable** et **buildable**.

- [x] **1.1 — `package.json` + install** 🤖
      Express + Vitest + Supertest. Claude écrit le fichier et t'explique les
      4 champs qui comptent : `type`, `scripts`, `dependencies` vs
      `devDependencies`.
      *Contrôle : pourquoi Vitest est en `devDependencies` ? Quel impact sur la
      taille de l'image Docker ?*
- [x] **1.2 — `src/app.js`** ✍️
      L'app Express seule : une route `GET /` (message + version) et une route
      `GET /health` (pour les probes Kubernetes plus tard). **Exporte** l'app,
      ne l'écoute pas.
- [x] **1.3 — `src/server.js`** ✍️
      Importe l'app et fait le `listen()`. Deux fichiers au lieu d'un : c'est ce
      qui permet de tester l'app sans ouvrir de port.
      *Contrôle : que se passerait-il en test si `listen()` était dans `app.js` ?*
- [ ] **1.4 — `tests/app.test.js`** ✍️
      2–3 tests Supertest : `GET /` → 200, `GET /health` → 200, route inconnue
      → 404. Un de ces tests servira à la **démo d'échec**.
- [ ] **1.5 — `npm test` vert en local** 🖥️
      *Contrôle : quel code de sortie renvoie `npm test` quand un test échoue ?
      Pourquoi toute la pipeline dépend de ça ?*

---

## Lot 2 — Docker (S1, ~3 h) — première vraie brique notée

- [ ] **2.1 — `.dockerignore`** 🤖
      *Contrôle : que se passe-t-il si on oublie `node_modules/` dedans ?*
- [ ] **2.2 — `Dockerfile`, étape `base`** ✍️
      `FROM node:22-alpine`, `WORKDIR`. Pourquoi Alpine, pourquoi épingler la
      version majeure plutôt que `node:latest`.
- [ ] **2.3 — `Dockerfile`, étape `deps`** ✍️
      `COPY package*.json` **avant** `COPY . .` — la ligne la plus souvent
      demandée en soutenance (cache de layers).
      *Contrôle : pourquoi copier `package.json` seul d'abord ?*
- [ ] **2.4 — `Dockerfile`, target `dev`** ✍️
      Toutes les dépendances, commande de dev.
- [ ] **2.5 — `Dockerfile`, target `prod`** ✍️
      `npm ci --omit=dev`, `USER node`, `CMD node src/server.js`.
      *Contrôle : pourquoi `USER node` ? Que risque-t-on en root dans un
      conteneur ?*
- [ ] **2.6 — Build local des deux targets** 🖥️
      Comparer les tailles avec `docker images` : l'écart dev/prod est un
      argument de soutenance.
- [ ] **2.7 — `compose.yaml`** ✍️
      Confort local uniquement, hors périmètre noté. Court.

---

## Lot 3 — CI : le workflow GitHub Actions (S1→S2, ~4 h)

- [ ] **3.1 — `.github/workflows/ci-cd.yml`, en-tête + `on:`** ✍️
      Déclencheurs : `push` sur `main` **et** tags `v*.*.*`.
      *Contrôle : que se passe-t-il si on pousse un tag depuis une branche autre
      que `main` ? Le workflow part-il quand même ?*
- [ ] **3.2 — Job `test`** ✍️
      `runs-on: ubuntu-latest`, checkout épinglé, `setup-node` avec cache npm,
      `npm ci`, `npm test`.
      *Contrôle : différence entre `npm ci` et `npm install` en CI ?*
- [ ] **3.3 — Job `build`** ✍️
      `needs: test` (le gate), login GHCR avec `GITHUB_TOKEN`, `permissions:`
      explicite au niveau job.
      *Contrôle : pourquoi `packages: write`, et pourquoi le déclarer par job
      plutôt qu'en haut du fichier ?*
- [ ] **3.4 — Stratégie de tags d'image** ✍️
      push `main` → `:dev` + `:sha-xxxxxxx` · tag `vX.Y.Z` → `:X.Y.Z` +
      `:latest`. Choix du `--target` (dev ou prod) selon le déclencheur.
      *Contrôle : pourquoi pousser aussi `:sha-…` alors qu'on a déjà `:dev` ?*
- [ ] **3.5 — Premier run vert sur GitHub** 🖥️
      Vérifier les images dans l'onglet **Packages** du repo.
- [ ] **3.6 — Démo d'échec** 🖥️
      Casser volontairement un test, pousser, vérifier que `build` ne démarre
      pas. **À refaire le jour de la soutenance** — c'est explicitement demandé.

---

## Lot 4 — Notifications Google Chat (S2, ~2 h)

- [ ] **4.1 — Créer l'espace Chat + le webhook** 🧑
      Google Chat → un espace → *Applications et intégrations* → *Webhooks*.
- [ ] **4.2 — Enregistrer `GOOGLE_CHAT_WEBHOOK` dans les secrets GitHub** 🧑
      Le repo est **public** : l'URL du webhook ne doit apparaître dans **aucun**
      fichier. Un webhook Chat n'a pas d'authentification — qui a l'URL peut
      poster.
- [ ] **4.3 — Job `notify`** ✍️
      `if: always()`, `needs:` sur tous les jobs précédents, payload JSON avec
      commit, auteur, statut, lien vers le run.
      *Contrôle : sans `if: always()`, dans quel cas la notif n'arrive-t-elle
      pas ? Et pourquoi c'est justement le cas où on en a le plus besoin ?*
- [ ] **4.4 — Vérifier les deux chemins** 🖥️🧑 succès **et** échec.

---

## Lot 5 — Kubernetes en local (S2, ~5 h) — le gros morceau

- [ ] **5.1 — Installer `kind` + `kubectl`** 🧑 **, créer le cluster** 🖥️
      Cluster avec un mapping de ports pour l'ingress.
- [ ] **5.2 — Namespace `ci-cd-kube`** 🖥️
      *Contrôle : pourquoi pas `default` ?*
- [ ] **5.3 — `k8s/deployment.yaml`** ✍️ (dicté en 3 blocs)
      `replicas: 2`, `resources.requests` **et** `limits`, `livenessProbe` +
      `readinessProbe` sur `/health`. C'est là que se perdent le plus de points.
      *Contrôle : différence liveness / readiness ? Que fait Kubernetes dans
      chaque cas quand la probe échoue ? Et si on met `limits` sans `requests` ?*
- [ ] **5.4 — `k8s/service.yaml`** ✍️
      *Contrôle : ClusterIP vs NodePort vs LoadBalancer — lequel et pourquoi ?*
- [ ] **5.5 — Ingress controller sur kind** 🖥️ (ingress-nginx)
- [ ] **5.6 — `k8s/ingress.yaml`** ✍️
- [ ] **5.7 — `kubectl apply` manuel + app joignable** 🖥️
      À ce stade tout marche **à la main**. La CD arrive après.
      *Contrôle : que montre `kubectl get pods -n ci-cd-kube` ? Et
      `kubectl describe pod` quand un pod est en `CrashLoopBackOff` ?*
- [ ] **5.8 — (optionnel) `k8s/pvc.yaml`** — seulement si l'app a un vrai besoin
      de stockage. Sinon, savoir **justifier son absence** en soutenance.

---

## Lot 6 — CD : fermer la boucle (S3, ~3 h)

- [ ] **6.1 — Installer le runner self-hosted** 🧑
      Repo → Settings → Actions → Runners. Comprendre le sens du réseau
      (connexion sortante, long polling) — voir CLAUDE.md.
- [ ] **6.2 — Job `deploy`** ✍️
      `runs-on: self-hosted`, `needs: build`, `if:` qui exclut les
      `pull_request`, `kubectl set image` avec le tag **immuable**, puis
      `kubectl rollout status`.
      *Contrôle : pourquoi `kubectl set image` et pas `kubectl apply` ? Pourquoi
      le tag `:dev` ne déclencherait aucun redéploiement ?*
      *Contrôle sécu : pourquoi ce job ne doit JAMAIS tourner sur une PR quand le
      repo est public et le runner sur ta machine ?*
- [ ] **6.3 — Test bout en bout** 🖥️
      Push sur `main` → nouvelle image → pods remplacés → app à jour.
      Puis tag `v1.0.0` → chemin production.
- [ ] **6.4 — Rollback** 🖥️
      `kubectl rollout undo`. Bonus de soutenance quasi gratuit.

---

## Lot 7 — Rendu (S3, ~3 h)

- [ ] **7.1 — `README.md`** 🤖 + relecture par toi
      Schéma de la pipeline, justification des choix, comment reproduire.
- [ ] **7.2 — Relire chaque fichier et savoir l'expliquer** ✍️
      Passe finale : tu ouvres chaque fichier et tu l'expliques à voix haute.
      Tout ce qui bloque = on y retourne.
- [ ] **7.3 — Répétition de la démo complète** 🧑
      Succès → échec (test cassé) → notif d'erreur → correction → redéploiement.
- [ ] **7.4 — Checklist de rendu de CLAUDE.md cochée à 100 %**

---

## Risques identifiés

| Risque | Quand ça mord | Parade |
|---|---|---|
| PC éteint / runner arrêté le jour J | soutenance | vérifier le runner **avant** de démarrer la démo |
| Cluster kind détruit au reboot | S2→S3 | savoir le recréer en 2 commandes, documentées dans le README |
| Webhook Chat commité par erreur | dès le lot 4 | il vit dans les secrets GitHub, jamais dans un fichier |
| Retard sur le lot 5 (k8s) | S2 | c'est le lot le plus long : ne pas le commencer un jeudi soir |
