from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

class PaiementCreate(BaseModel):
    locataire_id: int
    bien_id: int
    mois: str
    montant: float
    statut: str = "en_attente"
    date_paiement: Optional[date] = None
    note: Optional[str] = None

class PaiementUpdate(BaseModel):
    statut: Optional[str] = None
    date_paiement: Optional[date] = None
    note: Optional[str] = None

class PaiementResponse(BaseModel):
    id: int
    locataire_id: int
    bien_id: int
    mois: str
    montant: float
    statut: str
    date_paiement: Optional[date] = None
    note: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True