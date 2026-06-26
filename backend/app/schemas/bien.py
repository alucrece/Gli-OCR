from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class BienCreate(BaseModel):
    adresse: str
    ville: str
    code_postal: str
    surface: float
    loyer_mensuel: float
    charges_mensuelles: float = 0.0

class BienUpdate(BaseModel):
    adresse: Optional[str] = None
    ville: Optional[str] = None
    code_postal: Optional[str] = None
    surface: Optional[float] = None
    loyer_mensuel: Optional[float] = None
    charges_mensuelles: Optional[float] = None

class BienResponse(BaseModel):
    id: int
    adresse: str
    ville: str
    code_postal: str
    surface: float
    loyer_mensuel: float
    charges_mensuelles: float
    owner_id: int
    created_at: datetime

    class Config:
        from_attributes = True