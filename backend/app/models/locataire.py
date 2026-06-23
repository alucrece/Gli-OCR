from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Locataire(Base):
    __tablename__ = "locataires"

    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String, nullable=False)
    prenom = Column(String, nullable=False)
    email = Column(String, nullable=False)
    telephone = Column(String)
    date_entree = Column(Date, nullable=False)
    date_sortie = Column(Date)
    depot_garantie = Column(Float, default=0.0)
    bien_id = Column(Integer, ForeignKey("biens.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    bien = relationship("Bien", back_populates="locataires")