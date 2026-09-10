from sqlalchemy import Column, Integer, Float, ForeignKey, DateTime, String, Boolean, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Paiement(Base):
    __tablename__ = "paiements"

    id = Column(Integer, primary_key=True, index=True)
    locataire_id = Column(Integer, ForeignKey("locataires.id"), nullable=False)
    bien_id = Column(Integer, ForeignKey("biens.id"), nullable=False)
    mois = Column(String, nullable=False)
    montant = Column(Float, nullable=False)
    statut = Column(String, default="en_attente")  # paye, en_attente, en_retard
    date_paiement = Column(Date)
    note = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    locataire = relationship("Locataire")
    bien = relationship("Bien")