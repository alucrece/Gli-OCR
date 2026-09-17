# Changelog — GLI-OCR

Toutes les évolutions notables du projet sont documentées ici.
Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/).

---

## [v0.9.0] - 2026-09-08
### Added
- Système de notifications cloche dans la sidebar avec badge rouge
- Alertes dismissibles (loyer manquant, bien vacant, bail expirant)
- Page profil propriétaire (modification nom/prénom, changement mot de passe)
- Espace locataire séparé avec connexion email + code d'accès
- Export fiscal PDF par année (ReportLab)
- Suivi des paiements de loyer avec historique et statuts

---

## [v0.8.0] - 2026-08-21
### Added
- Système de supervision : endpoints /health/, /health/ping, /health/metrics
- Logs structurés JSON via middleware FastAPI (timestamp, level, durée)
- Système de consignation des anomalies (API + interface React)
- Page Monitoring avec auto-refresh 30 secondes
- Configuration Dependabot (.github/dependabot.yml)

### Fixed
- Colonne code_acces manquante → ALTER TABLE locataires ADD COLUMN

---

## [v0.7.0] - 2026-07-24
### Added
- Page Quittances frontend avec génération PDF conforme loi 1989 (8 mentions)
- Tests dashboard : authentification et récupération des données
- README complet avec instructions d'installation et CI/CD

### Changed
- Couverture de tests portée à 81% (22 tests unitaires)

---

## [v0.6.0] - 2026-07-16
### Added
- Pipeline CI/CD GitHub Actions (Tests Backend + Lint Frontend)
- Accessibilité RGAA niveau AA (aria-*, focus-visible, sr-only, htmlFor)
- 22 tests unitaires pytest (auth, biens, locataires, dashboard)

---

## [v0.5.0] - 2026-07-06
### Added
- Interface React TypeScript complète (Login, Dashboard, Biens, Locataires)
- Contexte d'authentification (AuthContext, JWT localStorage)
- Navigation sidebar avec routes protégées (PrivateRoute)

### Fixed
- BUG-03 : Ajout CORSMiddleware FastAPI (erreurs OPTIONS 405)
- BUG-04 : Purge .env committé (git filter-branch --force)
- BUG-05 : Hot-reload Windows Docker (WATCHPACK_POLLING=true)

---

## [v0.4.0] - 2026-06-27
### Added
- Endpoint dashboard de rentabilité (revenu net, taux occupation)
- Métriques patrimoine : nb biens, locataires actifs, loyers bruts

---

## [v0.3.0] - 2026-06-20
### Added
- CRUD biens et locataires avec isolation owner_id
- Génération quittances PDF via ReportLab (8 mentions loi 1989)
- Stockage fichiers MinIO (AES-256)

### Fixed
- BUG-02 : Healthcheck PostgreSQL manquant dans docker-compose

---

## [v0.2.0] - 2026-06-13
### Added
- Authentification JWT complète (register, login, /me)
- Hachage mot de passe bcrypt, tokens 30 minutes
- Modèles SQLAlchemy (User, Bien, Locataire, Quittance)

### Fixed
- BUG-01 : Épinglage bcrypt==4.0.1 (incompatibilité passlib >4.0.1)

---

## [v0.1.0] - 2026-06-06
### Added
- Setup Docker Compose (5 conteneurs : backend, frontend, db, minio, ocr)
- Structure projet FastAPI + React TypeScript
- Configuration PostgreSQL 15 et MinIO
- Architecture microservices documentée