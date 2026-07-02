from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.models import User, Bien, Locataire, Quittance
from app.routers import auth, biens, locataires, quittances, dashboard

Base.metadata.create_all(bind=engine)

app = FastAPI(title="GLI-OCR API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(biens.router)
app.include_router(locataires.router)
app.include_router(quittances.router)
app.include_router(dashboard.router)

@app.get("/")
def ping():
    return {"status": "ok", "message": "GLI-OCR API is running"}