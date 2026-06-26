from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date

class LocataireCreate(BaseModel):
    nom: str
    prenom: str
    email: str
    telephone: Optional[str] = None
    date_entree: date
    date_sortie: Optional[date] = None
    depot_garantie: float = 0.0
    bien_id: int

class LocataireUpdate(BaseModel):
    nom: Optional[str] = None
    prenom: Optional[str] = None
    email: Optional[str] = None
    telephone: Optional[str] = None
    date_entree: Optional[date] = None
    date_sortie: Optional[date] = None
    depot_garantie: Optional[float] = None

class LocataireResponse(BaseModel):
    id: int
    nom: str
    prenom: str
    email: str
    telephone: Optional[str] = None
    date_entree: date
    date_sortie: Optional[date] = None
    depot_garantie: float
    bien_id: int
    created_at: datetime

    class Config:
        from_attributes = True