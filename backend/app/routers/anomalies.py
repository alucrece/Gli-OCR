from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.anomalie import Anomalie
from app.models.user import User
from app.schemas.anomalie import AnomalieCreate, AnomalieUpdate, AnomalieResponse
from app.auth.jwt import verify_token
from app.services.logger import app_logger
from datetime import datetime, timezone

router = APIRouter(prefix="/anomalies", tags=["Anomalies"])

def get_current_user(db: Session = Depends(get_db), token_data: dict = Depends(verify_token)):
    user = db.query(User).filter(User.email == token_data["sub"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    return user

@router.post("/", response_model=AnomalieResponse, status_code=201)
def create_anomalie(
    anomalie_data: AnomalieCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    nouvelle_anomalie = Anomalie(**anomalie_data.model_dump())
    db.add(nouvelle_anomalie)
    db.commit()
    db.refresh(nouvelle_anomalie)
    app_logger.info(f"Anomalie créée : {nouvelle_anomalie.titre} (criticité: {nouvelle_anomalie.criticite})")
    return nouvelle_anomalie

@router.get("/", response_model=List[AnomalieResponse])
def get_anomalies(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Anomalie).order_by(Anomalie.created_at.desc()).all()

@router.get("/{anomalie_id}", response_model=AnomalieResponse)
def get_anomalie(
    anomalie_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    anomalie = db.query(Anomalie).filter(Anomalie.id == anomalie_id).first()
    if not anomalie:
        raise HTTPException(status_code=404, detail="Anomalie non trouvée")
    return anomalie

@router.put("/{anomalie_id}", response_model=AnomalieResponse)
def update_anomalie(
    anomalie_id: int,
    anomalie_data: AnomalieUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    anomalie = db.query(Anomalie).filter(Anomalie.id == anomalie_id).first()
    if not anomalie:
        raise HTTPException(status_code=404, detail="Anomalie non trouvée")
    for key, value in anomalie_data.model_dump(exclude_unset=True).items():
        setattr(anomalie, key, value)
    if anomalie_data.statut == "resolu" and not anomalie.resolved_at:
        anomalie.resolved_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(anomalie)
    app_logger.info(f"Anomalie {anomalie_id} mise à jour : statut={anomalie.statut}")
    return anomalie