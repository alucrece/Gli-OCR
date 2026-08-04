from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.sql import func
from app.database import Base

class Anomalie(Base):
    __tablename__ = "anomalies"

    id = Column(Integer, primary_key=True, index=True)
    titre = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    module = Column(String, nullable=False)
    criticite = Column(String, nullable=False)  # bloquant, majeur, mineur
    statut = Column(String, default="ouvert")   # ouvert, en_cours, resolu
    etapes_reproduction = Column(Text)
    correctif = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    resolved_at = Column(DateTime(timezone=True))