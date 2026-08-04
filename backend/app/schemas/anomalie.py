from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AnomalieCreate(BaseModel):
    titre: str
    description: str
    module: str
    criticite: str
    etapes_reproduction: Optional[str] = None

class AnomalieUpdate(BaseModel):
    statut: Optional[str] = None
    correctif: Optional[str] = None
    resolved_at: Optional[datetime] = None

class AnomalieResponse(BaseModel):
    id: int
    titre: str
    description: str
    module: str
    criticite: str
    statut: str
    etapes_reproduction: Optional[str] = None
    correctif: Optional[str] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True