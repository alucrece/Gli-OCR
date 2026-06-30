from fastapi import FastAPI
from app.database import engine, Base
from app.models import User, Bien, Locataire, Quittance
from app.routers import auth, biens, locataires, quittances

Base.metadata.create_all(bind=engine)

app = FastAPI(title="GLI-OCR API")

app.include_router(auth.router)
app.include_router(biens.router)
app.include_router(locataires.router)
app.include_router(quittances.router)

@app.get("/")
def ping():
    return {"status": "ok", "message": "GLI-OCR API is running"}