# GLI-OCR — Mini ERP de Gestion Locative

![CI/CD](https://github.com/alucrece/Gli-OCR/actions/workflows/ci.yml/badge.svg)

Application web de gestion locative destinée aux propriétaires bailleurs particuliers. Elle centralise la gestion des biens, des locataires et la génération automatique de quittances conformes à la loi du 6 juillet 1989.

---

## Fonctionnalités

- Authentification sécurisée (JWT + bcrypt)
- Gestion des biens locatifs (CRUD)
- Gestion des locataires (CRUD)
- Génération de quittances PDF conformes (8 mentions légales — Article 21, loi du 6 juillet 1989)
- Dashboard de rentabilité en temps réel
- Accessibilité RGAA niveau AA
- Auto-hébergement (zéro coût de licence)

---

## Stack technique

| Couche | Technologie |
|--------|------------|
| Backend | FastAPI (Python 3.11) |
| Frontend | React 18 + TypeScript |
| Base de données | PostgreSQL 15 |
| Stockage fichiers | MinIO (self-hosted) |
| Génération PDF | ReportLab |
| Authentification | JWT (python-jose) |
| Déploiement | Docker Compose |
| CI/CD | GitHub Actions |

---

## Prérequis

- Docker >= 24.0
- Docker Compose >= 2.0
- Git >= 2.30
- Python >= 3.11 (pour générer la SECRET_KEY)

---

## Installation et lancement

### 1. Cloner le repository

```bash
git clone https://github.com/alucrece/Gli-OCR.git
cd Gli-OCR
```

### 2. Configurer les variables d'environnement

```bash
cp .env.example .env
```

Éditer le fichier `.env` et renseigner les valeurs :

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=votre_mot_de_passe
POSTGRES_DB=gliocr
SECRET_KEY=votre_cle_jwt_64_caracteres
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=votre_mot_de_passe_minio
DATABASE_URL=postgresql://postgres:votre_mot_de_passe@db:5432/gliocr
```

Générer une SECRET_KEY sécurisée :

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

### 3. Lancer l'application

```bash
docker-compose up --build
```

Le premier lancement prend environ 3-5 minutes (téléchargement des images Docker).

### 4. Accéder à l'application

| URL | Service |
|-----|---------|
| http://localhost:3000 | Interface utilisateur |
| http://localhost:8000 | API REST |
| http://localhost:8000/docs | Documentation Swagger |
| http://localhost:9001 | Administration MinIO |

---

## Lancer les tests unitaires

```bash
docker exec gli-ocr-backend-1 python -m pytest tests/ -v
```

Résultat attendu : **7 tests passants**

---

## Structure du projet

```
Gli-OCR/
├── backend/              # API FastAPI
│   ├── app/
│   │   ├── auth/         # JWT et hachage des mots de passe
│   │   ├── models/       # Modèles SQLAlchemy
│   │   ├── routers/      # Endpoints REST
│   │   ├── schemas/      # Schémas Pydantic
│   │   └── services/     # Génération PDF
│   ├── tests/            # Tests unitaires pytest
│   └── main.py           # Point d'entrée FastAPI
├── frontend/             # Interface React TypeScript
│   └── src/
│       ├── api/          # Configuration Axios
│       ├── components/   # Composants réutilisables
│       ├── context/      # Contexte d'authentification
│       └── pages/        # Pages de l'application
├── ocr/                  # Service OCR (évolution future)
├── .github/workflows/    # Pipeline CI/CD GitHub Actions
├── docker-compose.yml    # Orchestration des conteneurs
└── .env.example          # Template variables d'environnement
```

---

## CI/CD

Le pipeline GitHub Actions se déclenche automatiquement sur chaque push vers `main` ou `develop` :

- **Tests Backend** : exécution des tests unitaires pytest avec PostgreSQL de test
- **Build Frontend** : vérification TypeScript et build de production React

---

## Sécurité

- Mots de passe hachés avec bcrypt
- Authentification JWT à expiration courte (30 min)
- Chiffrement AES-256 des fichiers (MinIO)
- HTTPS obligatoire en production (Nginx + Let's Encrypt)
- Variables d'environnement pour tous les secrets (jamais en dur dans le code)
- Isolation des données par utilisateur (owner_id sur toutes les requêtes)

---

## Conformité légale

Les quittances générées contiennent les 8 mentions obligatoires définies par l'Article 21 de la loi n°89-462 du 6 juillet 1989 :
identité bailleur, identité locataire, adresse du logement, période de location, montant du loyer, montant des charges, total, date de paiement.

---

## Certification

Projet réalisé dans le cadre de la certification **RNCP39583 — Expert en développement logiciel** (Niveau 7) — YNOV Campus Sophia Antipolis — Année 2025-2026.