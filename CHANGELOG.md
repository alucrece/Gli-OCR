# Changelog — GLI-OCR

Toutes les évolutions notables du projet sont documentées ici.
Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/) et du versionnage sémantique.

---

## [v0.9.0] - 2026-09-08

### Added
- **Système de notifications** : cloche 🔔 dans la sidebar avec badge rouge indiquant le nombre d'alertes actives. Panneau dropdown au clic avec liste des alertes, bouton "Tout marquer lu" et fermeture individuelle par ✕.
- **Alertes intelligentes** : détection automatique des loyers manquants du mois en cours, biens vacants, et bails expirant dans les 30 jours. Alertes calculées côté backend à chaque appel dashboard.
- **Page profil propriétaire** : modification du prénom et nom, changement de mot de passe avec vérification de l'ancien mot de passe et confirmation.
- **Espace locataire séparé** : connexion via email + code d'accès (défaut : 1234), vue lecture seule du logement (adresse, loyer, dépôt de garantie, date d'entrée) et téléchargement des quittances PDF.
- **Export fiscal PDF** : récapitulatif annuel des loyers perçus par bien, avec détail des paiements et total annuel, générés via ReportLab et téléchargeables depuis la page Paiements.
- **Suivi des paiements de loyer** : enregistrement mensuel des loyers avec statuts (payé, en attente, en retard), historique par locataire, taux de recouvrement calculé automatiquement.
- **Dashboard enrichi** : graphique historique des loyers encaissés sur 6 mois, taux d'occupation du patrimoine, intégration des charges propriétaire (OCR) dans le calcul du revenu net réel.
- **OCR Tesseract** : upload image → extraction automatique montants et dates → validation manuelle → sauvegarde en table charges. Impact direct sur le revenu net du dashboard.

### Changed
- Revenu net dashboard : calcul enrichi `loyers - charges_locataires - charges_proprietaire_OCR`
- Navbar : ajout liens Paiements, OCR, Profil dans la sidebar

---

## [v0.8.0] - 2026-08-21

### Added
- **Endpoints de supervision** :
  - `GET /health/` : vérification PostgreSQL (SELECT 1) + MinIO, retourne statut global healthy/unhealthy
  - `GET /health/ping` : ping simple avec timestamp pour vérifier la disponibilité de l'API
  - `GET /health/metrics` : métriques applicatives en temps réel (nb users, biens, locataires, quittances)
- **Logs structurés JSON** : middleware FastAPI loggant chaque requête HTTP avec timestamp ISO, méthode, endpoint, code de réponse et durée en millisecondes. Handler fichier `/app/logs/gli-ocr.log` et handler console.
- **Système de consignation des anomalies** : modèle `Anomalie` (titre, description, module, criticité, statut, étapes de reproduction, correctif), endpoints CRUD `/anomalies/`, cycle de vie ouvert → en_cours → résolu avec date de résolution automatique.
- **Page Monitoring React** : affichage temps réel statut PostgreSQL, MinIO, métriques applicatives, journal des anomalies avec formulaire de signalement et bouton de résolution. Auto-refresh toutes les 30 secondes.
- **Dependabot** : configuration `.github/dependabot.yml` pour surveillance hebdomadaire des dépendances Python (pip) et Node.js (npm). PR #1 ouverte automatiquement (bcrypt 4.0.1 → 5.0.0, non mergée — incompatibilité passlib documentée).

### Fixed
- Colonne `code_acces` manquante sur la table locataires → `ALTER TABLE locataires ADD COLUMN code_acces VARCHAR DEFAULT '1234'`

---

## [v0.7.0] - 2026-07-24

### Added
- **Page Quittances frontend** : formulaire de génération (sélection bien, locataire, période, loyer, charges), liste des quittances avec téléchargement PDF.
- **Tests dashboard** : 3 tests supplémentaires couvrant l'authentification requise, la structure de la réponse et la récupération des métriques. Total : 22 tests unitaires.
- **README complet** : description du projet, stack technique, prérequis, instructions d'installation pas à pas, variables d'environnement, commandes Docker, architecture des conteneurs, statut CI/CD.

### Changed
- Couverture de tests portée à 81% (mesurée via pytest-cov)
- Version API passée à 0.7.0

---

## [v0.6.0] - 2026-07-16

### Added
- **Pipeline CI/CD GitHub Actions** (`.github/workflows/ci.yml`) :
  - Job `test-backend` : installation dépendances, démarrage PostgreSQL de test, exécution 22 tests pytest
  - Job `lint-frontend` : installation Node.js, `npm ci`, `npm run build` en mode production
  - Déclenchement sur push et pull_request vers main et develop
  - Durée moyenne : 43 secondes
- **Accessibilité RGAA niveau AA** :
  - `lang="fr"` sur la balise html
  - Attributs `aria-label`, `aria-current`, `aria-live`, `role` sur tous les éléments interactifs
  - Focus visible avec contour vert sur tous les éléments focusables
  - Associations `htmlFor`/`id` sur tous les labels de formulaire
  - Hauteur minimale 44px sur tous les boutons (critère WCAG 2.5.5)
  - Classes `sr-only` pour les textes destinés aux lecteurs d'écran

### Fixed
- Pipeline CI fail ESLint → correction exhaustive-deps sur useEffect EspaceLocataire

---

## [v0.5.0] - 2026-07-06

### Added
- **Interface React TypeScript complète** avec 8 pages fonctionnelles :
  Login, Register, Dashboard, Biens, Locataires, Quittances, Monitoring, Profil
- **Contexte d'authentification global** (AuthContext) : stockage JWT en localStorage, vérification token au démarrage, déconnexion automatique à expiration
- **Navigation sidebar** avec routes protégées (PrivateRoute), liens actifs, bouton de déconnexion
- **Design system** : variables CSS (--bleu-nuit, --vert-foret, --dore, --gris-ardoise), composants card, badge, btn, form-group réutilisables
- **Hot-reload Windows Docker** : volumes montés dans docker-compose.yml + variables `WATCHPACK_POLLING=true` et `CHOKIDAR_USEPOLLING=true` pour détecter les changements de fichiers sous Windows

### Fixed
- **BUG-03** : Erreurs CORS 405 Method Not Allowed sur requêtes préflight OPTIONS → Ajout `CORSMiddleware` FastAPI avec `allow_origins=["http://localhost:3000"]`, `allow_methods=["*"]`, `allow_headers=["*"]`
- **BUG-04** : Fichier `.env` committé publiquement avec secrets → Purge complète de l'historique Git via `git filter-branch --force --index-filter` + ajout `.env` au `.gitignore`
- **BUG-05** : Cache Docker Windows bloquant les modifications → `docker system prune` + reconfiguration volumes hot-reload

---

## [v0.4.0] - 2026-06-27

### Added
- **Endpoint dashboard** `GET /dashboard/` : calcul en temps réel du revenu net mensuel (loyers - charges), nombre de biens, nombre de locataires actifs, loyers bruts totaux et charges mensuelles totales
- **Schémas Pydantic** `DashboardResponse` et `BienDashboard` pour la sérialisation des métriques
- **Isolation des données** : toutes les métriques filtrées par `owner_id` pour garantir qu'un propriétaire ne voit que ses propres données

---

## [v0.3.0] - 2026-06-20

### Added
- **CRUD biens** : création, lecture, mise à jour, suppression avec validation propriétaire (`owner_id`)
- **CRUD locataires** : gestion complète avec association à un bien, date d'entrée/sortie, dépôt de garantie
- **Génération quittances PDF** via ReportLab : 8 mentions obligatoires loi du 6 juillet 1989 (bailleur, locataire, adresse, période, loyer HC, charges, total CC, date de paiement), mise en page A4, téléchargement direct
- **Stockage fichiers MinIO** : upload des quittances PDF avec chiffrement AES-256, organisation par bucket propriétaire
- **Schémas Pydantic** : `BienCreate`, `BienUpdate`, `BienResponse`, `LocataireCreate`, `LocataireUpdate`, `LocataireResponse`, `QuittanceCreate`, `QuittanceResponse`

### Fixed
- **BUG-02** : Conteneur backend démarrait avant PostgreSQL → Ajout healthcheck PostgreSQL dans docker-compose.yml avec `condition: service_healthy`

---

## [v0.2.0] - 2026-06-13

### Added
- **Authentification JWT complète** :
  - `POST /auth/register` : création compte avec validation email unique, hachage bcrypt
  - `POST /auth/login` : vérification identifiants, génération token JWT (expiration 30 min)
  - `GET /auth/me` : récupération profil utilisateur depuis token
  - `PUT /auth/me` : modification nom et prénom
  - `PUT /auth/password` : changement mot de passe avec vérification ancien mot de passe
- **Modèles SQLAlchemy** : User, Bien, Locataire, Quittance avec relations et contraintes
- **Sécurité** : variables d'environnement via `.env` (SECRET_KEY, DATABASE_URL, MINIO credentials), CORS configuré pour localhost:3000

### Fixed
- **BUG-01** : `bcrypt` > 4.0.1 incompatible avec `passlib` → Épinglage `bcrypt==4.0.1` dans requirements.txt. La PR Dependabot #1 (bcrypt 4.0.1 → 5.0.0) restera ouverte sans être mergée jusqu'à résolution de l'incompatibilité passlib.

---

## [v0.1.0] - 2026-06-06

### Added
- **Docker Compose** orchestrant 5 conteneurs :
  - `backend` : FastAPI Python 3.11, port 8000, hot-reload uvicorn
  - `frontend` : React 18 TypeScript Node 18, port 3000
  - `db` : PostgreSQL 15, volume persistant
  - `minio` : stockage objet S3-compatible, ports 9000/9001
  - `ocr` : service Tesseract dédié, port 8001
- **Structure projet** FastAPI avec architecture en couches : routers, models, schemas, services, auth
- **Configuration** PostgreSQL 15 avec création automatique de la base via SQLAlchemy `create_all`
- **Point d'entrée** `main.py` avec FastAPI, middleware CORS, inclusion des routers