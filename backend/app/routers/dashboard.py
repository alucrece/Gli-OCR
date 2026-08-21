from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import extract
from app.database import get_db
from app.models.bien import Bien
from app.models.locataire import Locataire
from app.models.user import User
from app.models.paiement import Paiement
from app.schemas.dashboard import DashboardResponse, BienDashboard
from app.auth.jwt import verify_token
from datetime import datetime, date
from dateutil.relativedelta import relativedelta

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

def get_current_user(db: Session = Depends(get_db), token_data: dict = Depends(verify_token)):
    user = db.query(User).filter(User.email == token_data["sub"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    return user

@router.get("/")
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    biens = db.query(Bien).filter(Bien.owner_id == current_user.id).all()
    loyers_total = sum(b.loyer_mensuel for b in biens)
    charges_total = sum(b.charges_mensuelles for b in biens)
    revenu_net = loyers_total - charges_total

    biens_dashboard = []
    nb_locataires_actifs = 0
    alertes = []

    for bien in biens:
        locataire_actif = db.query(Locataire).filter(
            Locataire.bien_id == bien.id,
            Locataire.date_sortie.is_(None)
        ).first()

        if locataire_actif:
            nb_locataires_actifs += 1
            locataire_nom = f"{locataire_actif.prenom} {locataire_actif.nom}"
            statut = "occupé"

            # Vérifier bail expirant dans 30 jours
            if locataire_actif.date_sortie:
                jours_restants = (locataire_actif.date_sortie - date.today()).days
                if 0 <= jours_restants <= 30:
                    alertes.append({
                        "type": "bail_expire",
                        "message": f"Bail de {locataire_nom} expire dans {jours_restants} jours",
                        "bien": bien.adresse,
                        "niveau": "warning"
                    })

            # Vérifier paiement du mois en cours
            mois_courant = datetime.now().strftime("%B %Y")
            paiement = db.query(Paiement).filter(
                Paiement.bien_id == bien.id,
                Paiement.locataire_id == locataire_actif.id,
                Paiement.mois == mois_courant
            ).first()

            if not paiement:
                alertes.append({
                    "type": "loyer_manquant",
                    "message": f"Loyer de {locataire_nom} non enregistré pour {mois_courant}",
                    "bien": bien.adresse,
                    "niveau": "warning"
                })
            elif paiement.statut == "en_retard":
                alertes.append({
                    "type": "loyer_retard",
                    "message": f"Loyer de {locataire_nom} en retard",
                    "bien": bien.adresse,
                    "niveau": "danger"
                })
        else:
            locataire_nom = None
            statut = "vacant"
            alertes.append({
                "type": "bien_vacant",
                "message": f"Bien vacant : {bien.adresse}",
                "bien": bien.adresse,
                "niveau": "info"
            })

        biens_dashboard.append({
            "id": bien.id,
            "adresse": bien.adresse,
            "ville": bien.ville,
            "loyer_mensuel": bien.loyer_mensuel,
            "charges_mensuelles": bien.charges_mensuelles,
            "statut": statut,
            "locataire": locataire_nom
        })

    # Historique des 6 derniers mois
    historique = []
    for i in range(5, -1, -1):
        mois_date = datetime.now() - relativedelta(months=i)
        mois_str = mois_date.strftime("%B %Y")
        paiements_mois = db.query(Paiement).join(Bien).filter(
            Bien.owner_id == current_user.id,
            Paiement.mois == mois_str,
            Paiement.statut == "paye"
        ).all()
        total_mois = sum(p.montant for p in paiements_mois)
        historique.append({
            "mois": mois_str,
            "total": total_mois,
            "nb_paiements": len(paiements_mois)
        })

    return {
        "nb_biens": len(biens),
        "nb_locataires_actifs": nb_locataires_actifs,
        "loyers_mensuels_total": loyers_total,
        "charges_mensuelles_total": charges_total,
        "revenu_net_mensuel": revenu_net,
        "taux_occupation": round((nb_locataires_actifs / len(biens) * 100) if biens else 0, 1),
        "alertes": alertes,
        "historique_6_mois": historique,
        "biens": biens_dashboard
    }