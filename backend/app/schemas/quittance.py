from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional

class QuittanceCreate(BaseModel):
    locataire_id: int
    bien_id: int
    mois: str
    loyer: float
    charges: float
    date_paiement: date

class QuittanceResponse(BaseModel):
    id: int
    locataire_id: int
    bien_id: int
    mois: str
    loyer: float
    charges: float
    total: float
    date_paiement: date
    pdf_path: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True