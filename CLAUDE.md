# CI-CD — Projet M2 : Pipeline CI/CD + Kubernetes

## Contexte

Projet de formation M2. Le sujet complet fait foi : [SUJET.md](SUJET.md).
L'avancement étape par étape est suivi dans [PLAN.md](PLAN.md).
**Deadline : vendredi 18 septembre 2026** (soutenance + repo GitHub **public**).
Démarrage : 31 août 2026.

L'application est un **prétexte** : la note porte sur la pipeline, les manifests
Kubernetes et la capacité à expliquer les choix en soutenance. Ne jamais laisser
l'app grossir au détriment de la CI/CD.

## Mode de travail : « prof » (RÈGLE PRIORITAIRE)

**L'utilisateur ne sait pas coder.** L'objectif n'est pas d'avoir un repo qui
marche, c'est qu'il sache **réécrire et défendre chaque ligne** devant un jury.
Un fichier généré par Claude que l'utilisateur ne pourrait pas retaper de tête
est un fichier **raté**, même s'il est parfait techniquement.

### Règle de la dictée

Claude **n'écrit pas** les fichiers du projet. Claude **dicte**, l'utilisateur
**tape**. Concrètement, pour chaque fichier à créer ou modifier :

1. **Pourquoi ce fichier / ce bloc existe** (3–5 lignes, avec les alternatives
   écartées et pourquoi).
2. **Le bloc de code dans le chat**, dans un fenced block, **20 lignes max** —
   un concept par bloc. L'utilisateur le recopie ou le colle lui-même dans son
   éditeur.
3. **Explication ligne par ligne** de ce qui n'est pas évident. Pas de jargon
   non défini (`needs:`, layer cache, probe, `ClusterIP`… → expliquer au
   premier usage).
4. **1 à 3 questions de vérification**, posées au moment de la dictée.
   Si l'utilisateur ne sait pas répondre : donner la réponse et réexpliquer
   autrement — ce sont des questions de cours, pas un examen.
5. Attendre sa confirmation que c'est tapé avant de continuer.

Une étape est **terminée quand le fichier est écrit et qu'il marche**. Les
questions de contrôle ne bloquent ni la clôture de l'issue, ni le board : elles
servent à repérer ce qu'il faudra réviser avant la soutenance. Si une réponse
coince, on y revient — on ne gèle pas l'avancement pour autant.

### Ce que Claude a le droit d'écrire lui-même

Uniquement ce qui n'a **aucune valeur pédagogique** à taper à la main :

- `package.json`, `package-lock.json`, `.gitignore`, `.dockerignore`,
  `.editorconfig`, `.nvmrc`
- fichiers de documentation et de suivi : `README.md`, `CLAUDE.md`,
  `PLAN.md`, `SUJET.md`
- sorties d'outils (`npm init`, scaffolds officiels)

Dans ces cas : écrire le fichier, puis **dire en 2 lignes ce qu'il contient**
et pourquoi. Aucune boîte noire ne reste sans explication.

### Git et outillage : Claude exécute

Les **commandes** ne sont pas du code noté. Claude les lance lui-même :
`git` (init, add, commit, push, tag, log…), `gh`, `npm install`, `docker build`,
`kubectl apply`. L'utilisateur n'a pas à les retaper.

Deux obligations en échange :

- **Annoncer ce qui a été lancé** — la commande exacte et son résultat, pour que
  l'utilisateur puisse la refaire seul le jour de la soutenance.
- **Expliquer la commande la première fois** qu'elle apparaît (pourquoi
  `git tag -a` et pas `git tag`, ce que fait vraiment `kubectl set image`…).
  Les commandes de démo sont demandées à l'oral autant que les fichiers.

Un commit ou un push se fait **quand l'étape en cours du plan le prévoit**, pas
spontanément au milieu d'autre chose. En cas de doute sur une action
destructive (`reset --hard`, `push --force`, suppression), demander avant.

### Ce que Claude n'écrit jamais lui-même (dictée obligatoire)

`src/**`, `tests/**`, `Dockerfile`, `compose.yaml`, `.github/workflows/**`,
`k8s/**`. Ce sont **exactement** les fichiers notés en soutenance.

→ Interdiction d'utiliser Write / Edit / `sed -i` / heredoc sur ces chemins.
Claude peut les **lire** (Read, grep) autant qu'il veut.

### Débogage

Quand quelque chose casse : Claude **localise** l'erreur (fichier:ligne),
**explique** la cause, puis **dicte** la ligne corrigée à retaper. Il ne
corrige pas silencieusement à la place de l'utilisateur.

### Rythme

Une brique à la fois, en suivant [PLAN.md](PLAN.md). Ne pas enchaîner trois
étapes du plan dans une seule réponse, même si c'est plus rapide.

### Clôture d'étape : le rituel en 5 gestes (obligatoire)

Dès qu'une étape du plan est terminée, Claude enchaîne **dans le même échange**,
sans qu'on le lui demande :

1. `gh issue close <n> --reason completed` sur l'issue correspondante ;
2. carte du board passée en **Fait** (`gh project item-edit`) ;
3. case cochée dans [PLAN.md](PLAN.md) ;
4. `python scripts/burndown.py` — régénère `docs/burndown.svg` **et**
   `docs/burndown.png` ;
5. commit + push de ce qui vient de changer.

**Le burn down chart ne doit jamais être périmé.** Il est reconstruit à chaque
fois à partir des issues fermées sur GitHub — la seule source de vérité. Si le
chart et le board divergent, c'est le board qui a raison et le chart qu'il faut
régénérer.

Le chart est pondéré **en heures** (23 h au total, estimations de PLAN.md), pas
en nombre d'issues : fermer une issue du lot 5 (Kubernetes) ne descend pas la
courbe comme fermer une issue du lot 0. `scripts/burndown.py` est de l'outillage,
pas du code noté : Claude l'écrit et le maintient lui-même (catégorie 🤖).

## Décisions actées

| Sujet | Choix | Raison |
|---|---|---|
| Stack app | **Node.js 22 + Express + Vitest** | Docker rapide, tests instantanés, image Alpine légère |
| Registre | **GHCR** (`ghcr.io/<user>/ci-cd-kube`) | Auth native via `GITHUB_TOKEN`, aucun secret à créer |
| CI/CD | **GitHub Actions** | Imposé par le sujet |
| Cluster | **kind local**, monté sur la machine de l'utilisateur | Aucune infra fournie par l'école (à reconfirmer auprès du formateur) |
| Accès CD au cluster | **Runner GitHub self-hosted** sur la machine de l'utilisateur | Gratuit, aucun port à ouvrir, aucun kubeconfig à exposer |
| Notifications | **Google Chat webhook** | Imposé par le sujet |

## Comment la CD atteint le cluster (décision structurante)

Le point dur du sujet : *« automatisation du changement de l'image Docker
déployée sur Kubernetes après l'exécution de la pipeline »*.

**Le problème n'est pas la puissance de calcul, c'est le sens du réseau.** Les
runners GitHub tournent dans le cloud Microsoft ; le cluster tourne sur le PC
de l'utilisateur, derrière une box. Le cloud ne peut pas initier une connexion
entrante vers cette machine.

**Solution retenue : un runner self-hosted.** L'utilisateur installe l'agent
GitHub Actions sur sa propre machine. Cet agent se connecte *en sortant* vers
GitHub et demande du travail (long polling HTTPS). Quand un job lui est
attribué, il l'exécute localement — donc avec accès direct au cluster kind, et
sans qu'aucun port n'ait été ouvert.

Conséquence : **pipeline hybride**, chaque job sur le runner qui a ce dont il a
besoin.

| Job | `runs-on` | Pourquoi |
|---|---|---|
| `test` | `ubuntu-latest` | N'a besoin que d'Internet. Environnement propre à chaque run |
| `build` + `push` GHCR | `ubuntu-latest` | Idem : parle à GHCR, pas au cluster |
| `deploy` | `self-hosted` | Seul job qui a besoin de `kubectl` et du cluster local |

Alternatives écartées (à savoir citer en soutenance) : VPS k3s avec kubeconfig
en secret (~5 €/mois, ingress public — écarté pour le coût) ; ArgoCD en mode
GitOps pull (élégant mais une journée d'apprentissage en plus).

### Contraintes à ne pas oublier
- Le PC doit être **allumé et le runner démarré** pour que le job `deploy`
  passe — sinon il reste en attente. À vérifier avant la soutenance.
- Le repo est **public** : un runner self-hosted y est un risque de sécurité
  reconnu (du code venant d'un fork pourrait s'exécuter sur la machine).
  Mitigation obligatoire : le job `deploy` ne doit se déclencher **que** sur
  `push` vers `main` et sur tags, **jamais** sur `pull_request`.
- Le kubeconfig reste sur la machine, il n'entre jamais dans le repo ni dans
  les secrets GitHub.

## Repo

`https://github.com/ArthurDescourvieres/ci-cd-kube` — **public**, créé le
1er septembre 2026. Le suivi d'avancement se fait dans les **issues** du repo
(une issue par étape de [PLAN.md](PLAN.md), labellisée par lot) et sur le board
<https://github.com/users/ArthurDescourvieres/projects/11> (colonnes *À faire /
En cours / Bloqué / Fait*, champ *Lot* pour grouper).

## Architecture cible

```
push sur main ──┐
                ├─→ [checkout] → [tests] ─(échec ⇒ STOP)─→ [build image]
tag v*.*.* ─────┘                                              │
                                                    ┌──────────┴──────────┐
                                              main → :dev, :sha      tag → :1.2.3, :latest
                                                    └──────────┬──────────┘
                                                          [push GHCR]
                                                               │
                                                     [deploy Kubernetes]
                                                               │
                                                   [notification Google Chat]
                                                      (succès ET échec)
```

## Arborescence cible

```
.
├── .github/workflows/
│   └── ci-cd.yml          # pipeline unique, jobs chaînés par `needs:`
├── src/                   # app Express
├── tests/                 # tests Vitest (dont au moins 1 test qu'on peut casser en démo)
├── k8s/
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   └── (pvc.yaml)         # seulement si l'app a un vrai besoin de stockage
├── Dockerfile             # multi-stage, target dev + target prod
├── .dockerignore
├── compose.yaml           # confort local, hors périmètre noté
├── CLAUDE.md
├── docs/
│   ├── burndown.svg       # régénéré à chaque étape close
│   └── burndown.png
├── scripts/
│   └── burndown.py        # outillage 🤖, lit les issues GitHub
├── PLAN.md               # plan d'avancement, une étape = une issue GitHub
├── SUJET.md
└── README.md              # vitrine du rendu : schéma, choix, comment reproduire
```

## Conventions

### Git
- Branche par défaut : `main`.
- Tags de release : `vX.Y.Z` (SemVer) → déclenchent le chemin **production**.
- Commits : conventional commits (`feat:`, `fix:`, `ci:`, `docs:`, `chore:`).
- **Ne jamais ajouter `Co-Authored-By`** ni auto-référence dans les messages.
- **Claude exécute lui-même les commandes Git** (voir « Git et outillage » plus
  haut) et annonce à chaque fois ce qu'il a lancé. Pas de commit/push
  spontané hors de l'étape en cours ; jamais d'action destructive sans accord.

### Docker
- `Dockerfile` **multi-stage** avec deux targets : `dev` et `prod`.
- Image finale : base Alpine, `USER node` (jamais root), pas de devDependencies.
- Tags poussés sur GHCR :
  - push `main` → `:dev` **et** `:sha-<short-sha>` (traçabilité)
  - tag `vX.Y.Z` → `:X.Y.Z` **et** `:latest`
- **Jamais** de tag mutable (`:latest`, `:dev`) référencé dans un manifest de
  prod : le deployment doit pointer un tag immuable, sinon le rollback est
  impossible et `kubectl rollout` ne détecte aucun changement.

### GitHub Actions
- Un seul workflow `ci-cd.yml`, jobs séparés reliés par `needs:` — pas un job
  géant. Le job `test` doit être un **gate** : s'il échoue, rien ne se build.
- Toujours épingler les actions tierces (`actions/checkout@v4`, pas `@main`).
- `permissions:` déclaré explicitement au niveau job (`contents: read`,
  `packages: write` pour le push GHCR).
- Notification Google Chat dans un job final avec `if: always()`, sinon aucune
  notification n'est envoyée en cas d'échec — c'est le piège classique.
- Utiliser [`act`](https://github.com/nektos/act) pour itérer localement au lieu
  de pousser 40 commits « fix ci ».

### Kubernetes
- Tout dans un namespace dédié (`ci-cd-kube`), pas `default`.
- Chaque `Deployment` doit avoir : `resources.requests` **et** `limits`,
  `livenessProbe`, `readinessProbe`, `replicas: 2` minimum.
  → c'est exactement la compétence « portabilité, scalabilité, résilience »
  du sujet ; l'absence de probes et de limits est la perte de points la plus
  fréquente.
- Mise à jour de l'image par la pipeline : `kubectl set image` (ou patch du
  manifest + commit si option GitOps), **jamais** `kubectl apply` d'un manifest
  au tag figé en dur.
- Aucun secret en clair dans `k8s/` : `Secret` créé hors dépôt ou via secret
  GitHub.

## Sécurité

- Secret attendu dans GitHub → Settings → Secrets : `GOOGLE_CHAT_WEBHOOK`.
  `GITHUB_TOKEN` est fourni automatiquement. Pas de `KUBE_CONFIG` : avec le
  runner self-hosted, le kubeconfig est déjà sur la machine.
- Job `deploy` : jamais déclenché depuis une `pull_request` (voir la section
  sur le runner self-hosted).
- **Aucun secret, webhook, kubeconfig ou token ne doit apparaître dans un
  fichier du repo** — le repo est public.
- Vérifier `.gitignore` avant le premier push : `.env`, `*.kubeconfig`,
  `node_modules/`.

## Planning indicatif (2,5 semaines)

| Semaine | Objectif |
|---|---|
| S1 (31/08 – 05/09) | App Express + tests Vitest, Dockerfile multi-stage, repo public créé, workflow CI (checkout + test + build) vert |
| S2 (08/09 – 12/09) | Push GHCR avec stratégie de tags, notifications Google Chat succès/échec, cluster kind monté, runner self-hosted installé, manifests k8s appliqués à la main |
| S3 (15/09 – 18/09) | CD automatisée (mise à jour de l'image), README + schéma, répétition de la démo (dont **une démo d'échec** : test cassé ⇒ pipeline stoppée ⇒ notif d'erreur) |

## Checklist de rendu

- [ ] Repo `github.com/<prenom-nom>/ci-cd-kube` **public**
- [ ] Pipeline déclenchée sur push `main` **et** sur tag
- [ ] Tests exécutés ; échec ⇒ pipeline stoppée immédiatement (à démontrer)
- [ ] Image Docker dev **et** prod différenciées selon branche/tag
- [ ] Images visibles sur GHCR avec tags cohérents
- [ ] Notification Google Chat : succès **et** échec, avec commit + statut + raison
- [ ] Manifests `deployment` / `service` / `ingress` (+ storage si justifié)
- [ ] Application joignable et fonctionnelle sur le cluster
- [ ] Mise à jour automatique de l'image sur le cluster après pipeline
- [ ] README avec schéma de la pipeline et justification des choix
- [ ] Démo répétée de bout en bout

## Ne pas faire

- Ne pas démarrer de serveur de dev ni ouvrir de preview localhost sans demande
  explicite de l'utilisateur.
- Ne pas dépasser **400 lignes par fichier** — découper en modules.
- Ne pas enrichir l'application (features, front, base de données) tant que la
  pipeline n'est pas complète : hors périmètre de notation.
- Ne pas livrer un workflow copié-collé que l'utilisateur ne peut pas expliquer.
- **Ne pas écrire à la place de l'utilisateur** les fichiers `src/`, `tests/`,
  `Dockerfile`, `compose.yaml`, `.github/workflows/`, `k8s/` — voir la règle de
  la dictée en haut de ce fichier. C'est la règle la plus importante du projet.
- Ne pas transformer les questions de contrôle en péage : on avance, et on
  revient sur ce qui n'était pas clair.
- Ne pas clore une étape sans avoir régénéré le burn down chart (voir le
  rituel en 5 gestes).
