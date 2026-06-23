from fastapi import FastAPI
from app.database import engine, Base
from app.models import User, Bien, Locataire

Base.metadata.create_all(bind=engine)

app = FastAPI(title="GLI-OCR API")

@app.get("/")
def ping():
    return {"status": "ok", "message": "GLI-OCR API is running"}