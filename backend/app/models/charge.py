from sqlalchemy import Column, Integer, Float, ForeignKey, DateTime, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Charge(Base):
    __tablename__ = "charges"

    id = Column(Integer, primary_key=True, index=True)
    bien_id = Column(Integer, ForeignKey("biens.id"), nullable=False)
    description = Column(String, nullable=False)
    fournisseur = Column(String)
    montant = Column(Float, nullable=False)
    date_charge = Column(String)
    texte_ocr = Column(Text)
    fichier_nom = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    bien = relationship("Bien")