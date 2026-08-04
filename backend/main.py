from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.models import User, Bien, Locataire, Quittance
from app.routers import auth, biens, locataires, quittances, dashboard
from app.routers import health
from app.services.logger import app_logger
import time
import os

Base.metadata.create_all(bind=engine)

app = FastAPI(title="GLI-OCR API", version="0.7.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Middleware de logging des requêtes HTTP"""
    start_time = time.time()
    response = await call_next(request)
    duration = round((time.time() - start_time) * 1000, 2)
    
    app_logger.info(
        f"{request.method} {request.url.path} "
        f"→ {response.status_code} ({duration}ms)"
    )
    return response

app.include_router(auth.router)
app.include_router(biens.router)
app.include_router(locataires.router)
app.include_router(quittances.router)
app.include_router(dashboard.router)
app.include_router(health.router)

@app.get("/")
def ping():
    app_logger.info("Ping endpoint appelé")
    return {"status": "ok", "message": "GLI-OCR API is running", "version": "0.7.0"}