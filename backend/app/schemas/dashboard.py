from pydantic import BaseModel
from typing import List, Optional

class BienDashboard(BaseModel):
    id: int
    adresse: str
    ville: str
    loyer_mensuel: float
    charges_mensuelles: float
    statut: str
    locataire: Optional[str] = None

class DashboardResponse(BaseModel):
    nb_biens: int
    nb_locataires_actifs: int
    loyers_mensuels_total: float
    charges_mensuelles_total: float
    revenu_net_mensuel: float
    biens: List[BienDashboard]