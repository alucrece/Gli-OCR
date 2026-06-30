from sqlalchemy import Column, Integer, Float, ForeignKey, DateTime, String, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Quittance(Base):
    __tablename__ = "quittances"

    id = Column(Integer, primary_key=True, index=True)
    locataire_id = Column(Integer, ForeignKey("locataires.id"), nullable=False)
    bien_id = Column(Integer, ForeignKey("biens.id"), nullable=False)
    mois = Column(String, nullable=False)
    loyer = Column(Float, nullable=False)
    charges = Column(Float, nullable=False)
    total = Column(Float, nullable=False)
    date_paiement = Column(Date, nullable=False)
    pdf_path = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    locataire = relationship("Locataire")
    bien = relationship("Bien")