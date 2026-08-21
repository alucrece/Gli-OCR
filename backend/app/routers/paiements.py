from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.paiement import Paiement
from app.models.bien import Bien
from app.models.locataire import Locataire
from app.models.user import User
from app.schemas.paiement import PaiementCreate, PaiementUpdate, PaiementResponse
from app.auth.jwt import verify_token
from datetime import date

router = APIRouter(prefix="/paiements", tags=["Paiements"])

def get_current_user(db: Session = Depends(get_db), token_data: dict = Depends(verify_token)):
    user = db.query(User).filter(User.email == token_data["sub"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    return user

@router.post("/", response_model=PaiementResponse, status_code=201)
def create_paiement(
    paiement_data: PaiementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    bien = db.query(Bien).filter(
        Bien.id == paiement_data.bien_id,
        Bien.owner_id == current_user.id
    ).first()
    if not bien:
        raise HTTPException(status_code=404, detail="Bien non trouvé")
    nouveau_paiement = Paiement(**paiement_data.model_dump())
    db.add(nouveau_paiement)
    db.commit()
    db.refresh(nouveau_paiement)
    return nouveau_paiement

@router.get("/", response_model=List[PaiementResponse])
def get_paiements(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Paiement).join(Bien).filter(
        Bien.owner_id == current_user.id
    ).order_by(Paiement.created_at.desc()).all()

@router.put("/{paiement_id}", response_model=PaiementResponse)
def update_paiement(
    paiement_id: int,
    paiement_data: PaiementUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    paiement = db.query(Paiement).join(Bien).filter(
        Paiement.id == paiement_id,
        Bien.owner_id == current_user.id
    ).first()
    if not paiement:
        raise HTTPException(status_code=404, detail="Paiement non trouvé")
    for key, value in paiement_data.model_dump(exclude_unset=True).items():
        setattr(paiement, key, value)
    if paiement_data.statut == "paye" and not paiement.date_paiement:
        paiement.date_paiement = date.today()
    db.commit()
    db.refresh(paiement)
    return paiement

@router.delete("/{paiement_id}", status_code=204)
def delete_paiement(
    paiement_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    paiement = db.query(Paiement).join(Bien).filter(
        Paiement.id == paiement_id,
        Bien.owner_id == current_user.id
    ).first()
    if not paiement:
        raise HTTPException(status_code=404, detail="Paiement non trouvé")
    db.delete(paiement)
    db.commit()
    return None