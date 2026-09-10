from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ChargeCreate(BaseModel):
    bien_id: int
    description: str
    fournisseur: Optional[str] = None
    montant: float
    date_charge: Optional[str] = None
    texte_ocr: Optional[str] = None
    fichier_nom: Optional[str] = None

class ChargeResponse(BaseModel):
    id: int
    bien_id: int
    description: str
    fournisseur: Optional[str] = None
    montant: float
    date_charge: Optional[str] = None
    texte_ocr: Optional[str] = None
    fichier_nom: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True