from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
from datetime import datetime
import os

router = APIRouter(prefix="/health", tags=["Health & Monitoring"])

@router.get("/")
def health_check(db: Session = Depends(get_db)):
    """Vérification globale de l'état de l'application"""
    checks = {}
    status_global = "healthy"

    # Vérification base de données
    try:
        db.execute(text("SELECT 1"))
        checks["database"] = {
            "status": "up",
            "message": "PostgreSQL opérationnel"
        }
    except Exception as e:
        checks["database"] = {
            "status": "down",
            "message": str(e)
        }
        status_global = "unhealthy"

    # Vérification stockage MinIO
    try:
        minio_host = os.getenv("MINIO_ROOT_USER")
        if minio_host:
            checks["storage"] = {
                "status": "up",
                "message": "MinIO configuré"
            }
        else:
            checks["storage"] = {
                "status": "warning",
                "message": "MinIO non configuré"
            }
    except Exception as e:
        checks["storage"] = {
            "status": "down",
            "message": str(e)
        }
        status_global = "unhealthy"

    return {
        "status": status_global,
        "timestamp": datetime.utcnow().isoformat(),
        "version": "0.7.0",
        "services": checks
    }

@router.get("/ping")
def ping():
    """Endpoint de ping simple pour vérifier que l'API répond"""
    return {
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat()
    }

@router.get("/metrics")
def get_metrics(db: Session = Depends(get_db)):
    """Métriques applicatives pour le monitoring"""
    from app.models.user import User
    from app.models.bien import Bien
    from app.models.locataire import Locataire
    from app.models.quittance import Quittance

    try:
        nb_users = db.query(User).count()
        nb_biens = db.query(Bien).count()
        nb_locataires = db.query(Locataire).count()
        nb_quittances = db.query(Quittance).count()

        return {
            "timestamp": datetime.utcnow().isoformat(),
            "application": "GLI-OCR",
            "version": "0.7.0",
            "metrics": {
                "users_total": nb_users,
                "biens_total": nb_biens,
                "locataires_total": nb_locataires,
                "quittances_total": nb_quittances,
                "locataires_actifs": db.query(Locataire).filter(
                    Locataire.date_sortie.is_(None)
                ).count()
            }
        }
    except Exception as e:
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "error": str(e)
        }