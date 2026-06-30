from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.quittance import Quittance
from app.models.locataire import Locataire
from app.models.bien import Bien
from app.models.user import User
from app.schemas.quittance import QuittanceCreate, QuittanceResponse
from app.auth.jwt import verify_token
from app.services.pdf_generator import generate_quittance_pdf

router = APIRouter(prefix="/quittances", tags=["Quittances"])

def get_current_user(db: Session = Depends(get_db), token_data: dict = Depends(verify_token)):
    user = db.query(User).filter(User.email == token_data["sub"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    return user

@router.post("/", response_model=QuittanceResponse, status_code=201)
def create_quittance(
    quittance_data: QuittanceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    bien = db.query(Bien).filter(
        Bien.id == quittance_data.bien_id,
        Bien.owner_id == current_user.id
    ).first()
    if not bien:
        raise HTTPException(status_code=404, detail="Bien non trouvé ou non autorisé")

    locataire = db.query(Locataire).filter(
        Locataire.id == quittance_data.locataire_id,
        Locataire.bien_id == quittance_data.bien_id
    ).first()
    if not locataire:
        raise HTTPException(status_code=404, detail="Locataire non trouvé")

    total = quittance_data.loyer + quittance_data.charges

    nouvelle_quittance = Quittance(
        locataire_id=quittance_data.locataire_id,
        bien_id=quittance_data.bien_id,
        mois=quittance_data.mois,
        loyer=quittance_data.loyer,
        charges=quittance_data.charges,
        total=total,
        date_paiement=quittance_data.date_paiement
    )
    db.add(nouvelle_quittance)
    db.commit()
    db.refresh(nouvelle_quittance)
    return nouvelle_quittance

@router.get("/", response_model=List[QuittanceResponse])
def get_quittances(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Quittance).join(Bien).filter(
        Bien.owner_id == current_user.id
    ).all()

@router.get("/{quittance_id}/pdf")
def download_quittance_pdf(
    quittance_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    quittance = db.query(Quittance).join(Bien).filter(
        Quittance.id == quittance_id,
        Bien.owner_id == current_user.id
    ).first()
    if not quittance:
        raise HTTPException(status_code=404, detail="Quittance non trouvée")

    locataire = db.query(Locataire).filter(Locataire.id == quittance.locataire_id).first()
    bien = db.query(Bien).filter(Bien.id == quittance.bien_id).first()

    pdf_bytes = generate_quittance_pdf(
        bailleur_nom=current_user.nom,
        bailleur_prenom=current_user.prenom,
        locataire_nom=locataire.nom,
        locataire_prenom=locataire.prenom,
        adresse_bien=bien.adresse,
        ville=bien.ville,
        code_postal=bien.code_postal,
        mois=quittance.mois,
        loyer=quittance.loyer,
        charges=quittance.charges,
        date_paiement=quittance.date_paiement
    )

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=quittance_{quittance.mois}_{locataire.nom}.pdf"
        }
    )