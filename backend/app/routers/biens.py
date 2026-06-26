from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.bien import Bien
from app.models.user import User
from app.schemas.bien import BienCreate, BienUpdate, BienResponse
from app.auth.jwt import verify_token

router = APIRouter(prefix="/biens", tags=["Biens"])

def get_current_user(db: Session = Depends(get_db), token_data: dict = Depends(verify_token)):
    user = db.query(User).filter(User.email == token_data["sub"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    return user

@router.post("/", response_model=BienResponse, status_code=201)
def create_bien(
    bien_data: BienCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    nouveau_bien = Bien(**bien_data.model_dump(), owner_id=current_user.id)
    db.add(nouveau_bien)
    db.commit()
    db.refresh(nouveau_bien)
    return nouveau_bien

@router.get("/", response_model=List[BienResponse])
def get_biens(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Bien).filter(Bien.owner_id == current_user.id).all()

@router.get("/{bien_id}", response_model=BienResponse)
def get_bien(
    bien_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    bien = db.query(Bien).filter(
        Bien.id == bien_id,
        Bien.owner_id == current_user.id
    ).first()
    if not bien:
        raise HTTPException(status_code=404, detail="Bien non trouvé")
    return bien

@router.put("/{bien_id}", response_model=BienResponse)
def update_bien(
    bien_id: int,
    bien_data: BienUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    bien = db.query(Bien).filter(
        Bien.id == bien_id,
        Bien.owner_id == current_user.id
    ).first()
    if not bien:
        raise HTTPException(status_code=404, detail="Bien non trouvé")
    for key, value in bien_data.model_dump(exclude_unset=True).items():
        setattr(bien, key, value)
    db.commit()
    db.refresh(bien)
    return bien

@router.delete("/{bien_id}", status_code=204)
def delete_bien(
    bien_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    bien = db.query(Bien).filter(
        Bien.id == bien_id,
        Bien.owner_id == current_user.id
    ).first()
    if not bien:
        raise HTTPException(status_code=404, detail="Bien non trouvé")
    db.delete(bien)
    db.commit()
    return None