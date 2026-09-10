from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.locataire import Locataire
from app.models.quittance import Quittance
from app.models.bien import Bien
from app.auth.jwt import create_access_token
from pydantic import BaseModel
from typing import Optional
from datetime import date

router = APIRouter(prefix="/locataire", tags=["Espace Locataire"])

class LocataireLogin(BaseModel):
    email: str
    code_acces: str

class LocataireInfo(BaseModel):
    id: int
    nom: str
    prenom: str
    email: str
    date_entree: date
    date_sortie: Optional[date] = None
    depot_garantie: float
    bien_adresse: str
    bien_ville: str
    loyer_mensuel: float

    class Config:
        from_attributes = True

@router.post("/login")
def locataire_login(data: LocataireLogin, db: Session = Depends(get_db)):
    locataire = db.query(Locataire).filter(
        Locataire.email == data.email,
        Locataire.code_acces == data.code_acces
    ).first()
    if not locataire:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou code d'accès incorrect"
        )
    token = create_access_token(data={
        "sub": locataire.email,
        "role": "locataire",
        "locataire_id": locataire.id
    })
    return {"access_token": token, "token_type": "bearer", "role": "locataire"}

@router.get("/me")
def get_locataire_me(
    db: Session = Depends(get_db),
    token_data: dict = Depends(__import__('app.auth.jwt', fromlist=['verify_token']).verify_token)
):
    if token_data.get("role") != "locataire":
        raise HTTPException(status_code=403, detail="Accès réservé aux locataires")
    locataire = db.query(Locataire).filter(
        Locataire.id == token_data.get("locataire_id")
    ).first()
    if not locataire:
        raise HTTPException(status_code=404, detail="Locataire non trouvé")
    bien = db.query(Bien).filter(Bien.id == locataire.bien_id).first()
    return {
        "id": locataire.id,
        "nom": locataire.nom,
        "prenom": locataire.prenom,
        "email": locataire.email,
        "date_entree": locataire.date_entree,
        "date_sortie": locataire.date_sortie,
        "depot_garantie": locataire.depot_garantie,
        "bien_adresse": bien.adresse if bien else "",
        "bien_ville": bien.ville if bien else "",
        "loyer_mensuel": bien.loyer_mensuel if bien else 0
    }

@router.get("/quittances")
def get_locataire_quittances(
    db: Session = Depends(get_db),
    token_data: dict = Depends(__import__('app.auth.jwt', fromlist=['verify_token']).verify_token)
):
    if token_data.get("role") != "locataire":
        raise HTTPException(status_code=403, detail="Accès réservé aux locataires")
    locataire_id = token_data.get("locataire_id")
    quittances = db.query(Quittance).filter(
        Quittance.locataire_id == locataire_id
    ).order_by(Quittance.created_at.desc()).all()
    return quittances