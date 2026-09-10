from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.charge import Charge
from app.models.bien import Bien
from app.models.user import User
from app.schemas.charge import ChargeCreate, ChargeResponse
from app.auth.jwt import verify_token

router = APIRouter(prefix="/charges", tags=["Charges"])

def get_current_user(db: Session = Depends(get_db), token_data: dict = Depends(verify_token)):
    user = db.query(User).filter(User.email == token_data["sub"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    return user

@router.post("/", response_model=ChargeResponse, status_code=201)
def create_charge(
    charge_data: ChargeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    bien = db.query(Bien).filter(
        Bien.id == charge_data.bien_id,
        Bien.owner_id == current_user.id
    ).first()
    if not bien:
        raise HTTPException(status_code=404, detail="Bien non trouvé")
    nouvelle_charge = Charge(**charge_data.model_dump())
    db.add(nouvelle_charge)
    db.commit()
    db.refresh(nouvelle_charge)
    return nouvelle_charge

@router.get("/", response_model=List[ChargeResponse])
def get_charges(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Charge).join(Bien).filter(
        Bien.owner_id == current_user.id
    ).order_by(Charge.created_at.desc()).all()

@router.get("/bien/{bien_id}", response_model=List[ChargeResponse])
def get_charges_by_bien(
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
    return db.query(Charge).filter(Charge.bien_id == bien_id).all()

@router.delete("/{charge_id}", status_code=204)
def delete_charge(
    charge_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    charge = db.query(Charge).join(Bien).filter(
        Charge.id == charge_id,
        Bien.owner_id == current_user.id
    ).first()
    if not charge:
        raise HTTPException(status_code=404, detail="Charge non trouvée")
    db.delete(charge)
    db.commit()
    return None