from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Bien(Base):
    __tablename__ = "biens"

    id = Column(Integer, primary_key=True, index=True)
    adresse = Column(String, nullable=False)
    ville = Column(String, nullable=False)
    code_postal = Column(String, nullable=False)
    surface = Column(Float, nullable=False)
    loyer_mensuel = Column(Float, nullable=False)
    charges_mensuelles = Column(Float, default=0.0)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="biens")
    locataires = relationship("Locataire", back_populates="bien")