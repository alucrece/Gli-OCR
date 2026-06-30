from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.bien import Bien
from app.models.locataire import Locataire
from app.models.user import User
from app.schemas.dashboard import DashboardResponse, BienDashboard
from app.auth.jwt import verify_token

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

def get_current_user(db: Session = Depends(get_db), token_data: dict = Depends(verify_token)):
    user = db.query(User).filter(User.email == token_data["sub"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    return user

@router.get("/", response_model=DashboardResponse)
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

    for bien in biens:
        locataire_actif = db.query(Locataire).filter(
            Locataire.bien_id == bien.id,
            Locataire.date_sortie.is_(None)
        ).first()

        if locataire_actif:
            nb_locataires_actifs += 1
            locataire_nom = f"{locataire_actif.prenom} {locataire_actif.nom}"
            statut = "occupé"
        else:
            locataire_nom = None
            statut = "vacant"

        biens_dashboard.append(BienDashboard(
            id=bien.id,
            adresse=bien.adresse,
            ville=bien.ville,
            loyer_mensuel=bien.loyer_mensuel,
            charges_mensuelles=bien.charges_mensuelles,
            statut=statut,
            locataire=locataire_nom
        ))

    return DashboardResponse(
        nb_biens=len(biens),
        nb_locataires_actifs=nb_locataires_actifs,
        loyers_mensuels_total=loyers_total,
        charges_mensuelles_total=charges_total,
        revenu_net_mensuel=revenu_net,
        biens=biens_dashboard
    )