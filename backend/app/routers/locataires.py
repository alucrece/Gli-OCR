from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.locataire import Locataire
from app.models.bien import Bien
from app.models.user import User
from app.schemas.locataire import LocataireCreate, LocataireUpdate, LocataireResponse
from app.auth.jwt import verify_token

router = APIRouter(prefix="/locataires", tags=["Locataires"])

def get_current_user(db: Session = Depends(get_db), token_data: dict = Depends(verify_token)):
    user = db.query(User).filter(User.email == token_data["sub"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    return user

@router.post("/", response_model=LocataireResponse, status_code=201)
def create_locataire(
    locataire_data: LocataireCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    bien = db.query(Bien).filter(
        Bien.id == locataire_data.bien_id,
        Bien.owner_id == current_user.id
    ).first()
    if not bien:
        raise HTTPException(status_code=404, detail="Bien non trouvé ou non autorisé")
    nouveau_locataire = Locataire(**locataire_data.model_dump())
    db.add(nouveau_locataire)
    db.commit()
    db.refresh(nouveau_locataire)
    return nouveau_locataire

@router.get("/", response_model=List[LocataireResponse])
def get_locataires(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Locataire).join(Bien).filter(
        Bien.owner_id == current_user.id
    ).all()

@router.get("/{locataire_id}", response_model=LocataireResponse)
def get_locataire(
    locataire_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    locataire = db.query(Locataire).join(Bien).filter(
        Locataire.id == locataire_id,
        Bien.owner_id == current_user.id
    ).first()
    if not locataire:
        raise HTTPException(status_code=404, detail="Locataire non trouvé")
    return locataire

@router.put("/{locataire_id}", response_model=LocataireResponse)
def update_locataire(
    locataire_id: int,
    locataire_data: LocataireUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    locataire = db.query(Locataire).join(Bien).filter(
        Locataire.id == locataire_id,
        Bien.owner_id == current_user.id
    ).first()
    if not locataire:
        raise HTTPException(status_code=404, detail="Locataire non trouvé")
    for key, value in locataire_data.model_dump(exclude_unset=True).items():
        setattr(locataire, key, value)
    db.commit()
    db.refresh(locataire)
    return locataire

@router.delete("/{locataire_id}", status_code=204)
def delete_locataire(
    locataire_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    locataire = db.query(Locataire).join(Bien).filter(
        Locataire.id == locataire_id,
        Bien.owner_id == current_user.id
    ).first()
    if not locataire:
        raise HTTPException(status_code=404, detail="Locataire non trouvé")
    db.delete(locataire)
    db.commit()
    return None